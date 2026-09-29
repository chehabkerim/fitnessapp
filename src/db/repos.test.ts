/**
 * @jest-environment node
 */
import { sql } from 'drizzle-orm';

import { validateExport } from './repos';
import { ActiveWorkoutExistsError } from './repos/workouts';
import { ensureSeed, SEED_VERSION } from './seed';
import { createTestDb } from './testing';

const T0 = new Date(2026, 8, 20, 18, 0).getTime();
const MIN = 60_000;
const DAY = 24 * 60 * MIN;

async function setup() {
  const t = await createTestDb();
  const r = t.repos;
  const backAndChest = r.templates.list().find((x) => x.template.name === 'Back & Chest')!;
  const incline = r.exercises.bySlug('incline_db_bench_press')!;
  return { ...t, r, backAndChest, incline };
}

/** Logs every set of a workout with the given values and finishes it. */
function logAndFinish(r: Awaited<ReturnType<typeof setup>>['r'], workoutId: number, values: { weightKg: number; reps: number }, at: number) {
  for (const e of r.workouts.detail(workoutId)!.entries) {
    for (const s of e.sets) {
      r.workouts.updateSet(s.id, values);
      r.workouts.setCompleted(s.id, true, at);
    }
  }
  r.workouts.finish(workoutId, { discardIncomplete: true }, at + 45 * MIN);
}

describe('seed', () => {
  it('seeds 12 exercises and two templates once', async () => {
    const { r, db } = await setup();
    expect(r.exercises.all()).toHaveLength(12);
    const templates = r.templates.list();
    expect(templates.map((t) => t.template.name)).toEqual(['Back & Chest', 'Arms']);
    expect(templates[0]!.items.map((i) => i.exercise.name)).toEqual(['Incline Dumbbell Bench Press', 'Flat Chest Press', 'Lat Pulldown', 'Close Grip Row', 'Upper Back Row']);
    expect(templates[1]!.items).toHaveLength(7);
    expect(templates[0]!.items[0]!.item).toMatchObject({ targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 });
    expect(r.appState.get().seedVersion).toBe(SEED_VERSION);
    // deleting a seeded template sticks
    r.templates.remove(templates[1]!.template.id);
    ensureSeed(db);
    expect(r.templates.list()).toHaveLength(1);
  });

  it('starts new installs in the dark theme', async () => {
    const { r } = await setup();
    expect(r.settings.get().theme).toBe('dark');
  });

  it('stores cues and muscles as arrays', async () => {
    const { incline } = await setup();
    expect(incline.primaryMuscles).toEqual(['upper_chest']);
    expect(incline.cues).toHaveLength(4);
    expect(incline.loadMode).toBe('per_dumbbell');
  });
});

describe('library', () => {
  it('groups by template, then My exercises, and searches', async () => {
    const { r } = await setup();
    const custom = r.exercises.create({ name: 'Cable Fly', equipment: 'cable', logType: 'weight_reps', loadMode: 'total', primaryMuscles: ['chest'], secondaryMuscles: [], defaultRestSec: 60, cues: [] });
    const groups = r.exercises.library();
    expect(groups.map((g) => g.title)).toEqual(['Back & Chest', 'Arms', 'My exercises']);
    expect(groups[2]!.exercises.map((e) => e.id)).toEqual([custom]);
    expect(r.exercises.library('curl').flatMap((g) => g.exercises.map((e) => e.name))).toEqual(['Hammer Curl', 'Preacher Curl', 'Bicep Curl']);
    r.exercises.setArchived(custom, true);
    expect(r.exercises.library()[2]!.exercises).toHaveLength(0);
  });
});

