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
import { Pressable, Text, View, Linking, ActivityIndicator, ScrollView, Image } from 'react-native';
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
import { ScreenBackground, GlassCard, ThemeToggle } from '../components';
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
        {/* ── Nav Bar (ELECTRA) ───────────────────────── */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          borderWidth: 1, borderRadius: 999,
          paddingHorizontal: 16, paddingVertical: 10,
          marginBottom: 20,
          backgroundColor: isDark ? '#060810' : '#ffffff', borderColor: colors.borderSoft,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
        }}>
          {/* Brand */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b5cf6' }}>
              <Ionicons name="flash" size={14} color="#ffffff" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: 0.5, color: colors.text }}>
              ELECTRA
            </Text>
          </View>
          {/* Links */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 32 }}>
            {[
              { label: 'Home',     active: false, onPress: () => navigation.navigate('HomeDashboard') },
              { label: 'Map',      active: false, onPress: () => navigation.navigate('Map') },
              { label: 'Vehicles', active: false, onPress: () => navigation.navigate('ChargingVan') },
              { label: 'Safety',   active: false, onPress: () => navigation.navigate('WomenSafety') },
              { label: 'SOS',      active: true,  onPress: () => {} },
            ].map(({ label, active, onPress }) => (
              <Pressable key={label} onPress={onPress} style={{ alignItems: 'center', justifyContent: 'center', position: 'relative', height: 32 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: active ? '#a855f7' : colors.textMuted }}>
                  {label}
                </Text>
                {active && <View style={{ position: 'absolute', bottom: -4, width: '100%', height: 2, borderRadius: 2, backgroundColor: '#a855f7' }} />}
              </Pressable>
            ))}
          </View>
          {/* Actions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Ionicons name="notifications" size={18} color={colors.textMuted} />
            <ThemeToggle size="sm" showLabel={false} />
            <View style={{ width: 32, height: 32, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
              <Image source={{ uri: 'https://i.pravatar.cc/100?img=47' }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} />
            </View>
          </View>
        </View>

        {/* ── SOS Dashboard Card ───────────────────────── */}
        <View style={{
          backgroundColor: isDark ? '#0d1117' : '#f8fafc',
          borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft,
          padding: isLargeScreen ? 32 : 20,
          marginBottom: 32,
          minHeight: 400,
          justifyContent: 'space-between'
        }}>
          {/* Top text */}
          <Text style={{ color: colors.text, fontSize: scaleFont(16), fontWeight: '600' }}>My Van</Text>

          {/* Center Content Row */}
          <View style={{ flexDirection: isLargeScreen ? 'row' : 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: isLargeScreen ? 60 : 30, paddingVertical: 40 }}>
            {/* SOS Button Area */}
            <View style={{ width: ringSize3, height: ringSize3, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View style={[ringStyle3, { position: 'absolute', width: ringSize3, height: ringSize3, borderRadius: ringSize3 / 2, backgroundColor: 'rgba(244,63,94,0.06)' }]} />
              <Animated.View style={[ringStyle2, { position: 'absolute', width: ringSize2, height: ringSize2, borderRadius: ringSize2 / 2, backgroundColor: 'rgba(244,63,94,0.1)' }]} />
              <Animated.View style={[ringStyle1, { position: 'absolute', width: ringSize1, height: ringSize1, borderRadius: ringSize1 / 2, backgroundColor: 'rgba(244,63,94,0.15)' }]} />
              <Pressable
                onPress={handleSOS}
                disabled={loading}
                accessibilityRole="button"
                style={{
                  width: sosButtonSize, height: sosButtonSize, borderRadius: sosButtonSize / 2,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: '#ef4444',
                  borderWidth: 6, borderColor: 'rgba(244,63,94,0.4)',
                  shadowColor: '#f43f5e', shadowOpacity: 0.6, shadowRadius: 24, elevation: 12,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size={isLargeScreen ? 'large' : 'small'} />
                ) : (
                  <Text style={{ fontWeight: '900', color: '#fff', fontSize: scaleFont(isLargeScreen ? 28 : 24), letterSpacing: 1 }}>
                    SOS
                  </Text>
                )}
              </Pressable>
            </View>

            {/* Right Text */}
            <Text style={{ color: colors.text, fontSize: scaleFont(isLargeScreen ? 24 : 20), fontWeight: '500', maxWidth: 220, textAlign: isLargeScreen ? 'left' : 'center', lineHeight: 32 }}>
              Press and Hold to send an SOS Alert
            </Text>
          </View>

          {/* Bottom Bar: Location Sharing */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
            borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
            marginTop: 20
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={locShared ? 'lock-open' : 'lock-closed'} size={16} color={colors.textFaint} />
              <Text style={{ color: colors.textMuted, fontSize: scaleFont(13) }}>
                {locShared ? 'Location shared with ' : 'Sharing location with '}<Text style={{ color: colors.text, fontWeight: '700' }}>3 contacts</Text>
              </Text>
            </View>
            <Pressable onPress={shareLocation}>
              <Text style={{ color: colors.text, fontSize: scaleFont(13), fontWeight: '600' }}>View</Text>
            </Pressable>
          </View>
        </View>

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

        {/* ── Emergency Helplines ──────────────────────────────────────────── */}
        <Text style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2.5, color: colors.textFaint, fontSize: scaleFont(11), marginBottom: 12 }}>
          Emergency helplines
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 }}>
          {HELPLINES.map((h) => (
            <HelplineButton key={h.id} helpline={h} colors={colors} scaleFont={scaleFont} isLargeScreen={isLargeScreen} />
          ))}
        </View>

        {/* ── Emergency Contacts ───────────────────────────────────────────── */}
        <Text style={{ fontWeight: '800', textTransform: 'uppercase', letterSpacing: 2.5, color: colors.textFaint, fontSize: scaleFont(11), marginBottom: 12 }}>
          Emergency contacts
        </Text>
        <View style={{ gap: 10, marginBottom: 28 }}>
          {[
            { name: 'Mom',       initial: 'M', phone: '+91 98765 43210', color: '#ec4899', bg: 'rgba(236,72,153,0.12)'  },
            { name: 'Dad',       initial: 'D', phone: '+91 91234 56789', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)'  },
            { name: 'Emergency', initial: '!', phone: '112',             color: '#ef4444', bg: 'rgba(239,68,68,0.12)'   },
          ].map((contact) => (
            <Pressable
              key={contact.name}
              onPress={() => Linking.openURL(`tel:${contact.phone}`)}
              accessibilityRole="button"
              accessibilityLabel={`Call ${contact.name}`}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 14,
                borderRadius: 14, borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(255,255,255,0.8)',
                paddingHorizontal: 16, paddingVertical: 14,
                opacity: pressed ? 0.8 : 1,
              })}
            >
              {/* Avatar Circle */}
              <View style={{
                width: isLargeScreen ? 48 : 42, height: isLargeScreen ? 48 : 42,
                borderRadius: isLargeScreen ? 24 : 21,
                backgroundColor: contact.bg,
                borderWidth: 2, borderColor: `${contact.color}40`,
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Text style={{ fontWeight: '900', color: contact.color, fontSize: scaleFont(isLargeScreen ? 18 : 16) }}>
                  {contact.initial}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', color: colors.text, fontSize: scaleFont(14) }}>{contact.name}</Text>
                <Text style={{ color: colors.textFaint, fontSize: scaleFont(12), marginTop: 2 }}>{contact.phone}</Text>
              </View>
              <View style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: `${contact.color}15`,
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Ionicons name="call" size={16} color={contact.color} />
              </View>
            </Pressable>
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
