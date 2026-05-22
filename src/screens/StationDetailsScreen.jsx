import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenBackground, GlassCard, BatteryIndicator } from '../components';
import { fetchStationById } from '../services/vehicleService';
import { api } from '../services/apiClient';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

// ── Duration presets ──────────────────────────────────────────────────────────
const PRESETS = [
  { label: '30 min',      minutes: 30  },
  { label: '1 hour',      minutes: 60  },
  { label: '2 hours',     minutes: 120 },
  { label: '4 hours',     minutes: 240 },
  { label: '8 hours',     minutes: 480 },
  { label: 'Full charge', minutes: 480 },
];

function estimateCost(minutes, maxKw, pricePerKwh) {
  if (!minutes || !maxKw || !pricePerKwh) return null;
  const kwh = maxKw * (minutes / 60) * 0.85;
  return (kwh * pricePerKwh).toFixed(2);
}

function formatDuration(minutes) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function StationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const stationId = route.params?.stationId;
  const initialStation = route.params?.station;
  const { contentContainerStyle, scaleFont, isLargeScreen } = useResponsive();
  const { colors, isDark } = useTheme();

  const [station, setStation]               = useState(initialStation || null);
  const [loading, setLoading]               = useState(true);
  const [bookingMsg, setBookingMsg]         = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Duration state
  const [selectedPreset, setSelectedPreset] = useState(1); // default: 1 hour
  const [useCustom, setUseCustom]           = useState(false);
  const [customMinutes, setCustomMinutes]   = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (!initialStation) {
          const s = await fetchStationById(stationId);
          if (!cancelled) setStation(s);
        }
      } catch {
        if (!cancelled && !initialStation) setStation(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [stationId]);

  const resolvedMinutes = useCustom
    ? (parseInt(customMinutes, 10) || 0)
    : PRESETS[selectedPreset].minutes;

  const estimatedCost = station
    ? estimateCost(resolvedMinutes, station.maxKw, station.pricePerKwh)
    : null;

  const book = async () => {
    if (!resolvedMinutes || resolvedMinutes < 1) {
      setBookingMsg('Please enter a valid duration.');
      setBookingSuccess(false);
      return;
    }
    setBookingLoading(true);
    setBookingMsg('');
    setBookingSuccess(false);
    try {
      await api('/bookings/create', {
        method: 'POST',
        body: {
          chargingStationId: stationId,
          bookingTime: new Date(Date.now() + 300000).toISOString(),
          chargingDurationMinutes: resolvedMinutes,
        },
      });
      setBookingMsg(`Booking confirmed for ${formatDuration(resolvedMinutes)}.`);
      setBookingSuccess(true);
    } catch (e) {
      setBookingMsg(e.message);
      setBookingSuccess(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={colors.accentCyan} />
        </View>
      </ScreenBackground>
    );
  }

  if (!station) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}>
          <Text style={{ textAlign: 'center', color: colors.textMuted }}>Station not found.</Text>
        </View>
      </ScreenBackground>
    );
  }

  const availPct    = station.totalPorts > 0 ? (station.availablePorts / station.totalPorts) * 100 : 0;
  const inputBg     = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(240,244,248,0.9)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(100,116,139,0.25)';

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[contentContainerStyle, { paddingTop: insets.top + 8, paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Premium Hero Panel ──────────────────────────────────────────── */}
        <View style={{
          marginBottom: 20,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          height: isLargeScreen ? 200 : 160,
          backgroundColor: isDark ? colors.bg : '#f1f5f9',
        }}>
          {/* Gradient background */}
          <View style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: isDark ? colors.bgElevated : '#eef2f7',
          }}>
            {/* Decorative glow orbs */}
            <View style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: `${colors.accentCyan}15` }} />
            <View style={{ position: 'absolute', bottom: -40, left: -20, width: 120, height: 120, borderRadius: 60, backgroundColor: `${colors.accentCyan}10` }} />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <View style={{
              width: isLargeScreen ? 72 : 60, height: isLargeScreen ? 72 : 60, borderRadius: isLargeScreen ? 36 : 30,
              backgroundColor: `${colors.accentCyan}20`,
              borderWidth: 2, borderColor: `${colors.accentCyan}50`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name="flash" size={isLargeScreen ? 34 : 28} color={colors.accentCyan} />
            </View>
            <Text style={{ fontWeight: '900', color: colors.text, fontSize: scaleFont(isLargeScreen ? 20 : 17), letterSpacing: -0.5 }} numberOfLines={1}>
              {station.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="location-outline" size={12} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(12) }} numberOfLines={1}>
                {station.address}
              </Text>
            </View>
            {/* Badges */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${colors.accentCyan}15`, borderWidth: 1, borderColor: `${colors.accentCyan}30` }}>
                <Ionicons name="time-outline" size={11} color={colors.accentCyan} />
                <Text style={{ color: colors.accentCyan, fontSize: scaleFont(11), fontWeight: '700' }}>Open 24 Hours</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: `${colors.warning}15`, borderWidth: 1, borderColor: `${colors.warning}30` }}>
                <Ionicons name="star" size={11} color={colors.warning} />
                <Text style={{ color: colors.warning, fontSize: scaleFont(11), fontWeight: '700' }}>{station.rating?.toFixed(1)} Rating</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(isLargeScreen ? 28 : 24) }}>
              {station.name}
            </Text>
            <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: scaleFont(isLargeScreen ? 15 : 14) }}>
              {station.address}
            </Text>
            {station.lat && station.lng && (
              <Text style={{ marginTop: 4, color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>
                {station.lat.toFixed(4)}°, {station.lng.toFixed(4)}°
              </Text>
            )}
          </View>
          
          <Pressable
            onPress={() => navigation.navigate('MainTabs', { screen: 'Map', params: { targetId: stationId } })}
            style={({ pressed }) => ({
              backgroundColor: `${colors.accentCyan}15`,
              borderColor: colors.accentCyan,
              borderWidth: 1,
              paddingHorizontal: isLargeScreen ? 16 : 14,
              paddingVertical: isLargeScreen ? 12 : 10,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Ionicons name="navigate" size={18} color={colors.accentCyan} />
            <Text style={{ color: colors.accentCyan, fontWeight: '800', fontSize: scaleFont(13) }}>
              Navigate
            </Text>
          </Pressable>
        </View>

        {/* Info chips */}
        <GlassCard style={{ marginTop: 8 }} padding={isLargeScreen ? 20 : 18}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip icon="flash-outline" label={`${station.maxKw} kW max`} isLarge={isLargeScreen} colors={colors} />
            <Chip icon="cash-outline"  label={`₹${station.pricePerKwh}/kWh`} isLarge={isLargeScreen} colors={colors} />
            <Chip icon="star"          label={`${station.rating.toFixed(1)} rating`} isLarge={isLargeScreen} colors={colors} />
            <Chip icon="time-outline"  label="Open 24 Hours" isLarge={isLargeScreen} colors={colors} />
          </View>
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSoft, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ textTransform: 'uppercase', letterSpacing: 2, color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 12 : 11) }}>
                Network
              </Text>
              <Text style={{ marginTop: 4, fontWeight: '600', color: colors.accentCyan, fontSize: scaleFont(isLargeScreen ? 17 : 16) }}>
                {station.network}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ textTransform: 'uppercase', letterSpacing: 2, color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 12 : 11) }}>
                Price
              </Text>
              <Text style={{ marginTop: 4, fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 17 : 16) }}>
                ₹{station.pricePerKwh} / kWh
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Availability */}
        <GlassCard style={{ marginTop: 16 }} padding={isLargeScreen ? 20 : 18}>
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14) }}>
            Availability
          </Text>
          <View style={{ marginTop: 12 }}>
            <BatteryIndicator percent={availPct} showLabel={false} height={isLargeScreen ? 14 : 12} />
          </View>
          <Text style={{ marginTop: 8, color: colors.textMuted, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>
            {station.availablePorts} of {station.totalPorts} connectors available
          </Text>

          {/* ── Connector Slot Grid ─────────────────────────────────────────── */}
          <View style={{ marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {Array.from({ length: station.totalPorts || 8 }).map((_, i) => {
              const isAvail = i < (station.availablePorts || 2);
              const slotNum = i + 1;
              return (
                <View key={slotNum} style={{
                  flexBasis: isLargeScreen ? '23%' : '47%',
                  flexGrow: 1,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: isAvail ? 'rgba(16,185,129,0.35)' : 'rgba(251,191,36,0.35)',
                  backgroundColor: isAvail
                    ? isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)'
                    : isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.06)',
                  paddingHorizontal: 10, paddingVertical: 8,
                  flexDirection: 'row', alignItems: 'center', gap: 6,
                }}>
                  <Ionicons
                    name={isAvail ? 'flash' : 'flash-off'}
                    size={12}
                    color={isAvail ? colors.accentCyan : '#fbbf24'}
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: scaleFont(11) }} numberOfLines={1}>
                      Charger {slotNum}
                    </Text>
                    <Text style={{ color: isAvail ? colors.accentCyan : '#fbbf24', fontSize: scaleFont(10), fontWeight: '600', marginTop: 1 }}>
                      {isAvail ? 'Available' : 'In Use'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        {/* Charger types */}
        {station.amenities?.length > 0 && (
          <GlassCard style={{ marginTop: 16 }} padding={isLargeScreen ? 20 : 18}>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14) }}>
              Charger types
            </Text>
            <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {station.amenities.map((a) => (
                <View key={a} style={{
                  borderRadius: 999, borderWidth: 1,
                  borderColor: 'rgba(52,211,153,0.3)',
                  backgroundColor: 'rgba(52,211,153,0.1)',
                  paddingHorizontal: 12, paddingVertical: 6,
                }}>
                  <Text style={{ fontWeight: '500', color: colors.accentMint, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>
                    {a}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        )}

        {/* ── Duration picker ──────────────────────────────────────────────── */}
        <GlassCard style={{ marginTop: 16 }} padding={isLargeScreen ? 20 : 18}>
          <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14), marginBottom: 14 }}>
            Session duration
          </Text>

          {/* Preset chips */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {PRESETS.map((p, i) => {
              const active = !useCustom && selectedPreset === i;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => { setSelectedPreset(i); setUseCustom(false); }}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                    borderColor: active ? colors.accentCyan : colors.borderSoft,
                    backgroundColor: active
                      ? isDark ? 'rgba(0,217,126,0.18)' : 'rgba(0,106,78,0.12)'
                      : isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  <Text style={{ fontSize: scaleFont(13), fontWeight: '600', color: active ? colors.accentCyan : colors.textMuted }}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}

            {/* Custom chip */}
            <Pressable
              onPress={() => setUseCustom(true)}
              style={{
                paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
                borderColor: useCustom ? colors.accentCyan : colors.borderSoft,
                backgroundColor: useCustom
                  ? isDark ? 'rgba(0,217,126,0.18)' : 'rgba(0,106,78,0.12)'
                  : isDark ? 'rgba(15,23,42,0.7)' : 'rgba(255,255,255,0.7)',
              }}
            >
              <Text style={{ fontSize: scaleFont(13), fontWeight: '600', color: useCustom ? colors.accentCyan : colors.textMuted }}>
                Custom
              </Text>
            </Pressable>
          </View>

          {/* Custom input */}
          {useCustom && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <TextInput
                value={customMinutes}
                onChangeText={(v) => setCustomMinutes(v.replace(/\D/g, ''))}
                keyboardType="number-pad"
                placeholder="e.g. 90"
                placeholderTextColor={colors.textFaint}
                style={{
                  flex: 1, borderRadius: 12, borderWidth: 1,
                  borderColor: inputBorder, backgroundColor: inputBg,
                  paddingHorizontal: 14, paddingVertical: isLargeScreen ? 14 : 12,
                  fontSize: scaleFont(16), color: colors.text,
                }}
              />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(14) }}>minutes</Text>
            </View>
          )}

          {/* Cost estimate */}
          {resolvedMinutes > 0 && estimatedCost && (
            <View style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              borderRadius: 12, borderWidth: 1, borderColor: `${colors.accentCyan}30`,
              backgroundColor: `${colors.accentCyan}15`,
              paddingHorizontal: 14, paddingVertical: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="time-outline" size={16} color={colors.accentCyan} />
                <Text style={{ color: colors.textMuted, fontSize: scaleFont(13) }}>
                  {formatDuration(resolvedMinutes)}
                </Text>
              </View>
              <Text style={{ fontWeight: '700', color: colors.accentCyan, fontSize: scaleFont(14) }}>
                ~${estimatedCost}
              </Text>
            </View>
          )}
        </GlassCard>

        {/* Booking status */}
        {bookingMsg ? (
          <View style={{
            marginTop: 14, borderRadius: 12, borderWidth: 1,
            borderColor: bookingSuccess ? 'rgba(52,211,153,0.35)' : 'rgba(239,68,68,0.35)',
            backgroundColor: bookingSuccess ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)',
            padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8,
          }}>
            <Ionicons
              name={bookingSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={18}
              color={bookingSuccess ? colors.accentMint : colors.danger}
            />
            <Text style={{ flex: 1, color: bookingSuccess ? colors.accentMint : colors.danger, fontSize: scaleFont(13) }}>
              {bookingMsg}
            </Text>
          </View>
        ) : null}

        {/* Book button */}
        <Pressable
          onPress={book}
          disabled={bookingLoading || station.availablePorts === 0 || (useCustom && !customMinutes)}
          style={({ pressed }) => ({
            marginTop: 16, borderRadius: 16, backgroundColor: colors.accentCyan,
            paddingVertical: isLargeScreen ? 18 : 16,
            alignItems: 'center', justifyContent: 'center',
            opacity: bookingLoading || station.availablePorts === 0 || pressed ? 0.6 : 1,
          })}
        >
          {bookingLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={{ fontWeight: '800', color: '#ffffff', fontSize: scaleFont(isLargeScreen ? 17 : 16) }}>
              {station.availablePorts === 0
                ? 'Station full'
                : resolvedMinutes
                ? `Book ${formatDuration(resolvedMinutes)} session`
                : 'Select a duration'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </ScreenBackground>
  );
}

// ── Chip helper ───────────────────────────────────────────────────────────────
function Chip({ icon, label, isLarge, colors }) {
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 999, borderWidth: 1,
      borderColor: `${colors.accentCyan}40`,
      backgroundColor: `${colors.accentCyan}15`,
      paddingHorizontal: 12, paddingVertical: 6,
    }}>
      <Ionicons name={icon} size={isLarge ? 16 : 14} color={colors.accentCyan} />
      <Text style={{ fontWeight: '600', color: colors.accentCyan, fontSize: isLarge ? 13 : 12 }}>{label}</Text>
    </View>
  );
}
