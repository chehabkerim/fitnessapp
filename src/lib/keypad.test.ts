import { adjustText, applyKey, chipsFor } from './keypad';

describe('keypad', () => {
  it('replaces the value on the first key, then appends', () => {
    expect(applyKey('22.5', '2', true, true)).toBe('2');
    expect(applyKey('2', '5', false, true)).toBe('25');
    expect(applyKey('25', 'back', false, true)).toBe('2');
    expect(applyKey('25', 'back', true, true)).toBe('');
  });

  it('handles decimals and limits', () => {
    expect(applyKey('', '.', false, true)).toBe('0.');
    expect(applyKey('22', '.', false, true)).toBe('22.');
    expect(applyKey('22.5', '.', false, true)).toBe('22.5');
    expect(applyKey('8', '.', false, false)).toBe('8'); // reps have no decimal
    expect(applyKey('22.25', '5', false, true)).toBe('22.25'); // two decimals max
    expect(applyKey('0', '7', false, true)).toBe('7');
    expect(applyKey('9999', '9', false, false)).toBe('9999');
  });

  it('adjusts with chips, never below zero', () => {
    expect(adjustText('22.5', 2.5)).toBe('25');
    expect(adjustText('1', -2.5)).toBe('0');
    expect(adjustText('', 1)).toBe('1');
    expect(adjustText('0.1', 0.2)).toBe('0.3');
  });

  it('uses unit-appropriate chips', () => {
    expect(chipsFor('weight', 'metric')).toEqual([-5, -2.5, 2.5, 5]);
    expect(chipsFor('weight', 'imperial')).toEqual([-10, -5, 5, 10]);
    expect(chipsFor('reps', 'metric')).toEqual([-1, 1]);
  });
});
