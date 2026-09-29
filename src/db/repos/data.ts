import { appState, badgesEarned, exercises, sets, settings, templateExercises, templates, workoutExercises, workouts } from '../schema';
import { ensureSeed } from '../seed';
import { backfillBadges } from './badges';
import type { RepoCtx } from './context';

const TABLES = { settings, app_state: appState, exercises, templates, template_exercises: templateExercises, workouts, workout_exercises: workoutExercises, sets, badges_earned: badgesEarned } as const;
type TableName = keyof typeof TABLES;
const ORDER: TableName[] = ['settings', 'app_state', 'exercises', 'templates', 'template_exercises', 'workouts', 'workout_exercises', 'sets', 'badges_earned'];
/** Tables added after version 1; older exports without them import as empty. */
const OPTIONAL: TableName[] = ['badges_earned'];

export const EXPORT_FORMAT = 'plus-ultra';
export const EXPORT_VERSION = 2;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  tables: Record<TableName, Record<string, unknown>[]>;
  /** photo_id → base64 images; filled by the platform photo store. */
  photos: Record<string, { thumb: { mime: string; data: string }; detail: { mime: string; data: string } }>;
}

export class ImportError extends Error {}

export function validateExport(data: unknown): ExportFile {
  const d = data as Partial<ExportFile> | null;
  if (!d || typeof d !== 'object' || d.format !== EXPORT_FORMAT) throw new ImportError("This file isn't a Plus Ultra export.");
  if (typeof d.version !== 'number' || d.version > EXPORT_VERSION) throw new ImportError('This export comes from a newer version of the app.');
  if (!d.tables || typeof d.tables !== 'object') throw new ImportError('The export is missing its data.');
  const tables = { ...d.tables } as Record<string, unknown>;
  for (const t of OPTIONAL) tables[t] ??= [];
  for (const t of ORDER) if (!Array.isArray(tables[t])) throw new ImportError(`The export is missing the ${t} table.`);
  return { ...d, tables, photos: d.photos ?? {} } as ExportFile;
}

export function dataRepo({ db, changed }: RepoCtx) {
  const wipe = () => [...ORDER].reverse().forEach((t) => db.delete(TABLES[t]).run());

  return {
    /** Everything except photos (added by the caller). */
    exportTables(): ExportFile['tables'] {
      const out = {} as ExportFile['tables'];
      for (const t of ORDER) out[t] = db.select().from(TABLES[t]).all() as Record<string, unknown>[];
      return out;
    },

    /** Replaces all data with an export, atomically. */
    importTables(file: ExportFile) {
      db.transaction(() => {
        wipe();
        for (const t of ORDER) {
          const rows = file.tables[t];
          // insert in chunks to stay under SQLite's variable limit
          for (let i = 0; i < rows.length; i += 50) {
            const chunk = rows.slice(i, i + 50);
            if (chunk.length) db.insert(TABLES[t]).values(chunk as never).run();
          }
        }
      });
      ensureSeed(db);
      // Award anything the imported history has earned (older exports have no badges), silently.
      backfillBadges(db);
      changed();
    },

    /** Deletes everything and re-seeds the library and templates. */
    resetAll() {
      db.transaction(() => wipe());
      ensureSeed(db);
      changed();
    },
  };
}
