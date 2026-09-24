import type { ExerciseRow, SetRow } from '@/db';
import { formatClock, formatVolume } from '@/lib/format';
import type { PrRecord } from '@/lib/prs';
import type { Units } from '@/lib/domain';
import { displayWeight, formatNumber, formatWeight, fromKg, unitLabel } from '@/lib/units';

/** "60 × 8", "+10 × 8", "12 reps", "0:45". */
export function formatSetShort(s: Pick<SetRow, 'weightKg' | 'reps' | 'durationSec'>, ex: Pick<ExerciseRow, 'logType'>, units: Units): string {
  switch (ex.logType) {
    case 'duration':
      return formatClock(s.durationSec ?? 0);
    case 'reps':
      return `${s.reps ?? 0} reps`;
    case 'bodyweight_added':
      return s.weightKg ? `+${displayWeight(s.weightKg, units)} × ${s.reps ?? 0}` : `BW × ${s.reps ?? 0}`;
    default:
      return `${displayWeight(s.weightKg ?? 0, units)} × ${s.reps ?? 0}`;
  }
}

/** Longer form for history and PRs: "22.5 kg each × 10". */
export function formatSetLong(s: Pick<SetRow, 'weightKg' | 'reps' | 'durationSec'>, ex: Pick<ExerciseRow, 'logType' | 'loadMode'>, units: Units): string {
  switch (ex.logType) {
    case 'duration':
      return formatClock(s.durationSec ?? 0);
    case 'reps':
      return `${s.reps ?? 0} reps`;
    case 'bodyweight_added':
      return s.weightKg ? `${formatWeight(s.weightKg, units, { added: true })} × ${s.reps ?? 0}` : `Bodyweight × ${s.reps ?? 0}`;
    default:
      return `${formatWeight(s.weightKg ?? 0, units, { each: ex.loadMode === 'per_dumbbell' })} × ${s.reps ?? 0}`;
  }
}

/** Volume (stored in kg) shown in the user's units, e.g. "12,450". */
export const formatVolumeIn = (kg: number, units: Units) => formatVolume(fromKg(kg, units));

/** A record value for display: weights as entered ("25 kg each"), volume in the user's units. */
export function formatRecord(r: PrRecord, ex: Pick<ExerciseRow, 'loadMode' | 'logType'>, units: Units): string {
  switch (r.metric) {
    case 'heaviest':
    case 'e1rm':
      return formatWeight(r.value, units, { each: ex.loadMode === 'per_dumbbell', added: ex.logType === 'bodyweight_added' });
    case 'volume':
      return `${formatVolumeIn(r.value, units)} ${unitLabel(units)}`;
    case 'reps':
      return `${formatNumber(r.value)} reps`;
    case 'duration':
      return formatClock(r.value);
  }
}
