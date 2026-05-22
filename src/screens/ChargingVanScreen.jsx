/**
 * ChargingVanScreen — PowerRoute
 *
 * Mobile Charging Van feature:
 * - Shows nearby charging vans on a canvas map
 * - User can request portable charging service
 * - Live ETA tracking of van arrival
 * - Contact van driver directly
 */
import { useState, useEffect, useRef } from 'react';
import { ScrollView, Text, View, Pressable, ActivityIndicator, Animated, Easing } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassCard } from '../components';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/apiClient';


// ── Animated van icon ─────────────────────────────────────────────────────────
function PulsingVan({ color }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.25, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 800, easing: Easing.in(Easing.ease),  useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', width: 48, height: 48 }}>
      <Animated.View style={{
        position: 'absolute', width: 44, height: 44, borderRadius: 22,
        backgroundColor: `${color}25`, transform: [{ scale: pulse }],
      }} />
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: `${color}20`, borderWidth: 2, borderColor: color,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name="car" size={18} color={color} />
      </View>
    </View>
  );
}

// ── Demo van data ─────────────────────────────────────────────────────────────
const DEMO_VANS = [
  { _id: "van-1", driverName: "Arjun Singh",  vehicleNo: "DL 01 EV 2024", distanceKm: 1.4, etaMinutes: 8,  maxKw: 22, pricePerKwh: 0.38, rating: 4.8, available: true,  phone: "+91 98765 43210" },
  { _id: "van-2", driverName: "Priya Sharma", vehicleNo: "MH 02 EV 5566", distanceKm: 2.9, etaMinutes: 16, maxKw: 15, pricePerKwh: 0.34, rating: 4.6, available: true,  phone: "+91 91234 56789" },
  { _id: "van-3", driverName: "Ravi Kumar",   vehicleNo: "KA 03 EV 7788", distanceKm: 4.2, etaMinutes: 24, maxKw: 30, pricePerKwh: 0.42, rating: 4.9, available: false, phone: "+91 99887 76655" },
];

