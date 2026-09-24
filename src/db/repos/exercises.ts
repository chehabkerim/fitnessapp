import { and, asc, eq, isNull } from 'drizzle-orm';

import type { Equipment, LoadMode, LogType, Muscle } from '../../lib/domain';
import { exercises, templateExercises, templates, type ExerciseRow } from '../schema';
import type { RepoCtx } from './context';

export interface ExerciseInput {
  name: string;
  equipment: Equipment;
  logType: LogType;
  loadMode: LoadMode;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
  defaultRestSec: number | null;
  cues: string[];
}

export interface LibraryGroup {
  key: string;
  title: string;
  templateId: number | null;
  exercises: ExerciseRow[];
}

export function exerciseRepo({ db, changed }: RepoCtx) {
  const active = () => db.select().from(exercises).where(isNull(exercises.archivedAt)).orderBy(asc(exercises.name)).all();

  return {
    all: active,
    archived: () => db.select().from(exercises).orderBy(asc(exercises.name)).all().filter((e) => e.archivedAt != null),
    get: (id: number) => db.select().from(exercises).where(eq(exercises.id, id)).get(),

    create(input: ExerciseInput): number {
      const [row] = db.insert(exercises).values({ ...input, name: input.name.trim(), isCustom: true }).returning({ id: exercises.id }).all();
      changed();
      return row!.id;
    },

    update(id: number, patch: Partial<ExerciseInput>) {
      db.update(exercises).set({ ...patch, ...(patch.name ? { name: patch.name.trim() } : {}), updatedAt: Date.now() }).where(eq(exercises.id, id)).run();
      changed();
    },

    setArchived(id: number, archived: boolean) {
      db.update(exercises).set({ archivedAt: archived ? Date.now() : null, updatedAt: Date.now() }).where(eq(exercises.id, id)).run();
      changed();
    },

    setPhoto(id: number, photoId: string | null) {
      db.update(exercises).set({ photoId, updatedAt: Date.now() }).where(eq(exercises.id, id)).run();
      changed();
    },

    /** Library grouped by template (template order), then "My exercises" for those in no template. */
    library(search = ''): LibraryGroup[] {
      const q = search.trim().toLowerCase();
      const matches = (e: ExerciseRow) => !q || e.name.toLowerCase().includes(q);
      const all = active();
      const byId = new Map(all.map((e) => [e.id, e]));
      const links = db
        .select({ templateId: templates.id, title: templates.name, exerciseId: templateExercises.exerciseId })
        .from(templateExercises)
        .innerJoin(templates, eq(templates.id, templateExercises.templateId))
        .orderBy(asc(templates.position), asc(templates.id), asc(templateExercises.position))
        .all();
      const groups: LibraryGroup[] = [];
      const inTemplate = new Set<number>();
      for (const l of links) {
        let g = groups.find((x) => x.templateId === l.templateId);
        if (!g) groups.push((g = { key: `t${l.templateId}`, title: l.title, templateId: l.templateId, exercises: [] }));
        const e = byId.get(l.exerciseId);
        if (!e) continue;
        inTemplate.add(e.id);
        if (matches(e) && !g.exercises.some((x) => x.id === e.id)) g.exercises.push(e);
      }
      const mine = all.filter((e) => !inTemplate.has(e.id) && matches(e));
      groups.push({ key: 'mine', title: 'My exercises', templateId: null, exercises: mine });
      return groups.filter((g) => g.exercises.length > 0 || (g.key === 'mine' && !q));
    },

    bySlug: (slug: string) => db.select().from(exercises).where(and(eq(exercises.slug, slug))).get(),
  };
}
