import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

/**
 * Animated dark / light mode toggle.
 *
 * @param {{ showLabel?: boolean, size?: 'sm' | 'md' }} props
 */
export function ThemeToggle({ showLabel = true, size = 'md' }) {
  const { isDark, toggle, colors } = useTheme();
  const anim = useRef(new Animated.Value(isDark ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isDark ? 0 : 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isDark, anim]);

  const isSmall = size === 'sm';
  const trackW = isSmall ? 44 : 52;
  const trackH = isSmall ? 26 : 30;
  const knobSize = isSmall ? 20 : 24;
  const knobTravel = trackW - knobSize - 4;

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,217,126,0.25)', 'rgba(251,191,36,0.3)'],
  });
  const trackBorder = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,217,126,0.55)', 'rgba(251,191,36,0.6)'],
  });
  const knobX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, knobTravel],
  });
  const knobBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.accentCyan, '#fbbf24'],
  });

  return (
    <Pressable
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: !isDark }}
      accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      style={styles.row}
    >
      {showLabel && (
        <Text style={[styles.label, { color: colors.textMuted, fontSize: isSmall ? 11 : 13 }]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
      )}

      <Animated.View
        style={[
          styles.track,
          {
            width: trackW,
            height: trackH,
            borderRadius: trackH / 2,
            backgroundColor: trackBg,
            borderColor: trackBorder,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.knob,
            {
              width: knobSize,
              height: knobSize,
              borderRadius: knobSize / 2,
              backgroundColor: knobBg,
              transform: [{ translateX: knobX }],
            },
          ]}
        >
          <Ionicons
            name={isDark ? 'moon' : 'sunny'}
            size={isSmall ? 11 : 13}
            color="#020617"
          />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  track: {
    borderWidth: 1,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
