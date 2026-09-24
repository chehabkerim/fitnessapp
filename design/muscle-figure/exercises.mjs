// The 12 seeded exercises (visual fields only) — mirrors /src/db/seed once implemented.
export const EXERCISES = [
  { name: 'Incline Dumbbell Bench Press', equipment: 'dumbbell', primary: ['upper_chest'], secondary: ['front_delts', 'triceps'] },
  { name: 'Flat Chest Press', equipment: 'machine', primary: ['chest'], secondary: ['front_delts', 'triceps'] },
  { name: 'Lat Pulldown', equipment: 'cable', primary: ['lats'], secondary: ['biceps', 'rear_delts'] },
  { name: 'Close Grip Row', equipment: 'cable', primary: ['lats', 'upper_back'], secondary: ['biceps', 'rear_delts'] },
  { name: 'Upper Back Row', equipment: 'cable', primary: ['upper_back', 'rear_delts'], secondary: ['biceps'] },
  { name: 'Tricep Pushdown', equipment: 'cable', primary: ['triceps'], secondary: [] },
  { name: 'Weighted Dips', equipment: 'bodyweight', primary: ['triceps'], secondary: ['chest', 'front_delts'] },
  { name: 'Lateral Raise', equipment: 'dumbbell', primary: ['side_delts'], secondary: ['traps'] },
  { name: 'Shoulder Press', equipment: 'dumbbell', primary: ['front_delts'], secondary: ['side_delts', 'triceps'] },
  { name: 'Hammer Curl', equipment: 'dumbbell', primary: ['biceps'], secondary: ['forearms'] },
  { name: 'Preacher Curl', equipment: 'ez_bar', primary: ['biceps'], secondary: [] },
  { name: 'Bicep Curl', equipment: 'dumbbell', primary: ['biceps'], secondary: ['forearms'] },
];
export const MUSCLE_LABEL = { upper_chest: 'Upper chest', chest: 'Chest', front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts', traps: 'Traps', upper_back: 'Upper back', lats: 'Lats', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms' };
