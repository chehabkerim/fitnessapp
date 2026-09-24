// Design tokens. Contrast notes (WCAG):
//  light: ink/bg 15.3:1, muted/bg 5.3:1, accentStrong/bg and white-on-accentStrong ≥ 5:1.
//  #C4623F (accent) is for fills, rings and large numerals only (3.6:1 on bg).
//  dark: accent #D9774F on bg 5.8:1; dark text on accent 5.7:1.

export const palettes = {
  light: {
    bg: '#F6F1EA',
    surface: '#FBF8F3',
    surfaceAlt: '#F0E9DF',
    ink: '#1F1A17',
    muted: '#6E625A',
    faint: '#8F8378',
    line: '#E4D9CB',
    sand: '#E4D9CB',
    accent: '#C4623F',
    accentStrong: '#B0532F',
    onAccent: '#FFFFFF',
    sage: '#7D8F6E',
    sageTint: '#E6E8DC',
    onSage: '#FFFFFF',
    danger: '#A33A2A',
    focus: '#B0532F',
    scrim: 'rgba(31,26,23,0.32)',
    figureBody: '#E4D9CB',
    figurePrimary: '#C4623F',
    figureSecondary: '#D19277',
  },
  dark: {
    bg: '#1A1512',
    surface: '#221C18',
    surfaceAlt: '#2A231E',
    ink: '#F2E9DE',
    muted: '#A89A8C',
    faint: '#86796D',
    line: '#3A302A',
    sand: '#3A302A',
    accent: '#D9774F',
    accentStrong: '#D9774F',
    onAccent: '#1A1512',
    sage: '#9DAE8C',
    sageTint: '#2A2D24',
    onSage: '#1A1512',
    danger: '#E07A66',
    focus: '#D9774F',
    scrim: 'rgba(0,0,0,0.5)',
    figureBody: '#3B312A',
    figurePrimary: '#D9774F',
    figureSecondary: '#A15E45',
  },
} as const;

export type Colors = { [K in keyof (typeof palettes)['light']]: string };

export const space = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 20, xl: 24, xxl: 32, xxxl: 40, huge: 56 } as const;
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, pill: 999 } as const;

export const fonts = {
  display: 'Fraunces_500Medium',
  displayBold: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
} as const;

export const type = {
  display: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  subheading: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  overline: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 1, textTransform: 'uppercase' as const },
  numeral: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46 },
} as const;

export type TypeVariant = keyof typeof type;

export const motion = { fast: 150, base: 200, slow: 250 } as const;

export const layout = { maxWidth: 560, minTap: 44 } as const;
