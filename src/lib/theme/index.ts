// Pure colour derivation for the colour schemes: every derived colour is computed, not hand-picked,
// so each scheme × mode meets WCAG AA by construction (verified in src/theme/contrast.test.ts).
import { contrastRatio, mix } from '../contrast';

export { contrastRatio, luminance, mix } from '../contrast';

export type Mode = 'light' | 'dark';

/** WCAG AA minimums: small text, and large text (≥ 24px, or ≥ 18.66px bold) or UI graphics. */
export const AA_TEXT = 4.5;
export const AA_GRAPHIC = 3;

const upper = (hex: string) => `#${hex.replace('#', '').toUpperCase()}`;

/**
 * The smallest shift of `color` toward black (`darker`) or white (`lighter`), in 1% steps, that reaches
 * `min`:1 against every background. Returns `color` itself when it already does.
 */
export function ensureContrast(color: string, backgrounds: string[], min: number, toward: 'darker' | 'lighter'): string {
  const target = toward === 'darker' ? '#000000' : '#FFFFFF';
  for (let step = 0; step <= 100; step++) {
    const candidate = step === 0 ? upper(color) : mix(color, target, step / 100);
    if (backgrounds.every((bg) => contrastRatio(candidate, bg) >= min)) return candidate;
  }
  throw new Error(`${color} can't reach ${min}:1 against ${backgrounds.join(', ')}`);
}

/** Light mode darkens, dark mode lightens: toward the ink, away from the background. */
export const towardInk = (mode: Mode) => (mode === 'light' ? 'darker' : 'lighter');

/** "Accent ink": the accent adjusted until small text in it reaches 4.5:1 on every given background. */
export function accentInk(accent: string, backgrounds: string[], mode: Mode): string {
  return ensureContrast(accent, backgrounds, AA_TEXT, towardInk(mode));
}

/** The accent adjusted until outlines, rings and highlights in it reach 3:1 on every given background. */
export function accentGraphic(accent: string, backgrounds: string[], mode: Mode): string {
  return ensureContrast(accent, backgrounds, AA_GRAPHIC, towardInk(mode));
}

/** Whichever candidate (near-black or white by default) reads best on `background`. */
export function readableOn(background: string, candidates: string[] = ['#0E0E10', '#FFFFFF']): string {
  return candidates.reduce((best, c) => (contrastRatio(c, background) > contrastRatio(best, background) ? c : best));
}
