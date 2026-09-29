// Colour schemes. Plus Ultra is dark only; each scheme sets the background family and the accent.
// Only the base values below are chosen by hand (they are the approved table): every other colour is
// derived in /src/lib/theme so each scheme meets WCAG AA (src/theme/contrast.test.ts checks every pair).
// Brand purple is not a UI colour: it lives in `brand` (tokens.ts) for the logo, icon and badge enamel.

import type { ColorScheme } from '../lib/domain';
import { AA_TEXT, accentGraphic, accentInk, ensureContrast, mix, onAccent } from '../lib/theme';

export interface SchemeBase {
  bg: string;
  surface: string; // cards
  raised: string; // inputs, keypad keys, value boxes
  current: string; // current set row
  line: string; // hairlines
  outline: string; // secondary button borders
  ink: string; // text
  muted: string; // secondary text
  figureBody: string;
  accent: string;
}

const NEUTRAL: Omit<SchemeBase, 'accent'> = {
  bg: '#0E0E10',
  surface: '#17171A',
  raised: '#222226',
  current: '#1D1D21',
  line: '#2E2E33',
  outline: '#3A3A40',
  ink: '#F4F1EA',
  muted: '#A09C94',
  figureBody: '#2A2A2E',
};

export interface SchemeDef {
  name: string;
  base: SchemeBase;
}

export const SCHEMES: Record<ColorScheme, SchemeDef> = {
  neon: { name: 'Neon', base: { ...NEUTRAL, accent: '#39FF14' } },
  // Locked until stage 3 (earned with the first Diamond badge).
  ultraviolet: {
    name: 'Ultraviolet',
    base: {
      bg: '#0D0A1A',
      surface: '#17122A',
      raised: '#221B3A',
      current: '#1C1633',
      line: '#2E2645',
      outline: '#3D3458',
      ink: '#F2EEFF',
      muted: '#A39DBF',
      figureBody: '#2A2440',
      accent: '#2EE6FF',
    },
  },
  volt: { name: 'Volt', base: { ...NEUTRAL, accent: '#E4FF1A' } },
  mono: {
    name: 'Mono',
    base: {
      bg: '#0B0B0C',
      surface: '#161617',
      raised: '#222224',
      current: '#1C1C1E',
      line: '#2C2C2E',
      outline: '#3A3A3D',
      ink: '#FFFFFF',
      muted: '#9A9A9E',
      figureBody: '#2A2A2C',
      accent: '#FFFFFF',
    },
  },
  coral: { name: 'Coral', base: { ...NEUTRAL, accent: '#FF6B5A' } },
};

/** Schemes offered in Settings → Appearance (Ultraviolet unlocks in stage 3). */
export const SELECTABLE_SCHEMES: ColorScheme[] = ['neon', 'volt', 'mono', 'coral'];

/** Builds the full token object from a scheme's base values. */
export function buildColors(b: SchemeBase) {
  const surfaces = [b.bg, b.surface, b.raised, b.current];
  // Outlines, rings, icons, progress, the muscle highlight: 3:1 on every surface (and the figure body).
  const accent = accentGraphic(b.accent, [b.bg, b.surface, b.raised, b.figureBody]);
  const on = onAccent(accent);

  return {
    bg: b.bg,
    surface: b.surface,
    raised: b.raised,
    current: b.current,
    line: b.line,
    outline: b.outline,
    ink: b.ink,
    muted: b.muted,
    // Set list values: between text and secondary.
    listText: ensureContrast(mix(b.ink, b.muted, 0.5), surfaces, AA_TEXT),
    // "×" separator: secondary mixed toward the background, lightened back to 4.5:1.
    times: accentInk(mix(b.muted, b.bg, 0.35), surfaces),
    accent,
    // Small accent text ("UP NEXT", "SET 2 OF 3", NOW): lightened until 4.5:1 on every surface.
    accentText: accentInk(b.accent, surfaces),
    // Text and icons on accent fills (primary buttons, the PLUS ULTRA banner, ticks).
    onAccent: on,
    tick: accent,
    onTick: on,
    danger: '#FF7A6B',
    onDanger: '#0E0E10',
    scrim: 'rgba(0,0,0,0.6)',
    focus: accent,
    cardBorder: b.line,
    tileBg: b.current,
    figureBody: b.figureBody,
    figurePrimary: accent,
    figureSecondary: mix(accent, b.figureBody, 0.45),
  };
}
