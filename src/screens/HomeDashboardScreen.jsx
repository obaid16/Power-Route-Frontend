import React, { useEffect } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, ThemeToggle } from '../components';
import { AmbientOrbs, DashboardBatteryHero, DashboardStationCard, ChargingSessionCard } from '../components/home';
import { useMainStackNav } from '../hooks/useMainStackNav';
import { useResponsive } from '../hooks/useResponsive';
import { useAuth } from '../context/AuthContext';
import { useVoltApi } from '../hooks/useVoltApi';
import { useTheme } from '../context/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';

export function HomeDashboardScreen() {
  const navigation = useNavigation();
  const stackNav = useMainStackNav();
  const { user, logout } = useAuth();
  const { colors: themeColors, isDark } = useTheme();
  const {
    contentContainerStyle,
    cardSnapInterval,
    quickColBasis,
    isDesktop,
    isTablet,
    isLargeScreen,
    titleSize,
    scaleFont,
  } = useResponsive();
  const { loading, vehicle, stations, source, apiBaseUrl, lastError, locationNote, refresh } = useVoltApi();

  const sosPulse = useSharedValue(1);

  useEffect(() => {
    sosPulse.value = withRepeat(
      withSequence(withTiming(1.08, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1,
      true
    );
  }, [sosPulse]);

  const sosAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosPulse.value }],
  }));

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScreenBackground>
      <View style={styles.relative}>
        <AmbientOrbs />
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ 
                fontSize: scaleFont(isLargeScreen ? 13 : 11), 
                color: themeColors.accentPurple || themeColors.accentCyan, 
                fontWeight: '800', 
                textTransform: 'uppercase', 
                letterSpacing: 2.2,
                marginBottom: 2
              }}>
                {getGreeting()}
              </Text>
              
              <View style={{ alignSelf: 'flex-start', marginBottom: 6 }}>
                <Text style={{ fontSize: 30, fontWeight: '900', letterSpacing: -0.8, color: themeColors.text }}>
                  PowerRoute
                </Text>
                <LinearGradient
                  colors={[themeColors.accentCyan, themeColors.accentMint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: 3, borderRadius: 1.5, width: 75, marginTop: 2 }}
                />
              </View>

              <Text style={{ marginTop: 2, fontWeight: '800', color: themeColors.text, fontSize: scaleFont(18) }} numberOfLines={1}>
                {vehicle.evVehicleModel || user?.name || 'Your EV'}
              </Text>
              <Text style={{ marginTop: 4, color: themeColors.textMuted, fontSize: scaleFont(13), fontWeight: '500' }}>
                AI-powered EV navigation & emergency assist
              </Text>
              <DataSourcePill loading={loading} source={source} apiBaseUrl={apiBaseUrl} lastError={lastError} locationNote={locationNote} onRetry={refresh} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Pressable
                onPress={() => {
                  if (Platform.OS === 'web') {
                    if (window.confirm("Are you sure you want to logout?")) {
                      logout().then(() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }));
                    }
                  } else {
                    Alert.alert(
                      "Logout",
                      "Are you sure you want to logout?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Logout", style: "destructive", onPress: async () => {
                          await logout();
                          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
                        }}
                      ]
                    );
                  }
                }}
                style={({ pressed }) => ({
                  height: 46, width: 46, borderRadius: 23,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(0,217,126,0.22)' : 'rgba(0,106,78,0.18)',
                  backgroundColor: isDark ? 'rgba(0,217,126,0.06)' : 'rgba(255,255,255,0.85)',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons name="log-out-outline" size={isLargeScreen ? 24 : 20} color={themeColors.danger || '#ef4444'} />
              </Pressable>

              <Pressable
                onPress={() => stackNav.navigate('Notifications')}
                style={({ pressed }) => ({
                  height: 46, width: 46, borderRadius: 23,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(0,217,126,0.22)' : 'rgba(0,106,78,0.18)',
                  backgroundColor: isDark ? 'rgba(0,217,126,0.06)' : 'rgba(255,255,255,0.85)',
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Ionicons name="notifications-outline" size={isLargeScreen ? 24 : 20} color={themeColors.accentCyan} />
              </Pressable>
              
              <ThemeToggle size="sm" showLabel={false} />
              
              <Animated.View style={sosAnimStyle}>
                <Pressable
                  onPress={() => navigation.navigate('EmergencySOS')}
                  style={({ pressed }) => [
                    styles.sosBtn,
                    { 
                      borderColor: themeColors.danger,
                      shadowColor: themeColors.danger,
                      shadowOffset: { width: 0, height: 8 },
                      shadowOpacity: 0.35,
                      shadowRadius: 12,
                      elevation: 8,
                    },
                    pressed && { opacity: 0.85 }
                  ]}
                >
                  <Ionicons name="warning" size={isLargeScreen ? 24 : 20} color={themeColors.danger} />
                </Pressable>
              </Animated.View>
            </View>
          </View>

          <DashboardBatteryHero
            batteryPct={vehicle.batteryPct > 0 ? vehicle.batteryPct : 78}
            rangeKm={vehicle.rangeKm > 0 ? vehicle.rangeKm : 342}
            ecoScore={vehicle.ecoScore > 0 ? vehicle.ecoScore : 85}
          />

          {vehicle.isCharging ? (
            <ChargingSessionCard chargeKw={vehicle.chargeKw} timeToFullMin={vehicle.timeToFullMin} />
          ) : null}

          <SectionHeading title="Superhubs" subtitle="Nearby charging stations" icon="flash-outline" />
          {!loading && stations.length === 0 ? (
            <Text style={{ marginBottom: 16, textAlign: 'center', color: themeColors.textFaint, fontSize: scaleFont(14) }}>
              No stations in range. Run backend seed: npm run seed
            </Text>
          ) : null}
          {isDesktop || isTablet ? (
            <View style={[styles.stationGrid, isLargeScreen && { gap: 18 }]}>
              {stations.map((s) => (
                <View key={s.id} style={[styles.stationGridItem, isLargeScreen && { minWidth: 320 }]}>
                  <DashboardStationCard
                    station={s}
                    style={{ width: '100%', marginRight: 0 }}
                    onPress={() => stackNav.navigate('StationDetails', { stationId: s.id, station: s })}
                  />
                </View>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={cardSnapInterval}
              snapToAlignment="start"
              contentContainerStyle={styles.hScroll}
            >
              {stations.map((s) => (
                <DashboardStationCard
                  key={s.id}
                  station={s}
                  onPress={() => stackNav.navigate('StationDetails', { stationId: s.id, station: s })}
                />
              ))}
            </ScrollView>
          )}

          <SectionHeading title="Quick paths" subtitle="One tap · zero friction" icon="rocket-outline" />
          <View style={styles.quickGrid}>
            <QuickPath icon="map-outline"              label="Live Map"      sub="Route + ETA"         colBasis={quickColBasis} onPress={() => navigation.navigate('Map')} />
            <QuickPath icon="sparkles-outline"         label="AI Assist"     sub="Smart suggest"       colBasis={quickColBasis} onPress={() => stackNav.navigate('AIRecommend')} />
            <QuickPath icon="stats-chart-outline"      label="Insights"      sub="Energy + cost"       colBasis={quickColBasis} onPress={() => navigation.navigate('Analytics')} />
            <QuickPath icon="warning-outline"          label="SOS"           sub="Emergency"           colBasis={quickColBasis} onPress={() => navigation.navigate('EmergencySOS')} danger />
            <QuickPath icon="business-outline"         label="Services"      sub="Hotels · hospitals"  colBasis={quickColBasis} onPress={() => stackNav.navigate('NearbyServices')} />
            <QuickPath icon="notifications-outline"    label="Alerts"        sub="Smart notifications" colBasis={quickColBasis} onPress={() => stackNav.navigate('Notifications')} />
            <QuickPath icon="car-outline"              label="Charging Van"  sub="Mobile charger"      colBasis={quickColBasis} onPress={() => stackNav.navigate('ChargingVan')} />
            <QuickPath icon="shield-checkmark-outline" label="Women Safety"  sub="Safe mode"           colBasis={quickColBasis} onPress={() => stackNav.navigate('WomenSafety')} />
          </View>
        </ScrollView>
      </View>
    </ScreenBackground>
  );
}

function DataSourcePill({ loading, source, apiBaseUrl, lastError, locationNote, onRetry }) {
  const { colors: c } = useTheme();
  if (loading) {
    return (
      <View style={styles.pillRow}>
        <ActivityIndicator size="small" color={c.accentCyan} />
        <Text style={[styles.pillHint, { color: c.textFaint }]}>Syncing…</Text>
      </View>
    );
  }
  if (lastError) {
    return (
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.25)' }]}>
          <Text style={[styles.pillText, { color: c.textMuted }]}>Offline</Text>
        </View>
        <Pressable onPress={onRetry} style={{ flex: 1 }}>
          <Text style={[styles.pillHint, { color: c.textFaint }]} numberOfLines={2}>
            {lastError} · tap to retry
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.pillRow}>
      <View style={[styles.pill, { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.35)' }]}>
        <Text style={[styles.pillText, { color: c.accentMint }]}>Live API</Text>
      </View>
      <Text style={[styles.pillHint, { color: c.textFaint }]} numberOfLines={2}>
        {locationNote || apiBaseUrl}
      </Text>
    </View>
  );
}

function SectionHeading({ title, subtitle, icon }) {
  const { colors: c } = useTheme();
  return (
    <View style={styles.section}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <View style={{
            padding: 5,
            borderRadius: 8,
            backgroundColor: 'rgba(0,217,126, 0.08)',
            borderWidth: 1,
            borderColor: 'rgba(0,217,126, 0.15)',
          }}>
            <Ionicons name={icon} size={16} color={c.accentCyan} />
          </View>
        )}
        <Text style={{ fontSize: 20, fontWeight: '800', color: c.text }}>
          {title}
        </Text>
      </View>
      <Text style={{ marginTop: 4, fontSize: 13, color: c.textMuted, marginLeft: icon ? 32 : 0 }}>{subtitle}</Text>
    </View>
  );
}

function QuickPath({ icon, label, sub, onPress, colBasis, danger }) {
  const { isDark, colors: c } = useTheme();
  const borderColors = danger
    ? ['rgba(251,113,133,0.5)', 'rgba(244,63,94,0.2)', 'rgba(15,23,42,0.5)']
    : isDark
    ? ['rgba(255,255,255,0.28)', 'rgba(0,217,126,0.18)', 'rgba(15,23,42,0.4)']
    : ['rgba(255,255,255,0.85)', 'rgba(0,106,78,0.2)', 'rgba(240,244,248,0.5)'];
  const innerColors = isDark
    ? ['rgba(15,23,42,0.92)', 'rgba(2,6,23,0.96)']
    : ['rgba(255,255,255,0.95)', 'rgba(240,244,248,0.98)'];
  const iconColor = danger ? c.danger : c.accentCyan;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.qWrap, { flexBasis: colBasis }, pressed && { opacity: 0.88 }]}>
      <LinearGradient colors={borderColors} style={styles.qBorder}>
        <View style={styles.qInner}>
          <LinearGradient colors={innerColors} style={StyleSheet.absoluteFill} />
          <View style={styles.qContent}>
            <View style={[
              styles.qIcon, 
              { 
                backgroundColor: danger 
                  ? 'rgba(251, 113, 133, 0.1)' 
                  : isDark 
                  ? 'rgba(0,217,126, 0.08)' 
                  : 'rgba(0,106,78, 0.06)' 
              }
            ]}>
              <Ionicons name={icon} size={18} color={iconColor} />
            </View>
            <Text style={[styles.qLabel, { color: c.text }]}>{label}</Text>
            <Text style={[styles.qSub, { color: c.textFaint }]}>{sub}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  relative: {
    flex: 1,
    position: 'relative',
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 6,
  },
  sosBtn: {
    height: 46,
    width: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(251, 113, 133, 0.45)',
    backgroundColor: 'rgba(251, 113, 133, 0.1)',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    width: '100%',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  pillHint: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
  },
  section: {
    marginTop: 28,
    marginBottom: 12,
  },
  sectionAccent: {
    width: 44,
    height: 3,
    borderRadius: 2,
  },
  hScroll: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  stationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingVertical: 4,
  },
  stationGridItem: {
    flexGrow: 1,
    flexBasis: '48%',
    minWidth: 280,
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    gap: 12,
    marginTop: 4,
  },
  qWrap: {
    flexGrow: 1,
    minWidth: 104,
    alignSelf: 'stretch',
  },
  qBorder: {
    borderRadius: 18,
    padding: 1,
  },
  qInner: {
    borderRadius: 17,
    overflow: 'hidden',
    minHeight: 96,
    flex: 1,
  },
  qContent: {
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  qIcon: {
    marginBottom: 8,
  },
  qLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  qSub: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
