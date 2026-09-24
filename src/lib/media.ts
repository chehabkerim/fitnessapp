import type { Muscle } from './domain';
import { smallView, type FigureView } from './muscles';

export type VisualSize = 'small' | 'large';

export interface VisualSource {
  slug: string | null;
  photoId: string | null;
  primaryMuscles: Muscle[];
  secondaryMuscles: Muscle[];
}

export type ExerciseVisual =
  | { kind: 'photo'; photoId: string; size: VisualSize }
  | { kind: 'illustration'; key: string; size: VisualSize }
  | { kind: 'figure'; views: FigureView[]; primary: Muscle[]; secondary: Muscle[]; size: VisualSize };

/** Future hand-made illustrations keyed by exercise slug. Empty for now. */
export const ILLUSTRATIONS: Record<string, string> = {};

/**
 * The single entry point for exercise visuals. Priority: your photo → illustration → muscle figure.
 * Takes the exercise record (not an id) so it stays pure.
 */
export function getExerciseVisual(ex: VisualSource, size: VisualSize): ExerciseVisual {
  if (ex.photoId) return { kind: 'photo', photoId: ex.photoId, size };
  const illustration = ex.slug ? ILLUSTRATIONS[ex.slug] : undefined;
  if (illustration) return { kind: 'illustration', key: illustration, size };
  const views: FigureView[] = size === 'large' ? ['front', 'back'] : [smallView(ex.primaryMuscles, ex.secondaryMuscles)];
  return { kind: 'figure', views, primary: ex.primaryMuscles, secondary: ex.secondaryMuscles, size };
}

/** Figure shown beneath a photo on the detail screen. */
export function figureFor(ex: VisualSource): Extract<ExerciseVisual, { kind: 'figure' }> {
  return { kind: 'figure', views: ['front', 'back'], primary: ex.primaryMuscles, secondary: ex.secondaryMuscles, size: 'large' };
}
