import { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { getExerciseVisual, type VisualSource } from '../lib/media';
import { photos } from '../platform/photos';
import { radius, space, useTheme } from '../theme';
import { MuscleMap } from './MuscleMap';

export function usePhotoUrl(photoId: string | null, size: 'thumb' | 'detail') {
  const key = photoId ? `${photoId}:${size}` : null;
  const [loaded, setLoaded] = useState<{ key: string; url: string | null } | null>(null);
  useEffect(() => {
    let alive = true;
    if (photoId && key) void photos.url(photoId, size).then((url) => alive && setLoaded({ key, url }));
    return () => {
      alive = false;
    };
  }, [photoId, size, key]);
  return loaded && loaded.key === key ? loaded.url : null;
}

/** Square tile (56 library, 44 workout cards): your photo, else the muscle figure. */
export function ExerciseTile({ exercise, px, surface }: { exercise: VisualSource & { name: string }; px: 56 | 44; surface?: string }) {
  const { c } = useTheme();
  const v = getExerciseVisual(exercise, 'small');
  const url = usePhotoUrl(v.kind === 'photo' ? v.photoId : null, 'thumb');
  const bg = surface ?? c.surface;
  return (
    <View style={[styles.tile, { width: px, height: px, borderRadius: px === 56 ? radius.md : radius.sm, backgroundColor: bg }]}>
      {v.kind === 'photo' ? (
        url ? <Image source={{ uri: url }} style={{ width: px, height: px }} accessibilityLabel={`Photo of ${exercise.name}`} /> : null
      ) : v.kind === 'figure' ? (
        <MuscleMap view={v.views[0]!} primary={v.primary} secondary={v.secondary} size="small" px={px} gapColor={bg} />
      ) : null}
    </View>
  );
}

/** Detail header: photo (if any) with the front/back figure beneath. */
export function ExerciseHero({ exercise, figureHeight = 280 }: { exercise: VisualSource & { name: string }; figureHeight?: number }) {
  const { c } = useTheme();
  const v = getExerciseVisual(exercise, 'large');
  const url = usePhotoUrl(v.kind === 'photo' ? v.photoId : null, 'detail');
  return (
    <View style={styles.hero}>
      {v.kind === 'photo' && url ? (
        <Image source={{ uri: url }} style={styles.photo} resizeMode="cover" accessibilityLabel={`Photo of ${exercise.name}`} />
      ) : null}
      <View style={styles.pair}>
        {(['front', 'back'] as const).map((view) => (
          <MuscleMap key={view} view={view} primary={exercise.primaryMuscles} secondary={exercise.secondaryMuscles} size="large" px={figureHeight} gapColor={c.bg} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  hero: { gap: space.lg, alignItems: 'stretch' },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.lg },
  pair: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
});
