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
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';

export function DashboardBatteryHero({ batteryPct, rangeKm, ecoScore }) {
  const { scaleFont, isCompact, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: C } = useTheme();
  
  const [displayPct, setDisplayPct] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);
  
  const fill = useSharedValue(0);
  const shimmer = useSharedValue(-1);

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

  const fillStyle = useAnimatedStyle(() => {
    const w = trackWidth > 0 ? (trackWidth * fill.value) / 100 : 0;
    return { width: w };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const w = trackWidth > 0 ? (trackWidth * fill.value) / 100 : 160;
    return {
      transform: [{ translateX: shimmer.value * w * 0.9 }],
      opacity: 0.3,
    };
  });

  return (
    <View style={styles.wrap}>
      <View style={[
        styles.innerFrame, 
        { 
          backgroundColor: isDark ? C.bgElevated : '#fff', 
          borderColor: C.borderSoft 
        }
      ]}>
        <View style={[
          styles.content, 
          { 
            paddingHorizontal: isLargeScreen ? 28 : isTablet ? 24 : 20,
            paddingTop: isLargeScreen ? 28 : isTablet ? 26 : 22,
            paddingBottom: isLargeScreen ? 26 : isTablet ? 24 : 20
          }
        ]}>
          <View style={styles.topRow}>
            <View style={{ flex: 1.2 }}>
              <Text style={[styles.superScript, { color: C.accentCyan, fontSize: scaleFont(10) }]}>
                STATE OF CHARGE
              </Text>
              <View style={styles.valRow}>
                <Text style={[
                  styles.heroNum, 
                  { 
                    color: C.text, 
                    fontSize: scaleFont(isLargeScreen ? 66 : isCompact ? 50 : 58), 
                    lineHeight: scaleFont(isLargeScreen ? 70 : isCompact ? 54 : 62) 
                  }
                ]}>
                  {displayPct}
                </Text>
                <Text style={[styles.heroUnit, { color: C.textMuted, fontSize: scaleFont(24) }]}>%</Text>
              </View>
            </View>

            <View style={styles.statsCol}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: C.text, fontSize: scaleFont(20) }]}>{rangeKm}</Text>
                <Text style={[styles.statLabel, { color: C.textMuted, fontSize: scaleFont(10) }]}>Est. Range (km)</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: C.success || '#10b981', fontSize: scaleFont(20) }]}>{ecoScore}</Text>
                <Text style={[styles.statLabel, { color: C.textMuted, fontSize: scaleFont(10) }]}>Eco Score</Text>
              </View>
            </View>
          </View>

          <View style={styles.barWrap} onLayout={onTrackLayout}>
            <View style={[styles.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />
            <Animated.View style={[styles.barFill, fillStyle, { backgroundColor: C.accentCyan }]}>
              <Animated.View style={[styles.shimmer, shimmerStyle, { backgroundColor: 'rgba(255,255,255,0.6)' }]} />
            </Animated.View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 24,
  },
  innerFrame: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  superScript: {
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  valRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  heroNum: {
    fontWeight: '900',
    letterSpacing: -2,
  },
  heroUnit: {
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 2,
  },
  statsCol: {
    flex: 1,
    alignItems: 'flex-end',
    gap: 12,
  },
  statBox: {
    alignItems: 'flex-end',
  },
  statVal: {
    fontWeight: '800',
  },
  statLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  barWrap: {
    height: 12,
    marginTop: 20,
    position: 'relative',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barTrack: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
  },
  barFill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 6,
    overflow: 'hidden',
  },
  shimmer: {
    width: 40,
    height: '100%',
    transform: [{ skewX: '-20deg' }],
  },
});
