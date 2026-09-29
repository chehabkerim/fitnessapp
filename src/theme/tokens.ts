// Ignite design tokens. Colours come from the colour schemes (./schemes): one token object per
// scheme × mode, all checked against WCAG AA in src/theme/contrast.test.ts.

import { COLOR_SCHEMES, type ColorScheme } from '../lib/domain';
import type { Mode } from '../lib/theme';
import { buildColors } from './schemes';

export type ColorKey = keyof ReturnType<typeof buildColors>;
export type Colors = { [K in ColorKey]: string } & { cardBorderWidth: number };

export const cardBorderWidth = { dark: 1, light: 2 } as const;

/** Every scheme × mode, built once. */
export const themes = Object.fromEntries(
  COLOR_SCHEMES.map((scheme) => [
    scheme,
    {
      dark: { ...buildColors(scheme, 'dark'), cardBorderWidth: cardBorderWidth.dark },
      light: { ...buildColors(scheme, 'light'), cardBorderWidth: cardBorderWidth.light },
    },
  ]),
) as Record<ColorScheme, Record<Mode, Colors>>;

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;
export const radius = { row: 12, sm: 10, md: 14, button: 16, card: 20, xl: 22, pill: 999 } as const;

export const fonts = {
  // Barlow Condensed: display and all numbers
  cond600: 'BarlowCondensed_600SemiBold',
  cond700: 'BarlowCondensed_700Bold',
  cond800: 'BarlowCondensed_800ExtraBold',
  cond700i: 'BarlowCondensed_700Bold_Italic',
  cond800i: 'BarlowCondensed_800ExtraBold_Italic',
  // Barlow: UI and body
  body: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemi: 'Barlow_600SemiBold',
  bodyBold: 'Barlow_700Bold',
} as const;

const upper = 'uppercase' as const;

export const type = {
  display: { fontFamily: fonts.cond800i, fontSize: 56, lineHeight: 54, textTransform: upper },
  title: { fontFamily: fonts.cond800i, fontSize: 48, lineHeight: 48, textTransform: upper },
  heading: { fontFamily: fonts.cond800i, fontSize: 26, lineHeight: 28, textTransform: upper },
  subheading: { fontFamily: fonts.bodySemi, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 22 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 22 },
  label: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 18 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 17 },
  overline: { fontFamily: fonts.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 1.4, textTransform: upper },
  numeral: { fontFamily: fonts.cond800i, fontSize: 40, lineHeight: 42 },
  value: { fontFamily: fonts.cond700, fontSize: 20, lineHeight: 24 },
} as const;

export type TypeVariant = keyof typeof type;

export const motion = { fast: 120, base: 160, slow: 200 } as const;

export const layout = { maxWidth: 560, minTap: 48, primaryButton: 64 } as const;
