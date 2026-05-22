import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme';

/**
 * Flat card with a subtle violet border — replaces the heavy glassmorphism.
 * Keeps the same API (padding, borderRadius, style, children).
 */
export function GlassCard({
  children,
  className = '',
  style,
  padding = 16,
  borderRadius,
  blurIntensity = 28, // kept for API compat, unused
}) {
  const { isDark, colors } = useTheme();
  const br = borderRadius ?? radii.xl;

  const cardBg = isDark ? colors.bgElevated : colors.bgCard;
  const borderColor = colors.border;
  const shadowColor = colors.cardGlow || colors.accentCyan;

  return (
    <View
      className={className}
      style={[
        styles.frame,
        {
          borderRadius: br,
          backgroundColor: cardBg,
          borderColor,
          shadowColor,
        },
        style,
      ]}
    >
      <View style={[styles.inner, { padding, borderRadius: Math.max(0, br - 1) }]}>
        {children}
      </View>
    </View>
  );
}

/** Semantic alias */
export const GlassContainer = GlassCard;

const styles = StyleSheet.create({
  frame: {
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 6,
  },
  inner: {
    overflow: 'hidden',
  },
});
