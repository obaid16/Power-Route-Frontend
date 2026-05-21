import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Linking,
  Switch,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { ScreenBackground, GlassCard } from '../components';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { NEARBY_EMERGENCY } from '../constants/shieldDemo';
import { api } from '../services/apiClient';
import { useVoltApi } from '../hooks/useVoltApi';

function Pill({ level, children, colors, isDark = true }) {
  const map = {
    safe: { bg: isDark ? 'rgba(52,211,153,0.12)' : 'rgba(16,185,129,0.15)', border: isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.3)', text: isDark ? colors.accentMint : '#059669' },
    moderate: { bg: isDark ? 'rgba(251,191,36,0.12)' : 'rgba(245,158,11,0.15)', border: isDark ? 'rgba(251,191,36,0.35)' : 'rgba(245,158,11,0.3)', text: isDark ? colors.warning : '#d97706' },
    critical: { bg: isDark ? 'rgba(251,113,133,0.15)' : 'rgba(225,29,72,0.15)', border: isDark ? 'rgba(251,113,133,0.4)' : 'rgba(225,29,72,0.3)', text: isDark ? colors.danger : '#e11d48' },
  };
  const s = map[level];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg, borderColor: s.border }]}>
      <Text style={[styles.pillText, { color: s.text }]}>{children}</Text>
    </View>
  );
}

