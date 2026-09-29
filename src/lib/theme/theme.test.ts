import { accentGraphic, accentInk, contrastRatio, ensureContrast, mix, onAccent } from '.';

const BG = '#0E0E10';
const SURFACE = '#17171A';

describe('ensureContrast', () => {
  it('keeps a colour that already passes', () => {
    expect(ensureContrast('#39ff14', [BG, SURFACE], 4.5)).toBe('#39FF14');
  });

  it('lightens just enough: one step less would fail', () => {
    const ink = accentInk('#6A2FA0', [BG, SURFACE]);
    expect(Math.min(contrastRatio(ink, BG), contrastRatio(ink, SURFACE))).toBeGreaterThanOrEqual(4.5);
    const step = Array.from({ length: 100 }, (_, i) => (i + 1) / 100).find((a) => mix('#6A2FA0', '#FFFFFF', a) === ink)!;
    expect(step).toBeGreaterThan(0);
    const less = mix('#6A2FA0', '#FFFFFF', step - 0.01);
    expect(Math.min(contrastRatio(less, BG), contrastRatio(less, SURFACE))).toBeLessThan(4.5);
  });

  it('can darken, and throws when the target is impossible', () => {
    const dark = ensureContrast('#FF6B5A', ['#FFFFFF'], 4.5, 'darker');
    expect(contrastRatio(dark, '#FFFFFF')).toBeGreaterThanOrEqual(4.5);
    expect(() => ensureContrast('#777777', ['#777777'], 22)).toThrow("can't reach");
  });
});

describe('accent derivations', () => {
  it('accent ink reaches 4.5:1 and graphics 3:1, lightening dark blues', () => {
    const blue = '#0000FF'; // the darkest custom colour
    const ink = accentInk(blue, [BG, SURFACE]);
    const graphic = accentGraphic(blue, [BG, SURFACE]);
    expect(contrastRatio(ink, BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(graphic, BG)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(graphic, BG)).toBeLessThan(contrastRatio(ink, BG));
  });

  it('onAccent: near-black on bright accents, white on deep ones', () => {
    expect(onAccent('#39FF14')).toBe('#0E0E10');
    expect(onAccent('#E4FF1A')).toBe('#0E0E10');
    expect(onAccent('#FFFFFF')).toBe('#0E0E10');
    expect(onAccent('#FF6B5A')).toBe('#0E0E10');
    expect(onAccent('#0000FF')).toBe('#FFFFFF');
  });
});
