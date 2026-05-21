import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme';

const STORAGE_KEY = 'powerroute_theme';

const ThemeContext = createContext(null);

/**
 * Provides theme mode ('dark' | 'light') and the resolved color palette.
 * - On first launch, follows the device system preference.
 * - User override is persisted to AsyncStorage.
 */
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null
  const [mode, setMode] = useState(null); // null = not loaded yet

  // Load persisted preference on mount
  useEffect(() => {
    console.log('[ThemeContext] Initializing theme...');
    try {
      AsyncStorage.getItem(STORAGE_KEY)
        .then((stored) => {
          console.log('[ThemeContext] Stored theme is:', stored);
          if (stored === 'dark' || stored === 'light') {
            setMode(stored);
          } else {
            const fallback = systemScheme === 'light' ? 'light' : 'dark';
            console.log('[ThemeContext] No stored theme, using system scheme fallback:', fallback);
            setMode(fallback);
          }
        })
        .catch((err) => {
          console.warn('[ThemeContext] AsyncStorage error retrieving theme, using fallback:', err);
          setMode(systemScheme === 'light' ? 'light' : 'dark');
        });
    } catch (err) {
      console.error('[ThemeContext] Synchronous exception during theme initialization:', err);
      setMode(systemScheme === 'light' ? 'light' : 'dark');
    }
  }, [systemScheme]);

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      console.log('[ThemeContext] Toggling theme to:', next);
      try {
        AsyncStorage.setItem(STORAGE_KEY, next).catch((err) => {
          console.warn('[ThemeContext] Failed to persist toggled theme:', err);
        });
      } catch (err) {
        console.error('[ThemeContext] Synchronous exception during theme persist:', err);
      }
      return next;
    });
  }, []);

  const setTheme = useCallback((newMode) => {
    if (newMode !== 'dark' && newMode !== 'light') return;
    setMode(newMode);
    console.log('[ThemeContext] Setting theme directly to:', newMode);
    try {
      AsyncStorage.setItem(STORAGE_KEY, newMode).catch((err) => {
        console.warn('[ThemeContext] Failed to persist set theme:', err);
      });
    } catch (err) {
      console.error('[ThemeContext] Synchronous exception during theme set:', err);
    }
  }, []);

  const isDark = mode !== 'light';
  const themeColors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode: mode ?? 'dark', isDark, colors: themeColors, toggle, setTheme }),
    [mode, isDark, themeColors, toggle, setTheme]
  );

  // Don't render children until mode is resolved (avoids flash)
  if (mode === null) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** Returns { mode, isDark, colors, toggle, setTheme } */
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/** Shorthand — returns just the current color palette */
export function useColors() {
  return useTheme().colors;
}
