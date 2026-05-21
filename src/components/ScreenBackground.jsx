import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

export function ScreenBackground({ children, edges = true }) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();

  const gradientColors = isDark
    ? [colors.gradientStart || '#020617', '#0a1628', colors.gradientEnd || '#0f172a']
    : [colors.gradientStart || '#f8fafc', '#f1f5f9', colors.gradientEnd || '#e2e8f0'];

  const topGlowColors = isDark
    ? ['rgba(0, 217, 126, 0.15)', 'rgba(0, 217, 126, 0)'] // Caribbean Green glow
    : ['rgba(0, 106, 78, 0.08)', 'rgba(0, 106, 78, 0)']; // Bangladesh Green glow

  const bottomGlowColors = isDark
    ? ['rgba(60, 203, 149, 0.12)', 'rgba(60, 203, 149, 0)'] // Mountain Meadow glow
    : ['rgba(0, 106, 78, 0.06)', 'rgba(0, 106, 78, 0)'];

  return (
    // Wrap in a View first so flex always fills the screen
    <View style={[styles.fill, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={topGlowColors}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.topSpotlight}
      />
      <LinearGradient
        colors={bottomGlowColors}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={styles.bottomSpotlight}
      />
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
  topSpotlight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '90%',
    height: '40%',
  },
  bottomSpotlight: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '90%',
    height: '45%',
  },
});
