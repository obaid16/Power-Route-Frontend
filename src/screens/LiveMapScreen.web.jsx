import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

if (typeof document !== 'undefined') {
  if (!document.getElementById('leaflet-css')) {
    const link = document.createElement('link');
    link.id = 'leaflet-css';
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }
}

import { GlassCard } from '../components';
import { DEFAULT_MAP_CENTER } from '../constants/defaults';
import { formatDistance } from '../utils/format';
import { useResponsive } from '../hooks/useResponsive';
import { useVoltApi } from '../hooks/useVoltApi';
import { nearestStation } from '../utils/geo';
import { useTheme } from '../context/ThemeContext';
import { fetchNearbyPlaces, fetchRoute, fetchSafetyScore } from '../services/mapApiService';

const EXPO_PUBLIC_GEOAPIFY_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_KEY || '';

function useTabBarHeight() {
  try {
    return useBottomTabBarHeight();
  } catch {
    return 64;
  }
}

// ── Custom Leaflet Icons ────────────────────────────────────────────────────────
const createDotIcon = (color, size = 16, border = 'white') => L.divIcon({
  html: `<div style="width: ${size}px; height: ${size}px; background-color: ${color}; border-radius: 50%; border: 2px solid ${border}; box-shadow: 0 0 10px ${color}; display: flex; align-items: center; justify-content: center;"></div>`,
  className: '',
  iconSize: [size, size],
  iconAnchor: [size / 2, size / 2],
});

