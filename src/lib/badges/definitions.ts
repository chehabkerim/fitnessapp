// Badge definitions. Badges reward consistency and effort and never punish rest (no daily streaks).
// Names are original; "Plus Ultra" appears only in the PR category.
import type { BadgeStats } from './stats';

export type BadgeTier = 1 | 2 | 3 | 4;
export type BadgeCategory = 'milestones' | 'consistency' | 'plus_ultra' | 'volume' | 'habits';
/** Emblem icons. Full Rotation (loop) and Comeback (return) use the outline set; the rest are filled. */
export type BadgeIcon = 'dumbbell' | 'flame' | 'bolt' | 'kettlebell' | 'sun' | 'moon' | 'return' | 'check' | 'loop';
/** What the numbers count, for progress text ("37 / 50 workouts"). `once` = a one-off achievement. */
export type BadgeUnit = 'workouts' | 'weeks' | 'records' | 'kg' | 'once';

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: BadgeIcon;
  /** The number bar on the emblem ("10", "2W", "10T", "ALL"). */
  bar: string;
  tier: BadgeTier;
  target: number;
  unit: BadgeUnit;
  /** Progress toward the target, for bars and "N more to…". */
  progress: (s: BadgeStats) => number;
  /** Earned when true; defaults to progress ≥ target. */
  earned?: (s: BadgeStats) => boolean;
}

export const TIERS: Record<BadgeTier, { name: string; numeral: string }> = {
  1: { name: 'Bronze', numeral: 'I' },
  2: { name: 'Silver', numeral: 'II' },
  3: { name: 'Gold', numeral: 'III' },
  4: { name: 'Diamond', numeral: 'IV' },
};

export const CATEGORIES: { id: BadgeCategory; name: string }[] = [
  { id: 'milestones', name: 'Milestones' },
  { id: 'consistency', name: 'Consistency' },
  { id: 'plus_ultra', name: 'Plus Ultra' },
  { id: 'volume', name: 'Volume' },
  { id: 'habits', name: 'Habits' },
];

const milestone = (id: string, name: string, target: number, tier: BadgeTier): BadgeDef => ({
  id,
  name,
  description: target === 1 ? 'Finish your first workout.' : `Finish ${target} workouts.`,
  category: 'milestones',
  icon: 'dumbbell',
  bar: String(target),
  tier,
  target,
  unit: 'workouts',
  progress: (s) => s.workouts,
});

// Consecutive Monday-start weeks with 2+ finished workouts. The current week counts once it reaches 2.
// Earned from the best run ever; progress shows the run you can still extend.
const consistency = (id: string, name: string, weeks: number, tier: BadgeTier): BadgeDef => ({
  id,
  name,
  description: `Train at least twice a week for ${weeks} weeks in a row.`,
  category: 'consistency',
  icon: 'flame',
  bar: `${weeks}W`,
  tier,
  target: weeks,
  unit: 'weeks',
  progress: (s) => s.currentWeekRun,
  earned: (s) => s.bestWeekRun >= weeks,
});

const volume = (id: string, tonnes: number, tier: BadgeTier, about: string): BadgeDef => ({
  id,
  name: `${tonnes.toLocaleString('en-GB')} Tonnes`,
  description: `Lift ${tonnes.toLocaleString('en-GB')} tonnes in total. ${about}`,
  category: 'volume',
  icon: 'kettlebell',
  bar: `${tonnes}T`,
  tier,
  target: tonnes * 1000,
  unit: 'kg',
  progress: (s) => s.volumeKg,
});

const once = (value: boolean) => (value ? 1 : 0);

