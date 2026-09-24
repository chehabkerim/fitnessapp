import { sql } from 'drizzle-orm';
import { check, index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { EQUIPMENT, LOAD_MODES, LOG_TYPES, type Muscle } from '../lib/domain';

// Timestamps are epoch ms; dates are local YYYY-MM-DD; weights are kg.
const now = sql`(unixepoch('subsec') * 1000)`;
const timestamps = {
  createdAt: integer('created_at').notNull().default(now),
  updatedAt: integer('updated_at').notNull().default(now),
};

export const settings = sqliteTable(
  'settings',
  {
    id: integer('id').primaryKey(),
    units: text('units', { enum: ['metric', 'imperial'] }).notNull().default('metric'),
    theme: text('theme', { enum: ['system', 'light', 'dark'] }).notNull().default('system'),
    defaultRestSec: integer('default_rest_sec').notNull().default(90),
    restToneEnabled: integer('rest_tone_enabled', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => [check('settings_singleton', sql`${t.id} = 1`)],
);

export const appState = sqliteTable(
  'app_state',
  {
    id: integer('id').primaryKey(),
    seedVersion: integer('seed_version').notNull().default(0),
    restEndsAt: integer('rest_ends_at'),
    restDurationSec: integer('rest_duration_sec'),
    restNotificationAsked: integer('rest_notification_asked', { mode: 'boolean' }).notNull().default(false),
    restNotificationId: text('rest_notification_id'),
    storagePersistRequestedAt: integer('storage_persist_requested_at'),
    lastExportAt: integer('last_export_at'),
    installNudgeShownAt: integer('install_nudge_shown_at'),
  },
  (t) => [check('app_state_singleton', sql`${t.id} = 1`)],
);

export const exercises = sqliteTable(
  'exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    slug: text('slug'),
    name: text('name').notNull(),
    equipment: text('equipment', { enum: EQUIPMENT }).notNull(),
    logType: text('log_type', { enum: LOG_TYPES }).notNull().default('weight_reps'),
    loadMode: text('load_mode', { enum: LOAD_MODES }).notNull().default('total'),
    primaryMuscles: text('primary_muscles', { mode: 'json' }).$type<Muscle[]>().notNull().default(sql`'[]'`),
    secondaryMuscles: text('secondary_muscles', { mode: 'json' }).$type<Muscle[]>().notNull().default(sql`'[]'`),
    defaultRestSec: integer('default_rest_sec'),
    cues: text('cues', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
    photoId: text('photo_id'),
    met: real('met'),
    isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
    archivedAt: integer('archived_at'),
    ...timestamps,
  },
  (t) => [uniqueIndex('exercises_slug_uq').on(t.slug)],
);

export const templates = sqliteTable('templates', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  notes: text('notes'),
  position: integer('position').notNull(),
  lastUsedAt: integer('last_used_at'),
  ...timestamps,
});

export const templateExercises = sqliteTable(
  'template_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    templateId: integer('template_id').notNull().references(() => templates.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
    position: integer('position').notNull(),
    targetSets: integer('target_sets').notNull().default(3),
    targetRepsMin: integer('target_reps_min'),
    targetRepsMax: integer('target_reps_max'),
    restSec: integer('rest_sec'),
  },
  (t) => [index('template_exercises_template_idx').on(t.templateId, t.position), index('template_exercises_exercise_idx').on(t.exerciseId)],
);

export const workouts = sqliteTable(
  'workouts',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    date: text('date').notNull(),
    name: text('name'),
    templateId: integer('template_id').references(() => templates.id, { onDelete: 'set null' }),
    startedAt: integer('started_at').notNull(),
    endedAt: integer('ended_at'), // null = in progress
    notes: text('notes'),
    estimatedKcal: real('estimated_kcal'), // kept for later phases; not shown
    ...timestamps,
  },
  (t) => [index('workouts_date_idx').on(t.date), index('workouts_ended_idx').on(t.endedAt)],
);

export const workoutExercises = sqliteTable(
  'workout_exercises',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
    exerciseId: integer('exercise_id').notNull().references(() => exercises.id),
    position: integer('position').notNull(),
    restSec: integer('rest_sec'),
    notes: text('notes'),
  },
  (t) => [index('workout_exercises_workout_idx').on(t.workoutId, t.position), index('workout_exercises_exercise_idx').on(t.exerciseId)],
);

export const sets = sqliteTable(
  'sets',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    workoutExerciseId: integer('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    // per dumbbell for per_dumbbell exercises; added weight for bodyweight_added
    weightKg: real('weight_kg'),
    reps: integer('reps'),
    durationSec: integer('duration_sec'),
    isWarmup: integer('is_warmup', { mode: 'boolean' }).notNull().default(false),
    completedAt: integer('completed_at'),
    ...timestamps,
  },
  (t) => [index('sets_workout_exercise_idx').on(t.workoutExerciseId, t.position)],
);

export type SettingsRow = typeof settings.$inferSelect;
export type AppStateRow = typeof appState.$inferSelect;
export type ExerciseRow = typeof exercises.$inferSelect;
export type TemplateRow = typeof templates.$inferSelect;
export type TemplateExerciseRow = typeof templateExercises.$inferSelect;
export type WorkoutRow = typeof workouts.$inferSelect;
export type WorkoutExerciseRow = typeof workoutExercises.$inferSelect;
export type SetRow = typeof sets.$inferSelect;

/** Tables in dependency order (export/import/reset). */
export const TABLES_IN_ORDER = ['settings', 'app_state', 'exercises', 'templates', 'template_exercises', 'workouts', 'workout_exercises', 'sets'] as const;
