// Badge statistics, computed by replaying finished workouts in order. Pure: the repository supplies the data.
import { addDays, daysBetween, weekStart } from '../dates';
import type { ExerciseKind, SetValues } from '../domain';
import { bestsOf, detectPRs, type Bests, type PrMetric } from '../prs';
import { isWorkingSet, workoutVolume } from '../volume';

export interface BadgeWorkoutEntry {
  exerciseId: number;
  exercise: ExerciseKind;
  sets: SetValues[];
  /** Sets the template planned for this exercise when the workout started (null: not from a template). */
  plannedSets: number | null;
}

export interface BadgeWorkout {
  id: number;
  /** Local date the workout started (YYYY-MM-DD). */
  date: string;
  startedAt: number;
  endedAt: number;
  templateId: number | null;
  /** Sets the template planned in total when the workout started (null: not from a template, or unknown). */
  plannedSets: number | null;
  entries: BadgeWorkoutEntry[];
}

export interface BadgeStats {
  workouts: number;
  /** Longest run of consecutive Monday-start weeks with 2+ finished workouts. */
  bestWeekRun: number;
  /** The run you can still extend: ending this week if it already has 2+, else ending last week. */
  currentWeekRun: number;
  /** Personal records: one per exercise per workout that beat its history (first sessions are the baseline). */
  records: number;
  cleanSweep: boolean;
  volumeKg: number;
  earlyWorkouts: number;
  lateWorkouts: number;
  comeback: boolean;
  noSetLeftBehind: boolean;
  fullRotation: boolean;
}

/** The PR metrics that count for badges (holds are left out). */
const BADGE_METRICS: PrMetric[] = ['heaviest', 'e1rm', 'volume', 'reps'];
const EARLY_BEFORE_HOUR = 8;
const LATE_FROM_HOUR = 21;
const COMEBACK_DAYS = 14;

export const emptyStats = (): BadgeStats => ({
  workouts: 0,
  bestWeekRun: 0,
  currentWeekRun: 0,
  records: 0,
  cleanSweep: false,
  volumeKg: 0,
  earlyWorkouts: 0,
  lateWorkouts: 0,
  comeback: false,
  noSetLeftBehind: false,
  fullRotation: false,
});

/** Merge a session's bests into an exercise's running bests. */
function mergeBests(into: Bests, add: Bests) {
  for (const [m, v] of Object.entries(add) as [PrMetric, number][]) if (into[m] == null || v > into[m]!) into[m] = v;
}

/** Weeks (Monday dates) with 2+ workouts, from per-week counts. */
function qualifyingWeeks(weekCounts: Map<string, number>): Set<string> {
  return new Set([...weekCounts].filter(([, n]) => n >= 2).map(([w]) => w));
}

/** Longest run of consecutive qualifying weeks. */
export function bestRun(weeks: Set<string>): number {
  let best = 0;
  for (const w of weeks) {
    if (weeks.has(prevWeek(w))) continue; // not the start of a run
    let n = 0;
    for (let cur = w; weeks.has(cur); cur = nextWeek(cur)) n++;
    best = Math.max(best, n);
  }
  return best;
}

/** The run ending this week (if it qualifies already) or last week (this week is still in progress). */
export function currentRun(weeks: Set<string>, today: string): number {
  const thisWeek = weekStart(today);
  let cur = weeks.has(thisWeek) ? thisWeek : prevWeek(thisWeek);
  let n = 0;
  for (; weeks.has(cur); cur = prevWeek(cur)) n++;
  return n;
}

const prevWeek = (w: string) => addDays(w, -7);
const nextWeek = (w: string) => addDays(w, 7);

/**
 * Replays finished workouts in start order and calls `after` with the stats after each one.
 * `templateIds` are the current templates (Full Rotation needs all of them in one week).
 * Returns the stats after the last workout, with `currentWeekRun` measured from `today`.
 */
export function replayBadgeStats(workouts: BadgeWorkout[], templateIds: number[], today: string, after?: (w: BadgeWorkout, s: BadgeStats) => void): BadgeStats {
  const ordered = [...workouts].sort((a, b) => a.startedAt - b.startedAt || a.id - b.id);
  const s = emptyStats();
  const history = new Map<number, Bests>(); // exerciseId → bests so far
  const weekCounts = new Map<string, number>();
  const weekTemplates = new Map<string, Set<number>>();
  const allTemplates = new Set(templateIds);
  let prevDate: string | null = null;

  for (const w of ordered) {
    s.workouts++;
    s.volumeKg += workoutVolume(w.entries);

    const hour = new Date(w.endedAt).getHours();
    if (hour < EARLY_BEFORE_HOUR) s.earlyWorkouts++;
    if (hour >= LATE_FROM_HOUR) s.lateWorkouts++;

    if (prevDate != null && daysBetween(prevDate, w.date) >= COMEBACK_DAYS) s.comeback = true;
    prevDate = w.date;

    // Records: each exercise against its own history before this workout.
    const trained = w.entries.filter((e) => e.sets.some(isWorkingSet));
    let withRecord = 0;
    for (const e of trained) {
      const past = history.get(e.exerciseId) ?? {};
      const broken = detectPRs(e.sets, past, e.exercise).filter((r) => BADGE_METRICS.includes(r.metric));
      if (broken.length) withRecord++;
    }
    for (const e of trained) {
      const past = history.get(e.exerciseId) ?? {};
      mergeBests(past, bestsOf(e.sets, e.exercise));
      history.set(e.exerciseId, past);
    }
    s.records += withRecord;
    if (trained.length >= 3 && withRecord === trained.length) s.cleanSweep = true;

    // No Set Left Behind: every set the template planned was completed.
    if (w.templateId != null && w.plannedSets != null && w.plannedSets > 0) {
      const done = w.entries.reduce((n, e) => n + Math.min(e.sets.filter(isWorkingSet).length, e.plannedSets ?? 0), 0);
      if (done >= w.plannedSets) s.noSetLeftBehind = true;
    }

    // Weeks
    const week = weekStart(w.date);
    weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1);
    const qualifying = qualifyingWeeks(weekCounts);
    s.bestWeekRun = bestRun(qualifying);
    s.currentWeekRun = currentRun(qualifying, w.date);

    if (w.templateId != null) {
      const used = weekTemplates.get(week) ?? new Set<number>();
      used.add(w.templateId);
      weekTemplates.set(week, used);
      if (allTemplates.size >= 2 && [...allTemplates].every((t) => used.has(t))) s.fullRotation = true;
    }

    after?.(w, { ...s });
  }

  s.currentWeekRun = currentRun(qualifyingWeeks(weekCounts), today);
  return s;
}
