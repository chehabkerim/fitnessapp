import type { ExerciseRow, SetRow } from '@/db';
import type { Units } from '@/lib/domain';
import { formatClock } from '@/lib/format';
import { displayWeight } from '@/lib/units';

/** Pieces of a set for display: "22.5" × "10", "+10" × "8", "BW" × "12", or a duration. */
export function setParts(s: Pick<SetRow, 'weightKg' | 'reps' | 'durationSec'>, ex: Pick<ExerciseRow, 'logType'>, units: Units) {
  const reps = s.reps != null ? String(s.reps) : '—';
  switch (ex.logType) {
    case 'duration':
      return { left: formatClock(s.durationSec ?? 0), right: '', times: false, text: formatClock(s.durationSec ?? 0) };
    case 'reps':
      return { left: `${reps} reps`, right: '', times: false, text: `${reps} reps` };
    case 'bodyweight_added': {
      const left = s.weightKg ? `+${displayWeight(s.weightKg, units)}` : 'BW';
      return { left, right: reps, times: true, text: `${left} × ${reps}` };
    }
    default: {
      const left = s.weightKg != null ? displayWeight(s.weightKg, units) : '—';
      return { left, right: reps, times: true, text: `${left} × ${reps}` };
    }
  }
}
