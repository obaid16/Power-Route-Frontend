import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { radii } from '../theme';

/**
 * Floating circular AI assistant trigger (pulse animation).
 *
 * @param {object} props
 * @param {() => void} props.onPress
 * @param {number} [props.bottomOffset=88] — distance from bottom (above tab bar)
 * @param {string} [props.caption='Volt AI']
 * @param {'sparkles'|'chatbubble-ellipses'} [props.icon='sparkles']
 * @param {number} [props.size=58] — button diameter
 */
export function FloatingAIButton({
  onPress,
  bottomOffset = 88,
  caption = 'Volt AI',
  icon = 'sparkles',
  size = 58,
}) {
  const { isDark, colors } = useTheme();
  const pulse = useSharedValue(1);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.4);
  const rotation = useSharedValue(0);

  const { fabSize, fabBottomOffset, scaleFont, isLargeScreen } = useResponsive();
  
  // Use responsive size if default size is provided
  const buttonSize = size === 58 ? fabSize : size;
  const buttonBottom = bottomOffset === 88 ? fabBottomOffset : bottomOffset;

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1.04, { duration: 1400 }), withTiming(1, { duration: 1400 })),
      -1,
      true
    );

    ringScale.value = withRepeat(
      withTiming(1.35, { duration: 2000 }),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 2000 }), withTiming(0.45, { duration: 0 })),
      -1,
      false
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: 10000 }),
      -1,
      false
    );
  }, [pulse, ringScale, ringOpacity, rotation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const radius = buttonSize / 2;
  const iconSizeValue = Math.round(buttonSize * 0.42);
  const captionFontSize = scaleFont(isLargeScreen ? 11 : 10);

  return (
    <View pointerEvents="box-none" style={[styles.container, { bottom: buttonBottom }]}>
      <Animated.View style={[styles.haloRing, ringAnimStyle, { width: buttonSize, height: buttonSize, borderRadius: radius, borderColor: colors.accentCyan, backgroundColor: isDark ? 'rgba(0,217,126, 0.12)' : 'rgba(0,106,78, 0.08)' }]} />
      <Animated.View style={animStyle}>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={caption}
          style={({ pressed }) => [styles.btn, { shadowColor: colors.accentCyan }, pressed && { opacity: 0.92 }]}
        >
          <LinearGradient
            colors={isDark ? [colors.accentGlow, colors.accentCyan] : [colors.accentCyan, colors.accentMint]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.gradient, { width: buttonSize, height: buttonSize, borderRadius: radius, borderWidth: isLargeScreen ? 1.5 : 1 }]}
          >
            <Animated.View style={icon === 'sparkles' ? iconAnimStyle : null}>
              <Ionicons name={icon} size={iconSizeValue} color={isDark ? "#020617" : "#ffffff"} />
            </Animated.View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
      {caption ? (
        <Text 
          className="text-center font-semibold uppercase tracking-widest" 
          style={{ 
            marginTop: isLargeScreen ? 8 : 6, 
            fontSize: captionFontSize,
            color: isDark ? 'rgba(165, 243, 252, 0.8)' : 'rgba(0,106,78, 0.8)'
          }}
        >
          {caption}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 50,
  },
  haloRing: {
    position: 'absolute',
    borderWidth: 1.5,
  },
  btn: {
    borderRadius: radii.pill,
    overflow: 'visible',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    overflow: 'hidden',
  },
});
