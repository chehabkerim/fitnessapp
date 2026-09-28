import { deepEqual } from './deepEqual';

describe('deepEqual', () => {
  it('compares primitives, including NaN and null', () => {
    expect(deepEqual(1, 1)).toBe(true);
    expect(deepEqual('a', 'b')).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(null, undefined)).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });

  it('compares nested query-shaped rows', () => {
    const row = () => ({ id: 1, name: 'Incline', sets: [{ weightKg: 22.5, reps: 10, completedAt: null }], cues: ['a', 'b'] });
    expect(deepEqual(row(), row())).toBe(true);
    expect(deepEqual(row(), { ...row(), sets: [{ weightKg: 25, reps: 10, completedAt: null }] })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false);
    expect(deepEqual([1], { 0: 1, length: 1 })).toBe(false);
  });

  it('compares Dates, Maps and Sets', () => {
    expect(deepEqual(new Date(5), new Date(5))).toBe(true);
    expect(deepEqual(new Date(5), new Date(6))).toBe(false);
    expect(deepEqual(new Map([[1, { a: 1 }]]), new Map([[1, { a: 1 }]]))).toBe(true);
    expect(deepEqual(new Map([[1, 1]]), new Map([[2, 1]]))).toBe(false);
    expect(deepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(deepEqual(new Set([1]), new Set([2]))).toBe(false);
  });
});