const createPinIcon = (color, iconName) => L.divIcon({
  html: `
    <div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
      <span style="color: white; font-size: 14px; font-family: sans-serif;"><b>${iconName}</b></span>
    </div>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28]
});

const userIcon = createDotIcon('#00D97E', 20, '#ffffff');

const stationIcon = L.divIcon({
  html: `
    <div style="background-color: #7c3aed; width: 28px; height: 28px; border-radius: 50%; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(139,92,246,0.4);">
      <span style="color: white; font-size: 14px;">⚡</span>
    </div>
  `,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const targetStationIcon = L.divIcon({
  html: `
    <div style="
      background-color: #8b5cf6; 
      width: 36px; height: 36px; 
      border-radius: 50%; 
      border: 3px solid white; 
      display: flex; align-items: center; justify-content: center; 
      box-shadow: 0 0 15px #8b5cf6;
      animation: map-pulse 2s infinite;
    ">
      <span style="color: white; font-size: 18px;">⚡</span>
    </div>
    <style>
      @keyframes map-pulse {
        0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
        70% { box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); }
        100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
      }
    </style>
  `,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18]
});

const policeIcon = createPinIcon('#3b82f6', 'P');
const hospitalIcon = createPinIcon('#ef4444', 'H');

// ── Map Updater Component ───────────────────────────────────────────────────────
function MapUpdater({ center, zoom, bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.flyTo(center, zoom || 13);
    }
  }, [center, zoom, bounds, map]);
  return null;
}

export function LiveMapScreen() {
  const insets = useSafeAreaInsets();
  const tabBarH = useTabBarHeight();
  const navigation = useNavigation();
  const { isDark, colors } = useTheme();
  const { width, height, fontScale, isLargeScreen, horizontalPadding: edge, mapPreviewHeight, chipMaxWidth, contentMaxWidth } = useResponsive();

  const { stations, vehicle, userCoord: contextCoord, loading: dataLoading } = useVoltApi();
  const userCoord = contextCoord || DEFAULT_MAP_CENTER;
  const [targetId, setTargetId] = useState(null);
  
  const [routeData, setRouteData] = useState({ coords: [], etaMinutes: 0, etaKm: 0, loading: false });
  const [places, setPlaces] = useState({ police: [], hospitals: [] });
  const [safetyScore, setSafetyScore] = useState(null);

  const targetStation = useMemo(() => {
    const byId = stations.find((s) => s.id === targetId);
    if (byId) return byId;
    return nearestStation(userCoord, stations) || stations[0] || null;
  }, [stations, userCoord, targetId]);

  // Fetch Route
  useEffect(() => {
    if (!targetStation || !userCoord) return;
    
    let isMounted = true;
    const loadRoute = async () => {
      setRouteData(prev => ({ ...prev, loading: true }));
      const start = [userCoord.longitude, userCoord.latitude];
      const end = [targetStation.longitude, targetStation.latitude];
      
      const res = await fetchRoute(start, end);
      if (!isMounted) return;

      if (res && res.features && res.features.length > 0) {
        const feature = res.features[0];
        // GeoJSON uses [lng, lat], Leaflet uses [lat, lng]
        const coords = feature.geometry.coordinates.map(c => [c[1], c[0]]);
        const distanceKm = (feature.properties.summary.distance / 1000).toFixed(1);
        const durationMin = Math.round(feature.properties.summary.duration / 60);
        
        setRouteData({
          coords,
          etaMinutes: durationMin,
          etaKm: distanceKm,
          loading: false
        });
      } else {
        setRouteData({ coords: [], etaMinutes: 0, etaKm: 0, loading: false });
      }
    };
    loadRoute();
    return () => { isMounted = false; };
  }, [targetStation?.id, userCoord?.latitude, userCoord?.longitude]);

  // Fetch Places and Safety Score around user
  useEffect(() => {
    if (!userCoord) return;
    let isMounted = true;
    
    const loadPlaces = async () => {
      const pRes = await fetchNearbyPlaces(userCoord.latitude, userCoord.longitude, 'service.police', 5);
      const hRes = await fetchNearbyPlaces(userCoord.latitude, userCoord.longitude, 'healthcare.hospital', 5);
      const sRes = await fetchSafetyScore(userCoord.latitude, userCoord.longitude);
      
      if (!isMounted) return;
      
      setPlaces({
        police: pRes?.features || [],
        hospitals: hRes?.features || []
      });
      setSafetyScore(sRes);
    };
    loadPlaces();
    return () => { isMounted = false; };
  }, [userCoord?.latitude, userCoord?.longitude]);

  const mapH = mapPreviewHeight ?? Math.min(height * 0.42, 360);
  const mapW = contentMaxWidth ? Math.min(width - edge * 2, contentMaxWidth) : width - edge * 2;
  const bottomOverlay = insets.bottom + tabBarH + 10;
  const isNarrow = width < 360;

  const batteryPct = vehicle?.batteryPct ?? 0;
  const arrivalEst = useMemo(() => {
    if (!batteryPct) return 0;
    return Math.max(8, Math.min(99, batteryPct - Math.round(routeData.etaKm * 1.15)));
  }, [batteryPct, routeData.etaKm]);
  const lowBattery = batteryPct > 0 && (batteryPct < 34 || arrivalEst < 28);

  const goToStation = (stationId) => {
    try {
      const target = navigation.getParent() ?? navigation;
      target.navigate('StationDetails', { stationId });
    } catch {
      navigation.navigate('StationDetails', { stationId });
    }
  };

  const mapCenter = [userCoord.latitude, userCoord.longitude];
  
  // Compute bounds for map view
  const mapBounds = useMemo(() => {
    if (routeData.coords.length > 0) return routeData.coords;
    if (targetStation) {
      return [
        [userCoord.latitude, userCoord.longitude],
        [targetStation.latitude, targetStation.longitude]
      ];
    }
    return null;
  }, [routeData.coords, targetStation, userCoord]);

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>

      {/* ── Leaflet Map ─────────────────────────────────────────── */}
      <View style={[
        styles.mapFrame,
        {
          height: height, // Full height behind everything
          width: width,
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
        },
      ]}>
        <MapContainer 
          center={mapCenter} 
          zoom={13} 
          zoomControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url={isDark 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
              : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}
          />

          <MapUpdater center={mapCenter} bounds={mapBounds} />

          {/* User Marker */}
          <Marker position={mapCenter} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>

          {/* EV Stations */}
          {stations.map(s => {
            const isActive = s.id === targetStation?.id;
            return (
              <Marker 
                key={s.id} 
                position={[s.latitude, s.longitude]} 
                icon={isActive ? targetStationIcon : stationIcon}
                eventHandlers={{ click: () => setTargetId(s.id) }}
              >
                <Popup>
                  <strong>{s.name}</strong><br/>
                  {s.availablePorts} ports available<br/>
                  {s.maxKw} kW max
                </Popup>
              </Marker>
            );
          })}

          {/* Police Stations */}
          {places.police.map((p, i) => (
            <Marker key={`p-${i}`} position={[p.geometry.coordinates[1], p.geometry.coordinates[0]]} icon={policeIcon}>
              <Popup>{p.properties.name || 'Police Station'}</Popup>
            </Marker>
          ))}

          {/* Hospitals */}
          {places.hospitals.map((h, i) => (
            <Marker key={`h-${i}`} position={[h.geometry.coordinates[1], h.geometry.coordinates[0]]} icon={hospitalIcon}>
              <Popup>{h.properties.name || 'Hospital'}</Popup>
            </Marker>
          ))}

          {/* Route Polyline */}
          {routeData.coords.length > 0 && (
            <Polyline positions={routeData.coords} color={colors.accentCyan} weight={5} opacity={0.8} />
          )}
        </MapContainer>
        
        {/* Loading overlay for data or route */}
        {(dataLoading || routeData.loading) && (
          <View style={[styles.mapSpinner, { backgroundColor: isDark ? 'rgba(2,6,23,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            <ActivityIndicator color={colors.accentCyan} size="small" />
          </View>
        )}
      </View>

      {/* ── Top overlay (Safety Score) ─────────────────────────────────────────── */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: edge, right: edge, zIndex: 20 }}>
        {safetyScore && (
          <GlassCard padding={12} style={{ alignSelf: 'flex-start' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="shield-checkmark" size={18} color={safetyScore.score > 70 ? colors.accentMint : colors.warning} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                Safety Score: {safetyScore.score}/100
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 4 }}>
              {safetyScore.factors.join(' · ')}
            </Text>
          </GlassCard>
        )}
      </View>

      {/* ── bottom overlay ─────────────────────────────────────────────── */}
      <View style={[styles.bottomStack, { bottom: bottomOverlay, paddingHorizontal: edge }]} pointerEvents="box-none">
        
        {/* ── low battery banner ─────────────────────────────────────────── */}
        {lowBattery && (
          <View style={[styles.warnBox, { marginBottom: 10 }]}>
            <Ionicons name="battery-dead" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.warnTitle}>Reserve buffer</Text>
              <Text style={[styles.warnSub, { fontSize: 12 * Math.min(fontScale, 1.1) }]}>
                Est. arrival SoC ~{arrivalEst}%
              </Text>
            </View>
          </View>
        )}

        <View style={{ maxWidth: contentMaxWidth ?? 9999, alignSelf: 'center', width: '100%' }}>
          {/* Station chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
            style={{ marginBottom: 10, maxHeight: 44 }}
          >
            {stations.map((s) => {
              const active = s.id === targetStation?.id;
              return (
                <Pressable key={s.id} onPress={() => setTargetId(s.id)}
                  style={[styles.chip, { maxWidth: chipMaxWidth,
                    backgroundColor: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.9)',
                    borderColor: active ? colors.accentCyan : colors.borderSoft,
                    ...(active && { backgroundColor: isDark ? 'rgba(0,217,126,0.18)' : 'rgba(0,106,78,0.12)' }),
                  }]}
                >
                  <Text style={[styles.chipTxt, { color: active ? colors.accentCyan : colors.textMuted }]} numberOfLines={1}>
                    {s.name.replace(' Station', '').replace(' Superhub', '')}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* ETA card */}
          {targetStation ? (
            <GlassCard padding={isNarrow ? 12 : 16}>
              <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
                {/* Station Visual (Mockup Image Parity) */}
                <View style={{
                  width: 64, height: 64, borderRadius: 12,
                  overflow: 'hidden', borderWidth: 1.5, borderColor: `${colors.accentCyan}40`,
                  backgroundColor: `${colors.accentCyan}15`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="flash" size={24} color={colors.accentCyan} />
                </View>

                {/* Details */}
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontWeight: '800', color: colors.text, fontSize: scaleFont(16) }} numberOfLines={1}>
                      {targetStation.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Ionicons name="star" size={13} color="#fbbf24" />
                      <Text style={{ fontSize: scaleFont(12), fontWeight: '700', color: colors.text }}>
                        {targetStation.rating?.toFixed(1) || '4.5'}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: colors.textMuted, fontSize: scaleFont(12), marginTop: 2 }} numberOfLines={1}>
                    {targetStation.address || 'MG Road, Bangalore'} · {formatDistance(routeData.etaKm || 2.4)}
                  </Text>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    <View style={{
                      backgroundColor: `${colors.accentCyan}15`,
                      borderColor: `${colors.accentCyan}30`,
                      borderWidth: 1,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                    }}>
                      <Text style={{ color: colors.accentCyan, fontSize: scaleFont(11), fontWeight: '800' }}>
                        Available · {targetStation.availablePorts ?? 2}/{targetStation.totalPorts ?? 8}
                      </Text>
                    </View>
                    <Text style={{ color: colors.textFaint, fontSize: scaleFont(11), fontWeight: '600' }}>
                      DC Fast Charger
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
                <Pressable onPress={() => goToStation(targetStation.id)}
                  style={({ pressed }) => ({
                    flex: 1,
                    backgroundColor: colors.accentCyan,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: scaleFont(13) }}>
                    View Details
                  </Text>
                </Pressable>
                
                <Pressable onPress={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${targetStation.latitude},${targetStation.longitude}`;
                  window.open(url, '_blank');
                }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: colors.borderSoft,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <Ionicons name="navigate-outline" size={16} color={colors.text} />
                </Pressable>
              </View>
            </GlassCard>
          ) : (
            <GlassCard padding={isLargeScreen ? 20 : 16}>
              <Text style={[styles.foot, { fontSize: isLargeScreen ? 14 : 12, color: colors.textMuted }]}>
                {dataLoading ? 'Loading stations…' : 'No stations nearby. Make sure the backend is running.'}
              </Text>
            </GlassCard>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  mapFrame: {
    backgroundColor: '#e8f4fd',
  },
  mapSpinner: {
    position: 'absolute',
    top: 100,
    right: 20,
    padding: 8,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  warnBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(120,53,15,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.8)',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  warnTitle: { fontSize: 10, fontWeight: '800', color: '#fde68a', textTransform: 'uppercase' },
  warnSub: { marginTop: 2, color: '#fef3c7' },
  bottomStack: { position: 'absolute', left: 0, right: 0, zIndex: 10 },
  chipRow: { gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  etaRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  etaLabel: { fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  etaBig: { marginTop: 4, fontWeight: '700', letterSpacing: -0.5 },
  navBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12 },
  navBtnTxt: { fontWeight: '800', color: '#ffffff' },
  divider: { marginTop: 12, paddingTop: 12, borderTopWidth: 1 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  foot: { flex: 1, lineHeight: 18 },
});
