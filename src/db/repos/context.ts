import type { AppDb } from '../types';

export interface RepoCtx {
  db: AppDb;
  /** Must be called after every write: schedules persistence and refreshes live queries. */
  changed: () => void;
}
