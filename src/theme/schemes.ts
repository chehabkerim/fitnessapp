// Colour schemes × modes. Each scheme sets the background family and the accent; purple is the fixed
// action colour everywhere. Only the base values below are chosen by hand: every accent variant
// (graphics, ink for small text, fills, figure highlights) is derived in /src/lib/theme so each
// combination meets WCAG AA. src/theme/contrast.test.ts checks every pair.

import type { ColorScheme } from '../lib/domain';
import { AA_GRAPHIC, accentGraphic, accentInk, contrastRatio, mix, readableOn, type Mode } from '../lib/theme';

interface Base {
  bg: string;
  surface: string; // cards
  raised: string; // inputs, keypad keys, value boxes
  current: string; // current set row
  line: string; // hairlines
  outline: string; // neutral outline buttons
  ink: string;
  muted: string; // secondary text
  listText: string;
  figureBody: string;
  /** The scheme's accent as specified; used as-is for fills, adjusted for graphics and text. */
  accent: string;
}

const NEUTRAL_DARK: Omit<Base, 'accent'> = {
  bg: '#0E0E10',
  surface: '#17171A',
  raised: '#222226',
  current: '#1D1D21',
  line: '#2E2E33',
  outline: '#3A3A40',
  ink: '#F4F1EA',
  muted: '#A09C94',
  listText: '#C9C4BA',
  figureBody: '#2A2A2E',
};

const NEUTRAL_LIGHT: Omit<Base, 'accent'> = {
  bg: '#F3F4F1',
  surface: '#FFFFFF',
  raised: '#E9ECE7',
  current: '#FFFFFF',
  line: '#DDE1DA',
  outline: '#C4C9C1',
  ink: '#0E0E10',
  muted: '#5C6159',
  listText: '#343832',
  figureBody: '#D3D8D0',
};

export interface SchemeDef {
  name: string;
  dark: Base;
  light: Base;
  /** Volt: in light mode the accent is only a fill behind near-black text (chips, current set, progress). */
  lightAccentFillOnly?: boolean;
}

export const SCHEMES: Record<ColorScheme, SchemeDef> = {
  neon: {
    name: 'Neon',
    dark: { ...NEUTRAL_DARK, accent: '#39FF14' },
    light: { ...NEUTRAL_LIGHT, accent: '#00A03C' },
  },
  ultraviolet: {
    name: 'Ultraviolet',
    dark: {
      bg: '#0D0A1A',
      surface: '#17122A',
      raised: '#221B3A',
      current: '#1C1633',
      line: '#2E2645',
      outline: '#3D3458',
      ink: '#F2EEFF',
      muted: '#A39DBF',
      listText: '#CDC7E3',
      figureBody: '#2A2440',
      accent: '#2EE6FF',
    },
    // A cool, violet-tinted version of the neutral light base.
    light: {
      bg: '#F3F1F8',
      surface: '#FFFFFF',
      raised: '#E9E6F2',
      current: '#FFFFFF',
      line: '#DCD8E8',
      outline: '#C3BDD6',
      ink: '#0F0B1E',
      muted: '#5B5672',
      listText: '#35304B',
      figureBody: '#D4D0E2',
      accent: '#00B8D4',
    },
  },
  volt: {
    name: 'Volt',
    dark: { ...NEUTRAL_DARK, accent: '#E4FF1A' },
    light: { ...NEUTRAL_LIGHT, current: '#E4FF1A', accent: '#E4FF1A' },
    lightAccentFillOnly: true,
  },
  mono: {
    name: 'Mono',
    dark: {
      bg: '#0B0B0C',
      surface: '#161617',
      raised: '#222224',
      current: '#1C1C1E',
      line: '#2C2C2E',
      outline: '#3A3A3D',
      ink: '#FFFFFF',
      muted: '#9A9A9E',
      listText: '#D1D1D4',
      figureBody: '#2A2A2C',
      accent: '#B07AE6', // lighter than the purple buttons, so highlights stay distinct and readable as text
    },
    light: { ...NEUTRAL_LIGHT, accent: '#8E48C0' },
  },
  coral: {
    name: 'Coral',
    dark: { ...NEUTRAL_DARK, accent: '#FF6B5A' },
    light: { ...NEUTRAL_LIGHT, accent: '#FF6B5A' },
  },
};

const PURPLE = '#8E48C0';
const ON_PURPLE = '#F4F1EA';

/** Builds the full token object for a scheme and mode. */
export function buildColors(scheme: ColorScheme, mode: Mode) {
  const def = SCHEMES[scheme] ?? SCHEMES.neon;
  const b = def[mode];
  const light = mode === 'light';
  const textBgs = [b.bg, b.surface, b.raised, b.current];

  // Outlines, rings, icons, large accent text: 3:1 against every surface.
  const accent = accentGraphic(b.accent, [b.bg, b.surface, b.raised], mode);
  // Primary muscle highlight: 3:1 against the figure's body colour (and the tile behind it).
  const figurePrimary = accentGraphic(accent, [b.figureBody], mode);
  // Small accent text: 4.5:1 against every surface it sits on.
  const accentText = accentInk(b.accent, textBgs, mode);
  // Fills behind text (chips, the progress bar): the scheme accent exactly as specified.
  const accentFill = b.accent;
  const onAccentFill = readableOn(accentFill);
  // "×" separator: a quieter grey, adjusted until it still reads as text.
  const times = accentInk(mix(b.muted, b.bg, 0.35), [b.surface, b.raised, b.current], mode);
  // Completed tick: the success green in dark mode; in light mode, an accent circle.
  const tick = light ? accent : '#3DDC84';

  return {
    bg: b.bg,
    surface: b.surface,
    raised: b.raised,
    current: b.current,
    line: b.line,
    outline: b.outline,
    ink: b.ink,
    muted: b.muted,
    listText: b.listText,
    times,
    accent,
    accentText,
    accentFill,
    onAccentFill,
    purple: PURPLE,
    onPurple: ON_PURPLE,
    tick,
    // Light: a white check (the approved look) whenever it reaches 3:1 on the accent circle.
    onTick: light && contrastRatio('#FFFFFF', tick) >= AA_GRAPHIC ? '#FFFFFF' : readableOn(tick),
    danger: light ? '#B3261E' : '#FF7A6B',
    scrim: light ? 'rgba(14,14,16,0.45)' : 'rgba(0,0,0,0.6)',
    focus: light ? accentText : accent,
    cardBorder: light ? accent : b.line, // light cards and tiles have a 2px accent border
    tileBg: light ? b.raised : b.current,
    figureBody: b.figureBody,
    figurePrimary,
    figureSecondary: mix(figurePrimary, b.figureBody, light ? 0.4 : 0.45),
  };
}
