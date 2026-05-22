/**
 * EmergencySOSScreen — PowerRoute
 *
 * Full emergency hub:
 *  - Animated SOS button → finds nearest emergency-capable charger + logs SOS
 *  - One-tap helplines: Police · Ambulance · Fire · Women Safety · Roadside Assist
 *  - Share live location
 *  - Nearest open charging stations
 *  - Towing service contact
 */
import { useState, useEffect } from 'react';
import { Pressable, Text, View, Linking, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassCard } from '../components';
import { api } from '../services/apiClient';
import { mapStationFromApi } from '../utils/mappers';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

// ── Helpline definitions ──────────────────────────────────────────────────────
const HELPLINES = [
  { id: 'police',    icon: 'shield',           label: 'Police',              number: '112',  color: '#3b82f6' },
  { id: 'ambulance', icon: 'medkit',            label: 'Ambulance',           number: '108',  color: '#ef4444' },
  { id: 'fire',      icon: 'flame',             label: 'Fire Brigade',        number: '101',  color: '#f97316' },
  { id: 'women',     icon: 'female',            label: 'Women Distress',      number: '181',  color: '#ec4899' },
  { id: 'roadside',  icon: 'construct',         label: 'Roadside Assist',     number: '1800', color: '#a855f7' },
  { id: 'towing',    icon: 'car',               label: 'Towing Service',      number: '1802', color: '#fbbf24' },
];

