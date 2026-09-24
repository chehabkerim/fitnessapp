import { asc, eq, inArray, max } from 'drizzle-orm';

import { exercises, sets, templateExercises, templates, workoutExercises, workouts, type ExerciseRow, type TemplateExerciseRow, type TemplateRow } from '../schema';
import type { RepoCtx } from './context';

export interface TemplateItemInput {
  exerciseId: number;
  targetSets: number;
  targetRepsMin: number | null;
  targetRepsMax: number | null;
  restSec: number | null;
}

export interface TemplateDetail {
  template: TemplateRow;
  items: { item: TemplateExerciseRow; exercise: ExerciseRow }[];
}

export function templateRepo({ db, changed }: RepoCtx) {
  const detail = (id: number): TemplateDetail | undefined => {
    const template = db.select().from(templates).where(eq(templates.id, id)).get();
    if (!template) return undefined;
    const items = db
      .select({ item: templateExercises, exercise: exercises })
      .from(templateExercises)
      .innerJoin(exercises, eq(exercises.id, templateExercises.exerciseId))
      .where(eq(templateExercises.templateId, id))
      .orderBy(asc(templateExercises.position))
      .all();
    return { template, items };
  };

  const save = (input: { id?: number; name: string; notes?: string | null; items: TemplateItemInput[] }): number => {
    const id = db.transaction((tx) => {
      let id = input.id;
      if (id == null) {
        const pos = tx.select({ m: max(templates.position) }).from(templates).get()?.m ?? -1;
        id = tx.insert(templates).values({ name: input.name.trim(), notes: input.notes ?? null, position: pos + 1 }).returning({ id: templates.id }).all()[0]!.id;
      } else {
        tx.update(templates).set({ name: input.name.trim(), notes: input.notes ?? null, updatedAt: Date.now() }).where(eq(templates.id, id)).run();
        tx.delete(templateExercises).where(eq(templateExercises.templateId, id)).run();
      }
      input.items.forEach((it, position) => tx.insert(templateExercises).values({ ...it, templateId: id!, position }).run());
      return id;
    });
    changed();
    return id;
  };

  return {
    list(): TemplateDetail[] {
      return db
        .select({ id: templates.id })
        .from(templates)
        .orderBy(asc(templates.position), asc(templates.id))
        .all()
        .map((t) => detail(t.id)!)
        .filter(Boolean);
    },
    get: detail,
    save,
    remove(id: number) {
      db.delete(templates).where(eq(templates.id, id)).run();
      changed();
    },

    /** "Save as template": exercises in order, target sets = working sets done, reps range from what was done. */
    fromWorkout(workoutId: number, name: string): number {
      const wes = db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workoutId)).orderBy(asc(workoutExercises.position)).all();
      const allSets = wes.length ? db.select().from(sets).where(inArray(sets.workoutExerciseId, wes.map((w) => w.id))).all() : [];
      const items: TemplateItemInput[] = wes.map((we) => {
        const working = allSets.filter((s) => s.workoutExerciseId === we.id && !s.isWarmup && s.completedAt != null);
        const reps = working.map((s) => s.reps).filter((r): r is number => r != null);
        return {
          exerciseId: we.exerciseId,
          targetSets: Math.max(1, working.length),
          targetRepsMin: reps.length ? Math.min(...reps) : null,
          targetRepsMax: reps.length ? Math.max(...reps) : null,
          restSec: we.restSec,
        };
      });
      const w = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
      return save({ name: name || w?.name || 'Workout', items });
    },
  };
}
