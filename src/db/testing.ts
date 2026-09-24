// Test helper: a real in-memory SQLite (sql.js, node build) with the app's migrations and seed.
import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs, { type Database } from 'sql.js';

import { migrationBundle } from './bundle';
import { migrate } from './migrate';
import { createRepos } from './repos';
import { ensureSeed } from './seed';
import type { AppDb } from './types';

export async function createTestDb(bytes?: Uint8Array) {
  const SQL = await initSqlJs();
  const raw: Database = bytes ? new SQL.Database(bytes) : new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  const db = drizzle(raw) as unknown as AppDb;
  migrate(db, migrationBundle);
  ensureSeed(db);
  let writes = 0;
  const repos = createRepos({ db, changed: () => writes++ });
  return { raw, db, repos, writes: () => writes };
}
