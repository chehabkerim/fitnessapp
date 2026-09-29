import { COLOR_SCHEMES } from '../lib/domain';
import { AA_GRAPHIC, AA_TEXT, contrastRatio } from '../lib/theme';
import { themes, type ColorKey, type Colors } from './tokens';

// WCAG AA for every colour scheme (dark only): 4.5:1 for small text, 3:1 for large text (≥ 24px, or
// ≥ 18.66px bold) and UI graphics. Any failure fails the build.
// Not checked, on purpose: `figureSecondary` (a mid-tone between the highlight and the body by design;
// the muscle names are also listed as text).
type Pair = { fg: ColorKey; bg: ColorKey; min: number; use: string };

const SURFACES = ['bg', 'surface', 'raised', 'current'] as const;
export const PAIRS: Pair[] = [
  ...SURFACES.flatMap((bg): Pair[] => [
    { fg: 'ink', bg, min: AA_TEXT, use: 'text' },
    { fg: 'muted', bg, min: AA_TEXT, use: 'secondary text' },
    { fg: 'accentText', bg, min: AA_TEXT, use: 'accent ink (small accent text)' },
  ]),
  ...(['surface', 'raised', 'current'] as const).flatMap((bg): Pair[] => [
    { fg: 'listText', bg, min: AA_TEXT, use: 'set list text' },
    { fg: 'times', bg, min: AA_TEXT, use: '"×" separator' },
  ]),
  { fg: 'danger', bg: 'bg', min: AA_TEXT, use: 'destructive text' },
  { fg: 'danger', bg: 'surface', min: AA_TEXT, use: 'destructive text' },
  { fg: 'onDanger', bg: 'danger', min: AA_GRAPHIC, use: 'icon on the swipe-delete action' },
  { fg: 'onAccent', bg: 'accent', min: AA_TEXT, use: 'text on accent buttons and the PLUS ULTRA banner' },
  ...(['bg', 'surface', 'raised'] as const).map((bg): Pair => ({ fg: 'accent', bg, min: AA_GRAPHIC, use: 'accent fills, outlines, icons, large accent text' })),
  { fg: 'figurePrimary', bg: 'figureBody', min: AA_GRAPHIC, use: 'primary muscle highlight' },
  { fg: 'onTick', bg: 'tick', min: AA_GRAPHIC, use: 'check on the completed tick' },
  { fg: 'focus', bg: 'bg', min: AA_GRAPHIC, use: 'focus ring' },
  { fg: 'focus', bg: 'surface', min: AA_GRAPHIC, use: 'focus ring' },
];

export function failures(c: Colors) {
  return PAIRS.map((p) => ({ pair: `${p.fg} on ${p.bg}`, colors: `${c[p.fg]} on ${c[p.bg]}`, ratio: +contrastRatio(c[p.fg], c[p.bg]).toFixed(2), min: p.min })).filter((r) => r.ratio < r.min);
}

describe.each(COLOR_SCHEMES)('%s', (scheme) => {
  it('meets WCAG AA for every text/background and graphic pair', () => {
    expect(failures(themes[scheme])).toEqual([]);
  });
});

it('prints the ratios table (for the design report)', () => {
  const rows = PAIRS.filter((p, i, all) => all.findIndex((q) => q.fg === p.fg && q.bg === p.bg) === i);
  const head = ['pair'.padEnd(26), ...COLOR_SCHEMES.map((s) => s.padStart(12))].join('');
  const lines = rows.map((p) => [`${p.fg} / ${p.bg}`.padEnd(26), ...COLOR_SCHEMES.map((s) => contrastRatio(themes[s][p.fg], themes[s][p.bg]).toFixed(2).padStart(12))].join(''));
  const derived = ['accent', 'accentText', 'onAccent', 'listText', 'times', 'figureSecondary'] as const;
  const tokens = derived.map((k) => [k.padEnd(26), ...COLOR_SCHEMES.map((s) => themes[s][k].padStart(12))].join(''));
  console.log(['Contrast ratios (min: 4.5 text, 3 graphics)', head, ...lines, '', 'Derived tokens', head.replace('pair', 'token'), ...tokens].join('\n'));
  expect(lines.length).toBeGreaterThan(0);
});
