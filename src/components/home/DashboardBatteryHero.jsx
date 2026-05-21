import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../../hooks/useResponsive';
import { colors, radii } from '../../theme';
import { useTheme } from '../../context/ThemeContext';

export function DashboardBatteryHero({ batteryPct, rangeKm, ecoScore }) {
  const { scaleFont, isCompact, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: themeColors } = useTheme();
  const [displayPct, setDisplayPct] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useSharedValue(0);
  const shimmer = useSharedValue(-1);
  const halo = useSharedValue(0.28);

  const onTrackLayout = (e) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    fill.value = 0;
    fill.value = withTiming(Math.min(100, Math.max(0, batteryPct)), {
      duration: 1800,
      easing: Easing.out(Easing.cubic),
    });
  }, [batteryPct, fill]);

  useAnimatedReaction(
    () => fill.value,
    (value, prev) => {
      if (value !== prev) {
        runOnJS(setDisplayPct)(Math.round(value));
      }
    }
  );

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1.6, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [shimmer]);

  useEffect(() => {
    halo.value = withRepeat(
      withTiming(0.48, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [halo]);

  const fillStyle = useAnimatedStyle(() => {
    const w = trackWidth > 0 ? (trackWidth * fill.value) / 100 : 0;
    return { width: w };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const w = trackWidth > 0 ? (trackWidth * fill.value) / 100 : 160;
    return {
      transform: [{ translateX: shimmer.value * w * 0.9 }],
      opacity: 0.5,
    };
  });

  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.haloRing, haloStyle, { borderColor: isDark ? 'rgba(0,217,126, 0.4)' : 'rgba(0,106,78, 0.28)' }]} />
      <View style={[styles.innerFrame, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.45)' : 'rgba(255, 255, 255, 0.8)', borderColor: themeColors.border }]}>
        <LinearGradient
          colors={isDark ? ['rgba(15, 23, 42, 0.65)', 'rgba(2, 6, 23, 0.96)'] : ['rgba(255, 255, 255, 0.9)', 'rgba(248, 250, 252, 0.98)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.innerGrad, { 
            paddingHorizontal: isLargeScreen ? 28 : isTablet ? 24 : 20,
            paddingTop: isLargeScreen ? 28 : isTablet ? 26 : 22,
            paddingBottom: isLargeScreen ? 26 : isTablet ? 24 : 20
          }]}
        >
          <View style={styles.topRow}>
            <View style={{ flex: 1 }}>
              <Text className="font-bold uppercase tracking-[0.28em]" style={{ color: themeColors.accentCyan, fontSize: scaleFont(isLargeScreen ? 11 : 10) }}>State of charge</Text>
              <View className="mt-1 flex-row items-end">
                <Text style={[styles.heroNum, { color: themeColors.text, fontSize: scaleFont(isLargeScreen ? 66 : isCompact ? 50 : 58), lineHeight: scaleFont(isLargeScreen ? 70 : isCompact ? 54 : 62) }]}>
                  {displayPct}
                </Text>
                <Text style={[styles.heroPct, { color: themeColors.accentCyan, fontSize: scaleFont(isLargeScreen ? 26 : 22), marginBottom: isLargeScreen ? 12 : 10 }]}>%</Text>
              </View>
            </View>

            {/* Glowing Vertical Divider */}
            <LinearGradient
              colors={isDark 
                ? ['rgba(0,217,126, 0.05)', 'rgba(0,217,126, 0.45)', 'rgba(0,217,126, 0.05)'] 
                : ['rgba(0,106,78, 0.03)', 'rgba(0,106,78, 0.3)', 'rgba(0,106,78, 0.03)']}
              style={{ width: 1.5, height: '70%', alignSelf: 'center', marginHorizontal: 16 }}
            />

            <View style={[styles.miniStatCol, { minWidth: isLargeScreen ? 88 : 76 }]}>
              <MiniStat label="Range" value={`${rangeKm}`} unit="km" isLarge={isLargeScreen} themeColors={themeColors} />
              <View style={{ height: isLargeScreen ? 14 : 12 }} />
              <MiniStat label="Eco" value={`${ecoScore}`} unit="" accent={true} isLarge={isLargeScreen} themeColors={themeColors} />
            </View>
          </View>

          <View style={[styles.track, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.95)' : 'rgba(240, 244, 248, 1)', borderColor: themeColors.border, marginTop: isLargeScreen ? 28 : 22, height: isLargeScreen ? 14 : 12 }]} onLayout={onTrackLayout}>
            <Animated.View style={[styles.fillWrap, fillStyle]}>
              <LinearGradient
                colors={[themeColors.accentGlow, themeColors.accentCyan, themeColors.accentMint]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
            </Animated.View>
          </View>
          <View style={styles.trackLabels}>
            <Text style={[styles.trackHint, { color: themeColors.textFaint, fontSize: isLargeScreen ? 11 : 10 }]}>Reserve</Text>
            <Text style={[styles.trackHint, { color: themeColors.textFaint, fontSize: isLargeScreen ? 11 : 10 }]}>Peak</Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
}

function MiniStat({ label, value, unit, accent, isLarge, themeColors }) {
  return (
    <View style={styles.miniStat}>
      <Text style={[styles.miniLabel, { color: themeColors.textFaint, fontSize: isLarge ? 11 : 10 }]}>{label}</Text>
      <Text style={[styles.miniValue, { color: themeColors.text, fontSize: isLarge ? 22 : 20 }, accent && { color: themeColors.accentMint }]}>
        {value}
        {unit ? <Text style={[styles.miniUnit, { color: themeColors.textMuted, fontSize: isLarge ? 13 : 12 }]}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 8,
    borderRadius: radii.xl + 4,
    padding: 1,
  },
  haloRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.xl + 6,
    borderWidth: 1.5,
    margin: -3,
  },
  innerFrame: {
    borderRadius: radii.xl + 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  innerGrad: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroNum: {
    fontSize: 56,
    lineHeight: 60,
    fontWeight: '300',
    color: '#f8fafc',
    letterSpacing: -1.5,
  },
  heroPct: {
    fontSize: 22,
    fontWeight: '600',
    color: 'rgba(0,217,126, 0.95)',
    marginBottom: 10,
    marginLeft: 2,
  },
  miniStatCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
    paddingTop: 0,
  },
  miniStat: {
    alignItems: 'flex-end',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  miniValue: {
    marginTop: 4,
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  miniUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94a3b8',
  },
  track: {
    height: 12,
    borderRadius: radii.pill,
    overflow: 'hidden',
    borderWidth: 1,
  },
  fillWrap: {
    height: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '55%',
    backgroundColor: 'rgba(255,255,255,0.48)',
    borderRadius: radii.pill,
  },
  trackLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  trackHint: {
    fontSize: 10,
    color: '#475569',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
});
