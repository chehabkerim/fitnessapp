import type { Equipment, LoadMode, LogType, Muscle } from '../../lib/domain';

export interface SeedExercise {
  slug: string;
  name: string;
  equipment: Equipment;
  logType: LogType;
  loadMode: LoadMode;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  defaultRestSec: number;
  cues: string[];
}

// Hand-authored library. Original cues; no third-party data.
export const SEED_EXERCISES: SeedExercise[] = [
  {
    slug: 'incline_db_bench_press', name: 'Incline Dumbbell Bench Press', equipment: 'dumbbell', logType: 'weight_reps', loadMode: 'per_dumbbell',
    primaryMuscles: ['upper_chest'], secondaryMuscles: ['front_delts', 'triceps'], defaultRestSec: 120,
    cues: [
      'Set the bench to a low incline and sit back with the dumbbells on your thighs.',
      'Pull your shoulder blades back and down, feet flat on the floor.',
      'Lower the dumbbells beside your upper chest, elbows at about 45°.',
      'Press up and slightly in until your arms are straight.',
    ],
  },
  {
    slug: 'flat_chest_press', name: 'Flat Chest Press', equipment: 'machine', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['chest'], secondaryMuscles: ['front_delts', 'triceps'], defaultRestSec: 120,
    cues: [
      'Set the seat so the handles line up with the middle of your chest.',
      'Keep your shoulder blades squeezed together against the pad.',
      "Press forward until your arms are almost straight, without rolling your shoulders forward.",
      'Return slowly until you feel a stretch across your chest.',
    ],
  },
  {
    slug: 'lat_pulldown', name: 'Lat Pulldown', equipment: 'cable', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['lats'], secondaryMuscles: ['biceps', 'rear_delts'], defaultRestSec: 120,
    cues: [
      'Lock your thighs under the pad and grip a little wider than your shoulders.',
      'Lean back slightly and lift your chest toward the bar.',
      'Pull the bar to your upper chest by driving your elbows down.',
      'Let the bar rise slowly until your arms are straight.',
    ],
  },
  {
    slug: 'close_grip_row', name: 'Close Grip Row', equipment: 'cable', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['lats', 'upper_back'], secondaryMuscles: ['biceps', 'rear_delts'], defaultRestSec: 120,
    cues: [
      'Sit tall with a slight bend in your knees and a neutral back.',
      'Pull the handle to your lower ribs, elbows close to your sides.',
      "Squeeze your shoulder blades together; don't lean back to finish.",
      'Reach forward slowly without rounding your lower back.',
    ],
  },
  {
    slug: 'upper_back_row', name: 'Upper Back Row', equipment: 'cable', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['upper_back', 'rear_delts'], secondaryMuscles: ['biceps'], defaultRestSec: 90,
    cues: [
      'Take a wide overhand grip and sit tall with your chest up.',
      'Pull the bar toward your upper chest, elbows out to the sides.',
      'Squeeze between your shoulder blades and pause briefly.',
      'Keep your shoulders down, away from your ears.',
    ],
  },
  {
    slug: 'tricep_pushdown', name: 'Tricep Pushdown', equipment: 'cable', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['triceps'], secondaryMuscles: [], defaultRestSec: 60,
    cues: [
      'Stand close to the cable with your elbows pinned to your sides.',
      'Push the handle down until your arms are fully straight.',
      'Keep your upper arms still; only your forearms move.',
      'Let the handle rise slowly to about chest height.',
    ],
  },
  {
    slug: 'weighted_dips', name: 'Weighted Dips', equipment: 'bodyweight', logType: 'bodyweight_added', loadMode: 'total',
    primaryMuscles: ['triceps'], secondaryMuscles: ['chest', 'front_delts'], defaultRestSec: 120,
    cues: [
      'Start at the top with straight arms and your shoulders down.',
      'Lower until your upper arms are about level with the floor, or as far as feels comfortable.',
      'Stay fairly upright to keep the work in your triceps.',
      'Press back up to straight arms without swinging.',
    ],
  },
  {
    slug: 'lateral_raise', name: 'Lateral Raise', equipment: 'dumbbell', logType: 'weight_reps', loadMode: 'per_dumbbell',
    primaryMuscles: ['side_delts'], secondaryMuscles: ['traps'], defaultRestSec: 60,
    cues: [
      'Stand tall with a slight bend in your elbows.',
      'Raise your arms out to the sides to shoulder height.',
      'Lead with your elbows and keep your shoulders away from your ears.',
      "Lower slowly; don't swing the weights up.",
    ],
  },
  {
    slug: 'shoulder_press', name: 'Shoulder Press', equipment: 'dumbbell', logType: 'weight_reps', loadMode: 'per_dumbbell',
    primaryMuscles: ['front_delts'], secondaryMuscles: ['side_delts', 'triceps'], defaultRestSec: 120,
    cues: [
      'Sit against an upright bench with the dumbbells at shoulder height.',
      'Brace your core and keep your lower back on the pad.',
      'Press overhead until your arms are straight.',
      'Lower slowly back to shoulder height.',
    ],
  },
  {
    slug: 'hammer_curl', name: 'Hammer Curl', equipment: 'dumbbell', logType: 'weight_reps', loadMode: 'per_dumbbell',
    primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], defaultRestSec: 60,
    cues: [
      'Hold the dumbbells at your sides with your palms facing each other.',
      'Curl up with your elbows fixed at your sides.',
      'Keep your wrists straight and palms facing in the whole way.',
      'Lower slowly until your arms are fully straight.',
    ],
  },
  {
    slug: 'preacher_curl', name: 'Preacher Curl', equipment: 'ez_bar', logType: 'weight_reps', loadMode: 'total',
    primaryMuscles: ['biceps'], secondaryMuscles: [], defaultRestSec: 60,
    cues: [
      'Set the pad so your armpits rest snugly over the top edge.',
      'Hold the EZ bar on the angled grips, arms flat on the pad.',
      'Curl up without lifting your elbows off the pad.',
      "Lower slowly until your arms are almost straight; don't drop into the bottom.",
    ],
  },
  {
    slug: 'bicep_curl', name: 'Bicep Curl', equipment: 'dumbbell', logType: 'weight_reps', loadMode: 'per_dumbbell',
    primaryMuscles: ['biceps'], secondaryMuscles: ['forearms'], defaultRestSec: 60,
    cues: [
      'Stand tall with your palms facing forward.',
      'Curl up, keeping your elbows close to your body.',
      'Squeeze at the top without letting your elbows drift forward.',
      "Lower slowly; don't swing your body.",
    ],
  },
];

export const SEED_TEMPLATES: { name: string; slugs: string[] }[] = [
  { name: 'Back & Chest', slugs: ['incline_db_bench_press', 'flat_chest_press', 'lat_pulldown', 'close_grip_row', 'upper_back_row'] },
  { name: 'Arms', slugs: ['tricep_pushdown', 'weighted_dips', 'lateral_raise', 'shoulder_press', 'hammer_curl', 'preacher_curl', 'bicep_curl'] },
];
