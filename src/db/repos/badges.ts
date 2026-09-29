import { and, asc, eq, inArray, isNotNull } from 'drizzle-orm';

import { toLocalDate } from '../../lib/dates';
import { BADGE_BY_ID, badgeStatuses, evaluateBadges, replayBadgeStats, type BadgeStats, type BadgeStatus, type BadgeWorkout } from '../../lib/badges';
import { appState, badgesEarned, exercises, sets, templates, workoutExercises, workouts, type BadgeEarnedRow } from '../schema';
import type { AppDb } from '../types';
import type { RepoCtx } from './context';

/** Current version of the silent backfill; bump to re-run it for everyone after new badges are added. */
export const BADGES_VERSION = 1;

/** Finished workouts in the shape the badge logic needs (3 queries, no per-workout reads). */
function badgeWorkouts(db: AppDb): BadgeWorkout[] {
  const ws = db.select().from(workouts).where(isNotNull(workouts.endedAt)).orderBy(asc(workouts.startedAt)).all();
  if (!ws.length) return [];
  const ids = ws.map((w) => w.id);
  const wes = db
    .select({ we: workoutExercises, exercise: exercises })
    .from(workoutExercises)
    .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
    .where(inArray(workoutExercises.workoutId, ids))
    .orderBy(asc(workoutExercises.position))
    .all();
  const allSets = wes.length ? db.select().from(sets).where(inArray(sets.workoutExerciseId, wes.map((r) => r.we.id))).orderBy(asc(sets.position)).all() : [];
  const setsByWe = new Map<number, typeof allSets>();
  for (const s of allSets) setsByWe.set(s.workoutExerciseId, [...(setsByWe.get(s.workoutExerciseId) ?? []), s]);
  const entriesByWorkout = new Map<number, BadgeWorkout['entries']>();
  for (const r of wes) {
    const list = entriesByWorkout.get(r.we.workoutId) ?? [];
    list.push({ exerciseId: r.exercise.id, exercise: r.exercise, sets: setsByWe.get(r.we.id) ?? [], plannedSets: r.we.plannedSets });
    entriesByWorkout.set(r.we.workoutId, list);
  }
  return ws.map((w) => ({ id: w.id, date: w.date, startedAt: w.startedAt, endedAt: w.endedAt!, templateId: w.templateId, plannedSets: w.plannedSets, entries: entriesByWorkout.get(w.id) ?? [] }));
}

const templateIds = (db: AppDb) => db.select({ id: templates.id }).from(templates).all().map((t) => t.id);

/**
 * Awards every badge the history has earned that isn't stored yet (idempotent). Returns the new rows.
 * Stored badges are never removed here: edits and deletions don't take a badge away.
 */
export function awardBadges(db: AppDb, now = Date.now()): BadgeEarnedRow[] {
  const { earned } = evaluateBadges(badgeWorkouts(db), templateIds(db), toLocalDate(new Date(now)));
  const have = new Set(db.select({ id: badgesEarned.badgeId }).from(badgesEarned).all().map((r) => r.id));
  const fresh = [...earned].filter(([id]) => !have.has(id) && BADGE_BY_ID.has(id));
  if (!fresh.length) return [];
  return db
    .insert(badgesEarned)
    .values(fresh.map(([badgeId, e]) => ({ badgeId, earnedAt: e.at, workoutId: e.workoutId })))
    .onConflictDoNothing()
    .returning()
    .all();
}

/** Silent batch award (first launch of badges, and after an import); sets the one-off notice when anything was new. */
export function backfillBadges(db: AppDb, now = Date.now()): number {
  const added = awardBadges(db, now).length;
  db.update(appState).set({ badgesVersion: BADGES_VERSION, ...(added > 0 ? { badgesNotice: added } : {}) }).where(eq(appState.id, 1)).run();
  return added;
}

export interface BadgeOverview {
  stats: BadgeStats;
  statuses: BadgeStatus[];
  earned: Map<string, BadgeEarnedRow>;
}

export function badgeRepo({ db, changed }: RepoCtx) {
  return {
    /** Progress and earned state for every badge. */
    overview(now = Date.now()): BadgeOverview {
      const rows = db.select().from(badgesEarned).all();
      const earned = new Map(rows.map((r) => [r.badgeId, r]));
      const stats = replayBadgeStats(badgeWorkouts(db), templateIds(db), toLocalDate(new Date(now)));
      return { stats, statuses: badgeStatuses(stats, new Set(earned.keys())), earned };
    },

    /** Badges earned by one workout, in definition order. */
    forWorkout(workoutId: number): BadgeEarnedRow[] {
      const rows = db.select().from(badgesEarned).where(and(eq(badgesEarned.workoutId, workoutId))).all();
      const order = [...BADGE_BY_ID.keys()];
      return rows.sort((a, b) => order.indexOf(a.badgeId) - order.indexOf(b.badgeId));
    },

    /** Called when a workout finishes. Returns the newly earned badges. */
    evaluate(now = Date.now()): BadgeEarnedRow[] {
      const added = awardBadges(db, now);
      if (added.length) changed();
      return added;
    },

    /** Runs the silent backfill once per badges version (first launch of the feature). */
    backfillIfNeeded(now = Date.now()) {
      const state = db.select({ v: appState.badgesVersion }).from(appState).where(eq(appState.id, 1)).get();
      if (!state || state.v >= BADGES_VERSION) return;
      backfillBadges(db, now);
      changed();
    },

    dismissNotice() {
      db.update(appState).set({ badgesNotice: null }).where(eq(appState.id, 1)).run();
      changed();
    },
  };
}
