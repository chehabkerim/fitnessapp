import { accentGraphic, accentInk, contrastRatio, ensureContrast, mix, readableOn } from '.';

const LIGHT = ['#F3F4F1', '#FFFFFF', '#E9ECE7'];
const DARK = ['#0E0E10', '#17171A', '#222226'];

describe('ensureContrast', () => {
  it('keeps a colour that already passes', () => {
    expect(ensureContrast('#39ff14', DARK, 4.5, 'lighter')).toBe('#39FF14');
  });

  it('darkens just enough to pass against every background', () => {
    const ink = ensureContrast('#FF6B5A', LIGHT, 4.5, 'darker');
    for (const bg of LIGHT) expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
    // one step less would fail somewhere: the result is the smallest adjustment
    const step = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => i / 100).find((a) => mix('#FF6B5A', '#000000', a) === ink);
    if (step !== undefined) {
      const lighter = mix('#FF6B5A', '#000000', step - 0.01);
      expect(LIGHT.some((bg) => contrastRatio(lighter, bg) < 4.5)).toBe(true);
    }
  });

  it('lightens in dark mode', () => {
    const ink = ensureContrast('#6A2FA0', DARK, 4.5, 'lighter');
    for (const bg of DARK) expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('throws when the target is impossible', () => {
    expect(() => ensureContrast('#777777', ['#777777'], 22, 'darker')).toThrow("can't reach");
  });
});

describe('accent ink and graphics', () => {
  it('derives text and graphic variants for light accents', () => {
    const ink = accentInk('#00B8D4', LIGHT, 'light');
    const graphic = accentGraphic('#00B8D4', LIGHT, 'light');
    for (const bg of LIGHT) {
      expect(contrastRatio(ink, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(graphic, bg)).toBeGreaterThanOrEqual(3);
    }
    // graphics need less than text, so they stay closer to the original colour
    expect(contrastRatio(graphic, '#FFFFFF')).toBeLessThan(contrastRatio(ink, '#FFFFFF'));
  });

  it('picks near-black text on volt and white on purple', () => {
    expect(readableOn('#E4FF1A')).toBe('#0E0E10');
    expect(readableOn('#8E48C0')).toBe('#FFFFFF');
  });
});
