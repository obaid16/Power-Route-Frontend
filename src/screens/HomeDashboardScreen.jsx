import React, { useEffect } from 'react';
import {
  ScrollView, Text, View, Pressable,
  StyleSheet, ActivityIndicator, TextInput, Image, Alert, Platform, ImageBackground
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

        {/* ── Desktop / Tablet Nav Bar (ELECTRA) ───────────────────────── */}
        {(isDesktop || isTablet) && (
          <View style={[styles.navBarPill, { backgroundColor: isDark ? '#060810' : '#ffffff', borderColor: C.borderSoft }]}>
            {/* Brand */}
            <View style={styles.navBrand}>
              <View style={[styles.navLogoElectra]}>
                <Ionicons name="flash" size={14} color="#ffffff" />
              </View>
              <Text style={[styles.navBrandText, { color: C.text }]}>
                ELECTRA
              </Text>
            </View>


            {/* Links */}
            <View style={styles.navLinks}>
              {[
                { label: 'Home',     active: true,  onPress: () => {} },
                { label: 'Map',      active: false, onPress: () => navigation.navigate('Map') },
                { label: 'Vehicles', active: false, onPress: () => {} },
                { label: 'Safety',   active: false, onPress: () => stackNav.navigate('WomenSafety') },
              ].map(({ label, active, onPress }) => (
                <Pressable key={label} onPress={onPress} style={styles.navLinkContainer}>
                  <Text style={[styles.navLink, { color: active ? C.accentCyan : C.textMuted }]}>
                    {label}
                  </Text>
                  {active && (
                    <View style={[styles.navLinkActiveBar, { backgroundColor: C.accentCyan }]} />
                  )}
                </Pressable>
              ))}
            </View>

            {/* User Row / Actions */}
            <View style={styles.navActions}>
              <Pressable onPress={() => navigation.navigate('EmergencySOS')}>
                <Text style={{ color: C.textMuted, fontSize: scaleFont(13), fontWeight: '600' }}>SOS</Text>
              </Pressable>
              
              <Pressable onPress={() => stackNav.navigate('Notifications')}>
                <Ionicons name="notifications" size={18} color={C.textMuted} />
              </Pressable>
              
              <ThemeToggle size="sm" showLabel={false} />
              
              <View style={styles.avatarWrap}>
                <Image 
                  source={{ uri: 'https://i.pravatar.cc/100?img=47' }} 
                  style={styles.avatarImg} 
                />
              </View>
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

        {/* ── Landing Page Hero Block ───────────────────────────────────────── */}
        <ImageBackground 
          source={require('../../assets/hero_bg.jpg')}
          style={[
            styles.hero,
            (isDesktop || isTablet) && { flexDirection: 'row', gap: 40, alignItems: 'center', marginTop: 20 },
            { padding: isDesktop ? 60 : 30, borderRadius: 24, overflow: 'hidden', minHeight: 460 }
          ]}
          imageStyle={{ resizeMode: 'cover', borderRadius: 24 }}
        >
          {/* Left: Text & CTA */}
          <View style={{ flex: 1.1, minWidth: 0, zIndex: 10 }}>
            <Text style={[styles.heroTitle, { color: '#ffffff', fontSize: scaleFont(isLargeScreen ? 60 : 44), lineHeight: scaleFont(isLargeScreen ? 68 : 52) }]}>
              Smart. Safe.{'\n'}
              <Text style={{ color: C.accentPurple }}>
                Sustainable.
              </Text>
            </Text>

            <Text style={[styles.heroSub, { color: C.textMuted, fontSize: scaleFont(isLargeScreen ? 18 : 15), marginTop: 24, maxWidth: 380 }]}>
              Empowering every journey{'\n'}with Electric Mobility.
            </Text>

            {/* CTA Buttons */}
            <View style={styles.heroCtas}>
              <Pressable
                onPress={() => navigation.navigate('Map')}
                style={({ pressed }) => [
                  styles.ctaPrimary, 
                  { backgroundColor: C.accentPurple, opacity: pressed ? 0.85 : 1 }
                ]}
              >
                <Text style={styles.ctaPrimaryText}>Get Started</Text>
              </Pressable>
              <Pressable
                onPress={() => {}}
                style={({ pressed }) => [
                  styles.ctaSecondary, 
                  { borderColor: 'rgba(255,255,255,0.2)', opacity: pressed ? 0.85 : 1 }
                ]}
              >
                <Text style={[styles.ctaSecondaryText, { color: '#ffffff' }]}>Learn More</Text>
              </Pressable>
            </View>
          </View>

          {/* Right: Empty space to let background image (car) show through */}
          <View style={{ flex: 1 }} />
        </ImageBackground>

        {/* ── Feature Cards Row ──────────────────────────────────────────── */}
        <View style={[styles.featureRow, (isDesktop || isTablet) && { flexDirection: 'row', marginTop: 20 }]}>
          {[
            { icon: 'leaf', title: 'Eco Friendly', sub: 'Zero emission\nfor a better planet', color: '#10b981' },
            { icon: 'phone-portrait-outline', title: 'Smart Charging', sub: 'Find, book and\ncharge anywhere', color: '#f59e0b' },
            { icon: 'person', title: 'Women Safety', sub: 'Your safety,\nour priority', color: '#a855f7' },
            { icon: 'location', title: 'Real-time Updates', sub: 'Live tracking and\nvehicle insights', color: '#6366f1' },
          ].map(({ icon, title, sub, color }) => (
            <View
              key={title}
              style={[styles.featureCardMock, { backgroundColor: isDark ? '#0b0f19' : '#ffffff', borderColor: C.borderSoft }]}
            >
              <View style={styles.featureIconWrap}>
                <Ionicons name={icon} size={24} color={color} />
              </View>
              <Text style={[styles.featureTitleMock, { color: C.text, fontSize: scaleFont(15) }]}>{title}</Text>
              <Text style={[styles.featureSubMock, { color: C.textMuted, fontSize: scaleFont(12) }]}>{sub}</Text>
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

  // ── Nav Bar (ELECTRA) ──
  navBarPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  navBrand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navLogoElectra: { 
    width: 28, height: 28, borderRadius: 14, 
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#8b5cf6', // purple accent
  },
  navBrandText: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  navLinks: { flexDirection: 'row', alignItems: 'center', gap: 32 },
  navLinkContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: 32,
  },
  navLink: { fontWeight: '700', fontSize: 13 },
  navLinkActiveBar: {
    position: 'absolute',
    bottom: -4,
    width: '100%',
    height: 2,
    borderRadius: 2,
  },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: {
    width: 32, height: 32, borderRadius: 16,
    overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarImg: { width: '100%', height: '100%', resizeMode: 'cover' },

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

  // ── Hero (Landing Page Mock) ──
  hero:         { marginBottom: 28 },
  heroTitle:    { fontWeight: '900', letterSpacing: -1.5 },
  heroSub:      { lineHeight: 24, fontWeight: '500' },
  heroCtas:     { flexDirection: 'row', gap: 12, marginTop: 32 },
  ctaPrimary: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaPrimaryText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  ctaSecondary: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 8, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaSecondaryText: { fontWeight: '700', fontSize: 14 },
  heroImgWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  heroImg:      { width: '100%', height: 340 },

  // ── Feature Cards (Landing Page Mock) ──
  featureRow:  { flexDirection: 'column', gap: 16, marginBottom: 40 },
  featureCardMock: {
    flex: 1, minWidth: 150,
    borderRadius: 16, borderWidth: 1,
    padding: 20,
    justifyContent: 'flex-start'
  },
  featureIconWrap: {
    marginBottom: 20,
  },
  featureTitleMock: { fontWeight: '700', marginBottom: 8, letterSpacing: -0.3 },
  featureSubMock:   { fontWeight: '500', lineHeight: 18 },

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