function SectionHeader({ eyebrow, title, subtitle, colors }) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: colors.textFaint }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.sectionSub, { color: colors.textMuted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

function Bar({ label, pct, colors }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.barRow}>
        <Text style={[styles.barLabel, { color: colors.textFaint }]}>{label}</Text>
        <Text style={[styles.barPct, { color: colors.textMuted }]}>{Math.round(pct)}%</Text>
      </View>
      <View style={[styles.barTrack, { borderColor: colors.borderSoft, backgroundColor: colors.isDark ? 'rgba(15,23,42,0.8)' : 'rgba(226, 232, 240, 1)' }]}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.max(0, pct))}%`, backgroundColor: colors.accentCyan }]} />
      </View>
    </View>
  );
}

export function VoltPathShieldScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const {
    horizontalPadding,
    contentMaxWidth,
    scaleFont,
    isTablet,
    isLargeScreen,
    isWide,
    isDesktop,
    isMobile,
  } = useResponsive();

  const { userCoord } = useVoltApi();

  const [safetyOn, setSafetyOn] = useState(false);
  const [fWomen, setFWomen] = useState(true);
  const [fFast, setFFast] = useState(false);
  const [fOpen, setFOpen] = useState(false);
  const [fWait, setFWait] = useState(false);
  const [liveTrack, setLiveTrack] = useState(true);
  const [autoAlert, setAutoAlert] = useState(true);
  const [toast, setToast] = useState('');
  const [fabOpen, setFabOpen] = useState(false);

  const [stationsList, setStationsList] = useState([]);
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch safety data from backend
  useEffect(() => {
    let active = true;
    async function fetchSafeData() {
      setLoading(true);
      try {
        const { latitude, longitude } = userCoord;
        // Fetch safe stations from the API
        const stationsRes = await api(
          `/women-safety/safe-stations?lat=${latitude}&lng=${longitude}&radiusKm=25`
        );
        if (!active) return;
        
        const rawStations = stationsRes?.data?.stations || [];
        setStationsList(rawStations);

        // Fetch reviews for each of the top stations
        const reviewsPromises = rawStations.slice(0, 3).map(async (s) => {
          try {
            const revRes = await api(`/women-safety/community-reviews/${s._id}`);
            return (revRes?.data?.reviews || []).map(r => ({
              ...r,
              station: s.stationName
            }));
          } catch (err) {
            return [];
          }
        });
        const allReviews = await Promise.all(reviewsPromises);
        if (!active) return;
        setReviewsList(allReviews.flat());
      } catch (err) {
        console.error('Failed to fetch safety data:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchSafeData();
    return () => {
      active = false;
    };
  }, [userCoord]);

  // Client-side filtering for fast interactive chip response
  const filteredStations = useMemo(() => {
    return stationsList.filter((s) => {
      if (fWomen && !s.womenSafe) return false;
      if (fFast && !s.cctv) return false; // fast maps to cctv status
      if (fOpen && !s.open247) return false;
      if (fWait && s.waitMinAvg > 15) return false;
      return true;
    });
  }, [stationsList, fWomen, fFast, fOpen, fWait]);

  // Map to the layout structure expected by the original JSX
  const mappedStations = useMemo(() => {
    return filteredStations.map((s) => ({
      id: s._id || s.id,
      name: s.stationName,
      distanceKm: s.distanceKm,
      chargerType: s.chargerTypes?.join(', ') || (s.chargingSpeedKw ? `DC ${s.chargingSpeedKw}kW` : 'AC'),
      available: s.slotAvailability?.availableSlots > 0,
      ports: `${s.slotAvailability?.availableSlots || 0} / ${s.slotAvailability?.totalSlots || 0}`,
      safetyRating: s.safetyRating || 4.5,
      cctv: s.cctv,
      open247: s.open247,
      crowd: s.slotAvailability?.availableSlots < 2 ? 'High' : s.slotAvailability?.availableSlots < 4 ? 'Moderate' : 'Low',
      waitMin: s.waitMinAvg || 0,
      womenSafe: s.womenSafe,
    }));
  }, [filteredStations]);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }, []);

  const contentPad = {
    paddingHorizontal: horizontalPadding,
    paddingBottom: insets.bottom + 100,
    ...(contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : {}),
  };

  return (
    <ScreenBackground>
      <ScrollView contentContainerStyle={contentPad} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.hero, { borderColor: isDark ? colors.borderSoft : 'rgba(0,0,0,0.08)', backgroundColor: isDark ? 'transparent' : '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0 : 0.05, shadowRadius: 12, elevation: isDark ? 0 : 2 }]}>
          <LinearGradient
            colors={isDark ? ['rgba(0,217,126,0.12)', 'transparent'] : ['rgba(0,106,78,0.08)', 'transparent']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View style={styles.heroTop}>
            <View style={[styles.liveDot, { borderColor: colors.border }]}>
              <View style={[styles.liveInner, { backgroundColor: colors.accentMint }]} />
            </View>
            <Text style={[styles.heroBadge, { color: colors.accentCyan }]}>VoltPath Shield</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.text, fontSize: scaleFont(28) }]}>
            Women Safety Mode
          </Text>
          <Text style={[styles.heroSub, { color: colors.textMuted, fontSize: scaleFont(14) }]}>
            Safe EV navigation and emergency protection for solo and night travel.
          </Text>

          <View style={{ flexDirection: 'row', gap: 24, marginTop: 16, marginBottom: 12 }}>
            <View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>14</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Safe stations</Text>
            </View>
            <View>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>3</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Guardians active</Text>
            </View>
            <View>
              <Text style={{ color: colors.accentMint, fontWeight: '800', fontSize: 18 }}>24/7</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>Live monitoring</Text>
            </View>
          </View>

          <View style={[styles.heroActions, (isTablet || isLargeScreen) && { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }]}>
            <Pressable
              onPress={async () => {
                const targetState = !safetyOn;
                try {
                  if (targetState) {
                    await api('/women-safety/activate', {
                      method: 'POST',
                      body: { lat: userCoord.latitude, lng: userCoord.longitude, guardianContacts: ['+91 98765 43210'] }
                    });
                    showToast('Women Safety Mode activated.');
                  } else {
                    await api('/women-safety/deactivate', {
                      method: 'POST',
                      body: { lat: userCoord.latitude, lng: userCoord.longitude }
                    });
                    showToast('Women Safety Mode paused.');
                  }
                  setSafetyOn(targetState);
                } catch (err) {
                  showToast(err.message || 'Action failed — backend down?');
                }
              }}
              style={({ pressed }) => [
                styles.btnPrimary,
                { backgroundColor: safetyOn ? colors.accentMint : colors.accentCyan, opacity: pressed ? 0.9 : 1 },
                (isTablet || isLargeScreen) && { flex: 1, marginTop: 0 }
              ]}
            >
              <Text style={[styles.btnPrimaryTxt, { color: isDark ? '#020617' : '#fff' }]}>
                {safetyOn ? 'Safety on' : 'Activate safety mode'}
              </Text>
            </Pressable>
            <Pressable
              onPress={async () => {
                try {
                  await api('/women-safety/share-location', {
                    method: 'POST',
                    body: { lat: userCoord.latitude, lng: userCoord.longitude, message: 'VoltPath Shield Live Location Share' }
                  });
                  showToast('Live location shared with guardians.');
                } catch (err) {
                  showToast(err.message || 'Share failed.');
                }
              }}
              style={({ pressed }) => [
                styles.btnGhost,
                { borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
                (isTablet || isLargeScreen) && { flex: 1, marginTop: 0 }
              ]}
            >
              <Text style={[styles.btnGhostTxt, { color: colors.text }]}>Share live location</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('EmergencySOS')}
              style={({ pressed }) => [
                styles.btnSos,
                { opacity: pressed ? 0.9 : 1, backgroundColor: isDark ? 'rgba(251,113,133,0.2)' : colors.danger, borderColor: isDark ? 'rgba(251,113,133,0.45)' : colors.danger },
                (isTablet || isLargeScreen) && { flex: 1, marginTop: 0 }
              ]}
            >
              <Text style={[styles.btnSosTxt, { color: isDark ? '#fecdd3' : '#ffffff' }]}>Emergency SOS</Text>
            </Pressable>
          </View>
        </View>

        {/* Smart status */}
        <SectionHeader
          eyebrow="Neural guard"
          title="Smart safety status"
          subtitle="Battery, route, stations, traffic, and emergency access at a glance."
          colors={colors}
        />
        {(() => {
          const gridColumns = isWide ? 3 : isDesktop ? 3 : isTablet ? 2 : 2;
          const gridItemWidth = `${100 / gridColumns - 1.5}%`;
          return (
            <View style={styles.grid2}>
              {[
                ['Battery risk', 'Moderate', 'moderate', 'Mod'],
                ['Route safety', 'Safe', 'safe', 'OK'],
                ['Safe distance', '118 km', 'safe', 'OK'],
                ['Safe stations', stationsList.filter(s => s.womenSafe).length.toString(), 'safe', 'OK'],
                ['Emergency', 'High', 'safe', 'OK'],
                ['Traffic', 'Low', 'safe', 'OK'],
              ].map(([a, b, lvl, pillTxt]) => (
                <View key={a} style={[styles.gridItem, { width: gridItemWidth, flexGrow: isMobile ? 1 : 0 }]}>
                  <GlassCard padding={14}>
                    <Text style={[styles.metricLabel, { color: colors.textFaint }]}>{a}</Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={[styles.metricVal, { color: colors.text }]}>{b}</Text>
                      <Pill level={lvl} colors={colors} isDark={isDark}>
                        {pillTxt}
                      </Pill>
                    </View>
                  </GlassCard>
                </View>
              ))}
            </View>
          );
        })()}

        <GlassCard padding={16} style={{ marginTop: 12 }}>
          <Text style={[styles.eyebrow, { color: colors.textFaint }]}>Recommendations</Text>
          <Text style={[styles.body, { color: colors.textMuted, marginTop: 8 }]}>
            Prefer Aurora Superhub over a shorter isolated stop. Enable live guardian for the next night segment.
          </Text>
        </GlassCard>

        {/* Safe route */}
        <View style={{ height: 24 }} />
        <SectionHeader
          eyebrow="Navigation"
          title="Safe route"
          subtitle="Safest path — lit roads, public areas, verified chargers."
          colors={colors}
        />
        <GlassCard padding={16}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 }}>
            <View>
              <Text style={[styles.metricVal, { color: colors.text }]}>94</Text>
              <Text style={[styles.metricLabel, { color: colors.textFaint, marginTop: 4 }]}>Safety</Text>
            </View>
            <View>
              <Text style={[styles.metricVal, { color: colors.accentCyan }]}>38m</Text>
              <Text style={[styles.metricLabel, { color: colors.textFaint, marginTop: 4 }]}>ETA</Text>
            </View>
            <View>
              <Text style={[styles.metricVal, { color: colors.warning }]}>Low</Text>
              <Text style={[styles.metricLabel, { color: colors.textFaint, marginTop: 4 }]}>Risk</Text>
            </View>
          </View>
          {NEARBY_EMERGENCY.map((n) => (
            <View key={n.label} style={[styles.emRow, { borderColor: colors.borderSoft }]}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>{n.type}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{n.label}</Text>
              <Text style={{ color: colors.accentCyan, fontSize: 12 }}>{n.dist}</Text>
            </View>
          ))}
        </GlassCard>

        {/* Stations */}
        <View style={{ height: 24 }} />
        <SectionHeader
          eyebrow="Infrastructure"
          title="Verified safe charging"
          subtitle="Filter to match your comfort."
          colors={colors}
        />
        <View style={styles.filterRow}>
          {[
            ['Women-safe', fWomen, setFWomen],
            ['Fast', fFast, setFFast],
            ['24/7', fOpen, setFOpen],
            ['Low wait', fWait, setFWait],
          ].map(([label, on, set]) => (
            <Pressable
              key={label}
              onPress={() => set((v) => !v)}
              style={[styles.filterChip, { borderColor: on ? colors.accentCyan : colors.borderSoft, backgroundColor: on ? 'rgba(0,217,126,0.12)' : 'transparent' }]}
            >
              <Text style={{ color: on ? colors.accentCyan : colors.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
            </Pressable>
          ))}
        </View>
        {mappedStations.map((s) => (
          <GlassCard key={s.id} padding={14} style={{ marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '700', flex: 1 }} numberOfLines={2}>
                {s.name}
              </Text>
              {s.womenSafe ? (
                <Pill level="safe" colors={colors} isDark={isDark}>
                  Safe
                </Pill>
              ) : (
                <Pill level="moderate" colors={colors} isDark={isDark}>
                  Review
                </Pill>
              )}
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
              {s.distanceKm} km · {s.chargerType}
            </Text>
            <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 8 }}>
              CCTV {s.cctv ? 'yes' : 'no'} · 24/7 {s.open247 ? 'yes' : 'no'} · Wait {s.waitMin}m · {s.crowd} crowd
            </Text>
          </GlassCard>
        ))}

        {/* Guardian */}
        <View style={{ height: 24 }} />
        <SectionHeader eyebrow="Trusted circle" title="Live guardian" subtitle="Share trip with people you trust." colors={colors} />
        <GlassCard padding={16}>
          <View style={styles.toggleRow}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Live tracking</Text>
            <Switch value={liveTrack} onValueChange={setLiveTrack} trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: colors.accentMint }} thumbColor="#fff" />
          </View>
          <View style={[styles.toggleRow, { marginTop: 12 }]}>
            <Text style={{ color: colors.text, fontWeight: '600' }}>Auto emergency alerts</Text>
            <Switch value={autoAlert} onValueChange={setAutoAlert} trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: colors.accentCyan }} thumbColor="#fff" />
          </View>
        </GlassCard>



        {/* Map abstract */}
        <View style={{ height: 24 }} />
        <SectionHeader eyebrow="Map" title="Safe zone view" subtitle="Corridors, chargers, and emergency assets." colors={colors} />
        <View style={[styles.mapBox, { borderColor: colors.border, backgroundColor: isDark ? 'rgba(2,6,23,0.5)' : 'rgba(248,250,252,0.8)' }]}>
          <View style={[styles.mapSafe, { borderColor: isDark ? 'rgba(52,211,153,0.35)' : 'rgba(16,185,129,0.3)' }]} />
          <View style={[styles.mapYou, { backgroundColor: colors.accentCyan }]} />
          <View style={styles.mapLegend}>
            <Text style={{ color: colors.textFaint, fontSize: 10 }}>● Safe  ● Caution  ● You</Text>
          </View>
        </View>

        {/* Community */}
        <View style={{ height: 24 }} />
        <SectionHeader eyebrow="Community" title="Safety reviews" subtitle="Verified driver experiences." colors={colors} />
        {reviewsList.length === 0 ? (
          <GlassCard padding={14}>
            <Text style={{ color: colors.textMuted, fontSize: 13, textAlign: 'center' }}>
              No safety reviews submitted yet. Submit a review after your session to keep the community safe!
            </Text>
          </GlassCard>
        ) : (
          reviewsList.slice(0, 4).map((r) => (
            <GlassCard key={r.id || r._id} padding={14} style={{ marginBottom: 10 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{r.author}</Text>
              <Text style={{ color: colors.accentCyan, fontSize: 12 }}>{r.station}</Text>
              <Text style={{ color: colors.textMuted, marginTop: 6, fontSize: 13 }}>{r.text}</Text>
              <Text style={{ color: colors.accentMint, fontSize: 11, marginTop: 8 }}>{r.trust}</Text>
            </GlassCard>
          ))
        )}

        {/* Night */}
        <View style={{ height: 24 }} />
        <SectionHeader eyebrow="Night travel" title="Night assistance" subtitle="Tighter thresholds after dark." colors={colors} />
        <View style={styles.grid2}>
          <View style={styles.gridItem}>
            <GlassCard padding={14}>
              <Text style={[styles.metricLabel, { color: colors.textFaint }]}>Low battery mode</Text>
              <Text style={[styles.metricVal, { color: colors.warning, marginTop: 6 }]}>Standby</Text>
            </GlassCard>
          </View>
          <View style={styles.gridItem}>
            <GlassCard padding={14}>
              <Text style={[styles.metricLabel, { color: colors.textFaint }]}>Shelter suggestions</Text>
              <Text style={[styles.body, { color: colors.textMuted, marginTop: 6 }]}>Marina Inn · Transit hub</Text>
            </GlassCard>
          </View>
        </View>

        {/* Risk analytics */}
        <View style={{ height: 24 }} />
        <SectionHeader eyebrow="Analytics" title="Risk analysis" subtitle="Live composite risk layers." colors={colors} />
        <GlassCard padding={16}>
          <Bar label="Battery risk" pct={34} colors={colors} />
          <Bar label="Route danger (inverse)" pct={12} colors={colors} />
          <Bar label="Charging access" pct={88} colors={colors} />
          <Bar label="Emergency availability" pct={91} colors={colors} />
        </GlassCard>

        {/* CTA */}
        <View style={{ height: 24 }} />
        <LinearGradient
          colors={['rgba(0,217,126,0.2)', 'rgba(52,211,153,0.12)']}
          style={[styles.cta, { borderColor: colors.border }]}
        >
          <Text style={[styles.ctaTitle, { color: colors.text }]}>Travel solo with a safety net</Text>
          <Text style={[styles.body, { color: colors.textMuted, textAlign: 'center', marginTop: 8 }]}>
            Activate Women Safety Mode for night routes and low battery.
          </Text>
          <Pressable
            onPress={() => {
              setSafetyOn(true);
              showToast('Women Safety Mode on.');
            }}
            style={[styles.btnPrimary, { marginTop: 16, backgroundColor: colors.accentCyan }]}
          >
            <Text style={[styles.btnPrimaryTxt, { color: '#020617' }]}>Activate now</Text>
          </Pressable>
        </LinearGradient>
      </ScrollView>

      {/* Floating assistant */}
      <View style={[styles.fabWrap, { bottom: insets.bottom + 20 }]}>
        {fabOpen ? (
          <GlassCard padding={12} style={{ marginBottom: 12, minWidth: 200 }}>
            <Pressable onPress={() => { setFabOpen(false); navigation.navigate('AIRecommend'); }} style={styles.fabItem}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Help</Text>
            </Pressable>
            <Pressable onPress={() => { setFabOpen(false); navigation.navigate('EmergencySOS'); }} style={styles.fabItem}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>SOS</Text>
            </Pressable>
            <Pressable onPress={() => { setFabOpen(false); navigation.navigate('MainTabs', { screen: 'Map' }); }} style={styles.fabItem}>
              <Text style={{ color: colors.text, fontWeight: '600' }}>Live map</Text>
            </Pressable>
          </GlassCard>
        ) : null}
        <Pressable
          onPress={() => setFabOpen((o) => !o)}
          style={[styles.fab, { backgroundColor: colors.accentCyan, borderColor: colors.border }]}
        >
          <Ionicons name="shield-checkmark" size={26} color="#020617" />
        </Pressable>
      </View>

      {toast ? (
        <View style={[styles.toast, { bottom: insets.bottom + 88, borderColor: colors.border, backgroundColor: isDark ? 'rgba(10,22,40,0.95)' : 'rgba(255,255,255,0.95)' }]}>
          <Text style={{ color: colors.text, fontSize: 13, textAlign: 'center' }}>{toast}</Text>
        </View>
      ) : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 8,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  liveDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInner: { width: 8, height: 8, borderRadius: 4 },
  heroBadge: { fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  heroTitle: { fontWeight: '300', letterSpacing: -0.5 },
  heroSub: { marginTop: 10, lineHeight: 20 },
  heroActions: { marginTop: 18, gap: 10 },
  btnPrimary: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  btnPrimaryTxt: { fontWeight: '800', fontSize: 14 },
  btnGhost: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1 },
  btnGhostTxt: { fontWeight: '600', fontSize: 14 },
  btnSos: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', borderWidth: 1 },
  btnSosTxt: { fontWeight: '800', fontSize: 14 },
  sectionHeader: { marginBottom: 12, marginTop: 8 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase' },
  sectionTitle: { fontSize: 24, fontWeight: '700', marginTop: 4 },
  sectionSub: { fontSize: 13, marginTop: 6, lineHeight: 18 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridItem: { width: '48%', flexGrow: 1, minWidth: 150 },
  metricLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  metricVal: { fontSize: 18, fontWeight: '600' },
  pill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1 },
  pillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  body: { lineHeight: 20 },
  emRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  filterChip: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8 },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sosCell: {
    width: Platform.OS === 'web' ? '30%' : '31%',
    minWidth: 100,
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
  },
  waveRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 4, height: 48 },
  waveBar: { width: 5, borderRadius: 3, opacity: 0.85 },
  micBtn: {
    alignSelf: 'center',
    marginTop: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBox: {
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mapSafe: {
    position: 'absolute',
    left: '8%',
    top: '12%',
    right: '8%',
    bottom: '25%',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'rgba(52,211,153,0.08)',
  },
  mapYou: {
    position: 'absolute',
    bottom: '28%',
    left: '42%',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  mapLegend: { position: 'absolute', bottom: 8, left: 8, right: 8 },
  cta: { borderRadius: 20, borderWidth: 1, padding: 20, alignItems: 'center' },
  ctaTitle: { fontSize: 20, fontWeight: '600', textAlign: 'center' },
  fabWrap: { position: 'absolute', left: 16, alignItems: 'flex-start', zIndex: 99, elevation: 10 },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabItem: { paddingVertical: 10 },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  barPct: { fontSize: 10, fontWeight: '700' },
  barTrack: { height: 8, borderRadius: 999, borderWidth: 1, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
});
