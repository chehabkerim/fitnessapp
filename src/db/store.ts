import { useMemo, useSyncExternalStore } from 'react';

import { createRepos, type Repos } from './repos';
import type { Engine } from './types';

// App-wide database handle plus a change counter that drives live queries.
let engine: Engine | null = null;
let repos: Repos | null = null;
let version = 0;
const listeners = new Set<() => void>();

const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

export function attachEngine(e: Engine): Repos {
  engine = e;
  repos = createRepos({
    db: e.db,
    changed: () => {
      e.markDirty();
      notify();
    },
  });
  notify();
  return repos;
}

export function detachEngine() {
  engine = null;
  repos = null;
  notify();
}

export function getRepos(): Repos {
  if (!repos) throw new Error('Database not open yet');
  return repos;
}

export const flushNow = () => engine?.flush() ?? Promise.resolve();

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Repositories for event handlers. */
export function useRepos(): Repos {
  useSyncExternalStore(subscribe, () => version, () => version);
  return getRepos();
}

/**
 * Live query: re-runs the (synchronous) selector after any write. Queries are small local reads,
 * so recomputing on every change keeps things simple and always consistent.
 */
export function useLive<T>(select: (r: Repos) => T, deps: unknown[] = []): T {
  const v = useSyncExternalStore(subscribe, () => version, () => version);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => select(getRepos()), [v, ...deps]);
}
