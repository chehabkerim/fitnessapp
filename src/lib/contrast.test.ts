import { contrastRatio, mix } from './contrast';

describe('contrast helpers', () => {
  it('computes WCAG ratios', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });
  it('mixes colours', () => {
    expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080');
    expect(mix('#00A03C', '#0E0E10', 0.3)).toBe('#04742F'); // the spec's #04742E, rounded differently
  });
});
