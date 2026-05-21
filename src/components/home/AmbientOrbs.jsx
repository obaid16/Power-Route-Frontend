import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useResponsive } from '../../hooks/useResponsive';

import { useTheme } from '../../context/ThemeContext';

export function AmbientOrbs() {
  const { isLargeScreen, isTablet, width } = useResponsive();
  const { isDark, colors: themeColors } = useTheme();
  
  // Scale orb sizes based on screen size
  const orb1Size = isLargeScreen ? 360 : isTablet ? 320 : 280;
  const orb2Size = isLargeScreen ? 340 : isTablet ? 300 : 260;
  const orb3Size = isLargeScreen ? 280 : isTablet ? 250 : 220;
  
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[isDark ? 'rgba(0,217,126, 0.22)' : 'rgba(0,106,78, 0.15)', 'transparent']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 1, y: 0.8 }}
        style={[styles.blob, { top: isLargeScreen ? -60 : -40, right: isLargeScreen ? -80 : -60, width: orb1Size, height: orb1Size, borderRadius: orb1Size / 2 }]}
      />
      <LinearGradient
        colors={[isDark ? 'rgba(52, 211, 153, 0.12)' : 'rgba(16, 185, 129, 0.12)', 'transparent']}
        start={{ x: 1, y: 0.3 }}
        end={{ x: 0, y: 1 }}
        style={[styles.blob, { bottom: isLargeScreen ? 160 : isTablet ? 140 : 120, left: isLargeScreen ? -100 : -80, width: orb2Size, height: orb2Size, borderRadius: orb2Size / 2 }]}
      />
      <LinearGradient
        colors={[isDark ? 'rgba(8, 145, 178, 0.18)' : 'rgba(3, 105, 161, 0.12)', 'transparent']}
        style={[styles.blob, { top: '38%', right: isLargeScreen ? -120 : -100, width: orb3Size, height: orb3Size, borderRadius: orb3Size / 2 }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    opacity: 0.9,
  },
});
