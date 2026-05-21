import { View } from 'react-native';
import { useResponsive } from '../hooks/useResponsive';

/**
 * Centers scroll/content on tablet & desktop with consistent horizontal padding.
 */
export function ResponsiveContent({ children, style, noPadding = false, ...rest }) {
  const { contentContainerStyle, horizontalPadding } = useResponsive();

  return (
    <View
      style={[
        noPadding
          ? { maxWidth: contentContainerStyle.maxWidth, alignSelf: 'center', width: '100%' }
          : contentContainerStyle,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function ResponsiveScrollPadding({ bottomExtra = 0 }) {
  const { scrollBottomPad, horizontalPadding, contentMaxWidth } = useResponsive();
  return {
    paddingHorizontal: horizontalPadding,
    paddingBottom: scrollBottomPad + bottomExtra,
    ...(contentMaxWidth ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' } : {}),
  };
}