export function EmergencySOSScreen() {
  const navigation = useNavigation();
  const { userCoord, stations } = useVoltApi();
  const {
    horizontalPadding,
    sosButtonSize,
    scaleFont,
    contentMaxWidth,
    isLargeScreen,
    isTablet,
    verticalPadding,
  } = useResponsive();
  const { colors, isDark } = useTheme();

  const [msg, setMsg]         = useState('');
  const [msgType, setMsgType] = useState('info'); // 'info' | 'error'
  const [nearest, setNearest] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locShared, setLocShared] = useState(false);

  // Pulsing ring animation
  const ring1 = useSharedValue(1);
  const ring2 = useSharedValue(1);
  const ring3 = useSharedValue(1);

  const ringSize1 = sosButtonSize + (isLargeScreen ? 48 : isTablet ? 38 : 30);
  const ringSize2 = sosButtonSize + (isLargeScreen ? 96 : isTablet ? 76 : 60);
  const ringSize3 = sosButtonSize + (isLargeScreen ? 144 : isTablet ? 114 : 90);

  useEffect(() => {
    ring1.value = withRepeat(
      withTiming(1.25, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    ring2.value = withRepeat(
      withTiming(1.45, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
    ring3.value = withRepeat(
      withTiming(1.65, { duration: 2000, easing: Easing.out(Easing.ease) }),
      -1,
      false,
    );
  }, [ring1, ring2, ring3]);

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: ring1.value }],
    opacity: 1 - (ring1.value - 1) / 0.25,
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: ring2.value }],
    opacity: 1 - (ring2.value - 1) / 0.45,
  }));

  const ringStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: ring3.value }],
    opacity: 1 - (ring3.value - 1) / 0.65,
  }));


  // ── SOS tap ────────────────────────────────────────────────────────────────
  const handleSOS = async () => {
    setLoading(true);
    setMsg('');
    try {
      const res = await api('/emergency/nearest', {
        method: 'POST',
        body: { lat: userCoord.latitude, lng: userCoord.longitude },
      });
      setNearest(mapStationFromApi(res.data.station));
      await api('/emergency/sos', {
        method: 'POST',
        body: { lat: userCoord.latitude, lng: userCoord.longitude, message: 'PowerRoute SOS' },
      });
      setMsg('Nearest emergency station found. SOS alert logged.');
      setMsgType('info');
    } catch (e) {
      setMsg(e.message || 'Emergency lookup failed — check backend connection.');
      setMsgType('error');
    } finally {
      setLoading(false);
    }
  };

  // ── Share location ─────────────────────────────────────────────────────────
  const shareLocation = async () => {
    try {
      await api('/emergency/share-location', {
        method: 'POST',
        body: { lat: userCoord.latitude, lng: userCoord.longitude },
      });
      setLocShared(true);
      setMsg('Live location shared with emergency services.');
      setMsgType('info');
    } catch (e) {
      setMsg(e.message || 'Could not share location.');
      setMsgType('error');
    }
  };

  const openStations = stations.filter((s) => s.availablePorts > 0).slice(0, 3);
  const msgColor = msgType === 'error' ? colors.danger : colors.accentMint;

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: verticalPadding,
          paddingHorizontal: horizontalPadding,
          paddingBottom: 48,
          maxWidth: contentMaxWidth,
          width: '100%',
          alignSelf: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 20 }}
        >
          <Ionicons name="chevron-back" size={scaleFont(22)} color={colors.accentCyan} />
          <Text style={{ fontWeight: '600', color: colors.accentCyan, fontSize: scaleFont(14) }}>Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={{ fontWeight: '800', color: colors.text, fontSize: scaleFont(isLargeScreen ? 28 : 24), marginBottom: 4 }}>
          Emergency SOS
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: scaleFont(13), marginBottom: 28 }}>
          One tap to alert emergency services and find help
        </Text>

        {/* ── SOS Button ──────────────────────────────────────────────────── */}
        <Pressable
          onPress={handleSOS}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Activate SOS emergency alert"
          style={{ width: '100%', alignItems: 'center', justifyContent: 'center', marginBottom: 28, height: ringSize3, minHeight: 220 }}
        >
          <Animated.View style={[
            ringStyle3,
            { position: 'absolute', width: ringSize3, height: ringSize3, borderRadius: ringSize3 / 2, backgroundColor: 'rgba(244,63,94,0.06)' },
          ]} />
          <Animated.View style={[
            ringStyle2,
            { position: 'absolute', width: ringSize2, height: ringSize2, borderRadius: ringSize2 / 2, backgroundColor: 'rgba(244,63,94,0.1)' },
          ]} />
          <Animated.View style={[
            ringStyle1,
            { position: 'absolute', width: ringSize1, height: ringSize1, borderRadius: ringSize1 / 2, backgroundColor: 'rgba(244,63,94,0.15)' },
          ]} />
          <LinearGradient
            colors={['#fb7185', '#f43f5e', '#be123c']}
            style={{
              width: sosButtonSize, height: sosButtonSize, borderRadius: sosButtonSize / 2,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: isLargeScreen ? 3 : 2, borderColor: 'rgba(255,255,255,0.3)',
              shadowColor: '#f43f5e', shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
              position: 'absolute',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size={isLargeScreen ? 'large' : 'small'} />
            ) : (
              <>
                <Ionicons name="warning" size={scaleFont(isLargeScreen ? 36 : 30)} color="#fff" />
                <Text style={{ fontWeight: '900', color: '#fff', fontSize: scaleFont(isLargeScreen ? 28 : 24), letterSpacing: 2 }}>
                  SOS
                </Text>
              </>
            )}
          </LinearGradient>
        </Pressable>
        <Text style={{ textAlign: 'center', color: colors.textMuted, marginTop: 4, marginBottom: 24, fontSize: scaleFont(13) }}>
          Tap to activate emergency alert
        </Text>

        {/* Status message */}
        {msg ? (
          <View style={{
            marginBottom: 20, borderRadius: 12, borderWidth: 1,
            borderColor: msgType === 'error' ? 'rgba(239,68,68,0.35)' : 'rgba(52,211,153,0.35)',
            backgroundColor: msgType === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(52,211,153,0.1)',
            padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
          }}>
            <Ionicons
              name={msgType === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={18}
              color={msgColor}
            />
            <Text style={{ flex: 1, color: msgColor, fontSize: scaleFont(13) }}>{msg}</Text>
          </View>
        ) : null}

        {/* Nearest station result */}
        {nearest ? (
          <GlassCard style={{ marginBottom: 20 }} padding={isLargeScreen ? 20 : 16}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(52,211,153,0.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="flash" size={20} color={colors.accentMint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(15) }}>{nearest.name}</Text>
                <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 2 }}>
                  {nearest.distanceKm} km away · Emergency capable
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : null}

        {/* ── Share Location ───────────────────────────────────────────────── */}
        <Pressable
          onPress={shareLocation}
          accessibilityRole="button"
          style={({ pressed }) => ({
            marginBottom: 24, borderRadius: 14, borderWidth: 1,
            borderColor: locShared ? 'rgba(52,211,153,0.5)' : colors.border,
            backgroundColor: locShared
              ? 'rgba(52,211,153,0.12)'
              : isDark ? 'rgba(0,217,126,0.08)' : 'rgba(0,106,78,0.08)',
            padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Ionicons
            name={locShared ? 'location' : 'location-outline'}
            size={22}
            color={locShared ? colors.accentMint : colors.accentCyan}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(14) }}>
              {locShared ? 'Location shared ✓' : 'Share live location'}
            </Text>
            <Text style={{ color: colors.textFaint, fontSize: scaleFont(11), marginTop: 2 }}>
              Sends your GPS coordinates to emergency services
            </Text>
          </View>
          {!locShared && <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
        </Pressable>

        {/* ── Emergency Helplines ──────────────────────────────────────────── */}
        <Text style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2.5, color: colors.textFaint, fontSize: scaleFont(11), marginBottom: 12 }}>
          Emergency helplines
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {HELPLINES.map((h) => (
            <HelplineButton key={h.id} helpline={h} colors={colors} scaleFont={scaleFont} isLargeScreen={isLargeScreen} />
          ))}
        </View>

        {/* ── Open Nearby Stations ─────────────────────────────────────────── */}
        {openStations.length > 0 && (
          <>
            <Text style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2.5, color: colors.textFaint, fontSize: scaleFont(11), marginBottom: 12 }}>
              Open nearby stations
            </Text>
            {openStations.map((s) => (
              <View key={s.id} style={{
                marginBottom: 10, borderRadius: 14, borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.7)',
                paddingHorizontal: 16, paddingVertical: 14,
                flexDirection: 'row', alignItems: 'center', gap: 12,
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,217,126,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="flash" size={18} color={colors.accentCyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(14) }} numberOfLines={1}>{s.name}</Text>
                  <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 2 }}>
                    {s.availablePorts} ports free · {s.maxKw} kW
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: 'rgba(52,211,153,0.15)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.35)' }}>
                  <Text style={{ color: colors.accentMint, fontSize: scaleFont(11), fontWeight: '700' }}>Open</Text>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

