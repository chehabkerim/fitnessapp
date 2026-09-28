import type { Repos, WorkoutEntry } from '@/db';
import { resolveRestSec, startRest } from '@/lib/rest';
import { restAlerts } from '@/platform/restAlerts';
import { restCue } from '@/platform/restCue';

/** Starts the rest timer for an exercise; the first time, asks (via onAsk) before requesting notification permission. */
export function beginRest(repos: Repos, entry: WorkoutEntry, onAsk: () => void) {
  const settings = repos.settings.get();
  const sec = resolveRestSec(entry.we.restSec, entry.exercise.defaultRestSec, settings.defaultRestSec);
  const r = startRest(Date.now(), sec);
  // The tone needs audio unlocked on this tap; creating the audio context is slow, so only when the tone is on.
  if (settings.restToneEnabled) restCue.unlock();
  repos.appState.update({ restEndsAt: r.endsAt, restDurationSec: r.durationSec });
  if (!repos.appState.get().restNotificationAsked) {
    void restAlerts.permission().then((p) => {
      if (p === 'default') onAsk();
      else repos.appState.update({ restNotificationAsked: true });
    });
  }
}
