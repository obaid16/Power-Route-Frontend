export const darkColors = {
  bg: '#001B1B', // Rich Black
  bgElevated: '#012223', // Dark Green
  bgCard: 'rgba(1, 34, 35, 0.8)',
  surface: 'rgba(0, 27, 27, 0.72)',
  border: 'rgba(0, 217, 126, 0.25)', // Caribbean Green faint
  borderSoft: 'rgba(60, 203, 149, 0.15)', // Mountain Meadow faint
  text: '#F2F6F6', // Anti Flash White
  textMuted: '#8ba6a6',
  textFaint: '#4a6363',
  accentCyan: '#00D97E', // Caribbean Green is the new primary "cyan" replacement
  accentMint: '#3CCB95', // Mountain Meadow
  accentPurple: '#006A4E', // Bangladesh Green (secondary accent)
  accentAmber: '#fbbf24',
  accentGlow: '#00D97E',
  success: '#3CCB95',
  danger: '#ef4444',
  warning: '#fbbf24',
  overlay: 'rgba(0, 27, 27, 0.65)',
  tabBar: 'rgba(0, 27, 27, 0.96)',
  tabBarBorder: 'rgba(0, 217, 126, 0.15)',
  cardGlow: 'rgba(0, 217, 126, 0.15)',
  gradientStart: '#001B1B',
  gradientEnd: '#012223',
  mapStyle: 'dark',
};

export const lightColors = {
  bg: '#F2F6F6', // Anti Flash White
  bgElevated: '#ffffff',
  bgCard: 'rgba(255, 255, 255, 0.9)',
  surface: 'rgba(242, 246, 246, 0.92)',
  border: 'rgba(0, 106, 78, 0.2)', // Bangladesh Green faint
  borderSoft: 'rgba(0, 106, 78, 0.1)',
  text: '#001B1B', // Rich Black
  textMuted: '#3d5252',
  textFaint: '#6b8a8a',
  accentCyan: '#006A4E', // Bangladesh Green for light mode primary
  accentMint: '#00D97E', // Caribbean Green
  accentPurple: '#3CCB95', // Mountain Meadow
  accentAmber: '#d97706',
  accentGlow: '#00D97E',
  success: '#00D97E',
  danger: '#ef4444',
  warning: '#d97706',
  overlay: 'rgba(242, 246, 246, 0.75)',
  tabBar: 'rgba(242, 246, 246, 0.98)',
  tabBarBorder: 'rgba(0, 106, 78, 0.15)',
  cardGlow: 'rgba(0, 217, 126, 0.1)',
  gradientStart: '#F2F6F6',
  gradientEnd: '#e6eeee',
  mapStyle: 'light',
};

// Default export keeps backward-compat for files that import { colors }
export const colors = darkColors;
