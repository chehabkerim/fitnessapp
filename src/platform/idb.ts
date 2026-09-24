// Tiny IndexedDB helpers (web only). One database with two stores:
//   sqlite: the exported SQLite file (key "main")
//   photos: exercise photos keyed by photo_id — never stored inside SQLite.
const DB_NAME = 'plus-ultra';
const VERSION = 1;
export type StoreName = 'sqlite' | 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openIdb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('sqlite')) db.createObjectStore('sqlite');
      if (!db.objectStoreNames.contains('photos')) db.createObjectStore('photos');
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error('IndexedDB unavailable'));
    };
  });
  return dbPromise;
}

const done = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });

export async function idbGet<T>(store: StoreName, key: string): Promise<T | undefined> {
  const db = await openIdb();
  const tx = db.transaction(store, 'readonly');
  const req = tx.objectStore(store).get(key);
  await done(tx);
  return req.result as T | undefined;
}

/** Resolves only once the transaction has committed. */
export async function idbPut(store: StoreName, key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  const tx = db.transaction(store, 'readwrite', { durability: 'strict' } as IDBTransactionOptions);
  tx.objectStore(store).put(value, key);
  await done(tx);
}

export async function idbDelete(store: StoreName, key: string): Promise<void> {
  const db = await openIdb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).delete(key);
  await done(tx);
}

export async function idbKeys(store: StoreName): Promise<string[]> {
  const db = await openIdb();
  const tx = db.transaction(store, 'readonly');
  const req = tx.objectStore(store).getAllKeys();
  await done(tx);
  return req.result.map(String);
}

export async function idbClear(store: StoreName): Promise<void> {
  const db = await openIdb();
  const tx = db.transaction(store, 'readwrite');
  tx.objectStore(store).clear();
  await done(tx);
}
