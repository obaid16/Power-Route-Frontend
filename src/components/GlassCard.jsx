import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { radii } from '../theme';
import { useTheme } from '../context/ThemeContext';

/**
 * Glassmorphism card — adapts to dark / light theme automatically.
 *
 * @param {object}  props
 * @param {React.ReactNode} props.children
 * @param {string}  [props.className]
 * @param {number}  [props.padding=16]
 * @param {number}  [props.borderRadius]
 * @param {number}  [props.blurIntensity=28]
 * @param {object}  [props.style]
 */
export function GlassCard({
  children,
  className = '',
  style,
  padding = 16,
  borderRadius,
  blurIntensity = 28,
}) {
  const { isDark, colors } = useTheme();
  const br = borderRadius ?? radii.xl;
  const innerBr = Math.max(0, br - 2);

  // Dark: deep dark green glass  |  Light: frosted white glass
  const innerColors = isDark
    ? ['rgba(1, 34, 35, 0.95)', 'rgba(0, 27, 27, 0.92)']
    : ['rgba(255,255,255,0.95)', 'rgba(242,246,246,0.92)'];

  // Start with a bright neon highlight at top-left, graduating to accent color, then fading
  const borderColors = isDark
    ? ['rgba(60, 203, 149, 0.45)', 'rgba(0, 217, 126, 0.22)', 'rgba(1, 34, 35, 0.2)']
    : ['rgba(0, 106, 78, 0.35)', 'rgba(60, 203, 149, 0.2)', 'rgba(242, 246, 246, 0.4)'];

  const androidBg = isDark ? 'rgba(0, 27, 27, 0.8)' : 'rgba(255,255,255,0.9)';
  const blurTint = isDark ? 'dark' : 'light';

  const isFlex = style && (StyleSheet.flatten(style)?.flex !== undefined || StyleSheet.flatten(style)?.height !== undefined);
  const flexStyle = isFlex ? { flex: 1 } : null;

  const inner = (
    <LinearGradient
      colors={innerColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.inner, { padding, borderRadius: innerBr }, flexStyle]}
    >
      {children}
    </LinearGradient>
  );

  return (
    <View
      className={className}
      style={[
        styles.frame,
        {
          borderRadius: br,
          shadowColor: colors.cardGlow || colors.accentCyan,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={borderColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.frameGradient, { borderRadius: br }, flexStyle]}
      >
        {Platform.OS === 'ios' || Platform.OS === 'web' ? (
          <BlurView
            intensity={blurIntensity}
            tint={blurTint}
            style={[styles.blurClip, { borderRadius: br - 1 }, flexStyle]}
          >
            {inner}
          </BlurView>
        ) : (
          <View style={[styles.androidFill, { borderRadius: br - 1, backgroundColor: androidBg }, flexStyle]}>
            {inner}
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

/** Semantic alias — same component */
export const GlassContainer = GlassCard;

const styles = StyleSheet.create({
  frame: {
    overflow: 'visible',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  frameGradient: { padding: 1, overflow: 'hidden' },
  blurClip: { overflow: 'hidden' },
  androidFill: { overflow: 'hidden' },
  inner: { overflow: 'hidden' },
});
