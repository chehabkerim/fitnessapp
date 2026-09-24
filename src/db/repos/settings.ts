import { eq } from 'drizzle-orm';

import { appState, settings, type AppStateRow, type SettingsRow } from '../schema';
import type { RepoCtx } from './context';

export function settingsRepo({ db, changed }: RepoCtx) {
  return {
    get(): SettingsRow {
      const row = db.select().from(settings).where(eq(settings.id, 1)).get();
      if (!row) throw new Error('Settings row missing');
      return row;
    },
    update(patch: Partial<Pick<SettingsRow, 'units' | 'theme' | 'defaultRestSec' | 'restToneEnabled'>>) {
      db.update(settings).set({ ...patch, updatedAt: Date.now() }).where(eq(settings.id, 1)).run();
      changed();
    },
  };
}

export function appStateRepo({ db, changed }: RepoCtx) {
  return {
    get(): AppStateRow {
      const row = db.select().from(appState).where(eq(appState.id, 1)).get();
      if (!row) throw new Error('App state row missing');
      return row;
    },
    update(patch: Partial<Omit<AppStateRow, 'id'>>) {
      db.update(appState).set(patch).where(eq(appState.id, 1)).run();
      changed();
    },
  };
}
