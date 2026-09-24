/**
 * Rest time priority: workout exercise → (template value, copied into the workout exercise at start) →
 * exercise default → settings default.
 */
export function resolveRestSec(workoutExerciseRest: number | null | undefined, exerciseDefault: number | null | undefined, settingsDefault: number): number {
  return workoutExerciseRest ?? exerciseDefault ?? settingsDefault;
}

export interface RestState {
  endsAt: number;
  durationSec: number;
}

export const startRest = (now: number, durationSec: number): RestState => ({ endsAt: now + durationSec * 1000, durationSec });

/** −15s / +15s. The end time never moves before now; the duration follows so progress stays proportional. */
export function adjustRest(state: RestState, deltaSec: number, now: number): RestState {
  const endsAt = Math.max(now, state.endsAt + deltaSec * 1000);
  return { endsAt, durationSec: Math.max(0, state.durationSec + deltaSec) };
}

export const remainingMs = (state: RestState | null, now: number) => (state ? Math.max(0, state.endsAt - now) : 0);

export const isRestOver = (state: RestState | null, now: number) => state != null && now >= state.endsAt;
