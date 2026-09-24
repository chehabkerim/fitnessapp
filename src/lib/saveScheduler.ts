/**
 * Debounced saver for the web database: every write marks it dirty; a save runs after a short quiet
 * period (≤ 250ms) but never later than maxWait after the first unsaved change. flush() saves now.
 * Saves never overlap; changes made during a save trigger another one.
 */
export interface SaveSchedulerOptions {
  save: () => Promise<void>;
  debounceMs?: number;
  maxWaitMs?: number;
  now?: () => number;
  onError?: (e: unknown) => void;
}

export interface SaveScheduler {
  markDirty(): void;
  flush(): Promise<void>;
  readonly dirty: boolean;
}

export function createSaveScheduler({ save, debounceMs = 200, maxWaitMs = 1000, now = Date.now, onError }: SaveSchedulerOptions): SaveScheduler {
  let dirty = false;
  let firstDirtyAt = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let running: Promise<void> | null = null;

  const clear = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  const run = async (): Promise<void> => {
    clear();
    if (running) {
      await running;
      if (!dirty) return;
    }
    if (!dirty) return;
    dirty = false;
    running = save()
      .catch((e) => {
        dirty = true; // keep the change; the next trigger retries
        onError?.(e);
      })
      .finally(() => {
        running = null;
      });
    await running;
    if (dirty && !timer) schedule();
  };

  const schedule = () => {
    const wait = Math.max(0, Math.min(debounceMs, firstDirtyAt + maxWaitMs - now()));
    clear();
    timer = setTimeout(() => void run(), wait);
  };

  return {
    markDirty() {
      if (!dirty) firstDirtyAt = now();
      dirty = true;
      schedule();
    },
    flush: run,
    get dirty() {
      return dirty || running != null;
    },
  };
}
