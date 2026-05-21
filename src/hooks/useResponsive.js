import { Platform, useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  compact: 380,
  narrow: 360,
  tablet: 720,
  desktop: 1024,
  wide: 1440,
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Central responsive layout hook — breakpoints, spacing, typography scale, and layout tokens.
 * Enhanced for phone, tablet, laptop, and desktop responsiveness.
 */
export function useResponsive() {
  const { width, height, fontScale } = useWindowDimensions();
  const isLandscape = width > height;
  const isCompact = width < BREAKPOINTS.compact;
  const isNarrow = width < BREAKPOINTS.narrow;
  const isTablet = width >= BREAKPOINTS.tablet && width < BREAKPOINTS.desktop;
  const isDesktop = width >= BREAKPOINTS.desktop && width < BREAKPOINTS.wide;
  const isWide = width >= BREAKPOINTS.wide;
  const isLaptop = width >= BREAKPOINTS.desktop;
  const isMobile = width < BREAKPOINTS.tablet;
  const isLargeScreen = isDesktop || isWide;

  // Responsive horizontal padding with better scaling
  const horizontalPadding = isWide ? 48 : isDesktop ? 40 : isTablet ? 32 : isCompact ? 16 : 20;
  const verticalPadding = isLargeScreen ? 24 : isTablet ? 20 : isCompact ? 12 : 16;
  
  // Content max width for better readability on large screens
  const contentMaxWidth = isWide ? 1200 : isDesktop ? 960 : isTablet ? 680 : undefined;

  // Card sizing with better responsive scaling
  const featuredCardWidth = clamp(
    isWide ? width * 0.22 : isDesktop ? width * 0.28 : isTablet ? width * 0.42 : width - horizontalPadding * 2 - 28,
    260,
    isWide ? 400 : isDesktop ? 360 : 300
  );
  const cardSnapInterval = featuredCardWidth + 14;

  // Grid columns for different screen sizes
  const quickGridColumns = isWide ? 4 : isDesktop ? 3 : isTablet && isLandscape ? 3 : isTablet ? 2 : 1;
  const quickColBasis = quickGridColumns === 4 ? '23%' : quickGridColumns === 3 ? '31%' : quickGridColumns === 2 ? '48%' : '100%';

  // Typography scaling with better font size control
  const scaleFont = (base) => base * clamp(fontScale, 0.85, 1.2);
  
  // Layout dimensions
  const scrollBottomPad = isLargeScreen ? 160 : isTablet ? 140 : 128;
  const tabBarHeight = isLargeScreen ? 76 : isTablet ? 72 : isCompact ? 60 : 64;
  const fabSize = isLargeScreen ? 68 : isTablet ? 64 : 58;
  const fabBottomOffset = tabBarHeight + (isCompact ? 14 : isLargeScreen ? 22 : 18);
  
  // Map dimensions
  const mapPreviewHeight = clamp(
    isWide ? 520 : isDesktop ? 460 : isTablet ? 400 : isLandscape && !isMobile ? height * 0.42 : 320,
    260,
    isWide ? 600 : isDesktop ? 520 : 420
  );
  const mapContentMaxWidth = isWide
    ? Math.min(width - horizontalPadding * 2, 1200)
    : isDesktop
      ? Math.min(width - horizontalPadding * 2, 960)
      : isTablet
        ? Math.min(width - horizontalPadding * 2, 680)
        : undefined;
  
  // Component sizing
  const chipMaxWidth = isWide ? 260 : isDesktop ? 220 : isNarrow ? 130 : 160;
  const sosButtonSize = isLargeScreen ? 180 : isTablet ? 168 : isCompact ? 120 : 140;
  const loginMaxWidth = isWide ? 520 : isDesktop ? 480 : isTablet ? 420 : undefined;
  const modalMaxWidth = isWide ? 600 : isDesktop ? 560 : isTablet ? 500 : undefined;
  const modalMaxHeight = clamp(height * 0.6, 300, isWide ? 640 : isDesktop ? 580 : 520);
  
  // Icon and text sizing
  const iconSize = { 
    sm: scaleFont(isLargeScreen ? 16 : 14), 
    md: scaleFont(isLargeScreen ? 22 : 20), 
    lg: scaleFont(isLargeScreen ? 36 : 32) 
  };
  const titleSize = scaleFont(isWide ? 34 : isDesktop ? 32 : isTablet ? 28 : 26);
  const heroTitleSize = scaleFont(isWide ? 48 : isDesktop ? 44 : 36);

  // Content container style with proper centering
  const contentContainerStyle = {
    paddingHorizontal: horizontalPadding,
    paddingBottom: scrollBottomPad,
    ...(contentMaxWidth
      ? { maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }
      : {}),
  };

  return {
    width,
    height,
    fontScale,
    isLandscape,
    isCompact,
    isNarrow,
    isTablet,
    isDesktop,
    isWide,
    isLaptop,
    isMobile,
    isLargeScreen,
    horizontalPadding,
    verticalPadding,
    contentMaxWidth,
    featuredCardWidth,
    cardSnapInterval,
    quickGridColumns,
    quickColBasis,
    scaleFont,
    scrollBottomPad,
    tabBarHeight,
    fabSize,
    fabBottomOffset,
    mapPreviewHeight,
    mapContentMaxWidth,
    chipMaxWidth,
    sosButtonSize,
    loginMaxWidth,
    modalMaxWidth,
    modalMaxHeight,
    iconSize,
    titleSize,
    heroTitleSize,
    contentContainerStyle,
  };
}
