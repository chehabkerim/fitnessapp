import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import { migrationBundle } from './bundle';
import { migrate } from './migrate';
import type { OpenResult } from './open';
import { ensureSeed } from './seed';
import type { AppDb } from './types';

/** Native: expo-sqlite writes are durable immediately, so there is nothing to schedule. */
export async function openEngine(): Promise<OpenResult> {
  const sqlite = openDatabaseSync('plus-ultra.db');
  sqlite.execSync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
  const db = drizzle(sqlite) as unknown as AppDb;
  migrate(db, migrationBundle);
  ensureSeed(db);
  return {
    status: 'ready',
    engine: { db, markDirty() {}, flush: async () => {}, close: async () => sqlite.closeSync() },
    onLost() {},
  };
}
