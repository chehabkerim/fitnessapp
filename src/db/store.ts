import { useRef, useSyncExternalStore } from 'react';

import { useScreenFocused } from '../hooks/useScreenFocused';
import { deepEqual } from '../lib/deepEqual';

import { createRepos, type Repos } from './repos';
import type { Engine } from './types';

// App-wide database handle plus a change counter that drives live queries.
let engine: Engine | null = null;
let repos: Repos | null = null;
let version = 0;
const listeners = new Set<() => void>();
// Changes only when the database is attached or detached (useRepos doesn't need every write).
let engineVersion = 0;
const engineListeners = new Set<() => void>();

const notify = () => {
  version++;
  listeners.forEach((l) => l());
};
const notifyEngine = () => {
  engineVersion++;
  engineListeners.forEach((l) => l());
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
  notifyEngine();
  notify();
  return repos;
}

export function detachEngine() {
  engine = null;
  repos = null;
  notifyEngine();
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
const subscribeEngine = (l: () => void) => {
  engineListeners.add(l);
  return () => engineListeners.delete(l);
};

/** Repositories for event handlers. Re-renders only when the database opens or closes, not on every write. */
export function useRepos(): Repos {
  useSyncExternalStore(subscribeEngine, () => engineVersion, () => engineVersion);
  return getRepos();
}

const sameDeps = (a: unknown[], b: unknown[]) => a.length === b.length && a.every((v, i) => Object.is(v, b[i]));

/**
 * Live query: re-runs the (synchronous) selector after any write. Queries are small local reads,
 * so recomputing on every change keeps things simple and always consistent. When the result is
 * structurally unchanged the previous object is returned, so the component doesn't re-render.
 * Screens that aren't focused (a tab in the background, the screen under the active workout) keep their
 * last result and catch up when they're focused again, so a write only re-runs the visible screen's queries.
 */
export function useLive<T>(select: (r: Repos) => T, deps: unknown[] = []): T {
  const focused = useScreenFocused();
  const cache = useRef<{ version: number; deps: unknown[]; value: T } | null>(null);
  const getSnapshot = () => {
    const c = cache.current;
    if (c && (c.version === version || !focused) && sameDeps(c.deps, deps)) return c.value;
    const next = select(getRepos());
    const value = c && deepEqual(c.value, next) ? c.value : next;
    cache.current = { version, deps, value };
    return value;
  };
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
