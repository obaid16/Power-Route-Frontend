// ── VoltPath Design System — Purple / Violet Dark Theme ──────────────────────
// Inspired by the Electra EV reference: deep purple-black surfaces,
// violet primary accent, fuchsia/pink primary CTAs, green for charging status.

export const darkColors = {
  bg:              '#0f0720',              // Deep purple-black base
  bgElevated:      '#1a0d35',              // Dark purple card surface
  bgCard:          'rgba(26, 13, 53, 0.9)',
  surface:         'rgba(15, 7, 32, 0.8)',
  border:          'rgba(139, 92, 246, 0.22)', // Violet border
  borderSoft:      'rgba(139, 92, 246, 0.10)',
  text:            '#ffffff',
  textMuted:       '#c4b5fd',              // Violet-300 for secondary text
  textFaint:       '#7c6bb0',              // Muted purple-gray
  accentCyan:      '#8b5cf6',              // Violet-500 — primary interactive
  accentMint:      '#a78bfa',              // Violet-400 — lighter variant
  accentPurple:    '#d946ef',              // Fuchsia-500 — primary CTA buttons
  accentAmber:     '#fbbf24',
  accentGlow:      '#7c3aed',              // Violet-600 for glows
  success:         '#10B981',              // Keep green for availability/charging
  danger:          '#ef4444',
  warning:         '#f59e0b',
  overlay:         'rgba(15, 7, 32, 0.72)',
  tabBar:          'rgba(15, 7, 32, 0.97)',
  tabBarBorder:    'rgba(139, 92, 246, 0.18)',
  cardGlow:        'rgba(139, 92, 246, 0.14)',
  gradientStart:   '#0f0720',
  gradientEnd:     '#1a0d35',
  mapStyle:        'dark',
};

export const lightColors = {
  bg:              '#f8f8ff',              // Very light lavender-white
  bgElevated:      '#ffffff',
  bgCard:          'rgba(255, 255, 255, 0.95)',
  surface:         'rgba(248, 248, 255, 0.95)',
  border:          'rgba(124, 58, 237, 0.14)',
  borderSoft:      'rgba(124, 58, 237, 0.07)',
  text:            '#111827',
  textMuted:       '#6b7280',
  textFaint:       '#9ca3af',
  accentCyan:      '#7c3aed',              // Violet-600 for interactive elements
  accentMint:      '#8b5cf6',              // Violet-500
  accentPurple:    '#c026d3',              // Fuchsia-600 for CTAs
  accentAmber:     '#d97706',
  accentGlow:      '#7c3aed',
  success:         '#10B981',
  danger:          '#ef4444',
  warning:         '#d97706',
  overlay:         'rgba(255, 255, 255, 0.82)',
  tabBar:          'rgba(255, 255, 255, 0.98)',
  tabBarBorder:    'rgba(124, 58, 237, 0.10)',
  cardGlow:        'rgba(124, 58, 237, 0.05)',
  gradientStart:   '#f8f8ff',
  gradientEnd:     '#ede9fe',
  mapStyle:        'light',
};

// Default export keeps backward-compat for files that import { colors }
export const colors = darkColors;
