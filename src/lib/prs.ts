import { type ExerciseKind, type SetValues } from './domain';
import { estimateOneRepMax } from './e1rm';
import { isWorkingSet, setVolume } from './volume';

export type PrMetric = 'heaviest' | 'e1rm' | 'reps' | 'volume' | 'duration';

export const PR_LABELS: Record<PrMetric, string> = {
  heaviest: 'Heaviest weight',
  e1rm: 'Best estimated 1RM',
  reps: 'Most reps',
  volume: 'Best single-set volume',
  duration: 'Longest hold',
};

/** Which records apply to an exercise kind. Weighted dips (bodyweight + added) get no 1RM. */
export function metricsFor(ex: ExerciseKind): PrMetric[] {
  switch (ex.logType) {
    case 'weight_reps':
      return ['heaviest', 'e1rm', 'reps', 'volume'];
    case 'bodyweight_added':
      return ['heaviest', 'reps', 'volume'];
    case 'reps':
      return ['reps'];
    case 'duration':
      return ['duration'];
  }
}

/** Value of one metric for one set (weights as entered, i.e. per dumbbell where relevant; volume counts both). */
export function metricValue(metric: PrMetric, set: SetValues, ex: ExerciseKind): number | null {
  switch (metric) {
    case 'heaviest':
      return set.weightKg != null && set.weightKg > 0 && (set.reps ?? 0) > 0 ? set.weightKg : null;
    case 'e1rm':
      return estimateOneRepMax(set.weightKg, set.reps);
    case 'reps':
      return set.reps != null && set.reps > 0 ? set.reps : null;
    case 'volume': {
      const v = setVolume(set, ex);
      return v > 0 ? v : null;
    }
    case 'duration':
      return set.durationSec != null && set.durationSec > 0 ? set.durationSec : null;
  }
}

export type Bests = Partial<Record<PrMetric, number>>;

/** Best value per metric across working sets (completed, not warm-up). */
export function bestsOf(sets: SetValues[], ex: ExerciseKind): Bests {
  const out: Bests = {};
  for (const s of sets) {
    if (!isWorkingSet(s)) continue;
    for (const m of metricsFor(ex)) {
      const v = metricValue(m, s, ex);
      if (v != null && (out[m] == null || v > out[m]!)) out[m] = v;
    }
  }
  return out;
}

export const hasHistory = (b: Bests) => Object.keys(b).length > 0;

const EPS = 1e-9;

/**
 * Live "Plus Ultra" flags: walks the working sets in order and flags a set when it beats the best so far
 * (history, then earlier sets in this workout). The first session of an exercise sets the baseline and flags nothing.
 */
export function prFlags(sets: SetValues[], history: Bests, ex: ExerciseKind): Map<number, PrMetric[]> {
  const flags = new Map<number, PrMetric[]>();
  if (!hasHistory(history)) return flags;
  const running: Bests = { ...history };
  for (const s of sets) {
    if (!isWorkingSet(s) || s.id == null) continue;
    const broken: PrMetric[] = [];
    for (const m of metricsFor(ex)) {
      const v = metricValue(m, s, ex);
      if (v == null) continue;
      if (running[m] == null || v > running[m]! + EPS) {
        if (history[m] != null) broken.push(m);
        running[m] = v;
      }
    }
    if (broken.length) flags.set(s.id, broken);
  }
  return flags;
}

export interface PrRecord {
  metric: PrMetric;
  value: number;
  previous: number;
}

/** Records a finished workout broke for one exercise (empty on the first session). */
export function detectPRs(workoutSets: SetValues[], history: Bests, ex: ExerciseKind): PrRecord[] {
  if (!hasHistory(history)) return [];
  const now = bestsOf(workoutSets, ex);
  const out: PrRecord[] = [];
  for (const m of metricsFor(ex)) {
    const v = now[m];
    const prev = history[m];
    if (v != null && prev != null && v > prev + EPS) out.push({ metric: m, value: v, previous: prev });
  }
  return out;
}
