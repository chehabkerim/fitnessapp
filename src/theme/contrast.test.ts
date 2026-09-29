import { COLOR_SCHEMES } from '../lib/domain';
import { AA_GRAPHIC, AA_TEXT, contrastRatio } from '../lib/theme';
import { themes, type ColorKey } from './tokens';

// WCAG AA for every colour scheme × mode: 4.5:1 for small text, 3:1 for large text (≥ 24px, or
// ≥ 18.66px bold) and for UI graphics. Any failure fails the build.
// Not checked, on purpose: `accentFill` as the rest progress bar (the countdown carries the same
// information), and `figureSecondary` (a mid-tone
// between the highlight and the body by design; the muscle names are also listed as text).
type Pair = { fg: ColorKey; bg: ColorKey; min: number; use: string; only?: 'light' | 'dark' };

const SURFACES = ['bg', 'surface', 'raised', 'current'] as const;
const PAIRS: Pair[] = [
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
  { fg: 'onPurple', bg: 'purple', min: AA_TEXT, use: 'text on purple buttons and the banner' },
  { fg: 'onAccentFill', bg: 'accentFill', min: AA_TEXT, use: 'text on accent fills (chips)' },
  ...(['bg', 'surface', 'raised'] as const).map((bg): Pair => ({ fg: 'accent', bg, min: AA_GRAPHIC, use: 'accent outlines, icons, large accent text' })),
  { fg: 'figurePrimary', bg: 'figureBody', min: AA_GRAPHIC, use: 'primary muscle highlight' },
  { fg: 'onTick', bg: 'tick', min: AA_GRAPHIC, use: 'check on the completed tick' },
  { fg: 'tick', bg: 'surface', min: AA_GRAPHIC, use: 'completed tick circle' },
  { fg: 'focus', bg: 'bg', min: AA_GRAPHIC, use: 'focus ring' },
  { fg: 'focus', bg: 'surface', min: AA_GRAPHIC, use: 'focus ring' },
  { fg: 'cardBorder', bg: 'bg', min: AA_GRAPHIC, use: '2px accent card outline', only: 'light' },
];

const COMBOS = COLOR_SCHEMES.flatMap((scheme) => (['dark', 'light'] as const).map((mode) => ({ scheme, mode })));

describe.each(COMBOS)('$scheme $mode', ({ scheme, mode }) => {
  it('meets WCAG AA for every text/background and graphic pair', () => {
    const c = themes[scheme][mode];
    const failures = PAIRS.filter((p) => !p.only || p.only === mode)
      .map((p) => ({ pair: `${p.fg} on ${p.bg}`, colors: `${c[p.fg]} on ${c[p.bg]}`, ratio: +contrastRatio(c[p.fg], c[p.bg]).toFixed(2), min: p.min }))
      .filter((r) => r.ratio < r.min);
    expect(failures).toEqual([]);
  });
});

it('prints the ratios table (for the design report)', () => {
  const rows = PAIRS.filter((p, i, all) => all.findIndex((q) => q.fg === p.fg && q.bg === p.bg) === i);
  const head = ['pair'.padEnd(26), ...COMBOS.map(({ scheme, mode }) => `${scheme.slice(0, 5)}-${mode[0]}`.padStart(8))].join('');
  const lines = rows.map((p) =>
    [
      `${p.fg} / ${p.bg}`.padEnd(26),
      ...COMBOS.map(({ scheme, mode }) => (p.only && p.only !== mode ? '–' : contrastRatio(themes[scheme][mode][p.fg], themes[scheme][mode][p.bg]).toFixed(2)).padStart(8)),
    ].join(''),
  );
  const derived = ['accent', 'accentText', 'accentFill', 'onAccentFill', 'times', 'tick', 'figurePrimary', 'figureSecondary'] as const;
  const tokens = derived.map((k) => [k.padEnd(26), ...COMBOS.map(({ scheme, mode }) => themes[scheme][mode][k].padStart(8))].join(''));
  console.log(['Contrast ratios (min: 4.5 text, 3 graphics)', head, ...lines, '', 'Derived tokens', head.replace('pair', 'token'), ...tokens].join('\n'));
  expect(lines.length).toBeGreaterThan(0);
});
