import type { AppDb } from './types';

export interface MigrationBundle {
  journal: { entries: { idx: number; when: number; tag: string; breakpoints: boolean }[] };
  migrations: Record<string, string>;
}

/**
 * Runs the drizzle-kit (driver: expo) migration bundle on either engine. This is what drizzle's Expo
 * migrator does, without its React hook, so the same bundle serves expo-sqlite and sql.js.
 */
export function migrate(db: AppDb, bundle: MigrationBundle): void {
  const metas = bundle.journal.entries.map((e) => {
    const query = bundle.migrations[`m${e.idx.toString().padStart(4, '0')}`];
    if (!query) throw new Error(`Missing migration: ${e.tag}`);
    return { sql: query.split('--> statement-breakpoint'), bps: e.breakpoints, folderMillis: e.when, hash: '' };
  });
  // dialect.migrate is internal to drizzle but stable across the sync SQLite drivers.
  const internal = db as unknown as { dialect: { migrate(m: unknown, s: unknown): void }; session: unknown };
  internal.dialect.migrate(metas, internal.session);
}
