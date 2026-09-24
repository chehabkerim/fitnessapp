import type { BaseSQLiteDatabase } from 'drizzle-orm/sqlite-core';

/** Both engines (expo-sqlite, sql.js) are synchronous SQLite drivers. Created without `schema`, so `db.query` is unavailable. */
export type AppDb = BaseSQLiteDatabase<'sync', unknown>;

export interface Engine {
  db: AppDb;
  /** Called after every write; web schedules a save, native is a no-op (SQLite writes are durable). */
  markDirty(): void;
  /** Save now (web: export → IndexedDB). */
  flush(): Promise<void>;
  /** Close and release resources (web: tab lock). */
  close(): Promise<void>;
}