// ── Helpline button ───────────────────────────────────────────────────────────
function HelplineButton({ helpline, colors, scaleFont, isLargeScreen }) {
  const call = () => Linking.openURL(`tel:${helpline.number}`);
  return (
    <Pressable
      onPress={call}
      accessibilityRole="button"
      accessibilityLabel={`Call ${helpline.label} at ${helpline.number}`}
      style={({ pressed }) => ({
        flexBasis: '47%', flexGrow: 1,
        borderRadius: 16, borderWidth: 1,
        borderColor: `${helpline.color}40`,
        backgroundColor: `${helpline.color}15`,
        padding: isLargeScreen ? 16 : 14,
        alignItems: 'center', gap: 8,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View style={{
        width: isLargeScreen ? 48 : 42, height: isLargeScreen ? 48 : 42,
        borderRadius: isLargeScreen ? 24 : 21,
        backgroundColor: `${helpline.color}25`,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={helpline.icon} size={isLargeScreen ? 24 : 20} color={helpline.color} />
      </View>
      <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(13), textAlign: 'center' }}>
        {helpline.label}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Ionicons name="call" size={12} color={helpline.color} />
        <Text style={{ color: helpline.color, fontSize: scaleFont(12), fontWeight: '700' }}>
          {helpline.number}
        </Text>
      </View>
    </Pressable>
  );
}
