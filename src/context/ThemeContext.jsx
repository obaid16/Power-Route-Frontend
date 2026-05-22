import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme, View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme';

const STORAGE_KEY = 'powerroute_theme';

const ThemeContext = createContext(null);

/**
 * Provides theme mode ('dark' | 'light') and the resolved color palette.
 * - On first launch, follows the device system preference.
 * - User override is persisted to AsyncStorage.
 * - NEVER returns null — always shows a loading indicator to prevent blank screen.
 */
export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'dark' | 'light' | null

  // Initialize SYNCHRONOUSLY with system default — avoids the null → blank-screen flash
  const [mode, setMode] = useState(systemScheme === 'light' ? 'light' : 'dark');
  const [themeReady, setThemeReady] = useState(false);

  // Load persisted preference on mount — override the sync default if user had a saved choice
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored === 'dark' || stored === 'light') {
          setMode(stored);
        }
        // else keep the system-default already set synchronously
      })
      .catch(() => {
        // Keep the synchronous default; AsyncStorage failure is non-fatal
      })
      .finally(() => {
        setThemeReady(true);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const setTheme = useCallback((newMode) => {
    if (newMode !== 'dark' && newMode !== 'light') return;
    setMode(newMode);
    AsyncStorage.setItem(STORAGE_KEY, newMode).catch(() => {});
  }, []);

  const isDark = mode !== 'light';
  const themeColors = isDark ? darkColors : lightColors;

  const value = useMemo(
    () => ({ mode, isDark, colors: themeColors, toggle, setTheme }),
    [mode, isDark, themeColors, toggle, setTheme]
  );

  // Show a minimal branded loader while we confirm the persisted theme (< 100ms typically).
  // This prevents a white flash WITHOUT ever returning null.
  if (!themeReady) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: isDark ? darkColors.bg : lightColors.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <ActivityIndicator
          size="small"
          color={isDark ? darkColors.accentCyan : lightColors.accentCyan}
        />
      </View>
    );
  }

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