describe('workout logging', () => {
  it('starts from a template with prefilled sets and copies rest', async () => {
    const { r, backAndChest } = await setup();
    const id = r.workouts.start({ kind: 'template', templateId: backAndChest.template.id }, T0);
    const d = r.workouts.detail(id)!;
    expect(d.workout.name).toBe('Back & Chest');
    expect(d.entries).toHaveLength(5);
    expect(d.entries.every((e) => e.sets.length === 3)).toBe(true);
    expect(() => r.workouts.start({ kind: 'empty' })).toThrow(ActiveWorkoutExistsError);
  });

  it('fills Previous and prefill from the last session, and flags PRs', async () => {
    const { r, backAndChest, incline } = await setup();
    const first = r.workouts.start({ kind: 'template', templateId: backAndChest.template.id }, T0);
    logAndFinish(r, first, { weightKg: 22.5, reps: 10 }, T0);

    // first session: baseline, no records
    expect(r.workouts.summary(first)!.records).toEqual([]);
    expect(r.workouts.lastSession(incline.id).map((s) => s.reps)).toEqual([10, 10, 10]);

    // repeat: sets prefilled with last time's values
    const second = r.workouts.start({ kind: 'repeat', workoutId: first }, T0 + 2 * 86_400_000);
    const entry = r.workouts.detail(second)!.entries[0]!;
    expect(entry.sets.map((s) => [s.weightKg, s.reps, s.completedAt])).toEqual([[22.5, 10, null], [22.5, 10, null], [22.5, 10, null]]);

    r.workouts.updateSet(entry.sets[1]!.id, { weightKg: 25, reps: 8 });
    r.workouts.setCompleted(entry.sets[0]!.id, true, T0 + 2 * 86_400_000);
    r.workouts.setCompleted(entry.sets[1]!.id, true, T0 + 2 * 86_400_000);
    r.workouts.finish(second, { discardIncomplete: true }, T0 + 2 * 86_400_000 + 30 * MIN);

    const summary = r.workouts.summary(second)!;
    const inclineRecords = summary.records.find((x) => x.exercise.id === incline.id)!;
    expect(inclineRecords.records.map((x) => x.metric)).toEqual(expect.arrayContaining(['heaviest', 'e1rm']));
    expect(inclineRecords.records.find((x) => x.metric === 'heaviest')).toMatchObject({ value: 25, previous: 22.5 });
    // incomplete sets were discarded and empty exercises dropped
    expect(r.workouts.detail(second)!.entries.map((e) => e.sets.length)).toEqual([2]);
  });

  it('adds, prefills, reorders, warms up and deletes sets', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    const weId = r.workouts.addExercise(id, incline.id);
    const [s1] = r.workouts.detail(id)!.entries[0]!.sets;
    r.workouts.updateSet(s1!.id, { weightKg: 20, reps: 12 });
    const s2 = r.workouts.addSet(weId);
    expect(r.workouts.detail(id)!.entries[0]!.sets.find((s) => s.id === s2)).toMatchObject({ weightKg: 20, reps: 12 });
    r.workouts.setWarmup(s1!.id, true);
    r.workouts.deleteSet(s1!.id);
    expect(r.workouts.detail(id)!.entries[0]!.sets.map((s) => s.position)).toEqual([0]);

    const lat = r.exercises.bySlug('lat_pulldown')!;
    const we2 = r.workouts.addExercise(id, lat.id);
    r.workouts.moveExercise(we2, -1);
    expect(r.workouts.detail(id)!.entries.map((e) => e.exercise.name)).toEqual(['Lat Pulldown', 'Incline Dumbbell Bench Press']);
    r.workouts.removeExercise(we2);
    expect(r.workouts.detail(id)!.entries).toHaveLength(1);
    expect(r.workouts.incompleteCount(id)).toBe(1);
  });

  it('lists history with duration and per-dumbbell volume counted twice', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.rename(id, 'Push day');
    r.workouts.addExercise(id, incline.id);
    logAndFinish(r, id, { weightKg: 20, reps: 10 }, T0);
    const [row] = r.workouts.history();
    expect(row!.workout.name).toBe('Push day');
    expect(row!.volume).toBe(400);
    expect(row!.durationMs).toBe(45 * MIN);
    expect(row!.exerciseNames).toEqual(['Incline Dumbbell Bench Press']);
    expect(r.workouts.sessions(incline.id)).toHaveLength(1);
    expect(r.workouts.finishedCount()).toBe(1);
  });

  it('saves a workout as a template', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    const weId = r.workouts.addExercise(id, incline.id);
    r.workouts.addSet(weId);
    logAndFinish(r, id, { weightKg: 20, reps: 9 }, T0);
    const tid = r.templates.fromWorkout(id, 'Chest day');
    const t = r.templates.get(tid)!;
    expect(t.template.name).toBe('Chest day');
    expect(t.items[0]!.item).toMatchObject({ exerciseId: incline.id, targetSets: 2, targetRepsMin: 9, targetRepsMax: 9 });
  });
});