export const BADGES: BadgeDef[] = [
  milestone('first_rep', 'First Rep', 1, 1),
  milestone('ten_down', 'Ten Down', 10, 1),
  milestone('quarter_century', 'Quarter Century', 25, 2),
  milestone('half_hundred', 'Half Hundred', 50, 2),
  milestone('centurion', 'Centurion', 100, 3),
  milestone('iron_regular', 'Iron Regular', 250, 4),

  consistency('two_week_run', 'Two-Week Run', 2, 1),
  consistency('month_strong', 'Month Strong', 4, 1),
  consistency('eight_week_engine', 'Eight-Week Engine', 8, 2),
  consistency('quarter_year', 'Quarter Year', 13, 2),
  consistency('half_year_hero', 'Half-Year Hero', 26, 3),
  consistency('year_of_iron', 'Year of Iron', 52, 4),

  { id: 'plus_ultra', name: 'Plus Ultra', description: 'Set your first personal record.', category: 'plus_ultra', icon: 'bolt', bar: '1', tier: 1, target: 1, unit: 'records', progress: (s) => s.records },
  { id: 'beyond_10', name: 'Beyond ×10', description: 'Set 10 personal records.', category: 'plus_ultra', icon: 'bolt', bar: '10', tier: 2, target: 10, unit: 'records', progress: (s) => s.records },
  { id: 'beyond_50', name: 'Beyond ×50', description: 'Set 50 personal records.', category: 'plus_ultra', icon: 'bolt', bar: '50', tier: 3, target: 50, unit: 'records', progress: (s) => s.records },
  {
    id: 'clean_sweep',
    name: 'Clean Sweep',
    description: 'Set a record on every exercise in one workout (at least 3 exercises).',
    category: 'plus_ultra',
    icon: 'bolt',
    bar: 'ALL',
    tier: 3,
    target: 1,
    unit: 'once',
    progress: (s) => once(s.cleanSweep),
  },

  // Rough real-world comparisons: two African elephants ≈ 10 t; a main battle tank ≈ 45–65 t;
  // a blue whale ≈ 100–150 t; a fully loaded Boeing 747-400 ≈ 400 t.
  volume('tonnes_10', 10, 1, 'About the weight of two elephants.'),
  volume('tonnes_50', 50, 2, 'About the weight of a battle tank.'),
  volume('tonnes_100', 100, 3, 'About the weight of a blue whale.'),
  volume('tonnes_500', 500, 3, 'More than a fully loaded jumbo jet.'),
  volume('tonnes_1000', 1000, 4, 'About the weight of ten blue whales.'),

  { id: 'early_riser', name: 'Early Riser', description: 'Finish 5 workouts before 8:00 in the morning.', category: 'habits', icon: 'sun', bar: '5', tier: 1, target: 5, unit: 'workouts', progress: (s) => s.earlyWorkouts },
  { id: 'night_shift', name: 'Night Shift', description: 'Finish 5 workouts after 21:00.', category: 'habits', icon: 'moon', bar: '5', tier: 1, target: 5, unit: 'workouts', progress: (s) => s.lateWorkouts },
  {
    id: 'comeback',
    name: 'Comeback',
    description: 'Welcome back: finish a workout after two weeks or more away.',
    category: 'habits',
    icon: 'return',
    bar: '14D',
    tier: 1,
    target: 1,
    unit: 'once',
    progress: (s) => once(s.comeback),
  },
  {
    id: 'no_set_left_behind',
    name: 'No Set Left Behind',
    description: 'Finish a template workout with every planned set done.',
    category: 'habits',
    icon: 'check',
    bar: '100%',
    tier: 2,
    target: 1,
    unit: 'once',
    progress: (s) => once(s.noSetLeftBehind),
  },
  {
    id: 'full_rotation',
    name: 'Full Rotation',
    description: 'Do every one of your templates in the same week (you need at least two).',
    category: 'habits',
    icon: 'loop',
    bar: 'ALL',
    tier: 3,
    target: 1,
    unit: 'once',
    progress: (s) => once(s.fullRotation),
  },
];

export const BADGE_BY_ID = new Map(BADGES.map((b) => [b.id, b]));
