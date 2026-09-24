import { displayWeight, formatWeight, fromKg, parseDecimal, parseInteger, roundForDisplay, stepWeight, toKg, KG_PER_LB } from './units';

describe('units', () => {
  it('converts lb ↔ kg at full precision', () => {
    expect(toKg(135, 'imperial')).toBeCloseTo(61.2349, 3);
    expect(fromKg(toKg(135, 'imperial'), 'imperial')).toBeCloseTo(135, 9);
    expect(toKg(60, 'metric')).toBe(60);
  });

  it('rounds kg to 0.25 and lb to 0.5 for display', () => {
    expect(roundForDisplay(22.6, 'metric')).toBe(22.5);
    expect(roundForDisplay(22.7, 'metric')).toBe(22.75);
    expect(roundForDisplay(134.8, 'imperial')).toBe(135);
    expect(roundForDisplay(134.7, 'imperial')).toBe(134.5);
  });

  it('shows stored kg in the chosen units', () => {
    expect(displayWeight(toKg(135, 'imperial'), 'imperial')).toBe('135');
    expect(displayWeight(22.5, 'metric')).toBe('22.5');
    expect(displayWeight(null, 'metric')).toBe('');
    expect(formatWeight(22.5, 'metric', { each: true })).toBe('22.5 kg each');
    expect(formatWeight(10, 'metric', { added: true })).toBe('+10 kg');
    expect(formatWeight(20 * KG_PER_LB, 'imperial')).toBe('20 lb');
  });

  it('steps by 2.5 kg / 5 lb, snapping to the grid and never below zero', () => {
    expect(stepWeight(20, 1, 'metric')).toBe(22.5);
    expect(stepWeight(21, 1, 'metric')).toBe(22.5);
    expect(stepWeight(21, -1, 'metric')).toBe(20);
    expect(stepWeight(1, -1, 'metric')).toBe(0);
    expect(stepWeight(null, 1, 'metric')).toBe(2.5);
    expect(fromKg(stepWeight(toKg(135, 'imperial'), 1, 'imperial'), 'imperial')).toBeCloseTo(140, 9);
  });

  it('parses numbers, including a comma decimal', () => {
    expect(parseDecimal('22,5')).toBe(22.5);
    expect(parseDecimal(' ')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('-3')).toBeNull();
    expect(parseInteger('8.6')).toBe(9);
  });
});