describe('persistence', () => {
  it('survives export → reopen from bytes (what IndexedDB holds), and keeps foreign keys on', async () => {
    const { raw, r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.addExercise(id, incline.id);
    const bytes = raw.export();
    // export() reopens the connection; foreign keys must be re-enabled by the engine
    raw.run('PRAGMA foreign_keys = ON');
    expect(raw.exec('PRAGMA foreign_keys')[0]!.values[0]![0]).toBe(1);

    const reopened = await createTestDb(bytes);
    expect(reopened.repos.workouts.active()?.id).toBe(id);
    expect(reopened.repos.workouts.detail(id)!.entries[0]!.sets).toHaveLength(1);
  });

  it('round-trips a JSON export and resets to the seed', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.addExercise(id, incline.id);
    r.exercises.setPhoto(incline.id, 'ph_x');
    const file = validateExport(JSON.parse(JSON.stringify({ format: 'plus-ultra', version: 1, exportedAt: 'now', tables: r.data.exportTables(), photos: {} })));

    r.data.resetAll();
    expect(r.workouts.active()).toBeUndefined();
    expect(r.exercises.all()).toHaveLength(12);
    expect(r.exercises.bySlug('incline_db_bench_press')!.photoId).toBeNull();

    r.data.importTables(file);
    expect(r.workouts.active()?.id).toBe(id);
    expect(r.exercises.bySlug('incline_db_bench_press')!.photoId).toBe('ph_x');
    expect(r.exercises.bySlug('incline_db_bench_press')!.cues).toHaveLength(4);
  });

  it('keeps the colour scheme in exports; older exports without it import as Neon', async () => {
    const { r } = await setup();
    expect(r.settings.get().colorScheme).toBe('neon');
    r.settings.update({ colorScheme: 'ultraviolet' });
    const tables = JSON.parse(JSON.stringify(r.data.exportTables()));
    expect(tables.settings[0].colorScheme).toBe('ultraviolet');

    r.data.resetAll();
    r.data.importTables(validateExport({ format: 'plus-ultra', version: 1, exportedAt: 'now', tables, photos: {} }));
    expect(r.settings.get().colorScheme).toBe('ultraviolet');

    delete tables.settings[0].colorScheme; // an export from before schemes existed
    r.data.importTables(validateExport({ format: 'plus-ultra', version: 1, exportedAt: 'now', tables, photos: {} }));
    expect(r.settings.get().colorScheme).toBe('neon');
  });

  it('rejects files that are not exports', () => {
    expect(() => validateExport({ hello: 1 })).toThrow("isn't a Plus Ultra export");
    expect(() => validateExport({ format: 'plus-ultra', version: 99, tables: {} })).toThrow('newer version');
  });

  it('cascades deletes', async () => {
    const { r, db, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.addExercise(id, incline.id);
    r.workouts.discard(id);
    expect(db.get<{ n: number }>(sql`select count(*) as n from sets`)!.n).toBe(0);
  });
});

describe('badges', () => {
  it('awards on finish, records the workout, and is idempotent', async () => {
    const { r, backAndChest } = await setup();
    const id = r.workouts.start({ kind: 'template', templateId: backAndChest.template.id }, T0);
    logAndFinish(r, id, { weightKg: 20, reps: 10 }, T0);
    const added = r.badges.evaluate(T0 + 60 * MIN);
    expect(added.map((b) => b.badgeId)).toEqual(expect.arrayContaining(['first_rep', 'no_set_left_behind']));
    expect(added.every((b) => b.workoutId === id)).toBe(true);
    expect(r.badges.evaluate(T0 + 61 * MIN)).toEqual([]);
    expect(r.badges.forWorkout(id).map((b) => b.badgeId)[0]).toBe('first_rep');
  });

  it('records planned sets at a template start; skipped sets mean no "No Set Left Behind"', async () => {
    const { r, backAndChest } = await setup();
    const id = r.workouts.start({ kind: 'template', templateId: backAndChest.template.id }, T0);
    const d = r.workouts.detail(id)!;
    expect(d.workout.plannedSets).toBe(15);
    expect(d.entries.every((e) => e.we.plannedSets === 3)).toBe(true);
    const first = d.entries[0]!.sets[0]!;
    r.workouts.updateSet(first.id, { weightKg: 20, reps: 10 });
    r.workouts.setCompleted(first.id, true, T0);
    r.workouts.finish(id, { discardIncomplete: true }, T0 + 30 * MIN);
    const ids = r.badges.evaluate(T0 + 31 * MIN).map((b) => b.badgeId);
    expect(ids).toContain('first_rep');
    expect(ids).not.toContain('no_set_left_behind');
    expect(r.workouts.start({ kind: 'empty' }, T0 + DAY)).toBeGreaterThan(0);
    expect(r.workouts.detail(r.workouts.active()!.id)!.workout.plannedSets).toBeNull();
  });

  it('keeps earned badges when the workout behind them is deleted; reset removes them', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.addExercise(id, incline.id);
    logAndFinish(r, id, { weightKg: 20, reps: 10 }, T0);
    r.badges.evaluate(T0 + DAY);
    r.workouts.remove(id);
    const o = r.badges.overview(T0 + DAY);
    expect(o.earned.get('first_rep')?.workoutId).toBeNull();
    expect(o.statuses.find((s) => s.badge.id === 'first_rep')!.earned).toBe(true);
    expect(o.stats.workouts).toBe(0);
    r.data.resetAll();
    expect(r.badges.overview().earned.size).toBe(0);
  });

  it('backfills silently once, with a one-off notice', async () => {
    const { r, incline } = await setup();
    for (let i = 0; i < 3; i++) {
      const id = r.workouts.start({ kind: 'empty' }, T0 + i * DAY);
      r.workouts.addExercise(id, incline.id);
      logAndFinish(r, id, { weightKg: 20 + i, reps: 10 }, T0 + i * DAY);
    }
    expect(r.appState.get().badgesVersion).toBe(0);
    r.badges.backfillIfNeeded(T0 + 5 * DAY);
    const earned = r.badges.overview(T0 + 5 * DAY).earned;
    expect([...earned.keys()].sort()).toEqual(['first_rep', 'plus_ultra']); // Sun, Mon, Tue: one qualifying week, not two
    expect(r.appState.get()).toMatchObject({ badgesVersion: 1, badgesNotice: earned.size });
    // Backfilled badges keep the date of the workout that earned them
    expect(earned.get('first_rep')!.earnedAt).toBe(T0 + 45 * MIN);
    r.badges.dismissNotice();
    r.badges.backfillIfNeeded(T0 + 6 * DAY);
    expect(r.appState.get().badgesNotice).toBeNull();
  });

  it('exports badges; importing an older export without them awards them silently', async () => {
    const { r, incline } = await setup();
    const id = r.workouts.start({ kind: 'empty' }, T0);
    r.workouts.addExercise(id, incline.id);
    logAndFinish(r, id, { weightKg: 20, reps: 10 }, T0);
    r.badges.evaluate(T0 + DAY);
    const tables = JSON.parse(JSON.stringify(r.data.exportTables()));
    expect(tables.badges_earned).toHaveLength(1);

    r.data.importTables(validateExport({ format: 'plus-ultra', version: 2, exportedAt: 'now', tables, photos: {} }));
    expect(r.badges.overview().earned.has('first_rep')).toBe(true);
    expect(r.appState.get().badgesNotice ?? null).toBeNull(); // nothing new to announce

    delete tables.badges_earned; // an export from before badges
    tables.app_state[0].badgesVersion = 0;
    r.data.importTables(validateExport({ format: 'plus-ultra', version: 1, exportedAt: 'now', tables, photos: {} }));
    expect(r.badges.overview().earned.get('first_rep')?.workoutId).toBe(id);
    expect(r.appState.get().badgesNotice).toBe(1);
  });
});
