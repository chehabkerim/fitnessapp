// Ignite design tokens. Every text/background pair is checked against WCAG AA in src/theme/contrast.test.ts.

import { mix } from '../lib/contrast';

const DARK_ACCENT = '#39FF14';
const LIGHT_ACCENT = '#00A03C';
const DARK_FIGURE_BODY = '#2A2A2E';
const LIGHT_FIGURE_BODY = '#D3D8D0';

export const palettes = {
  dark: {
    bg: '#0E0E10',
    surface: '#17171A',
    raised: '#222226', // inputs, keypad keys, value boxes
    current: '#1D1D21', // current set row
    line: '#2E2E33', // hairlines, card borders (1px)
    outline: '#3A3A40', // neutral outline buttons
    ink: '#F4F1EA',
    muted: '#A09C94',
    listText: '#C9C4BA',
    times: '#8E8A83', // "×" separator (spec #6E6A64 lightened to pass AA on raised)
    accent: DARK_ACCENT, // fills, outlines, progress, highlights
    accentText: DARK_ACCENT, // small green text
    purple: '#8E48C0',
    onPurple: '#F4F1EA',
    tick: '#3DDC84',
    onTick: '#0E0E10',
    danger: '#FF7A6B',
    scrim: 'rgba(0,0,0,0.6)',
    focus: DARK_ACCENT,
    cardBorder: '#2E2E33',
    tileBg: '#1D1D21',
    figureBody: DARK_FIGURE_BODY,
    figurePrimary: DARK_ACCENT,
    figureSecondary: mix(DARK_ACCENT, DARK_FIGURE_BODY, 0.45),
  },
  light: {
    bg: '#F3F4F1',
    surface: '#FFFFFF',
    raised: '#E9ECE7',
    current: '#FFFFFF',
    line: '#DDE1DA',
    outline: '#C4C9C1',
    ink: '#0E0E10',
    muted: '#5C6159',
    listText: '#343832',
    times: '#656A62', // "×" separator (spec #959A92 darkened to pass AA on raised)
    accent: LIGHT_ACCENT,
    accentText: '#04742E', // accent mixed 30% toward #0E0E10: all small green text
    purple: '#8E48C0',
    onPurple: '#F4F1EA',
    tick: LIGHT_ACCENT,
    onTick: '#FFFFFF',
    danger: '#B3261E',
    scrim: 'rgba(14,14,16,0.45)',
    focus: '#04742E',
    cardBorder: LIGHT_ACCENT, // light cards and tiles have a 2px accent border
    tileBg: '#E9ECE7',
    figureBody: LIGHT_FIGURE_BODY,
    figurePrimary: LIGHT_ACCENT,
    figureSecondary: mix(LIGHT_ACCENT, LIGHT_FIGURE_BODY, 0.4),
  },
} as const;

export type ColorKey = keyof (typeof palettes)['dark'];
export type Colors = { [K in ColorKey]: string } & { cardBorderWidth: number };

export const cardBorderWidth = { dark: 1, light: 2 } as const;

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