export function ChargingVanScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { vehicle } = useVoltApi();
  const { contentContainerStyle, scaleFont, isLargeScreen, horizontalPadding, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();

  const [vans, setVans]                 = useState([]);
  const [loadingVans, setLoadingVans]   = useState(true);
  const [requestedVan, setRequestedVan] = useState(null);
  const [requesting, setRequesting]     = useState(null); // van ID being requested
  const [etaCountdown, setEtaCountdown] = useState(null);

  // Fetch available vans on mount and restore active request
  useEffect(() => {
    setVans(DEMO_VANS);
    setLoadingVans(false);
  }, []);

  // Countdown timer once a van is requested
  useEffect(() => {
    if (!requestedVan) return;
    setEtaCountdown(requestedVan.etaMinutes * 60); // seconds
    const interval = setInterval(() => {
      setEtaCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [requestedVan]);

  const handleRequest = async (van) => {
    setRequesting(van._id);
    try {
      await new Promise((r) => setTimeout(r, 1200)); // simulate API
      setRequestedVan(van);
    } catch (err) {
      console.error('Request failed:', err);
    } finally {
      setRequesting(null);
    }
  };

  const cancelRequest = async () => {
    setRequestedVan(null);
    setEtaCountdown(null);
  };

  const formatCountdown = (secs) => {
    if (secs === null) return '';
    if (secs === 0) return 'Arrived';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const availableVans = vans.filter((v) => v.available);
  const batteryPct = vehicle?.batteryPct ?? 0;

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentContainerStyle, { paddingTop: insets.top + 12, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 16 }}
        >
          <Ionicons name="chevron-back" size={scaleFont(22)} color={colors.accentCyan} />
          <Text style={{ fontWeight: '600', color: colors.accentCyan, fontSize: scaleFont(14) }}>Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={{ fontSize: scaleFont(26), fontWeight: '900', letterSpacing: -0.6, color: colors.accentCyan }}>
          PowerRoute
        </Text>
        <Text style={{ marginTop: 2, fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 24 : 20) }}>
          Mobile Charging Van
        </Text>
        <Text style={{ marginTop: 4, color: colors.textMuted, fontSize: scaleFont(14), fontWeight: '600', marginBottom: 20 }}>
          Request a portable charger delivered to your location
        </Text>

        {/* ── Hero Service Banner ────────────────────────────────────────────── */}
        <View style={{
          borderRadius: 18,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: isDark ? '#0e1424' : '#f8fafc',
          padding: 20,
          marginBottom: 20,
          flexDirection: isTablet || isLargeScreen ? 'row' : 'column',
          alignItems: isTablet || isLargeScreen ? 'center' : 'flex-start',
          gap: 16,
        }}>
          {/* Van Icon */}
          <View style={{
            width: isLargeScreen ? 80 : 64, height: isLargeScreen ? 80 : 64,
            borderRadius: isLargeScreen ? 40 : 32,
            backgroundColor: `${colors.accentCyan}15`,
            borderWidth: 2, borderColor: `${colors.accentCyan}40`,
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Ionicons name="car" size={isLargeScreen ? 36 : 28} color={colors.accentCyan} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 18 : 16), marginBottom: 8 }}>
              Mobile Charging Service
            </Text>
            {/* Service Badges */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { icon: 'flash', label: 'Fast Charge', color: colors.accentCyan, bg: `${colors.accentCyan}15`, border: `${colors.accentCyan}40` },
                { icon: 'leaf-outline', label: 'Eco-Friendly', color: colors.success || '#10b981', bg: `${colors.success || '#10b981'}15`, border: `${colors.success || '#10b981'}40` },
                { icon: 'shield-checkmark-outline', label: '24/7 Support', color: colors.primary || '#a855f7', bg: `${colors.primary || '#a855f7'}15`, border: `${colors.primary || '#a855f7'}40` },
                { icon: 'location-outline', label: 'On-Demand', color: colors.warning || '#fbbf24', bg: `${colors.warning || '#fbbf24'}15`, border: `${colors.warning || '#fbbf24'}40` },
              ].map((badge) => (
                <View key={badge.label} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 10, paddingVertical: 5,
                  borderRadius: 20, borderWidth: 1,
                  backgroundColor: badge.bg, borderColor: badge.border,
                }}>
                  <Ionicons name={badge.icon} size={11} color={badge.color} />
                  <Text style={{ color: badge.color, fontSize: scaleFont(11), fontWeight: '700' }}>{badge.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Battery warning if low */}
        {batteryPct > 0 && batteryPct <= 20 && (
          <View style={{
            marginBottom: 16, borderRadius: 14, borderWidth: 1,
            borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.1)',
            padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Ionicons name="battery-dead" size={22} color={colors.danger} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.danger, fontSize: scaleFont(13) }}>
                Critical battery — {batteryPct}%
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(12), marginTop: 2 }}>
                Request a van now before you run out of range.
              </Text>
            </View>
          </View>
        )}

        {/* ── Active request tracking ──────────────────────────────────────── */}
        {requestedVan && (
          <GlassCard style={{ marginBottom: 20 }} padding={isLargeScreen ? 20 : 16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accentMint }} />
              <Text style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2, color: colors.accentMint, fontSize: scaleFont(11) }}>
                Van en route
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
              <PulsingVan color={colors.accentMint} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(16) }}>
                  {requestedVan.driverName}
                </Text>
                <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 2 }}>
                  {requestedVan.vehicleNo} · {requestedVan.maxKw} kW
                </Text>
              </View>
              {/* ETA countdown */}
              <View style={{
                alignItems: 'center', justifyContent: 'center',
                width: 72, height: 72, borderRadius: 36,
                borderWidth: 2, borderColor: colors.accentMint,
                backgroundColor: 'rgba(52,211,153,0.1)',
              }}>
                <Text style={{ fontWeight: '800', color: colors.accentMint, fontSize: scaleFont(18), lineHeight: 20 }}>
                  {etaCountdown === 0 ? '✓' : formatCountdown(etaCountdown)}
                </Text>
                {etaCountdown !== 0 && (
                  <Text style={{ color: colors.textFaint, fontSize: scaleFont(9), fontWeight: '600' }}>ETA</Text>
                )}
              </View>
            </View>

            {/* Progress bar */}
            <View style={{ marginTop: 14, height: 4, borderRadius: 2, backgroundColor: colors.borderSoft, overflow: 'hidden' }}>
              <Animated.View style={{
                height: 4, borderRadius: 2, backgroundColor: colors.accentMint,
                width: etaCountdown !== null
                  ? `${Math.max(5, 100 - (etaCountdown / (requestedVan.etaMinutes * 60)) * 100)}%`
                  : '5%',
              }} />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Pressable
                onPress={() => { /* call driver */ }}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderRadius: 12, borderWidth: 1, borderColor: colors.border,
                  backgroundColor: isDark ? 'rgba(0,217,126,0.08)' : 'rgba(0,106,78,0.08)',
                  paddingVertical: 12,
                }}
              >
                <Ionicons name="call" size={16} color={colors.accentCyan} />
                <Text style={{ fontWeight: '700', color: colors.accentCyan, fontSize: scaleFont(13) }}>Call driver</Text>
              </Pressable>
              <Pressable
                onPress={cancelRequest}
                style={{
                  flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                  borderRadius: 12, borderWidth: 1, borderColor: 'rgba(239,68,68,0.35)',
                  backgroundColor: 'rgba(239,68,68,0.08)', paddingVertical: 12,
                }}
              >
                <Ionicons name="close-circle" size={16} color={colors.danger} />
                <Text style={{ fontWeight: '700', color: colors.danger, fontSize: scaleFont(13) }}>Cancel</Text>
              </Pressable>
            </View>
          </GlassCard>
        )}

        {/* ── How it works ─────────────────────────────────────────────────── */}
        {!requestedVan && (
          <GlassCard style={{ marginBottom: 20 }} padding={isLargeScreen ? 18 : 14}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(14), marginBottom: 12 }}>
              How it works
            </Text>
            {[
              { icon: 'location',  step: '1', text: 'We detect your location automatically' },
              { icon: 'car',       step: '2', text: 'A nearby charging van is dispatched to you' },
              { icon: 'flash',     step: '3', text: 'Van arrives and charges your EV on the spot' },
              { icon: 'cash',      step: '4', text: 'Pay per kWh — no session fee' },
            ].map((item) => (
              <View key={item.step} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: 'rgba(0,217,126,0.12)', borderWidth: 1, borderColor: colors.border,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontWeight: '800', color: colors.accentCyan, fontSize: scaleFont(12) }}>{item.step}</Text>
                </View>
                <Text style={{ flex: 1, color: colors.textMuted, fontSize: scaleFont(13) }}>{item.text}</Text>
              </View>
            ))}
          </GlassCard>
        )}

        {/* ── Available vans ───────────────────────────────────────────────── */}
        <Text style={{ fontWeight: '800', color: colors.text, fontSize: scaleFont(22), marginBottom: 12 }}>
          {availableVans.length} Van{availableVans.length !== 1 ? 's' : ''} Nearby
        </Text>

        {loadingVans ? (
          <GlassCard padding={24}>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <ActivityIndicator color={colors.accentCyan} size="large" />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(13) }}>
                Scanning for nearby charging vans...
              </Text>
            </View>
          </GlassCard>
        ) : (
          <View style={isTablet || isLargeScreen ? { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 } : { gap: 10 }}>
            {vans.map((van) => (
              <View
                key={van._id}
                style={[
                  {
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: van.available ? colors.borderSoft : 'rgba(148,163,184,0.08)',
                    backgroundColor: isDark
                      ? van.available ? 'rgba(15,23,42,0.7)' : 'rgba(15,23,42,0.35)'
                      : van.available ? 'rgba(255,255,255,0.85)' : 'rgba(240,244,248,0.5)',
                    padding: isLargeScreen ? 18 : 14,
                    opacity: van.available ? 1 : 0.5,
                  },
                  (isTablet || isLargeScreen) && { flexBasis: '48%', flexGrow: 1 }
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  {/* Van icon */}
                  <View style={{
                    width: 44, height: 44, borderRadius: 22,
                    backgroundColor: van.available ? 'rgba(0,217,126,0.12)' : 'rgba(148,163,184,0.1)',
                    borderWidth: 1, borderColor: van.available ? colors.border : colors.borderSoft,
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Ionicons name="car" size={20} color={van.available ? colors.accentCyan : colors.textFaint} />
                  </View>

                  {/* Info */}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(15) }} numberOfLines={1}>
                        {van.driverName}
                      </Text>
                      <View style={{
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
                        backgroundColor: van.available ? 'rgba(52,211,153,0.15)' : 'rgba(148,163,184,0.12)',
                        borderWidth: 1, borderColor: van.available ? 'rgba(52,211,153,0.4)' : 'rgba(148,163,184,0.2)',
                      }}>
                        <Text style={{ fontSize: scaleFont(10), fontWeight: '700', color: van.available ? colors.accentMint : colors.textFaint }}>
                          {van.available ? 'Available' : 'Busy'}
                        </Text>
                      </View>
                    </View>

                    <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 2 }}>
                      {van.vehicleNo}
                    </Text>

                    {/* Stats row */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                      <StatItem icon="location-outline" value={`${van.distanceKm} km`} color={colors.accentCyan} scaleFont={scaleFont} colors={colors} />
                      <StatItem icon="time-outline"     value={`${van.etaMinutes} min ETA`} color={colors.accentCyan} scaleFont={scaleFont} colors={colors} />
                      <StatItem icon="flash-outline"    value={`${van.maxKw} kW`} color={colors.accentMint} scaleFont={scaleFont} colors={colors} />
                      <StatItem icon="cash-outline"     value={`$${van.pricePerKwh}/kWh`} color={colors.textMuted} scaleFont={scaleFont} colors={colors} />
                      <StatItem icon="star"             value={`${van.rating}`} color="#fbbf24" scaleFont={scaleFont} colors={colors} />
                    </View>
                  </View>
                </View>

                {/* Request button */}
                {van.available && !requestedVan && (
                  <Pressable
                    onPress={() => handleRequest(van)}
                    disabled={requesting === van._id}
                    style={({ pressed }) => ({
                      marginTop: 14, borderRadius: 12, overflow: 'hidden',
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <LinearGradient
                      colors={['#00D97E', '#3CCB95']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{ paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}
                    >
                      {requesting === van._id ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="car" size={16} color="#ffffff" />
                          <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: scaleFont(14) }}>
                            Request this van
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </Pressable>
                )}

                {/* Already requested */}
                {requestedVan?._id === van._id && (
                  <View style={{
                    marginTop: 12, borderRadius: 10, borderWidth: 1,
                    borderColor: 'rgba(52,211,153,0.35)', backgroundColor: 'rgba(52,211,153,0.1)',
                    padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
                  }}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.accentMint} />
                    <Text style={{ color: colors.accentMint, fontSize: scaleFont(13), fontWeight: '600' }}>
                      Requested · van is on the way
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* No vans fallback */}
        {availableVans.length === 0 && !loadingVans && (
          <GlassCard padding={20}>
            <View style={{ alignItems: 'center', gap: 10 }}>
              <Ionicons name="car-outline" size={36} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(14), textAlign: 'center' }}>
                No charging vans available nearby right now. Try again in a few minutes.
              </Text>
            </View>
          </GlassCard>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

function StatItem({ icon, value, color, scaleFont, colors }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={12} color={color} />
      <Text style={{ color: colors.textMuted, fontSize: scaleFont(12), fontWeight: '600' }}>{value}</Text>
    </View>
  );
}
