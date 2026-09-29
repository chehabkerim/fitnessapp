import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ColorScheme } from '../lib/domain';
import { SELECTABLE_SCHEMES } from './schemes';
import { themes, type Colors } from './tokens';

interface ThemeValue {
  colorScheme: ColorScheme;
  c: Colors;
  setColorScheme: (s: ColorScheme) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * Always dark: the OS light/dark setting is ignored. Neon until the stored scheme loads; switching applies
 * instantly. A scheme that isn't selectable (Ultraviolet before it unlocks, or an unknown value from a
 * hand-edited import) falls back to Neon.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setColorScheme] = useState<ColorScheme>('neon');
  const colorScheme = SELECTABLE_SCHEMES.includes(stored) ? stored : 'neon';
  const value = useMemo(() => ({ colorScheme, c: themes[colorScheme], setColorScheme }), [colorScheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const v = useContext(ThemeContext);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
