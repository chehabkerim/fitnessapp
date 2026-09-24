import { drizzle } from 'drizzle-orm/sql-js';
import type { Database, SqlJsStatic } from 'sql.js';

import { createSaveScheduler } from '../lib/saveScheduler';
import { idbGet, idbPut } from '../platform/idb';
import { migrationBundle } from './bundle';
import { migrate } from './migrate';
import type { OpenResult } from './open';
import { ensureSeed } from './seed';
import type { AppDb, Engine } from './types';

// Kept in sync with scripts/copy-wasm.mjs, which copies the WASM into public/.
import sqlJsPkg from 'sql.js/package.json';

const LOCK = 'plus-ultra-db';
const CHANNEL = 'plus-ultra-db';
const HANDOFF_TIMEOUT_MS = 1500;

let sqlPromise: Promise<SqlJsStatic> | null = null;
function loadSqlJs(): Promise<SqlJsStatic> {
  sqlPromise ??= import('sql.js/dist/sql-wasm-browser.js').then((m) => m.default({ locateFile: () => `/sql-wasm-${sqlJsPkg.version}.wasm` }));
  return sqlPromise;
}

type Held = { release(): void; lost: Promise<void> };

/** Holds the Web Lock until released; `lost` resolves if another tab steals it. */
function acquireLock(opts: { ifAvailable?: boolean; steal?: boolean }): Promise<Held | null> {
  if (!('locks' in navigator)) return Promise.resolve({ release() {}, lost: new Promise(() => {}) });
  return new Promise((resolve) => {
    let release!: () => void;
    let markLost!: () => void;
    const lost = new Promise<void>((r) => (markLost = r));
    navigator.locks
      .request(LOCK, { ...opts, mode: 'exclusive' }, (lock) => {
        if (!lock) {
          resolve(null);
          return undefined;
        }
        resolve({ release: () => release(), lost });
        return new Promise<void>((r) => (release = r));
      })
      .catch(() => markLost()); // AbortError when stolen
  });
}

async function openOwned(held: Held): Promise<OpenResult> {
  const SQL = await loadSqlJs();
  const saved = await idbGet<Uint8Array>('sqlite', 'main');
  const raw: Database = saved ? new SQL.Database(saved) : new SQL.Database();
  raw.run('PRAGMA foreign_keys = ON');
  const db = drizzle(raw) as unknown as AppDb;
  migrate(db, migrationBundle);
  ensureSeed(db);

  let closed = false;
  const lostCallbacks: (() => void)[] = [];
  const save = async () => {
    if (closed) return;
    const bytes = raw.export();
    raw.run('PRAGMA foreign_keys = ON'); // export() closes and reopens the connection
    await idbPut('sqlite', 'main', bytes);
  };
  const scheduler = createSaveScheduler({ save, debounceMs: 200, maxWaitMs: 1000, onError: (e) => console.warn('Save failed; will retry', e) });
  // persist whatever migrations/seed changed before the first user write
  scheduler.markDirty();
  await scheduler.flush();

  const flushNow = () => void scheduler.flush();
  const onVisibility = () => document.visibilityState === 'hidden' && flushNow();
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', flushNow);

  const shutdown = async (notify: boolean) => {
    if (closed) return;
    await scheduler.flush();
    closed = true;
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flushNow);
    channel?.close();
    held.release();
    if (notify) lostCallbacks.forEach((cb) => cb());
  };

  // Another tab asks to take over: save, stop writing, release the lock, then tell it.
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  if (channel) {
    channel.onmessage = async (ev) => {
      if (ev.data?.type !== 'handoff') return;
      await shutdown(true);
      new BroadcastChannel(CHANNEL).postMessage({ type: 'released' });
    };
  }
  void held.lost.then(() => {
    closed = true;
    lostCallbacks.forEach((cb) => cb());
  });

  const engine: Engine = {
    db,
    markDirty: () => !closed && scheduler.markDirty(),
    flush: () => scheduler.flush(),
    close: () => shutdown(false),
  };
  return { status: 'ready', engine, onLost: (cb) => lostCallbacks.push(cb) };
}

async function takeOver(): Promise<OpenResult> {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
  const released = new Promise<void>((resolve) => {
    if (!channel) return resolve();
    channel.onmessage = (ev) => ev.data?.type === 'released' && resolve();
    setTimeout(resolve, HANDOFF_TIMEOUT_MS);
  });
  channel?.postMessage({ type: 'handoff' });
  await released;
  channel?.close();
  const held = (await acquireLock({ ifAvailable: true })) ?? (await acquireLock({ steal: true }));
  return openOwned(held!);
}

/** Web: sql.js in memory, persisted to IndexedDB; one tab owns the database at a time. */
export async function openEngine(): Promise<OpenResult> {
  const held = await acquireLock({ ifAvailable: true });
  if (!held) return { status: 'locked', takeOver };
  return openOwned(held);
}
