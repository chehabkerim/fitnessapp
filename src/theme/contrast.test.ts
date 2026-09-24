import { contrastRatio } from '../lib/contrast';
import { palettes } from './tokens';

// WCAG AA: 4.5:1 for normal text, 3:1 for large text (≥ 24px, or ≥ 18.66px bold) and for graphics.
type Pair = [fg: keyof (typeof palettes)['dark'], bg: keyof (typeof palettes)['dark'], min: number, use: string];

const PAIRS: Pair[] = [
  ...(['bg', 'surface', 'raised', 'current'] as const).flatMap((bg): Pair[] => [
    ['ink', bg, 4.5, 'text'],
    ['muted', bg, 4.5, 'secondary text'],
    ['accentText', bg, 4.5, 'small green labels'],
  ]),
  ...(['surface', 'raised', 'current'] as const).flatMap((bg): Pair[] => [
    ['listText', bg, 4.5, 'set list text'],
    ['times', bg, 4.5, '"×" separator'],
  ]),
  ['onPurple', 'purple', 4.5, 'text on purple buttons and the banner'],
  ['onTick', 'tick', 3, 'tick on completed-set circle (graphic)'],
  ['danger', 'surface', 4.5, 'destructive text'],
  ['danger', 'bg', 4.5, 'destructive text'],
  ['accent', 'bg', 3, 'accent outlines and progress (graphic)'],
  ['accent', 'surface', 3, 'accent outlines (graphic)'],
];

describe.each(['dark', 'light'] as const)('%s theme contrast', (theme) => {
  const p = palettes[theme];
  const rows = PAIRS.map(([fg, bg, min, use]) => ({ pair: `${fg} on ${bg}`, ratio: contrastRatio(p[fg], p[bg]), min, use }));

  it('meets WCAG AA for every text/background pair', () => {
    // Printed for the design report.
    console.log(`${theme}\n` + rows.map((r) => `  ${r.pair.padEnd(24)} ${r.ratio.toFixed(2)}:1  (min ${r.min}) ${r.use}`).join('\n'));
    for (const r of rows) expect({ pair: r.pair, ok: r.ratio >= r.min }).toEqual({ pair: r.pair, ok: true });
  });
});
