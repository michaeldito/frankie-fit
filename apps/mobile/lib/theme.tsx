import 'expo-sqlite/localStorage/install';

import { themes, type Theme, type ThemeColors, type ThemeName } from '@frankie-fit/brand-core';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_STORAGE_KEY = 'ff-theme';

export const fonts = {
  // Frankie's handwriting, only for his short one-liners — body text stays on the system font.
  frankie: 'CaveatBrush_400Regular',
};

export const spacing = {
  screenX: 20,
  radius: 18,
};

type ThemeContextValue = {
  theme: Theme;
  colors: ThemeColors;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredPreference(): ThemePreference {
  try {
    const stored = globalThis.localStorage?.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function FrankieThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      if (next === 'system') {
        globalThis.localStorage?.removeItem(THEME_STORAGE_KEY);
      } else {
        globalThis.localStorage?.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {
      // Storage unavailable: the choice still applies for this session.
    }
  }, []);

  const name: ThemeName = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({ theme: themes[name], colors: themes[name].colors, preference, setPreference }),
    [name, preference, setPreference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside FrankieThemeProvider');
  }
  return value;
}

// Module-level style factories that re-run only when the theme changes.
export function createThemedStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: ThemeColors) => T) {
  return function useThemedStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
