import { useEffect } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withDelay, 
  withRepeat, 
  withSequence 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../hooks/useResponsive';
import { useTheme } from '../context/ThemeContext';

export function SplashScreen() {
  const navigation = useNavigation();
  const { isAuthenticated, loading } = useAuth();
  const { horizontalPadding, heroTitleSize, scaleFont, iconSize, contentMaxWidth, isLandscape } = useResponsive();
  const { isDark, colors } = useTheme();

  // Animation values for stagger entrance
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.75);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(16);
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(12);

  // Animation loops
  const logoBreath = useSharedValue(1);
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.35);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.2);
  const shimmerTranslate = useSharedValue(-70);

  useEffect(() => {
    // Staggered entry timing
    logoOpacity.value = withTiming(1, { duration: 800 });
    logoScale.value = withTiming(1, { duration: 800 });

    titleOpacity.value = withDelay(250, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(250, withTiming(0, { duration: 800 }));

    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    taglineTranslateY.value = withDelay(500, withTiming(0, { duration: 800 }));

    // Pulse loop (breathing)
    logoBreath.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );

    // Expand & fade loop for Ring 1
    ring1Scale.value = withRepeat(
      withTiming(1.55, { duration: 2500 }),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 2500 }), withTiming(0.35, { duration: 0 })),
      -1,
      false
    );

    // Expand & fade loop for Ring 2 (staggered slightly differently)
    ring2Scale.value = withRepeat(
      withTiming(2.1, { duration: 2500 }),
      -1,
      false
    );
    ring2Opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 2500 }), withTiming(0.2, { duration: 0 })),
      -1,
      false
    );

    // Continuous shimmer
    shimmerTranslate.value = withRepeat(
      withTiming(150, { duration: 1400 }),
      -1,
      false
    );
  }, [logoOpacity, logoScale, titleOpacity, titleTranslateY, taglineOpacity, taglineTranslateY, logoBreath, ring1Scale, ring1Opacity, ring2Scale, ring2Opacity, shimmerTranslate]);

  useEffect(() => {
    if (loading) return;
    const t = setTimeout(() => {
      navigation.replace(isAuthenticated ? 'Main' : 'Login');
    }, 2800); // Slightly longer for the gorgeous intro animation to run fully!
    return () => clearTimeout(t);
  }, [navigation, isAuthenticated, loading]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value * logoBreath.value }],
  }));

  const ring1Style = useAnimatedStyle(() => ({
    opacity: ring1Opacity.value * logoOpacity.value,
    transform: [{ scale: ring1Scale.value }],
  }));

  const ring2Style = useAnimatedStyle(() => ({
    opacity: ring2Opacity.value * logoOpacity.value,
    transform: [{ scale: ring2Scale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslate.value }],
  }));

  const logoSize = iconSize.lg + (isLandscape ? 8 : 12);
  
  const gradientColors = isDark
    ? [colors.gradientStart || '#020617', '#0a1628', colors.gradientEnd || '#020617']
    : [colors.gradientStart || '#e8f4fd', '#f0f7ff', colors.gradientEnd || '#e8f4fd'];

  return (
    <LinearGradient
      colors={gradientColors}
      locations={[0, 0.5, 1]}
      style={[styles.root, { paddingHorizontal: horizontalPadding }]}
    >
      {/* Background ambient spotlight glow behind the logo */}
      <View style={[
        styles.spotlight, 
        { backgroundColor: isDark ? 'rgba(0,217,126, 0.08)' : 'rgba(0,106,78, 0.04)' },
        Platform.select({ web: { filter: 'blur(75px)' }, default: {} })
      ]} />

      <Animated.View style={{ alignItems: 'center', width: '100%', maxWidth: contentMaxWidth ?? 420 }}>
        
        {/* Double Concentric Pulsing Rings + Inner Breathing Orb */}
        <View style={{ height: logoSize + 70, width: logoSize + 70, alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <Animated.View style={[
            styles.pulseRing, 
            ring1Style, 
            { 
              width: logoSize + 24, 
              height: logoSize + 24, 
              borderRadius: (logoSize + 24) / 2,
              borderColor: colors.accentCyan,
            }
          ]} />
          <Animated.View style={[
            styles.pulseRing, 
            ring2Style, 
            { 
              width: logoSize + 24, 
              height: logoSize + 24, 
              borderRadius: (logoSize + 24) / 2,
              borderColor: colors.accentPurple || colors.accentCyan,
            }
          ]} />

          <Animated.View style={[
            logoStyle,
            {
              alignItems: 'center', justifyContent: 'center',
              borderRadius: 28, borderWidth: 1.5,
              borderColor: isDark ? 'rgba(0,217,126, 0.38)' : 'rgba(0,106,78, 0.4)',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
              height: logoSize + 36, width: logoSize + 36,
              shadowColor: colors.accentCyan,
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.35,
              shadowRadius: 24,
              elevation: 12,
            }
          ]}>
            <Ionicons name="flash" size={logoSize} color={colors.accentCyan} />
          </Animated.View>
        </View>

        {/* Title stagger entrance */}
        <Animated.View style={[titleStyle, { alignItems: 'center' }]}>
          <Text style={{ fontWeight: '800', letterSpacing: -0.8, color: colors.text, fontSize: heroTitleSize * 1.05 }}>
            PowerRoute
          </Text>
        </Animated.View>

        {/* Tagline stagger entrance */}
        <Animated.View style={[taglineStyle, { alignItems: 'center', width: '100%' }]}>
          <Text style={{
            marginTop: 10, textAlign: 'center', fontWeight: '600', textTransform: 'uppercase',
            color: colors.accentCyan, opacity: 0.85,
            fontSize: scaleFont(13), letterSpacing: isLandscape ? 4 : 5.6,
          }}>
            Smart EV navigation
          </Text>

          {/* Shimmer loading bar */}
          <View style={[styles.shimmerTrack, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' }]}>
            <Animated.View style={[
              shimmerStyle, 
              { 
                width: 50, 
                height: '100%', 
                backgroundColor: colors.accentCyan, 
                position: 'absolute', 
                top: 0, 
                left: 0,
                shadowColor: colors.accentCyan,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 6,
              }
            ]} />
          </View>
        </Animated.View>

      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  shimmerTrack: {
    width: 130, 
    height: 3, 
    borderRadius: 2, 
    marginTop: 26, 
    overflow: 'hidden',
    position: 'relative',
  },
  spotlight: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.6,
  },
});
