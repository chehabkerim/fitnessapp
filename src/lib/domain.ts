// Domain vocabulary shared by the database schema, business logic and UI.

export const MUSCLES = [
  // accurate, highlightable regions used by the seeded library
  'upper_chest', 'chest', 'front_delts', 'side_delts', 'rear_delts', 'traps', 'upper_back', 'lats', 'biceps', 'triceps', 'forearms',
  // valid for custom exercises; drawn as body shape only for now
  'abs', 'obliques', 'lower_back', 'glutes', 'quads', 'hamstrings', 'calves',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const EQUIPMENT = ['dumbbell', 'machine', 'cable', 'ez_bar', 'bodyweight', 'barbell', 'kettlebell', 'other'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const LOG_TYPES = ['weight_reps', 'reps', 'bodyweight_added', 'duration'] as const;
export type LogType = (typeof LOG_TYPES)[number];

export const LOAD_MODES = ['total', 'per_dumbbell'] as const;
export type LoadMode = (typeof LOAD_MODES)[number];

export type Units = 'metric' | 'imperial';
export type ThemePref = 'system' | 'light' | 'dark';

export const MUSCLE_LABELS: Record<Muscle, string> = {
  upper_chest: 'Upper chest', chest: 'Chest', front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts',
  traps: 'Traps', upper_back: 'Upper back', lats: 'Lats', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms',
  abs: 'Abs', obliques: 'Obliques', lower_back: 'Lower back', glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  dumbbell: 'Dumbbell', machine: 'Machine', cable: 'Cable', ez_bar: 'EZ bar', bodyweight: 'Bodyweight', barbell: 'Barbell', kettlebell: 'Kettlebell', other: 'Other',
};

export const LOG_TYPE_LABELS: Record<LogType, string> = {
  weight_reps: 'Weight × reps', reps: 'Reps only', bodyweight_added: 'Bodyweight + added weight', duration: 'Duration',
};

/** Minimal shape of an exercise the logic needs. */
export interface ExerciseKind {
  logType: LogType;
  loadMode: LoadMode;
}

/** Minimal shape of a set the logic needs. Weights are always kg. */
export interface SetValues {
  id?: number;
  weightKg: number | null;
  reps: number | null;
  durationSec: number | null;
  isWarmup: boolean;
  completedAt: number | null;
}

export const usesWeight = (t: LogType) => t === 'weight_reps' || t === 'bodyweight_added';
export const usesReps = (t: LogType) => t !== 'duration';
