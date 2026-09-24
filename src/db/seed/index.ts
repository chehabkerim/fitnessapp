import { eq, inArray } from 'drizzle-orm';

import { appState, exercises, settings, templateExercises, templates } from '../schema';
import type { AppDb } from '../types';
import { SEED_EXERCISES, SEED_TEMPLATES } from './exercises';

export const SEED_VERSION = 1;

/**
 * Makes sure the singleton rows exist and applies seed data once. Gated by app_state.seed_version,
 * so seeded exercises or templates you delete stay deleted.
 */
export function ensureSeed(db: AppDb): void {
  db.insert(settings).values({ id: 1 }).onConflictDoNothing().run();
  db.insert(appState).values({ id: 1 }).onConflictDoNothing().run();
  const state = db.select({ v: appState.seedVersion }).from(appState).where(eq(appState.id, 1)).get();
  if ((state?.v ?? 0) >= SEED_VERSION) return;

  db.transaction((tx) => {
    for (const e of SEED_EXERCISES) {
      tx.insert(exercises).values({ ...e, isCustom: false }).onConflictDoNothing().run();
    }
    const rows = tx.select({ id: exercises.id, slug: exercises.slug }).from(exercises).where(inArray(exercises.slug, SEED_EXERCISES.map((e) => e.slug))).all();
    const idBySlug = new Map(rows.map((r) => [r.slug, r.id]));
    SEED_TEMPLATES.forEach((t, position) => {
      const [created] = tx.insert(templates).values({ name: t.name, position }).returning({ id: templates.id }).all();
      t.slugs.forEach((slug, i) => {
        const exerciseId = idBySlug.get(slug);
        if (exerciseId == null || !created) return;
        tx.insert(templateExercises).values({ templateId: created.id, exerciseId, position: i, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12 }).run();
      });
    });
    tx.update(appState).set({ seedVersion: SEED_VERSION }).where(eq(appState.id, 1)).run();
  });
}
