import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

/**
 * Flat screen background — solid color with a very subtle top violet glow.
 * Minimal gradient approach: just the bg color + one barely-visible radial touch.
 */
export function ScreenBackground({ children, edges = true }) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      {/* Subtle top-right glow — 1 gradient, very low opacity */}
      {isDark && (
        <View
          style={[
            styles.topGlow,
            { backgroundColor: 'rgba(139, 92, 246, 0.07)' },
          ]}
        />
      )}
      <View
        style={[
          styles.fill,
          edges && {
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  topGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '70%',
    height: '35%',
    borderBottomLeftRadius: 999,
    opacity: 1,
  },
});
