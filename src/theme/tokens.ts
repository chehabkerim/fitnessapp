// Plus Ultra design tokens. Dark only: one token object per colour scheme (./schemes), all checked
// against WCAG AA in src/theme/contrast.test.ts.

import { COLOR_SCHEMES, type ColorScheme } from '../lib/domain';
import { buildColors, SCHEMES } from './schemes';

export type ColorKey = keyof ReturnType<typeof buildColors>;
export type Colors = { [K in ColorKey]: string };

/** Every scheme, built once. */
export const themes = Object.fromEntries(COLOR_SCHEMES.map((scheme) => [scheme, buildColors(SCHEMES[scheme].base)])) as Record<ColorScheme, Colors>;

/** Brand colours: only for the logo, the app icon and badge enamel. Never a UI colour. */
export const brand = { purple: '#8E48C0' } as const;

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;
export const radius = { row: 12, sm: 10, md: 14, button: 16, card: 20, xl: 22, pill: 999 } as const;

export const fonts = {
  // Barlow Condensed: display and all numbers
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
