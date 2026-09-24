import { getExerciseVisual } from './media';
import { smallView } from './muscles';
import { shouldShowInstallNudge } from './nudge';
import { newPhotoId } from './ids';

describe('muscle figure view', () => {
  it('chooses the view that shows the primary muscles', () => {
    expect(smallView(['upper_chest'], ['front_delts', 'triceps'])).toBe('front');
    expect(smallView(['lats'], ['biceps', 'rear_delts'])).toBe('back');
    expect(smallView(['triceps'], [])).toBe('back');
    expect(smallView(['triceps'], ['chest', 'front_delts'])).toBe('front'); // weighted dips differ from pushdowns
    expect(smallView(['side_delts'], ['traps'])).toBe('front'); // tie → front
  });
});

describe('getExerciseVisual', () => {
  const base = { slug: 'lat_pulldown', photoId: null, primaryMuscles: ['lats' as const], secondaryMuscles: ['biceps' as const] };
  it('prefers a photo', () => {
    expect(getExerciseVisual({ ...base, photoId: 'ph_1' }, 'small')).toEqual({ kind: 'photo', photoId: 'ph_1', size: 'small' });
  });
  it('falls back to the figure: one view small, both large', () => {
    expect(getExerciseVisual(base, 'small')).toMatchObject({ kind: 'figure', views: ['back'] });
    expect(getExerciseVisual(base, 'large')).toMatchObject({ kind: 'figure', views: ['front', 'back'] });
  });
});

describe('install nudge', () => {
  const now = new Date(2026, 8, 24).getTime();
  it('shows once after the third workout when not installed and not recently exported', () => {
    expect(shouldShowInstallNudge({ finishedWorkouts: 3, standalone: false, lastExportAt: null, shownAt: null, now })).toBe(true);
    expect(shouldShowInstallNudge({ finishedWorkouts: 2, standalone: false, lastExportAt: null, shownAt: null, now })).toBe(false);
    expect(shouldShowInstallNudge({ finishedWorkouts: 5, standalone: true, lastExportAt: null, shownAt: null, now })).toBe(false);
    expect(shouldShowInstallNudge({ finishedWorkouts: 5, standalone: false, lastExportAt: null, shownAt: now, now })).toBe(false);
    expect(shouldShowInstallNudge({ finishedWorkouts: 5, standalone: false, lastExportAt: now - 3 * 86_400_000, shownAt: null, now })).toBe(false);
    expect(shouldShowInstallNudge({ finishedWorkouts: 5, standalone: false, lastExportAt: now - 20 * 86_400_000, shownAt: null, now })).toBe(true);
  });
});

describe('photo ids', () => {
  it('are opaque and stable-length', () => {
    expect(newPhotoId(0, () => 0)).toBe('ph_0_000000');
    expect(newPhotoId()).toMatch(/^ph_[0-9a-z]+_[0-9a-z]{6}$/);
  });
});
