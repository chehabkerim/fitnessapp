// Pure colour derivation for the colour schemes. Plus Ultra is dark only, so derived colours are lightened
// (toward the text) until they reach WCAG AA; nothing derived is hand-picked.
// Verified for every scheme in src/theme/contrast.test.ts.
import { contrastRatio, mix } from '../contrast';

export { contrastRatio, luminance, mix } from '../contrast';

/** WCAG AA minimums: small text, and large text (≥ 24px, or ≥ 18.66px bold) or UI graphics. */
export const AA_TEXT = 4.5;
export const AA_GRAPHIC = 3;

const NEAR_BLACK = '#0E0E10';
const WHITE = '#FFFFFF';
const upper = (hex: string) => `#${hex.replace('#', '').toUpperCase()}`;

/**
 * The smallest shift of `color` toward black (`darker`) or white (`lighter`), in 1% steps, that reaches
 * `min`:1 against every background. Returns `color` itself when it already does.
 */
export function ensureContrast(color: string, backgrounds: string[], min: number, toward: 'darker' | 'lighter' = 'lighter'): string {
  const target = toward === 'darker' ? '#000000' : WHITE;
  for (let step = 0; step <= 100; step++) {
    const candidate = step === 0 ? upper(color) : mix(color, target, step / 100);
    if (backgrounds.every((bg) => contrastRatio(candidate, bg) >= min)) return candidate;
  }
  throw new Error(`${color} can't reach ${min}:1 against ${backgrounds.join(', ')}`);
}

/** "Accent ink": the accent lightened toward white until small text in it reaches 4.5:1 on every background. */
export function accentInk(accent: string, backgrounds: string[]): string {
  return ensureContrast(accent, backgrounds, AA_TEXT);
}

/** The accent lightened until outlines, rings and highlights in it reach 3:1 on every background. */
export function accentGraphic(accent: string, backgrounds: string[]): string {
  return ensureContrast(accent, backgrounds, AA_GRAPHIC);
}

/** Text and icons on an accent fill: whichever of near-black or white has the higher contrast. */
export function onAccent(accent: string): string {
  return contrastRatio(NEAR_BLACK, accent) >= contrastRatio(WHITE, accent) ? NEAR_BLACK : WHITE;
}
