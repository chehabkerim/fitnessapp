import type { SetValues } from './domain';

export type Prefill = Pick<SetValues, 'weightKg' | 'reps' | 'durationSec'>;

/**
 * "Previous" for a set row: the set at the same position in the last finished session of this exercise.
 * `lastSession` holds that session's completed sets in order.
 */
export function previousFor(lastSession: SetValues[], index: number): SetValues | undefined {
  return lastSession[index];
}

const values = (s: SetValues): Prefill => ({ weightKg: s.weightKg, reps: s.reps, durationSec: s.durationSec });

/**
 * Values for a new set row: copy the previous set in this workout; for the first set, use last session's
 * set at the same position (or its last set); otherwise leave it blank.
 */
export function prefillForNewSet(currentSets: SetValues[], lastSession: SetValues[]): Prefill {
  const lastHere = currentSets[currentSets.length - 1];
  if (lastHere) return values(lastHere);
  const fromHistory = lastSession[currentSets.length] ?? lastSession[lastSession.length - 1];
  if (fromHistory) return values(fromHistory);
  return { weightKg: null, reps: null, durationSec: null };
}

/** Values for set N when starting a workout from a template or a repeat: last session's set at that position. */
export function prefillAt(lastSession: SetValues[], index: number): Prefill {
  const s = lastSession[index] ?? lastSession[lastSession.length - 1];
  return s ? values(s) : { weightKg: null, reps: null, durationSec: null };
}
