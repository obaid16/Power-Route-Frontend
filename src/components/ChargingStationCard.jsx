import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../hooks/useResponsive';
import { formatCurrency, formatDistance } from '../utils/format';
import { colors, radii } from '../theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Reusable charging station card.
 *
 * @param {object} props
 * @param {object} props.station — { id, name, address, distanceKm, maxKw, rating, availablePorts, totalPorts, network?, pricePerKwh? }
 * @param {() => void} [props.onPress]
 * @param {'compact'|'featured'} [props.variant='compact'] — compact: list row; featured: dashboard carousel card
 * @param {boolean} [props.selected]
 * @param {import('react-native').StyleProp<import('react-native').ViewStyle>} [props.style]
 */
export function ChargingStationCard({ station, onPress, variant = 'compact', selected = false, style }) {
  if (variant === 'featured') {
    return <FeaturedStationCard station={station} onPress={onPress} selected={selected} style={style} />;
  }
  return <CompactStationCard station={station} onPress={onPress} selected={selected} style={style} />;
}

function CompactStationCard({ station, onPress, selected, style }) {
  const { scaleFont, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: themeColors } = useTheme();
  const padding = isLargeScreen ? 18 : isTablet ? 16 : 14;
  const iconSizeMd = scaleFont(isLargeScreen ? 16 : 14);
  const iconSizeSm = scaleFont(isLargeScreen ? 15 : 14);
  
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.compactWrap, { padding, backgroundColor: isDark ? 'rgba(13, 31, 53, 0.55)' : themeColors.surface, borderColor: themeColors.border }, selected && styles.compactSelected, pressed && styles.compactPressed, style]}
      accessibilityRole="button"
      accessibilityLabel={`Charging station ${station.name}`}
    >
      <View style={styles.compactHeader}>
        <Text className="flex-1 pr-2 font-semibold" numberOfLines={1} style={{ color: themeColors.text, fontSize: scaleFont(isLargeScreen ? 18 : 16) }}>
          {station.name}
        </Text>
        <View className="flex-row items-center rounded-full" style={{ backgroundColor: isDark ? 'rgba(0,217,126,0.15)' : 'rgba(0,106,78,0.1)', paddingHorizontal: isLargeScreen ? 10 : 8, paddingVertical: isLargeScreen ? 4 : 2 }}>
          <Ionicons name="flash" size={iconSizeSm} color={themeColors.accentCyan} />
          <Text className="font-semibold" style={{ color: isDark ? '#67e8f9' : themeColors.accentCyan, marginLeft: 2, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>{station.maxKw} kW</Text>
        </View>
      </View>
      <Text numberOfLines={1} style={{ color: themeColors.textFaint, marginTop: isLargeScreen ? 6 : 4, fontSize: scaleFont(isLargeScreen ? 14 : 12) }}>
        {station.address}
      </Text>
      <View className="flex-row items-center justify-between" style={{ marginTop: isLargeScreen ? 16 : 12, gap: isLargeScreen ? 16 : 12 }}>
        <View className="flex-row items-center" style={{ gap: isLargeScreen ? 16 : 12 }}>
          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={iconSizeMd} color={themeColors.textMuted} />
            <Text style={{ color: themeColors.textMuted, marginLeft: 4, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>{formatDistance(station.distanceKm)}</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="star" size={iconSizeMd} color={themeColors.warning} />
            <Text style={{ color: themeColors.textMuted, marginLeft: 4, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>{station.rating}</Text>
          </View>
        </View>
        <Text className="font-medium" style={{ color: themeColors.accentMint, fontSize: scaleFont(isLargeScreen ? 13 : 12) }}>
          {station.availablePorts}/{station.totalPorts} free
        </Text>
      </View>
    </Pressable>
  );
}

function FeaturedStationCard({ station, onPress, selected, style }) {
  const { featuredCardWidth, scaleFont, isDesktop, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: themeColors } = useTheme();
  const totalPorts = Math.max(1, station.totalPorts || 1);
  const availability = Math.min(1, (station.availablePorts || 0) / totalPorts);
  const network = station.network ?? 'Network';
  const price = station.pricePerKwh ?? 0;
  const iconSizeMd = scaleFont(isLargeScreen ? 16 : 14);
  const iconSizeSm = scaleFont(isLargeScreen ? 15 : 13);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.featPress,
        { width: style?.width === '100%' ? '100%' : featuredCardWidth, maxWidth: '100%' },
        isDesktop && styles.featPressDesktop,
        selected && styles.featSelected,
        pressed && styles.featPressed,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Charging station ${station.name}`}
    >
      <LinearGradient
        colors={isDark ? ['rgba(0,217,126, 0.55)', 'rgba(52, 211, 153, 0.35)', 'rgba(15, 23, 42, 0.5)'] : ['rgba(0,106,78, 0.35)', 'rgba(16, 185, 129, 0.2)', 'rgba(226, 232, 240, 0.8)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.featFrame, { shadowColor: themeColors.accentCyan }]}
      >
        <View style={[styles.featInner, { backgroundColor: isDark ? 'rgba(8, 15, 28, 0.92)' : 'rgba(255, 255, 255, 0.95)' }]}>
          <LinearGradient
            colors={[themeColors.accentCyan, themeColors.accentMint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.featAccentBar, { height: isLargeScreen ? 4 : 3 }]}
          />
          <View style={[styles.featBody, isLargeScreen && styles.featBodyLarge]}>
            <View style={styles.featRowBetween}>
              <Text style={[styles.featNetwork, { color: isDark ? 'rgba(0,217,126, 0.85)' : themeColors.accentCyan, flex: 1, minWidth: 0, paddingRight: 8, fontSize: scaleFont(isLargeScreen ? 11 : 10) }]} numberOfLines={1}>
                {network}
              </Text>
              <View style={[styles.featKwPill, { backgroundColor: isDark ? 'rgba(0,217,126, 0.12)' : 'rgba(0,106,78, 0.08)', borderColor: isDark ? 'rgba(0,217,126, 0.22)' : 'rgba(0,106,78, 0.2)', paddingHorizontal: isLargeScreen ? 12 : 10, paddingVertical: isLargeScreen ? 5 : 4 }]}>
                <Ionicons name="flash" size={iconSizeSm} color={themeColors.accentCyan} />
                <Text style={[styles.featKwText, { color: isDark ? '#a5f3fc' : themeColors.accentCyan, fontSize: scaleFont(isLargeScreen ? 13 : 11) }]}>{station.maxKw} kW</Text>
              </View>
            </View>
            <Text style={[styles.featTitle, { color: themeColors.text, fontSize: scaleFont(isLargeScreen ? 20 : 18), marginTop: isLargeScreen ? 12 : 10 }]} numberOfLines={2}>
              {station.name}
            </Text>
            <Text style={[styles.featAddress, { color: themeColors.textFaint, fontSize: scaleFont(isLargeScreen ? 14 : 12), marginTop: isLargeScreen ? 8 : 6 }]} numberOfLines={1}>
              {station.address}
            </Text>
            <View style={[styles.featMetaRow, { gap: isLargeScreen ? 14 : 10, marginTop: isLargeScreen ? 18 : 14 }]}>
              <View style={styles.featMetaItem}>
                <Ionicons name="navigate-outline" size={iconSizeMd} color={themeColors.textMuted} />
                <Text style={[styles.featMetaText, { color: themeColors.textMuted, fontSize: scaleFont(isLargeScreen ? 14 : 12) }]}>{formatDistance(station.distanceKm)}</Text>
              </View>
              <View style={styles.featMetaItem}>
                <Ionicons name="star" size={iconSizeMd} color={themeColors.warning} />
                <Text style={[styles.featMetaText, { color: themeColors.textMuted, fontSize: scaleFont(isLargeScreen ? 14 : 12) }]}>{station.rating}</Text>
              </View>
              <View style={styles.featMetaItem}>
                <Ionicons name="cash-outline" size={iconSizeMd} color={themeColors.textMuted} />
                <Text style={[styles.featMetaText, { color: themeColors.textMuted, fontSize: scaleFont(isLargeScreen ? 14 : 12) }]}>{formatCurrency(price)}/kWh</Text>
              </View>
            </View>
            <View style={[styles.featFooter, { marginTop: isLargeScreen ? 20 : 16 }]}>
              <View style={[styles.featPortTrack, { backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(241, 245, 249, 1)', borderColor: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(203, 213, 225, 0.8)', height: isLargeScreen ? 8 : 6 }]}>
                <LinearGradient
                  colors={[themeColors.accentGlow, themeColors.accentCyan]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.featPortFill, { width: `${Math.round(availability * 100)}%` }]}
                />
              </View>
              <Text style={[styles.featPortLabel, { color: themeColors.accentMint, fontSize: scaleFont(isLargeScreen ? 13 : 11), marginTop: isLargeScreen ? 10 : 8 }]}>
                {station.availablePorts}/{station.totalPorts} ports live
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactWrap: {
    flex: 1,
    minWidth: 0,
    borderRadius: radii.lg,
    padding: 14,
    backgroundColor: 'rgba(13, 31, 53, 0.55)',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  compactSelected: {
    borderColor: 'rgba(0,217,126, 0.55)',
    backgroundColor: 'rgba(0,217,126, 0.08)',
  },
  compactPressed: {
    transform: [{ translateY: -2 }],
    borderColor: 'rgba(0,217,126, 0.35)',
    shadowColor: colors.accentCyan,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 6,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  featPress: {
    marginRight: 14,
  },
  featSelected: {
    opacity: 0.95,
    transform: [{ scale: 1.01 }],
  },
  featPressed: {
    transform: [{ translateY: -3 }, { scale: 0.99 }],
  },
  featFrame: {
    borderRadius: radii.xl,
    padding: 1,
    shadowColor: colors.accentCyan,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 10,
  },
  featInner: {
    borderRadius: radii.xl - 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(8, 15, 28, 0.92)',
  },
  featAccentBar: {
    height: 3,
    width: '100%',
  },
  featBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
  },
  featBodyLarge: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  featRowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featNetwork: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    color: 'rgba(0,217,126, 0.85)',
    textTransform: 'uppercase',
  },
  featKwPill: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(0,217,126, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0,217,126, 0.22)',
  },
  featKwText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a5f3fc',
  },
  featTitle: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
    letterSpacing: -0.3,
  },
  featAddress: {
    marginTop: 6,
    fontSize: 12,
    color: '#64748b',
  },
  featPressDesktop: {
    marginRight: 0,
    width: '100%',
  },
  featMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  featMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  featMetaText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  featFooter: {
    marginTop: 16,
  },
  featPortTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.12)',
  },
  featPortFill: {
    height: '100%',
    borderRadius: 3,
  },
  featPortLabel: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: '#6ee7b7',
    letterSpacing: 0.2,
  },
});
