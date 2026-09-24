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

/** Square muscle tile (44–84px): your photo, else the muscle figure. Bordered like cards (2px accent in light). */
export function ExerciseTile({ exercise, px }: { exercise: VisualSource & { name: string }; px: number }) {
  const { c } = useTheme();
  const v = getExerciseVisual(exercise, 'small');
  const url = usePhotoUrl(v.kind === 'photo' ? v.photoId : null, 'thumb');
  const bw = c.cardBorderWidth;
  const inner = px - bw * 2;
  return (
    <View style={[styles.tile, { width: px, height: px, borderRadius: px >= 60 ? radius.md : radius.sm, backgroundColor: c.tileBg, borderColor: c.cardBorder, borderWidth: bw }]}>
      {v.kind === 'photo' ? (
        url ? <Image source={{ uri: url }} style={{ width: inner, height: inner }} accessibilityLabel={`Photo of ${exercise.name}`} /> : null
      ) : v.kind === 'figure' ? (
        <MuscleMap view={v.views[0]!} primary={v.primary} secondary={v.secondary} size="small" px={inner} gapColor={c.tileBg} />
      ) : null}
    </View>
  );
}

/** Tile for a set of muscles (e.g. a template's primary muscles). */
export function MuscleTile({ primary, secondary = [], px, label }: { primary: VisualSource['primaryMuscles']; secondary?: VisualSource['secondaryMuscles']; px: number; label: string }) {
  return <ExerciseTile exercise={{ name: label, slug: null, photoId: null, primaryMuscles: primary, secondaryMuscles: secondary }} px={px} />;
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
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: radius.card },
  pair: { flexDirection: 'row', justifyContent: 'center', gap: space.xl },
});
