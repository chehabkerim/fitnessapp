import { and, asc, desc, eq, inArray, isNotNull, isNull, lt, max, ne, sql } from 'drizzle-orm';

import { toLocalDate } from '../../lib/dates';
import type { SetValues } from '../../lib/domain';
import { prefillAt, prefillForNewSet } from '../../lib/previous';
import { bestsOf, detectPRs, type Bests, type PrRecord } from '../../lib/prs';
import { workoutVolume } from '../../lib/volume';
import { exercises, sets, templateExercises, templates, workoutExercises, workouts, type ExerciseRow, type SetRow, type WorkoutExerciseRow, type WorkoutRow } from '../schema';
import type { RepoCtx } from './context';

export interface WorkoutEntry {
  we: WorkoutExerciseRow;
  exercise: ExerciseRow;
  sets: SetRow[];
}

export interface WorkoutDetail {
  workout: WorkoutRow;
  entries: WorkoutEntry[];
}

export interface HistoryRow {
  workout: WorkoutRow;
  durationMs: number;
  volume: number;
  exerciseNames: string[];
  setsCompleted: number;
}

export interface Session {
  workoutId: number;
  date: string;
  startedAt: number;
  sets: SetRow[];
}

export interface WorkoutSummary {
  workout: WorkoutRow;
  durationMs: number;
  volume: number;
  setsCompleted: number;
  exerciseCount: number;
  records: { exercise: ExerciseRow; records: PrRecord[] }[];
}

export type StartOptions = { kind: 'empty' } | { kind: 'template'; templateId: number } | { kind: 'repeat'; workoutId: number };

export class ActiveWorkoutExistsError extends Error {
  constructor(public workoutId: number) {
    super('A workout is already in progress');
  }
}

