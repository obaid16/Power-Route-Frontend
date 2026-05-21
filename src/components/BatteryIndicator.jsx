import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radii } from '../theme';

/**
 * Animated horizontal battery / capacity bar with neon gradient fill.
 *
 * @param {object} props
 * @param {number} props.percent — 0–100
 * @param {boolean} [props.showLabel=true]
 * @param {number} [props.height=14] — track height
 * @param {string} [props.label='Battery'] — left label when showLabel
 * @param {boolean} [props.animate=true] — tween fill on change
 */
export function BatteryIndicator({
  percent,
  showLabel = true,
  height = 14,
  label = 'Battery',
  animate = true,
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const fill = useSharedValue(0);
  const shimmer = useSharedValue(-1);

  const clamped = Math.min(100, Math.max(0, Number(percent) || 0));

  const onTrackLayout = (e) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  useEffect(() => {
    if (animate) {
      fill.value = withTiming(clamped, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      fill.value = clamped;
    }
  }, [clamped, animate, fill]);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(2, { duration: 2800, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [shimmer]);

  const fillStyle = useAnimatedStyle(() => {
    const w = trackWidth > 0 ? (trackWidth * fill.value) / 100 : 0;
    return { width: w };
  });

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmer.value * 120 }],
    opacity: 0.35,
  }));

  return (
    <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped }}>
      {showLabel ? (
        <View className="mb-2 flex-row items-baseline justify-between">
          <Text className="text-xs font-medium uppercase tracking-widest text-slate-400">{label}</Text>
          <Text className="text-lg font-semibold text-cyan-400">{Math.round(clamped)}%</Text>
        </View>
      ) : null}
      <View style={[styles.track, { height }]} onLayout={onTrackLayout}>
        <Animated.View style={[styles.fillWrap, fillStyle]}>
          <LinearGradient
            colors={[colors.accentGlow, colors.accentCyan, colors.accentMint]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[styles.shimmer, shimmerStyle]} pointerEvents="none" />
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    borderRadius: radii.pill,
    backgroundColor: 'rgba(2, 6, 23, 0.95)',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,217,126, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 2,
  },
  fillWrap: {
    height: '100%',
    borderRadius: radii.pill,
    overflow: 'hidden',
    shadowColor: colors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
  },
  shimmer: {
    ...StyleSheet.absoluteFillObject,
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: radii.pill,
  },
});
