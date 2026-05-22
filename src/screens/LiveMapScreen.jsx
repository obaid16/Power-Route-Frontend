import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator, Linking } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard } from '../components';
import { DEFAULT_MAP_CENTER } from '../constants/defaults';
import { formatDistance } from '../utils/format';
import { useResponsive } from '../hooks/useResponsive';
import { useVoltApi } from '../hooks/useVoltApi';
import { useMapRoute } from '../hooks/useMapRoute';
import { nearestStation } from '../utils/geo';
import { useTheme } from '../context/ThemeContext';

// Safe wrapper — useBottomTabBarHeight throws if called outside a tab navigator
function useTabBarHeight() {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useBottomTabBarHeight();
  } catch {
    return 64;
  }
}

// Use default map provider (works without Google Maps API key)
// For Google Maps: Enable APIs at https://console.cloud.google.com/apis/library
// Required APIs: Maps JavaScript API, Maps SDK for Android/iOS, Directions API
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY || '';
const MAP_PROVIDER = GOOGLE_MAPS_KEY ? PROVIDER_GOOGLE : PROVIDER_DEFAULT;

export function LiveMapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarH = useTabBarHeight();
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const {
    width,
    height,
    fontScale,
    isCompact,
    isLargeScreen,
    horizontalPadding: edge,
    chipMaxWidth,
    contentMaxWidth,
  } = useResponsive();
  const mapRef = useRef(null);
  const { stations, vehicle, userCoord: contextCoord, locationNote } = useVoltApi();

  const [userCoord, setUserCoord] = useState(contextCoord || DEFAULT_MAP_CENTER);
  const [perm, setPerm] = useState('pending');
  const [targetId, setTargetId] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // Native Google Maps Traffic layer and In-App 3D turn-by-turn states
  const [showTraffic, setShowTraffic] = useState(false);
  const [navigationActive, setNavigationActive] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Sync coord from context once it resolves
  useEffect(() => {
    if (contextCoord?.latitude) setUserCoord(contextCoord);
  }, [contextCoord?.latitude, contextCoord?.longitude]);

  const route = useRoute();
  const passedTargetId = route.params?.targetId;

  // Set target station if navigated directly from another screen
  useEffect(() => {
    if (passedTargetId) {
      setTargetId(passedTargetId);
    }
  }, [passedTargetId]);

  const targetStation = useMemo(() => {
    const byId = stations.find((s) => s.id === targetId);
    if (byId) return byId;
    return nearestStation(userCoord, stations) || stations[0] || null;
  }, [stations, userCoord, targetId]);

  const { routeCoords, etaMinutes, etaKm, steps, loading: routeLoading } = useMapRoute(userCoord, targetStation);

  // Progress through the step-by-step itinerary in real-time when in-app navigation is active
  useEffect(() => {
    if (!navigationActive || !steps || steps.length === 0) {
      setActiveStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => {
        if (prev >= steps.length - 1) return prev;
        return prev + 1;
      });
    }, 7000); // Step advance every 7 seconds
    return () => clearInterval(interval);
  }, [navigationActive, steps]);

  const showsUserLocation = perm === 'granted';

  // Guard: vehicle may be EMPTY_VEHICLE (batteryPct = 0) on first render
  const batteryPct = vehicle?.batteryPct ?? 0;
  const arrivalEst = useMemo(() => {
    if (!batteryPct) return 0;
    const drop = Math.round(etaKm * 1.15);
    return Math.max(8, Math.min(99, batteryPct - drop));
  }, [batteryPct, etaKm]);

  // Only show low-battery warning when we actually have real battery data
  const lowBattery = batteryPct > 0 && (batteryPct < 34 || arrivalEst < 28);

  const bottomOverlay = insets.bottom + tabBarH + 10;
  const isNarrow = width < 360;

  const mapPad = useMemo(
    () => ({
      top: insets.top + (isLargeScreen ? 100 : 80),
      right: Math.max(12, edge),
      bottom: Math.min(bottomOverlay + (isNarrow ? 200 : isLargeScreen ? 180 : 168), height * 0.4),
      left: Math.max(12, edge),
    }),
    [insets.top, edge, bottomOverlay, isNarrow, isLargeScreen, height]
  );

  // Request location permission once on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        setPerm(status === 'granted' ? 'granted' : 'denied');
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        }).catch(() => null);
        if (!cancelled && pos?.coords) {
          setUserCoord({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        }
      } catch {
        if (!cancelled) setPerm('denied');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const fitMap = useCallback(() => {
    if (navigationActive) return; // Do not auto-zoom out when turn-by-turn navigation is running!
    if (!mapRef.current) return;
    const coords = routeCoords?.length ? [...routeCoords] : [];
    if (targetStation) coords.push({ latitude: targetStation.latitude, longitude: targetStation.longitude });
    if (!showsUserLocation) coords.push(userCoord);
    if (coords.length < 2) {
      // Not enough points to fit — just animate to user location
      mapRef.current.animateToRegion({
        latitude: userCoord.latitude,
        longitude: userCoord.longitude,
        latitudeDelta: 0.07,
        longitudeDelta: 0.07,
      }, 600);
      return;
    }
    mapRef.current.fitToCoordinates(coords, { edgePadding: mapPad, animated: true });
  }, [routeCoords, targetStation, showsUserLocation, userCoord, mapPad, navigationActive]);

  // Activate 3D bird's eye perspective navigation
  const startNavigation = useCallback(() => {
    if (!targetStation) return;
    setNavigationActive(true);
    setActiveStepIndex(0);

    if (mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: userCoord.latitude,
          longitude: userCoord.longitude,
        },
        pitch: 45, // 3D Camera Tilt
        heading: 0,
        altitude: 800,
        zoom: 17.5,
      }, { duration: 1000 });
    }
  }, [userCoord, targetStation]);

  const stopNavigation = useCallback(() => {
    setNavigationActive(false);
    setActiveStepIndex(0);
    // Let the map fit the route overview back
    setTimeout(() => {
      if (mapRef.current) {
        const coords = routeCoords?.length ? [...routeCoords] : [];
        if (targetStation) coords.push({ latitude: targetStation.latitude, longitude: targetStation.longitude });
        if (!showsUserLocation) coords.push(userCoord);
        if (coords.length >= 2) {
          mapRef.current.fitToCoordinates(coords, { edgePadding: mapPad, animated: true });
        }
      }
    }, 400);
  }, [routeCoords, targetStation, showsUserLocation, userCoord, mapPad]);

  // Google Maps turn-by-turn routing handover deep-linking
  const launchSystemMaps = useCallback(() => {
    if (!targetStation) return;
    const lat = targetStation.latitude;
    const lng = targetStation.longitude;
    const label = encodeURIComponent(targetStation.name);
    
    // Launch official Google Maps app for seamless live traffic navigation
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
    });
    
    Linking.openURL(url).catch(() => {
      // Graceful fallback to web link if native map fails
      const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      Linking.openURL(webUrl);
    });
  }, [targetStation]);

  const getManeuverIcon = useCallback((instruction) => {
    const text = (instruction || '').toLowerCase();
    if (text.includes('left')) return 'arrow-back-outline';
    if (text.includes('right')) return 'arrow-forward-outline';
    if (text.includes('merge') || text.includes('highway') || text.includes('route')) return 'shuffle-outline';
    if (text.includes('roundabout') || text.includes('exit')) return 'sync-outline';
    if (text.includes('arrive') || text.includes('destination')) return 'flag-outline';
    return 'arrow-up-outline';
  }, []);

  useEffect(() => {
    const t = setTimeout(fitMap, 400);
    return () => clearTimeout(t);
  }, [fitMap, width, height]);

  useFocusEffect(
    useCallback(() => {
      const t = setTimeout(fitMap, 500);
      return () => clearTimeout(t);
    }, [fitMap])
  );

  const initialRegion = useMemo(
    () => ({
      latitude: userCoord.latitude ?? DEFAULT_MAP_CENTER.latitude,
      longitude: userCoord.longitude ?? DEFAULT_MAP_CENTER.longitude,
      latitudeDelta: isCompact ? 0.09 : 0.06,
      longitudeDelta: isCompact ? 0.09 : 0.06,
    }),
    [userCoord.latitude, userCoord.longitude, isCompact]
  );

  // Navigate to station details safely
  const goToStation = useCallback((stationId) => {
    try {
      // Try parent (stack) first, fall back to current navigator
      const target = navigation.getParent() ?? navigation;
      target.navigate('StationDetails', { stationId });
    } catch {
      navigation.navigate('StationDetails', { stationId });
    }
  }, [navigation]);

  return (
    <View style={[styles.rootFill, { backgroundColor: colors.bg }]}>
      <View style={styles.flex}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={initialRegion}
          provider={MAP_PROVIDER}
          showsUserLocation={showsUserLocation}
          showsMyLocationButton={false}
          showsCompass={false}
          showsTraffic={showTraffic}
          customMapStyle={Platform.OS === 'ios' ? (isDark ? darkMapStyle : lightMapStyle) : []}
          onMapReady={() => setMapReady(true)}
          mapPadding={{
            top: mapPad.top,
            right: mapPad.right,
            bottom: Math.min(mapPad.bottom, height * 0.45),
            left: mapPad.left,
          }}
        >
          {!showsUserLocation ? (
            <Marker coordinate={userCoord} title="You" tracksViewChanges={false}>
              <View style={styles.userDot} />
            </Marker>
          ) : null}
          {stations.map((s) => {
            const isTarget = s.id === targetStation?.id;
            return (
              <Marker
                key={s.id}
                coordinate={{ latitude: s.latitude, longitude: s.longitude }}
                title={s.name}
                description={s.address}
                tracksViewChanges={false}
                onPress={() => setTargetId(s.id)}
              >
                <View style={[styles.stationWrap, isTarget && styles.stationWrapActive]}>
                  <View style={[
                    styles.stationBubble,
                    isTarget && styles.stationBubbleActive,
                    !isDark && { backgroundColor: colors.accentCyan, borderColor: colors.accentGlow },
                  ]}>
                    <Ionicons name="flash" size={isTarget ? 18 : 15} color={isDark ? '#020617' : '#fff'} />
                  </View>
                  {isTarget ? <Text style={[styles.stationTag, { color: colors.accentCyan }]}>Nav</Text> : null}
                </View>
              </Marker>
            );
          })}
          {routeCoords.length > 1 ? (
            <Polyline
              coordinates={routeCoords}
              strokeColor={colors.accentCyan}
              strokeWidth={Math.max(4, 4 * Math.min(fontScale, 1.2))}
              lineJoin="round"
              lineCap="round"
            />
          ) : null}
        </MapView>

        {/* Live 3D Navigation Turn-by-Turn HUD Card */}
        {navigationActive && steps && steps[activeStepIndex] && (
          <View style={[styles.navHudContainer, { top: insets.top + 8, paddingHorizontal: edge }]}>
            <GlassCard padding={14}>
              <View style={styles.navHudHeader}>
                <Ionicons 
                  name={getManeuverIcon(steps[activeStepIndex].instruction)} 
                  size={28} 
                  color={colors.accentCyan} 
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.navHudSubtitle, { color: colors.textFaint }]}>
                    Next Step ({steps[activeStepIndex].distance})
                  </Text>
                  <Text style={[styles.navHudInstruction, { color: colors.text }]} numberOfLines={2}>
                    {steps[activeStepIndex].instruction}
                  </Text>
                </View>
                <Pressable onPress={stopNavigation} style={styles.navHudCloseBtn} hitSlop={10}>
                  <Ionicons name="close-circle" size={32} color={colors.danger} />
                </Pressable>
              </View>
            </GlassCard>
          </View>
        )}

        {/* Loading overlay — shown until MapView fires onMapReady */}
        {!mapReady && (
          <View style={[styles.mapLoader, { backgroundColor: colors.bg }]}>
            <ActivityIndicator size="large" color={colors.accentCyan} />
            <Text style={[styles.mapLoaderText, { color: colors.textMuted }]}>Loading map…</Text>
          </View>
        )}

        <Pressable
          onPress={fitMap}
          style={[styles.recenter, {
            top: insets.top + 10,
            right: edge,
            height: isLargeScreen ? 52 : 44,
            width: isLargeScreen ? 52 : 44,
            borderRadius: isLargeScreen ? 26 : 22,
            backgroundColor: isDark ? 'rgba(2,6,23,0.85)' : 'rgba(255,255,255,0.92)',
            borderColor: colors.border,
          }]}
          hitSlop={10}
        >
          <Ionicons name="locate" size={isLargeScreen ? 26 : 22} color={colors.accentCyan} />
        </Pressable>

        {/* Premium Google Maps Traffic Toggle Control */}
        <Pressable
          onPress={() => setShowTraffic(!showTraffic)}
          style={[styles.recenter, {
            top: insets.top + (isLargeScreen ? 70 : 60),
            right: edge,
            height: isLargeScreen ? 52 : 44,
            width: isLargeScreen ? 52 : 44,
            borderRadius: isLargeScreen ? 26 : 22,
            backgroundColor: showTraffic 
              ? 'rgba(0,217,126, 0.22)' 
              : isDark ? 'rgba(2,6,23,0.85)' : 'rgba(255,255,255,0.92)',
            borderColor: showTraffic ? colors.accentCyan : colors.border,
          }]}
          hitSlop={10}
        >
          <Ionicons 
            name="analytics" 
            size={isLargeScreen ? 26 : 22} 
            color={showTraffic ? colors.accentCyan : colors.textMuted} 
          />
        </Pressable>

        {routeLoading ? (
          <View style={[styles.routeLoading, {
            top: insets.top + 10,
            left: edge,
            backgroundColor: isDark ? 'rgba(2,6,23,0.8)' : 'rgba(255,255,255,0.9)',
          }]}>
            <ActivityIndicator size="small" color={colors.accentCyan} />
          </View>
        ) : null}

        {perm === 'denied' && !navigationActive ? (
          <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, zIndex: 12, paddingHorizontal: edge, alignItems: 'center' }}>
            <View style={[styles.bannerMuted, {
              maxWidth: contentMaxWidth, width: '100%',
              paddingHorizontal: isLargeScreen ? 16 : 12,
              paddingVertical: isLargeScreen ? 12 : 10,
              backgroundColor: isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.92)',
              borderColor: colors.borderSoft,
            }]}>
              <Ionicons name="location-outline" size={isLargeScreen ? 20 : 18} color={colors.textMuted} />
              <Text style={[styles.bannerText, { fontSize: (isLargeScreen ? 12 : 11) * Math.min(fontScale, 1.15), color: colors.textMuted }]}>
                {locationNote || 'Location off — enable GPS for live navigation.'}
              </Text>
            </View>
          </View>
        ) : null}

        {lowBattery && !navigationActive ? (
          <View style={{ position: 'absolute', top: insets.top + (perm === 'denied' ? (isLargeScreen ? 60 : 52) : 8), left: 0, right: 0, zIndex: 12, paddingHorizontal: edge, alignItems: 'center' }}>
            <View style={[styles.bannerWarn, { maxWidth: contentMaxWidth, width: '100%', paddingHorizontal: isLargeScreen ? 16 : 12, paddingVertical: isLargeScreen ? 12 : 10 }]}>
              <Ionicons name="battery-dead" size={isLargeScreen ? 24 : 20} color={colors.warning} />
              <View style={styles.bannerBody}>
                <Text style={[styles.bannerTitle, { fontSize: isLargeScreen ? 11 : 10 }]}>Reserve buffer</Text>
                <Text style={[styles.bannerSub, { fontSize: (isLargeScreen ? 13 : 12) * Math.min(fontScale, 1.12) }]}>
                  Est. arrival SoC ~{arrivalEst}% · route {formatDistance(etaKm)}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.bottomStack,
            {
              bottom: bottomOverlay,
              left: 0,
              right: 0,
              paddingHorizontal: edge,
            },
          ]}
        >
          <View style={{ maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }}>
            
            {/* If In-App Navigation is active, render active step itinerary list drawer */}
            {navigationActive ? (
              <GlassCard padding={16}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontWeight: '700', color: colors.text, fontSize: 16 }}>Route Itinerary</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="pulse" size={14} color={colors.accentMint} />
                    <Text style={{ color: colors.accentMint, fontWeight: '700', fontSize: 12 }}>3D Sim Active</Text>
                  </View>
                </View>
                
                <ScrollView style={{ maxHeight: 130 }} nestedScrollEnabled showsVerticalScrollIndicator={true}>
                  {steps && steps.map((step, idx) => {
                    const isActive = idx === activeStepIndex;
                    return (
                      <View key={idx} style={[styles.stepItem, isActive && styles.stepItemActive]}>
                        <Ionicons 
                          name={getManeuverIcon(step.instruction)} 
                          size={18} 
                          color={isActive ? colors.accentCyan : colors.textMuted} 
                        />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={[styles.stepText, isActive && { fontWeight: '700', color: colors.text }]}>
                            {step.instruction}
                          </Text>
                          <Text style={styles.stepSubText}>{step.distance} · {step.duration}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
                
                <Pressable 
                  onPress={launchSystemMaps} 
                  style={[styles.externalNavBtn, { backgroundColor: colors.accentMint }]}
                >
                  <Ionicons name="navigate-circle-outline" size={20} color="#020617" />
                  <Text style={styles.externalNavBtnTxt}>Launch Google Maps App</Text>
                </Pressable>
              </GlassCard>
            ) : (
              // Standard route overview
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipRow}
                  style={{ maxHeight: 44, marginBottom: 10 }}
                >
                  {stations.map((s) => {
                    const active = s.id === targetStation?.id;
                    return (
                      <Pressable
                        key={s.id}
                        onPress={() => setTargetId(s.id)}
                        style={[
                          styles.chip,
                          { maxWidth: chipMaxWidth, backgroundColor: isDark ? colors.bgElevated : '#fff', borderColor: colors.borderSoft },
                          active && { borderColor: colors.accentCyan, backgroundColor: `${colors.accentCyan}15` },
                        ]}
                      >
                        <Text style={[styles.chipTxt, { color: active ? colors.accentCyan : colors.textMuted }]} numberOfLines={1}>
                          {s.name.replace(' Station', '').replace(' Superhub', '')}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {targetStation ? (
                  <GlassCard padding={isNarrow ? 14 : isLargeScreen ? 20 : 16}>
                    {/* ── Mockup-02 Station Info Row ────────────────────────── */}
                    <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                      {/* Station Icon Thumbnail */}
                      <View style={{
                        width: 60, height: 60, borderRadius: 12,
                        backgroundColor: `${colors.accentCyan}15`,
                        borderWidth: 1.5, borderColor: `${colors.accentCyan}40`,
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Ionicons name="flash" size={22} color={colors.accentCyan} />
                      </View>

                      <View style={{ flex: 1, minWidth: 0 }}>
                        {/* Name + Rating */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                          <Text style={{ fontWeight: '800', color: colors.text, fontSize: (isLargeScreen ? 16 : 14) * Math.min(fontScale, 1.08) }} numberOfLines={1}>
                            {targetStation.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Ionicons name="star" size={12} color="#fbbf24" />
                            <Text style={{ fontSize: 11 * Math.min(fontScale, 1.08), fontWeight: '700', color: colors.text }}>
                              {targetStation.rating?.toFixed(1) || '4.5'}
                            </Text>
                          </View>
                        </View>
                        {/* Address + ETA */}
                        <Text style={{ color: colors.textMuted, fontSize: 11 * Math.min(fontScale, 1.08), marginTop: 2 }} numberOfLines={1}>
                          {targetStation.address || 'EV Charging Hub'} · {etaMinutes} min · {formatDistance(etaKm)}
                        </Text>
                        {/* Available Badge */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                          <View style={{ backgroundColor: `${colors.accentCyan}15`, borderColor: `${colors.accentCyan}30`, borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                            <Text style={{ color: colors.accentCyan, fontSize: 10 * Math.min(fontScale, 1.08), fontWeight: '800' }}>
                              Available · {targetStation.availablePorts ?? 2}/{targetStation.totalPorts ?? 8}
                            </Text>
                          </View>
                          <Text style={{ color: colors.textFaint, fontSize: 10 * Math.min(fontScale, 1.08), fontWeight: '600' }}>
                            DC Fast Charger
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* ── Action Buttons ─────────────────────────────────────── */}
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                      {/* Primary: View Details (solid green) */}
                      <Pressable
                        onPress={() => goToStation(targetStation.id)}
                        style={({ pressed }) => ({
                          flex: 1, backgroundColor: colors.accentCyan,
                          paddingVertical: 12, borderRadius: 10,
                          alignItems: 'center', justifyContent: 'center',
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13 * Math.min(fontScale, 1.08) }}>
                          View Details
                        </Text>
                      </Pressable>
                      {/* In-App 3D Nav */}
                      <Pressable
                        onPress={startNavigation}
                        style={({ pressed }) => ({
                          paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
                          borderWidth: 1, borderColor: colors.borderSoft,
                          backgroundColor: `${colors.accentCyan}10`,
                          alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'row', gap: 4,
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Ionicons name="compass-outline" size={14} color={colors.accentCyan} />
                        <Text style={{ color: colors.accentCyan, fontWeight: '700', fontSize: 11 * Math.min(fontScale, 1.08) }}>3D</Text>
                      </Pressable>
                      {/* Google Maps Handoff */}
                      <Pressable
                        onPress={launchSystemMaps}
                        style={({ pressed }) => ({
                          paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10,
                          borderWidth: 1, borderColor: colors.borderSoft,
                          backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                          alignItems: 'center', justifyContent: 'center',
                          opacity: pressed ? 0.85 : 1,
                        })}
                      >
                        <Ionicons name="logo-google" size={16} color={colors.textMuted} />
                      </Pressable>
                    </View>
                  </GlassCard>
                ) : (
                  <GlassCard padding={isLargeScreen ? 20 : 16}>
                    <Text style={[styles.footNote, { fontSize: isLargeScreen ? 14 : 12, color: colors.textMuted }]}>No stations nearby. Seed the backend to see routes.</Text>
                  </GlassCard>
                )}
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootFill: {
    flex: 1,
    backgroundColor: '#020617',
  },
  flex: { flex: 1 },
  mapLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    zIndex: 99,
  },
  mapLoaderText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  userDot: {
    height: 16,
    width: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#c4b5fd',
    backgroundColor: '#8b5cf6',
  },
  stationWrap: { alignItems: 'center' },
  stationWrapActive: { transform: [{ translateY: -2 }] },
  stationBubble: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.55)',
    backgroundColor: 'rgba(139,92,246,0.90)',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  stationBubbleActive: {
    borderColor: '#c4b5fd',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  stationTag: {
    marginTop: 2,
    fontSize: 9,
    fontWeight: '800',
    color: '#a5f3fc',
    letterSpacing: 0.6,
  },
  recenter: {
    position: 'absolute',
    zIndex: 20,
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,126, 0.35)',
  },
  routeLoading: {
    position: 'absolute',
    zIndex: 20,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
  },
  bannerMuted: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  bannerWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(120, 53, 15, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
  },
  bannerBody: { flex: 1 },
  bannerTitle: { fontSize: 10, fontWeight: '800', color: '#fde68a', letterSpacing: 0.5, textTransform: 'uppercase' },
  bannerSub: { marginTop: 2, color: '#fef3c7' },
  bannerText: { flex: 1, flexShrink: 1, color: '#94a3b8', lineHeight: 16 },
  bottomStack: {
    position: 'absolute',
    zIndex: 15,
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  chipActive: {
    borderColor: 'rgba(0,217,126, 0.55)',
    backgroundColor: 'rgba(0,217,126, 0.18)',
  },
  chipTxt: { fontSize: 11, fontWeight: '600', color: '#94a3b8' },
  chipTxtActive: { color: '#ecfeff' },
  etaHeaderRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  etaLabel: { fontWeight: '700', letterSpacing: 1.2, color: '#64748b', textTransform: 'uppercase' },
  etaBig: { marginTop: 4, fontWeight: '700', color: '#f8fafc', letterSpacing: -0.5 },
  navBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#22d3ee',
  },
  navBtnWide: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#8b5cf6',
  },
  navBtnTxt: { fontSize: 12, fontWeight: '800', color: '#ffffff' },
  divider: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  footNote: { flex: 1, color: '#94a3b8', lineHeight: 18 },
  navHudContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  navHudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navHudSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  navHudInstruction: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  navHudCloseBtn: {
    marginLeft: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepItemActive: {
    backgroundColor: 'rgba(139,92,246,0.1)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  stepText: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
  },
  stepSubText: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  externalNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  externalNavBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnTxt: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0b1220' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020617' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
];

const lightMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#f0f4f8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#334155' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f8fafc' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#cbd5e1' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bae6fd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d1fae5' }] },
];
