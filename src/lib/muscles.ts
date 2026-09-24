import type { Muscle } from './domain';

export type FigureView = 'front' | 'back';

/**
 * Which highlightable regions each view of the figure shows, with how visible they are.
 * Partly visible regions (the lateral triceps strip on the front) count half when choosing a view.
 */
export const REGION_VISIBILITY: Record<FigureView, Partial<Record<Muscle, number>>> = {
  front: { traps: 1, upper_chest: 1, chest: 1, front_delts: 1, side_delts: 1, biceps: 1, triceps: 0.5, forearms: 1 },
  back: { traps: 1, rear_delts: 1, side_delts: 1, upper_back: 1, lats: 1, triceps: 1, forearms: 1 },
};

/** Small-size view: score = 2 × primary + secondary visible in that view; ties go to front. */
export function smallView(primary: readonly Muscle[], secondary: readonly Muscle[]): FigureView {
  const score = (v: FigureView) => {
    const w = (m: Muscle) => REGION_VISIBILITY[v][m] ?? 0;
    return 2 * primary.reduce((a, m) => a + w(m), 0) + secondary.reduce((a, m) => a + w(m), 0);
  };
  return score('back') > score('front') ? 'back' : 'front';
}