export function workoutRepo({ db, changed }: RepoCtx) {
  const getWorkout = (id: number) => db.select().from(workouts).where(eq(workouts.id, id)).get();

  const entriesOf = (workoutId: number): WorkoutEntry[] => {
    const rows = db
      .select({ we: workoutExercises, exercise: exercises })
      .from(workoutExercises)
      .innerJoin(exercises, eq(exercises.id, workoutExercises.exerciseId))
      .where(eq(workoutExercises.workoutId, workoutId))
      .orderBy(asc(workoutExercises.position), asc(workoutExercises.id))
      .all();
    if (!rows.length) return [];
    const allSets = db.select().from(sets).where(inArray(sets.workoutExerciseId, rows.map((r) => r.we.id))).orderBy(asc(sets.position), asc(sets.id)).all();
    return rows.map((r) => ({ ...r, sets: allSets.filter((s) => s.workoutExerciseId === r.we.id) }));
  };

  /** Completed sets from the last finished session of an exercise (excluding a workout). */
  const lastSession = (exerciseId: number, excludeWorkoutId?: number): SetRow[] => {
    const last = db
      .select({ weId: workoutExercises.id })
      .from(workoutExercises)
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(and(eq(workoutExercises.exerciseId, exerciseId), isNotNull(workouts.endedAt), excludeWorkoutId != null ? ne(workouts.id, excludeWorkoutId) : undefined))
      .orderBy(desc(workouts.startedAt), asc(workoutExercises.position))
      .limit(1)
      .get();
    if (!last) return [];
    return db.select().from(sets).where(and(eq(sets.workoutExerciseId, last.weId), isNotNull(sets.completedAt))).orderBy(asc(sets.position), asc(sets.id)).all();
  };

  /** Bests from finished workouts that started before `beforeStartedAt` (excluding one workout). */
  const historyBests = (exercise: ExerciseRow, beforeStartedAt: number, excludeWorkoutId?: number): Bests => {
    const rows = db
      .select({ s: sets })
      .from(sets)
      .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
      .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
      .where(
        and(
          eq(workoutExercises.exerciseId, exercise.id),
          isNotNull(workouts.endedAt),
          lt(workouts.startedAt, beforeStartedAt),
          excludeWorkoutId != null ? ne(workouts.id, excludeWorkoutId) : undefined,
        ),
      )
      .all();
    return bestsOf(rows.map((r) => r.s), exercise);
  };

  const nextPosition = (workoutId: number) =>
    (db.select({ m: max(workoutExercises.position) }).from(workoutExercises).where(eq(workoutExercises.workoutId, workoutId)).get()?.m ?? -1) + 1;

  const insertSets = (weId: number, values: Partial<SetValues>[]) =>
    values.forEach((v, position) =>
      db.insert(sets).values({ workoutExerciseId: weId, position, weightKg: v.weightKg ?? null, reps: v.reps ?? null, durationSec: v.durationSec ?? null, isWarmup: v.isWarmup ?? false }).run(),
    );

  const renumber = (weId: number) => {
    const rows = db.select({ id: sets.id }).from(sets).where(eq(sets.workoutExerciseId, weId)).orderBy(asc(sets.position), asc(sets.id)).all();
    rows.forEach((r, i) => db.update(sets).set({ position: i }).where(eq(sets.id, r.id)).run());
  };

  const touch = (setId: number) => {
    const row = db
      .select({ workoutId: workoutExercises.workoutId })
      .from(sets)
      .innerJoin(workoutExercises, eq(workoutExercises.id, sets.workoutExerciseId))
      .where(eq(sets.id, setId))
      .get();
    if (row) db.update(workouts).set({ updatedAt: Date.now() }).where(eq(workouts.id, row.workoutId)).run();
  };

  const summarise = (w: WorkoutRow, entries: WorkoutEntry[]) => ({
    durationMs: (w.endedAt ?? Date.now()) - w.startedAt,
    volume: workoutVolume(entries.map((e) => ({ exercise: e.exercise, sets: e.sets }))),
    setsCompleted: entries.reduce((n, e) => n + e.sets.filter((s) => s.completedAt != null && !s.isWarmup).length, 0),
  });

  return {
    get: getWorkout,
    active: (): WorkoutRow | undefined => db.select().from(workouts).where(isNull(workouts.endedAt)).orderBy(desc(workouts.startedAt)).limit(1).get(),
    detail(id: number): WorkoutDetail | undefined {
      const workout = getWorkout(id);
      return workout ? { workout, entries: entriesOf(id) } : undefined;
    },
    lastSession,
    historyBests,

    start(opts: StartOptions, now = Date.now()): number {
      const active = db.select({ id: workouts.id }).from(workouts).where(isNull(workouts.endedAt)).get();
      if (active) throw new ActiveWorkoutExistsError(active.id);
      const id = db.transaction(() => {
        let name: string | null = null;
        let templateId: number | null = null;
        if (opts.kind === 'template') {
          const t = db.select().from(templates).where(eq(templates.id, opts.templateId)).get();
          name = t?.name ?? null;
          templateId = t?.id ?? null;
        } else if (opts.kind === 'repeat') {
          name = getWorkout(opts.workoutId)?.name ?? null;
        }
        const [w] = db.insert(workouts).values({ date: toLocalDate(new Date(now)), startedAt: now, name, templateId }).returning({ id: workouts.id }).all();
        const workoutId = w!.id;

        if (opts.kind === 'template' && templateId != null) {
          const items = db.select().from(templateExercises).where(eq(templateExercises.templateId, templateId)).orderBy(asc(templateExercises.position)).all();
          items.forEach((it, position) => {
            const [we] = db.insert(workoutExercises).values({ workoutId, exerciseId: it.exerciseId, position, restSec: it.restSec }).returning({ id: workoutExercises.id }).all();
            const last = lastSession(it.exerciseId, workoutId);
            insertSets(we!.id, Array.from({ length: Math.max(1, it.targetSets) }, (_, i) => prefillAt(last, i)));
          });
          db.update(templates).set({ lastUsedAt: now }).where(eq(templates.id, templateId)).run();
        } else if (opts.kind === 'repeat') {
          entriesOf(opts.workoutId).forEach((e, position) => {
            const [we] = db.insert(workoutExercises).values({ workoutId, exerciseId: e.exercise.id, position, restSec: e.we.restSec }).returning({ id: workoutExercises.id }).all();
            insertSets(we!.id, e.sets.map((s) => ({ weightKg: s.weightKg, reps: s.reps, durationSec: s.durationSec, isWarmup: s.isWarmup })));
          });
        }
        return workoutId;
      });
      changed();
      return id;
    },

    rename(id: number, name: string) {
      db.update(workouts).set({ name: name.trim() || null, updatedAt: Date.now() }).where(eq(workouts.id, id)).run();
      changed();
    },

    setNotes(id: number, notes: string) {
      db.update(workouts).set({ notes: notes.trim() || null, updatedAt: Date.now() }).where(eq(workouts.id, id)).run();
      changed();
    },

    addExercise(workoutId: number, exerciseId: number): number {
      const weId = db.transaction(() => {
        const [we] = db.insert(workoutExercises).values({ workoutId, exerciseId, position: nextPosition(workoutId) }).returning({ id: workoutExercises.id }).all();
        insertSets(we!.id, [prefillForNewSet([], lastSession(exerciseId, workoutId))]);
        return we!.id;
      });
      changed();
      return weId;
    },

    removeExercise(weId: number) {
      db.delete(workoutExercises).where(eq(workoutExercises.id, weId)).run();
      changed();
    },

    moveExercise(weId: number, direction: -1 | 1) {
      const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, weId)).get();
      if (!we) return;
      const siblings = db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, we.workoutId)).orderBy(asc(workoutExercises.position), asc(workoutExercises.id)).all();
      const i = siblings.findIndex((s) => s.id === weId);
      const j = i + direction;
      if (j < 0 || j >= siblings.length) return;
      [siblings[i], siblings[j]] = [siblings[j]!, siblings[i]!];
      db.transaction(() => siblings.forEach((s, position) => db.update(workoutExercises).set({ position }).where(eq(workoutExercises.id, s.id)).run()));
      changed();
    },

    addSet(weId: number): number {
      const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, weId)).get();
      if (!we) throw new Error('Exercise entry not found');
      const current = db.select().from(sets).where(eq(sets.workoutExerciseId, weId)).orderBy(asc(sets.position), asc(sets.id)).all();
      const v = prefillForNewSet(current.filter((s) => !s.isWarmup), lastSession(we.exerciseId, we.workoutId));
      const [row] = db.insert(sets).values({ workoutExerciseId: weId, position: current.length, ...v }).returning({ id: sets.id }).all();
      changed();
      return row!.id;
    },

    updateSet(id: number, patch: Partial<Pick<SetRow, 'weightKg' | 'reps' | 'durationSec'>>) {
      db.update(sets).set({ ...patch, updatedAt: Date.now() }).where(eq(sets.id, id)).run();
      touch(id);
      changed();
    },

    setCompleted(id: number, done: boolean, now = Date.now()) {
      db.update(sets).set({ completedAt: done ? now : null, updatedAt: now }).where(eq(sets.id, id)).run();
      touch(id);
      changed();
    },

    setWarmup(id: number, warmup: boolean) {
      db.update(sets).set({ isWarmup: warmup, updatedAt: Date.now() }).where(eq(sets.id, id)).run();
      changed();
    },

    deleteSet(id: number) {
      const row = db.select({ weId: sets.workoutExerciseId }).from(sets).where(eq(sets.id, id)).get();
      db.delete(sets).where(eq(sets.id, id)).run();
      if (row) renumber(row.weId);
      changed();
    },

    incompleteCount(workoutId: number): number {
      return entriesOf(workoutId).reduce((n, e) => n + e.sets.filter((s) => s.completedAt == null).length, 0);
    },

    /** Finish: optionally drop incomplete sets, drop exercises left without sets, stamp the end time. */
    finish(id: number, opts: { discardIncomplete: boolean }, now = Date.now()) {
      db.transaction(() => {
        const entries = entriesOf(id);
        for (const e of entries) {
          if (opts.discardIncomplete) for (const s of e.sets) if (s.completedAt == null) db.delete(sets).where(eq(sets.id, s.id)).run();
        }
        for (const e of entriesOf(id)) if (e.sets.length === 0) db.delete(workoutExercises).where(eq(workoutExercises.id, e.we.id)).run();
        db.update(workouts).set({ endedAt: now, updatedAt: now }).where(eq(workouts.id, id)).run();
      });
      changed();
    },

    discard(id: number) {
      db.delete(workouts).where(eq(workouts.id, id)).run();
      changed();
    },

    remove(id: number) {
      db.delete(workouts).where(eq(workouts.id, id)).run();
      changed();
    },

    finishedCount: () => db.select({ n: sql<number>`count(*)` }).from(workouts).where(isNotNull(workouts.endedAt)).get()?.n ?? 0,

    history(): HistoryRow[] {
      const rows = db.select().from(workouts).where(isNotNull(workouts.endedAt)).orderBy(desc(workouts.startedAt)).all();
      return rows.map((w) => {
        const entries = entriesOf(w.id);
        return { workout: w, ...summarise(w, entries), exerciseNames: entries.map((e) => e.exercise.name) };
      });
    },

    summary(id: number): WorkoutSummary | undefined {
      const workout = getWorkout(id);
      if (!workout) return undefined;
      const entries = entriesOf(id);
      const records = entries
        .map((e) => ({ exercise: e.exercise, records: detectPRs(e.sets, historyBests(e.exercise, workout.startedAt, id), e.exercise) }))
        .filter((r) => r.records.length > 0);
      return { workout, ...summarise(workout, entries), exerciseCount: entries.length, records };
    },

    /** Finished sessions of one exercise, newest first, with their completed sets. */
    sessions(exerciseId: number): Session[] {
      const rows = db
        .select({ weId: workoutExercises.id, workoutId: workouts.id, date: workouts.date, startedAt: workouts.startedAt })
        .from(workoutExercises)
        .innerJoin(workouts, eq(workouts.id, workoutExercises.workoutId))
        .where(and(eq(workoutExercises.exerciseId, exerciseId), isNotNull(workouts.endedAt)))
        .orderBy(desc(workouts.startedAt), asc(workoutExercises.position))
        .all();
      if (!rows.length) return [];
      const allSets = db.select().from(sets).where(and(inArray(sets.workoutExerciseId, rows.map((r) => r.weId)), isNotNull(sets.completedAt))).orderBy(asc(sets.position)).all();
      const byWorkout = new Map<number, Session>();
      for (const r of rows) {
        const s = byWorkout.get(r.workoutId) ?? { workoutId: r.workoutId, date: r.date, startedAt: r.startedAt, sets: [] };
        s.sets.push(...allSets.filter((x) => x.workoutExerciseId === r.weId));
        byWorkout.set(r.workoutId, s);
      }
      return [...byWorkout.values()];
    },
  };
}
