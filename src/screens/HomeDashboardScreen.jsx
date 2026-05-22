import React, { useEffect } from 'react';
import {
  ScrollView, Text, View, Pressable,
  StyleSheet, ActivityIndicator, TextInput, Image, Alert, Platform
} from 'react-native';
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
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────
export function HomeDashboardScreen() {
  const navigation  = useNavigation();
  const stackNav    = useMainStackNav();
  const { user, logout } = useAuth();
  const { colors: C, isDark } = useTheme();
  const {
    contentContainerStyle, cardSnapInterval, quickColBasis,
    isDesktop, isTablet, isLargeScreen, scaleFont,
  } = useResponsive();
  const { loading, vehicle, stations, source, apiBaseUrl, lastError, locationNote, refresh } = useVoltApi();

  // ── SOS pulse animation ──────────────────────────────────────────────────
  const sosPulse = useSharedValue(1);
  useEffect(() => {
    sosPulse.value = withRepeat(
      withSequence(withTiming(1.1, { duration: 800 }), withTiming(1, { duration: 800 })),
      -1, true
    );
  }, [sosPulse]);
  const sosAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosPulse.value }],
  }));

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ScreenBackground>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, contentContainerStyle]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Desktop / Tablet Nav Bar ──────────────────────────────────── */}
        {(isDesktop || isTablet) && (
          <View style={[styles.navBar, { borderBottomColor: C.borderSoft }]}>
            {/* Brand */}
            <View style={styles.navBrand}>
              <View style={[styles.navLogo, { backgroundColor: C.accentCyan }]}>
                <Ionicons name="flash" size={14} color="#fff" />
              </View>
              <Text style={[styles.navBrandText, { color: C.text }]}>
                {isDark ? 'PowerRoute' : 'EV Map'}
              </Text>
            </View>


            {/* Links */}
            <View style={styles.navLinks}>
              {[
                { label: 'Home',        active: true,  onPress: () => {} },
                { label: 'Find Charger', active: false, onPress: () => navigation.navigate('Map') },
                { label: 'Services',    active: false,  onPress: () => stackNav.navigate('NearbyServices') },
                { label: 'Safety',      active: false,  onPress: () => stackNav.navigate('WomenSafety') },
              ].map(({ label, active, onPress }) => (
                <Pressable key={label} onPress={onPress}>
                  <Text style={[styles.navLink, { color: active ? C.accentCyan : C.textMuted }]}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Auth */}
            <View style={styles.navAuth}>
              <Pressable style={{ paddingHorizontal: 14, paddingVertical: 8 }}>
                <Text style={{ color: C.text, fontWeight: '600', fontSize: scaleFont(14) }}>Login</Text>
              </Pressable>
              <Pressable style={[styles.navSignUp, { backgroundColor: C.accentCyan }]}>
                <Text style={styles.navSignUpText}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── User Row ─────────────────────────────────────────────────── */}
        <View style={[styles.userRow, { marginBottom: 24 }]}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={[styles.greeting, { color: C.accentCyan }]}>
              {getGreeting()}, {user?.name || 'EV Driver'}
            </Text>
            <Text style={[styles.vehicleName, { color: C.text, fontSize: scaleFont(20) }]} numberOfLines={1}>
              {vehicle.evVehicleModel || 'Your EV'}
            </Text>
            <DataSourcePill
              loading={loading} source={source} apiBaseUrl={apiBaseUrl}
              lastError={lastError} locationNote={locationNote} onRetry={refresh}
            />
          </View>

          <View style={styles.headerActions}>
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
              style={({ pressed }) => [styles.iconBtn, { borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="log-out-outline" size={isLargeScreen ? 22 : 20} color={C.danger} />
            </Pressable>

            <Pressable
              onPress={() => stackNav.navigate('Notifications')}
              style={({ pressed }) => [styles.iconBtn, { borderColor: C.border, opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="notifications-outline" size={isLargeScreen ? 22 : 20} color={C.accentCyan} />
            </Pressable>

            <ThemeToggle size="sm" showLabel={false} />

            <Animated.View style={sosAnimStyle}>
              <Pressable
                onPress={() => navigation.navigate('EmergencySOS')}
                style={({ pressed }) => [styles.sosBtn, pressed && { opacity: 0.8 }]}
              >
                <Ionicons name="warning" size={isLargeScreen ? 22 : 20} color="#ef4444" />
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* ── Hero Block ───────────────────────────────────────────────── */}
        <View style={[
          styles.hero,
          (isDesktop || isTablet) && { flexDirection: 'row', gap: 32, alignItems: 'center' }
        ]}>
          {/* Left: text + search */}
          <View style={{ flex: 1.2, minWidth: 0 }}>
            <Text style={[styles.heroTitle, { color: C.text, fontSize: scaleFont(isLargeScreen ? 46 : 34) }]}>
              {isDark ? 'Powering the\n' : 'Find EV Charging\n'}
              <Text style={{ color: C.accentCyan }}>
                {isDark ? 'future.' : 'Stations Near You'}
              </Text>
            </Text>

            <Text style={[styles.heroSub, { color: C.textMuted, fontSize: scaleFont(isLargeScreen ? 15 : 13) }]}>
              {isDark
                ? 'Find reliable EV stations, book slots, and travel worry-free.'
                : 'Search, locate and navigate to the best EV charging stations.'}
            </Text>

            {/* Search */}
            <View style={[styles.searchBox, { backgroundColor: isDark ? C.bgElevated : '#fff', borderColor: C.border }]}>
              <Ionicons name="search-outline" size={16} color={C.textFaint} style={{ marginLeft: 14 }} />
              <TextInput
                placeholder="Search station or location…"
                placeholderTextColor={C.textFaint}
                style={[styles.searchInput, { color: C.text, fontSize: scaleFont(13) }]}
                onSubmitEditing={(e) => navigation.navigate('Map', { searchVal: e.nativeEvent.text })}
              />
              <Pressable
                onPress={() => navigation.navigate('Map')}
                style={({ pressed }) => [styles.searchBtn, { backgroundColor: C.accentCyan, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={styles.searchBtnText}>Search</Text>
              </Pressable>
            </View>

            {/* CTA pills */}
            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => navigation.navigate('Map')}
                style={({ pressed }) => [styles.ctaPill, { backgroundColor: C.accentCyan, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="map-outline" size={14} color="#fff" />
                <Text style={styles.ctaPillText}>Live Map</Text>
              </Pressable>
              <Pressable
                onPress={() => stackNav.navigate('AIRecommend')}
                style={({ pressed }) => [styles.ctaGhost, { borderColor: C.border, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="sparkles-outline" size={14} color={C.accentCyan} />
                <Text style={[styles.ctaGhostText, { color: C.text }]}>AI Assist</Text>
              </Pressable>
            </View>
          </View>

          {/* Right: car image */}
          <View style={styles.heroImgWrap}>
            <View style={[styles.heroImgCard, { borderColor: C.border, backgroundColor: isDark ? C.bgCard : '#f8f8ff' }]}>
              <Image
                source={require('../../assets/cyber_car.png')}
                style={styles.heroImg}
              />
            </View>
          </View>
        </View>

        {/* ── Stats Strip ──────────────────────────────────────────────── */}
        <View style={[styles.statsStrip, { backgroundColor: isDark ? C.bgElevated : '#fff', borderColor: C.borderSoft }]}>
          {[
            { value: '25K+', label: 'Active Users' },
            { value: '12K+', label: 'Stations' },
            { value: '98%',  label: 'Uptime' },
            { value: '4.8★', label: 'Rating', accent: true },
          ].map(({ value, label, accent }, i, arr) => (
            <React.Fragment key={label}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: accent ? C.accentCyan : C.text, fontSize: scaleFont(22) }]}>
                  {value}
                </Text>
                <Text style={[styles.statLabel, { color: C.textMuted, fontSize: scaleFont(10) }]}>{label}</Text>
              </View>
              {i < arr.length - 1 && (
                <View style={[styles.statDivider, { backgroundColor: C.borderSoft }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* ── Feature Cards ────────────────────────────────────────────── */}
        <View style={[styles.featureRow, (isDesktop || isTablet) && { flexDirection: 'row' }]}>
          {[
            { icon: 'radio-button-on-outline', title: 'Live Availability', sub: 'Real-time slot status' },
            { icon: 'navigate-circle-outline', title: 'Smart Routing',     sub: 'Fastest paths to charge' },
            { icon: 'shield-checkmark-outline', title: 'Safe & Secure',    sub: 'Verified, lit stations' },
            { icon: 'headset-outline',          title: '24/7 Support',     sub: 'Always here for you' },
          ].map(({ icon, title, sub }) => (
            <View
              key={title}
              style={[styles.featureCard, { backgroundColor: isDark ? C.bgElevated : '#fff', borderColor: C.borderSoft }]}
            >
              <View style={[styles.featureIcon, { backgroundColor: `${C.accentCyan}18` }]}>
                <Ionicons name={icon} size={18} color={C.accentCyan} />
              </View>
              <Text style={[styles.featureTitle, { color: C.text, fontSize: scaleFont(13) }]}>{title}</Text>
              <Text style={[styles.featureSub, { color: C.textFaint, fontSize: scaleFont(11) }]}>{sub}</Text>
            </View>
          ))}
        </View>

        {/* ── Vehicle Status ───────────────────────────────────────────── */}
        <SectionLabel title="Vehicle Status" sub="Battery & AI recommendations" C={C} scaleFont={scaleFont} />
        <DashboardBatteryHero
          batteryPct={vehicle.batteryPct > 0 ? vehicle.batteryPct : 78}
          rangeKm={vehicle.rangeKm > 0 ? vehicle.rangeKm : 342}
          ecoScore={vehicle.ecoScore > 0 ? vehicle.ecoScore : 85}
        />

        {vehicle.isCharging && (
          <ChargingSessionCard chargeKw={vehicle.chargeKw} timeToFullMin={vehicle.timeToFullMin} />
        )}

        {/* ── Nearby Stations ──────────────────────────────────────────── */}
        <SectionLabel title="Nearby Superhubs" sub="Charging stations in your area" C={C} scaleFont={scaleFont} />
        {!loading && stations.length === 0 && (
          <Text style={[styles.emptyHint, { color: C.textFaint, fontSize: scaleFont(13) }]}>
            No stations in range. Run: npm run seed
          </Text>
        )}
        {isDesktop || isTablet ? (
          <View style={styles.stationGrid}>
            {stations.map((s) => (
              <View key={s.id} style={styles.stationGridItem}>
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
            contentContainerStyle={{ paddingRight: 8, paddingVertical: 4 }}
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

        {/* ── Quick Actions ─────────────────────────────────────────────── */}
        <SectionLabel title="Quick Actions" sub="One tap · zero friction" C={C} scaleFont={scaleFont} />
        <View style={styles.quickGrid}>
          {[
            { icon: 'map-outline',              label: 'Live Map',      sub: 'Route + ETA',        onPress: () => navigation.navigate('Map') },
            { icon: 'sparkles-outline',         label: 'AI Assist',     sub: 'Smart suggest',      onPress: () => stackNav.navigate('AIRecommend') },
            { icon: 'stats-chart-outline',      label: 'Insights',      sub: 'Energy + cost',      onPress: () => navigation.navigate('Analytics') },
            { icon: 'warning-outline',          label: 'SOS',           sub: 'Emergency',          onPress: () => navigation.navigate('EmergencySOS'), danger: true },
            { icon: 'business-outline',         label: 'Services',      sub: 'Hotels · hospitals', onPress: () => stackNav.navigate('NearbyServices') },
            { icon: 'notifications-outline',    label: 'Alerts',        sub: 'Smart notifications',onPress: () => stackNav.navigate('Notifications') },
            { icon: 'car-outline',              label: 'Charging Van',  sub: 'Mobile charger',     onPress: () => stackNav.navigate('ChargingVan') },
            { icon: 'shield-checkmark-outline', label: 'Women Safety',  sub: 'Safe mode',          onPress: () => stackNav.navigate('WomenSafety') },
          ].map(({ icon, label, sub, onPress, danger }) => (
            <QuickCard
              key={label}
              icon={icon}
              label={label}
              sub={sub}
              onPress={onPress}
              danger={!!danger}
              colBasis={quickColBasis}
              C={C}
              isDark={isDark}
              scaleFont={scaleFont}
            />
          ))}
        </View>

      </ScrollView>
    </ScreenBackground>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function SectionLabel({ title, sub, C, scaleFont }) {
  return (
    <View style={styles.sectionLabel}>
      <Text style={[styles.sectionTitle, { color: C.text, fontSize: scaleFont(18) }]}>{title}</Text>
      <Text style={[styles.sectionSub, { color: C.textMuted, fontSize: scaleFont(12) }]}>{sub}</Text>
    </View>
  );
}

function QuickCard({ icon, label, sub, onPress, danger, colBasis, C, isDark, scaleFont }) {
  const iconColor = danger ? '#ef4444' : C.accentCyan;
  const iconBg    = danger ? 'rgba(239,68,68,0.1)' : `${C.accentCyan}15`;
  const borderCol = danger ? 'rgba(239,68,68,0.18)' : C.borderSoft;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.quickCard,
        {
          flexBasis: colBasis,
          borderColor: borderCol,
          backgroundColor: isDark ? C.bgElevated : '#fff',
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={[styles.quickIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={[styles.quickLabel, { color: C.text, fontSize: scaleFont(12) }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.quickSub, { color: C.textFaint, fontSize: scaleFont(10) }]} numberOfLines={1}>
        {sub}
      </Text>
    </Pressable>
  );
}

function DataSourcePill({ loading, source, apiBaseUrl, lastError, locationNote, onRetry }) {
  const { colors: C } = useTheme();

  if (loading) {
    return (
      <View style={styles.pillRow}>
        <ActivityIndicator size="small" color={C.accentCyan} />
        <Text style={[styles.pillHint, { color: C.textFaint }]}>Syncing…</Text>
      </View>
    );
  }
  if (lastError) {
    return (
      <View style={styles.pillRow}>
        <View style={[styles.pill, { backgroundColor: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.22)' }]}>
          <Text style={[styles.pillText, { color: C.textMuted }]}>Offline</Text>
        </View>
        <Pressable onPress={onRetry} style={{ flex: 1 }}>
          <Text style={[styles.pillHint, { color: C.textFaint }]} numberOfLines={2}>
            {lastError} · tap to retry
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.pillRow}>
      <View style={[styles.pill, { backgroundColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.25)' }]}>
        <Text style={[styles.pillText, { color: C.accentCyan }]}>Live API</Text>
      </View>
      <Text style={[styles.pillHint, { color: C.textFaint }]} numberOfLines={1}>
        {locationNote || apiBaseUrl}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex:   { flex: 1 },
  scroll: { paddingTop: 8 },

  // ── Nav Bar ──
  navBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, paddingBottom: 14, marginBottom: 20,
  },
  navBrand:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogo:      { width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  navBrandText: { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  navLinks:     { flexDirection: 'row', alignItems: 'center', gap: 28 },
  navLink:      { fontWeight: '600', fontSize: 14 },
  navAuth:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navSignUp:    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  navSignUpText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  // ── User Row ──
  userRow:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingTop: 6 },
  greeting:     { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 2 },
  vehicleName:  { fontWeight: '800', marginBottom: 2 },
  headerActions:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    height: 44, width: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'transparent',
  },
  sosBtn: {
    height: 44, width: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)',
    backgroundColor: 'rgba(239,68,68,0.08)',
  },

  // ── Hero ──
  hero:         { marginBottom: 28 },
  heroTitle:    { fontWeight: '900', letterSpacing: -1, lineHeight: undefined },
  heroSub:      { marginTop: 10, lineHeight: 20, fontWeight: '500', maxWidth: 480 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    padding: 4, marginTop: 18, maxWidth: 460,
  },
  searchInput:  { flex: 1, paddingHorizontal: 10, paddingVertical: 9 },
  searchBtn:    { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 9 },
  searchBtnText:{ color: '#fff', fontWeight: '700', fontSize: 13 },
  heroCtas:     { flexDirection: 'row', gap: 10, marginTop: 14 },
  ctaPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  ctaPillText:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  ctaGhost: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  ctaGhostText: { fontWeight: '700', fontSize: 13 },
  heroImgWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  heroImgCard: {
    borderRadius: 20, borderWidth: 1.5,
    overflow: 'hidden', width: '100%', maxWidth: 420, aspectRatio: 1.4,
  },
  heroImg:      { width: '100%', height: '100%', resizeMode: 'cover' },

  // ── Stats Strip ──
  statsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderWidth: 1, borderRadius: 16,
    paddingVertical: 18, paddingHorizontal: 8,
    marginBottom: 24,
  },
  statItem:    { flex: 1, alignItems: 'center' },
  statValue:   { fontWeight: '900', letterSpacing: -0.5 },
  statLabel:   { fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statDivider: { width: 1, height: 36, opacity: 0.5 },

  // ── Feature Cards ──
  featureRow:  { flexDirection: 'column', gap: 10, marginBottom: 28 },
  featureCard: {
    flex: 1, minWidth: 140,
    borderRadius: 14, borderWidth: 1,
    padding: 16,
  },
  featureIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  featureTitle: { fontWeight: '700', marginBottom: 4 },
  featureSub:   { fontWeight: '500', lineHeight: 16 },

  // ── Section Label ──
  sectionLabel: { marginTop: 24, marginBottom: 14 },
  sectionTitle: { fontWeight: '800' },
  sectionSub:   { marginTop: 4, fontWeight: '500' },

  // ── Station Grid ──
  stationGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 14, paddingVertical: 4 },
  stationGridItem: { flexGrow: 1, flexBasis: '48%', minWidth: 280, maxWidth: '100%', alignSelf: 'stretch' },
  emptyHint:       { textAlign: 'center', marginBottom: 16 },

  // ── Quick Actions ──
  quickGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    alignItems: 'stretch', gap: 10, marginTop: 4,
  },
  quickCard: {
    flexGrow: 1, minWidth: 100,
    borderRadius: 14, borderWidth: 1,
    padding: 14,
  },
  quickIcon: {
    width: 40, height: 40, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  quickLabel: { fontWeight: '700' },
  quickSub:   { marginTop: 3, fontWeight: '600', letterSpacing: 0.2 },

  // ── Data Source Pill ──
  pillRow:  { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  pill:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  pillHint: { flex: 1, flexShrink: 1, minWidth: 0, fontSize: 10, lineHeight: 14 },
});
