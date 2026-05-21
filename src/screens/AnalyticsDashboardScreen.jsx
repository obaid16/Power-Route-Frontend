import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenBackground, GlassCard, BatteryIndicator } from '../components';
import { useAnalytics } from '../hooks/useAnalytics';
import { useVoltApi } from '../hooks/useVoltApi';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/format';

export function AnalyticsDashboardScreen() {
  const { contentContainerStyle, scaleFont, isDesktop, isLandscape, isWide, isLargeScreen, isTablet } = useResponsive();
  const { colors, isDark } = useTheme();
  const { vehicle } = useVoltApi();
  const { loading, error, ecoScore, monthlySpend, energyWeek, history, reload } = useAnalytics();
  const chartHeight = isLargeScreen ? 160 : isDesktop ? 140 : isLandscape && isTablet ? 120 : 110;
  const maxKwh = Math.max(...energyWeek.map((d) => d.kwh), 1);

  if (loading) {
    return (
      <ScreenBackground>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.accentCyan} />
          <Text style={{ marginTop: 12, color: colors.textMuted, fontSize: scaleFont(14) }}>Loading analytics…</Text>
        </View>
      </ScreenBackground>
    );
  }

  return (
    <ScreenBackground>
      <ScrollView
        style={{ flex: 1, paddingTop: 16 }}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: scaleFont(26), fontWeight: '900', letterSpacing: -0.6, color: colors.accentCyan }}>
          PowerRoute
        </Text>
        <Text style={{ marginTop: 2, fontWeight: '800', color: colors.text, fontSize: scaleFont(30) }}>
          Analytics & Insights
        </Text>

        {error ? (
          <Pressable onPress={reload} style={{ marginTop: 16, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(244,63,94,0.3)', backgroundColor: 'rgba(244,63,94,0.1)', padding: 16 }}>
            <Text style={{ fontSize: scaleFont(14), color: '#fda4af' }}>{error}</Text>
            <Text style={{ marginTop: 4, fontSize: scaleFont(12), color: '#fca5a5' }}>Tap to retry</Text>
          </Pressable>
        ) : null}

        <View style={isDesktop || isTablet ? { flexDirection: 'row', gap: 16, marginTop: 24, alignItems: 'stretch' } : { marginTop: 24 }}>
          <GlassCard style={isDesktop || isTablet ? { flex: 1 } : undefined} padding={isLargeScreen ? 20 : 18}>
            <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14) }}>Energy · 7 days</Text>
            {energyWeek.every((d) => !d.kwh) ? (
              <Text style={{ marginTop: 16, color: colors.textMuted, fontSize: scaleFont(14) }}>Book a session to see weekly energy.</Text>
            ) : (
              <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: chartHeight + 10 }}>
                {energyWeek.map((d, i) => {
                  const barH = Math.max(14, (d.kwh / maxKwh) * (chartHeight - 30));
                  return (
                    <View key={`${d.day}-${i}`} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
                      {d.kwh > 0 && (
                        <Text style={{ fontSize: scaleFont(10), fontWeight: '700', color: colors.accentCyan, marginBottom: 4 }}>
                          {d.kwh.toFixed(1)}
                        </Text>
                      )}
                      <LinearGradient
                        colors={[colors.accentCyan, colors.accentPurple]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{ width: '100%', height: barH, borderRadius: 6, opacity: 0.95 }}
                      />
                      <Text style={{ marginTop: 8, fontWeight: '600', color: colors.textFaint, fontSize: scaleFont(11) }}>{d.day}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </GlassCard>

          <View style={[
            isDesktop || isTablet ? { flex: 1, justifyContent: 'space-between' } : { marginTop: 16, width: '100%' },
            { flexDirection: 'row', gap: 12, alignItems: 'stretch' },
          ]}>
            <GlassCard padding={isLargeScreen ? 18 : 16} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(52,211,153,0.1)', borderRadius: 10, padding: 6 }}>
                <Ionicons name="leaf" size={14} color={colors.accentMint} />
              </View>
              <View style={{ position: 'absolute', bottom: -18, right: -18, width: 64, height: 64, borderRadius: 32, borderWidth: 5, borderColor: 'rgba(52,211,153,0.06)', borderTopColor: colors.accentMint, borderRightColor: colors.accentMint, transform: [{ rotate: '45deg' }] }} />
              <Text style={{ textTransform: 'uppercase', letterSpacing: 1.5, color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 12 : 11) }}>Eco score</Text>
              <Text style={{ marginTop: 8, fontWeight: '700', color: colors.accentMint, fontSize: scaleFont(isLargeScreen ? 34 : 30) }}>{ecoScore}</Text>
            </GlassCard>
            <GlassCard padding={isLargeScreen ? 18 : 16} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,217,126,0.1)', borderRadius: 10, padding: 6 }}>
                <Ionicons name="wallet" size={14} color={colors.accentCyan} />
              </View>
              <View style={{ position: 'absolute', bottom: -18, right: -18, width: 64, height: 64, borderRadius: 32, borderWidth: 5, borderColor: 'rgba(0,217,126,0.06)', borderTopColor: colors.accentCyan, borderRightColor: colors.accentCyan, transform: [{ rotate: '-45deg' }] }} />
              <Text style={{ textTransform: 'uppercase', letterSpacing: 1.5, color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 12 : 11) }}>Total spend</Text>
              <Text style={{ marginTop: 8, fontWeight: '700', color: colors.accentCyan, fontSize: scaleFont(isLargeScreen ? 30 : 26) }}>{formatCurrency(monthlySpend)}</Text>
            </GlassCard>
          </View>
        </View>

        <GlassCard style={{ marginTop: 16 }} padding={isLargeScreen ? 20 : 18}>
          <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(isLargeScreen ? 16 : 14) }}>Pack level</Text>
          <View style={{ marginTop: 16 }}>
            <BatteryIndicator percent={vehicle.batteryPct > 0 ? vehicle.batteryPct : 78} showLabel={false} height={isLargeScreen ? 12 : 10} />
          </View>
        </GlassCard>

        <Text style={{ marginBottom: 12, marginTop: 32, fontWeight: '700', color: colors.text, fontSize: scaleFont(18) }}>
          Charging History
        </Text>
        {history.length === 0 ? (
          <Text style={{ color: colors.textMuted, fontSize: scaleFont(14) }}>No bookings yet — reserve from a station page.</Text>
        ) : (
          history.map((h, idx) => {
            const isEven = idx % 2 === 0;
            const bgTint = isDark
              ? (isEven ? 'rgba(15,23,42,0.55)' : 'rgba(15,23,42,0.35)')
              : (isEven ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)');
            return (
              <View key={h.id} style={{
                marginBottom: 12, flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: bgTint,
                paddingHorizontal: 16, paddingVertical: 14,
                shadowColor: colors.cardGlow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isEven ? 0.08 : 0.03,
                shadowRadius: 8,
                elevation: isEven ? 2 : 0,
              }}>
                <View style={{
                  marginRight: 12, alignItems: 'center', justifyContent: 'center',
                  borderRadius: 12, backgroundColor: isDark ? 'rgba(0,217,126,0.12)' : 'rgba(0,106,78,0.08)',
                  height: isLargeScreen ? 44 : 40, width: isLargeScreen ? 44 : 40,
                }}>
                  <Ionicons name="flash" size={isLargeScreen ? 22 : 20} color={colors.accentCyan} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontWeight: '600', color: colors.text, fontSize: scaleFont(isLargeScreen ? 15 : 14) }} numberOfLines={1}>{h.station}</Text>
                  <Text style={{ color: colors.textFaint, fontSize: scaleFont(isLargeScreen ? 13 : 12), marginTop: 2 }}>{h.date} · {h.kwh} kWh · {h.status}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontWeight: '700', color: colors.accentMint, fontSize: scaleFont(isLargeScreen ? 15 : 14) }}>{formatCurrency(h.cost)}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.textFaint} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </ScreenBackground>
  );
}
