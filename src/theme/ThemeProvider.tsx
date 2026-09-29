import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { COLOR_SCHEMES, type ColorScheme, type ThemePref } from '../lib/domain';
import type { Mode } from '../lib/theme';
import { themes, type Colors } from './tokens';

interface ThemeValue {
  /** The light/dark mode in effect (System resolved). */
  mode: Mode;
  colorScheme: ColorScheme;
  c: Colors;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
  setColorScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Neon in dark mode until the stored preferences load. Changes apply instantly, without a reload. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPref] = useState<ThemePref>('dark');
  const [stored, setColorScheme] = useState<ColorScheme>('neon');
  // An unknown value (e.g. from a hand-edited import) falls back to Neon.
  const colorScheme = COLOR_SCHEMES.includes(stored) ? stored : 'neon';
  const mode: Mode = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  const value = useMemo(() => ({ mode, colorScheme, c: themes[colorScheme][mode], pref, setPref, setColorScheme }), [mode, colorScheme, pref]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
