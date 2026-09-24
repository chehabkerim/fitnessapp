import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import type { ThemePref } from '../lib/domain';
import { cardBorderWidth, palettes, type Colors } from './tokens';

interface ThemeValue {
  scheme: 'light' | 'dark';
  c: Colors;
  pref: ThemePref;
  setPref: (p: ThemePref) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/** Dark is the default until the stored preference loads. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [pref, setPref] = useState<ThemePref>('dark');
  const scheme = pref === 'system' ? (system === 'light' ? 'light' : 'dark') : pref;
  const value = useMemo(() => ({ scheme, c: { ...palettes[scheme], cardBorderWidth: cardBorderWidth[scheme] }, pref, setPref }), [scheme, pref]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
