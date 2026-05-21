import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { colors, radii } from '../../theme';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';

export function ChargingSessionCard({ chargeKw, timeToFullMin }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.35);
  const { scaleFont, isLargeScreen, isTablet } = useResponsive();
  const { isDark, colors: themeColors } = useTheme();

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.25, { duration: 700, easing: Easing.inOut(Easing.quad) }), withTiming(1, { duration: 700 })),
      -1,
      true
    );
  }, [pulse]);

  useEffect(() => {
    glow.value = withRepeat(
      withTiming(0.65, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [glow]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: glow.value,
  }));

  const padding = isLargeScreen ? 24 : isTablet ? 20 : 18;
  const dotSize = isLargeScreen ? 12 : 10;
  const marginTop = isLargeScreen ? 28 : isTablet ? 24 : 20;

  const inner = (
    <LinearGradient
      colors={isDark ? ['rgba(15, 23, 42, 0.75)', 'rgba(5, 12, 24, 0.95)'] : ['rgba(255, 255, 255, 0.85)', 'rgba(248, 250, 252, 0.98)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.pad, { paddingHorizontal: padding, paddingVertical: padding }]}
    >
      <View style={styles.row}>
        <View>
          <Text style={[styles.label, { color: themeColors.textFaint, fontSize: scaleFont(isLargeScreen ? 12 : 11) }]}>Live session</Text>
          <View style={[styles.liveRow, { gap: isLargeScreen ? 10 : 8, marginTop: isLargeScreen ? 10 : 8 }]}>
            <Animated.View style={[styles.liveDot, dotStyle, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
            <Text style={[styles.liveText, { color: themeColors.text, fontSize: scaleFont(isLargeScreen ? 15 : 13) }]}>Ultra DC handshake</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : 'rgba(16, 185, 129, 0.15)', borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.3)', paddingHorizontal: isLargeScreen ? 12 : 10, paddingVertical: isLargeScreen ? 6 : 5 }]}>
          <Text style={[styles.badgeText, { color: themeColors.accentMint, fontSize: scaleFont(isLargeScreen ? 11 : 10) }]}>Active</Text>
        </View>
      </View>
      <View style={[styles.metrics, { marginTop }]}>
        <View>
          <Text style={[styles.muted, { color: themeColors.textMuted, fontSize: scaleFont(isLargeScreen ? 13 : 11) }]}>Power curve</Text>
          <Text style={[styles.big, { color: themeColors.accentCyan, fontSize: scaleFont(isLargeScreen ? 40 : isTablet ? 36 : 34), marginTop: isLargeScreen ? 6 : 4 }]}>{chargeKw} kW</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.muted, { color: themeColors.textMuted, fontSize: scaleFont(isLargeScreen ? 13 : 11) }]}>Target window</Text>
          <Text style={[styles.subBig, { color: themeColors.text, fontSize: scaleFont(isLargeScreen ? 26 : isTablet ? 24 : 22), marginTop: isLargeScreen ? 6 : 4 }]}>{timeToFullMin} min</Text>
        </View>
      </View>
      <LinearGradient
        colors={isDark ? ['transparent', 'rgba(0,217,126, 0.08)', 'rgba(52, 211, 153, 0.12)'] : ['transparent', 'rgba(0,106,78, 0.05)', 'rgba(16, 185, 129, 0.08)']}
        style={[styles.bottomGlow, { height: isLargeScreen ? 60 : 48 }]}
        pointerEvents="none"
      />
    </LinearGradient>
  );

  return (
    <View style={[styles.wrap, { marginTop: isLargeScreen ? 24 : isTablet ? 20 : 18, shadowColor: themeColors.accentMint }]}>
      <LinearGradient colors={isDark ? ['rgba(0,217,126, 0.35)', 'rgba(52, 211, 153, 0.15)', 'rgba(15, 23, 42, 0.4)'] : ['rgba(0,106,78, 0.25)', 'rgba(16, 185, 129, 0.15)', 'rgba(240, 244, 248, 0.8)']} style={styles.borderGrad}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={isDark ? 22 : 40} tint={isDark ? "dark" : "light"} style={styles.blur}>
            {inner}
          </BlurView>
        ) : (
          <View style={[styles.androidInner, { backgroundColor: themeColors.surface }]}>{inner}</View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.35)',
    shadowColor: colors.accentMint,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 8,
  },
  borderGrad: {
    borderRadius: radii.xl,
    padding: 1,
  },
  blur: {
    borderRadius: radii.xl - 1,
    overflow: 'hidden',
  },
  androidInner: {
    borderRadius: radii.xl - 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(13, 31, 53, 0.72)',
  },
  pad: {
    borderRadius: radii.xl - 2,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.6,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    backgroundColor: colors.accentMint,
    shadowColor: colors.accentMint,
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  liveText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#6ee7b7',
    textTransform: 'uppercase',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  muted: {
    fontSize: 11,
    color: '#64748b',
  },
  big: {
    fontWeight: '700',
    color: '#22d3ee',
    letterSpacing: -1,
  },
  subBig: {
    fontWeight: '600',
    color: '#e2e8f0',
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
