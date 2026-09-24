/**
 * Estimated one-rep max (Epley): w × (1 + reps / 30).
 * Returns null for missing/zero values and above 12 reps, where the estimate stops being useful.
 */
export function estimateOneRepMax(weightKg: number | null, reps: number | null): number | null {
  if (weightKg == null || reps == null || weightKg <= 0 || reps <= 0 || reps > 12) return null;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}
