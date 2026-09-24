import { usesWeight, type ExerciseKind, type SetValues } from './domain';

/** Loaded weight for volume: per-dumbbell entries count both dumbbells. */
export function loadKg(weightKg: number | null, ex: ExerciseKind): number {
  return (weightKg ?? 0) * (ex.loadMode === 'per_dumbbell' ? 2 : 1);
}

/** Volume of one set (kg × reps). Warm-ups, incomplete sets and non-weighted kinds count 0. */
export function setVolume(set: SetValues, ex: ExerciseKind): number {
  if (set.isWarmup || set.completedAt == null || !usesWeight(ex.logType)) return 0;
  return loadKg(set.weightKg, ex) * (set.reps ?? 0);
}

export function exerciseVolume(sets: SetValues[], ex: ExerciseKind): number {
  return sets.reduce((sum, s) => sum + setVolume(s, ex), 0);
}

export function workoutVolume(entries: { exercise: ExerciseKind; sets: SetValues[] }[]): number {
  return entries.reduce((sum, e) => sum + exerciseVolume(e.sets, e.exercise), 0);
}

export const isWorkingSet = (s: SetValues) => !s.isWarmup && s.completedAt != null;
