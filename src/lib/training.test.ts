import type { ExerciseKind, SetValues } from './domain';
import { estimateOneRepMax } from './e1rm';
import { prefillAt, prefillForNewSet, previousFor } from './previous';
import { bestsOf, detectPRs, metricsFor, prFlags } from './prs';
import { adjustRest, isRestOver, remainingMs, resolveRestSec, startRest } from './rest';
import { setVolume, workoutVolume } from './volume';

const set = (id: number, weightKg: number | null, reps: number | null, extra: Partial<SetValues> = {}): SetValues => ({
  id, weightKg, reps, durationSec: null, isWarmup: false, completedAt: 1, ...extra,
});
const barbellLike: ExerciseKind = { logType: 'weight_reps', loadMode: 'total' };
const dumbbell: ExerciseKind = { logType: 'weight_reps', loadMode: 'per_dumbbell' };
const dips: ExerciseKind = { logType: 'bodyweight_added', loadMode: 'total' };

describe('volume', () => {
  it('counts completed working sets only', () => {
    expect(setVolume(set(1, 60, 8), barbellLike)).toBe(480);
    expect(setVolume(set(1, 60, 8, { isWarmup: true }), barbellLike)).toBe(0);
    expect(setVolume(set(1, 60, 8, { completedAt: null }), barbellLike)).toBe(0);
  });

  it('counts both dumbbells for per-dumbbell loads', () => {
    expect(setVolume(set(1, 22.5, 10), dumbbell)).toBe(450);
  });

  it('uses only the added weight for weighted dips, and zero when none is added', () => {
    expect(setVolume(set(1, 10, 8), dips)).toBe(80);
    expect(setVolume(set(1, null, 12), dips)).toBe(0);
  });

  it('sums a workout', () => {
    expect(workoutVolume([{ exercise: barbellLike, sets: [set(1, 60, 8), set(2, 60, 8)] }, { exercise: dumbbell, sets: [set(3, 20, 10)] }])).toBe(1360);
  });
});

describe('estimated 1RM', () => {
  it('uses Epley and returns null above 12 reps', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
    expect(estimateOneRepMax(100, 10)).toBeCloseTo(133.33, 2);
    expect(estimateOneRepMax(100, 12)).toBeCloseTo(140, 9);
    expect(estimateOneRepMax(100, 13)).toBeNull();
    expect(estimateOneRepMax(0, 5)).toBeNull();
    expect(estimateOneRepMax(null, 5)).toBeNull();
  });
});

describe('personal records', () => {
  it('picks metrics by exercise kind', () => {
    expect(metricsFor(barbellLike)).toEqual(['heaviest', 'e1rm', 'reps', 'volume']);
    expect(metricsFor(dips)).toEqual(['heaviest', 'reps', 'volume']);
    expect(metricsFor({ logType: 'duration', loadMode: 'total' })).toEqual(['duration']);
  });

  it('ignores warm-ups and incomplete sets in bests', () => {
    const b = bestsOf([set(1, 100, 1, { isWarmup: true }), set(2, 80, 5), set(3, 90, 5, { completedAt: null })], barbellLike);
    expect(b.heaviest).toBe(80);
    expect(b.reps).toBe(5);
  });

  it('reports records a finished workout broke, and nothing on the first session', () => {
    const history = bestsOf([set(1, 60, 8), set(2, 60, 7)], barbellLike);
    const prs = detectPRs([set(3, 62.5, 8), set(4, 60, 6)], history, barbellLike);
    expect(prs.map((p) => p.metric)).toEqual(['heaviest', 'e1rm', 'volume']);
    expect(prs[0]).toEqual({ metric: 'heaviest', value: 62.5, previous: 60 });
    expect(detectPRs([set(3, 62.5, 8)], {}, barbellLike)).toEqual([]);
  });

  it('flags the set that breaks a record live, but not a repeat of it', () => {
    const history = bestsOf([set(1, 22.5, 10)], dumbbell);
    const flags = prFlags([set(10, 22.5, 10), set(11, 25, 8), set(12, 25, 8)], history, dumbbell);
    expect(flags.has(10)).toBe(false);
    expect(flags.get(11)).toEqual(expect.arrayContaining(['heaviest']));
    expect(flags.has(12)).toBe(false);
  });

  it('counts per-dumbbell volume ×2 but keeps the heaviest weight as entered', () => {
    const b = bestsOf([set(1, 22.5, 10)], dumbbell);
    expect(b.heaviest).toBe(22.5);
    expect(b.volume).toBe(450);
  });
});

describe('previous and prefill', () => {
  const last = [set(1, 60, 8), set(2, 60, 7), set(3, 57.5, 8)];
  it('matches by set position', () => {
    expect(previousFor(last, 1)?.reps).toBe(7);
    expect(previousFor(last, 5)).toBeUndefined();
  });

  it('prefills from the previous set in this workout, else from last session', () => {
    expect(prefillForNewSet([set(9, 65, 5)], last)).toEqual({ weightKg: 65, reps: 5, durationSec: null });
    expect(prefillForNewSet([], last)).toEqual({ weightKg: 60, reps: 8, durationSec: null });
    expect(prefillForNewSet([], [])).toEqual({ weightKg: null, reps: null, durationSec: null });
    expect(prefillAt(last, 4)).toEqual({ weightKg: 57.5, reps: 8, durationSec: null });
  });
});

describe('rest timer', () => {
  it('resolves rest time by priority', () => {
    expect(resolveRestSec(45, 120, 90)).toBe(45);
    expect(resolveRestSec(null, 120, 90)).toBe(120);
    expect(resolveRestSec(null, null, 90)).toBe(90);
  });

  it('is timestamp-based and adjustable', () => {
    const s = startRest(1_000, 90);
    expect(remainingMs(s, 31_000)).toBe(60_000);
    const plus = adjustRest(s, 15, 31_000);
    expect(remainingMs(plus, 31_000)).toBe(75_000);
    const minus = adjustRest(s, -120, 31_000);
    expect(remainingMs(minus, 31_000)).toBe(0);
    expect(isRestOver(minus, 31_000)).toBe(true);
    expect(isRestOver(null, 31_000)).toBe(false);
  });
});
