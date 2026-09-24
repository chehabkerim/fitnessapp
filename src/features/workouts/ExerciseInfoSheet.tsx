import { StyleSheet, View } from 'react-native';

import { ExerciseHero, Sheet, Text } from '@/components';
import type { ExerciseRow } from '@/db';
import { MUSCLE_LABELS } from '@/lib/domain';
import { space } from '@/theme';

/** Cues and muscles without leaving the workout. */
export function ExerciseInfoSheet({ exercise, onClose }: { exercise: ExerciseRow | null; onClose(): void }) {
  return (
    <Sheet visible={!!exercise} onClose={onClose} title={exercise?.name}>
      {exercise && (
        <View style={styles.wrap}>
          <ExerciseHero exercise={exercise} figureHeight={220} />
          <MuscleLegend exercise={exercise} />
          <Cues cues={exercise.cues} />
        </View>
      )}
    </Sheet>
  );
}

export function MuscleLegend({ exercise }: { exercise: Pick<ExerciseRow, 'primaryMuscles' | 'secondaryMuscles'> }) {
  return (
    <View style={styles.legend}>
      <Text variant="label">
        <Text variant="label" color="accentStrong">
          Primary{'  '}
        </Text>
        {exercise.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ') || '—'}
      </Text>
      {exercise.secondaryMuscles.length > 0 && (
        <Text variant="label">
          <Text variant="label" color="muted">
            Secondary{'  '}
          </Text>
          {exercise.secondaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
        </Text>
      )}
    </View>
  );
}

export function Cues({ cues }: { cues: string[] }) {
  if (!cues.length) return null;
  return (
    <View style={styles.cues} accessibilityRole="list">
      {cues.map((cue, i) => (
        <View key={i} style={styles.cue} accessibilityRole="text">
          <Text variant="heading" color="accent" style={styles.num} numeric>
            {i + 1}
          </Text>
          <Text style={styles.flex}>{cue}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.lg, paddingBottom: space.md },
  legend: { gap: space.xxs },
  cues: { gap: space.sm },
  cue: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  num: { width: 22, lineHeight: 24 },
  flex: { flex: 1 },
});
