import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionSheet, Button, Card, Divider, EmptyState, EquipmentGlyph, ExerciseHero, IconButton, LineChart, Screen, SectionTitle, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { Cues, MuscleLegend } from '@/features/workouts/ExerciseInfoSheet';
import { formatRecord, formatSetLong } from '@/features/workouts/format';
import { EQUIPMENT_LABELS, LOG_TYPE_LABELS } from '@/lib/domain';
import { estimateOneRepMax } from '@/lib/e1rm';
import { formatDay } from '@/lib/format';
import { bestsOf, metricsFor, PR_LABELS } from '@/lib/prs';
import { displayWeight, unitLabel } from '@/lib/units';
import { photos } from '@/platform/photos';
import { fonts, radius, space, useTheme } from '@/theme';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const exercise = useLive((r) => r.exercises.get(Number(id)), [id]);
  const sessions = useLive((r) => r.workouts.sessions(Number(id)), [id]);
  const units = useLive((r) => r.settings.get().units);
  const [menu, setMenu] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!exercise) {
    return (
      <Screen back>
        <EmptyState title="Exercise not found" />
      </Screen>
    );
  }

  const bests = bestsOf(sessions.flatMap((s) => s.sets), exercise);
  const metrics = metricsFor(exercise);
  const each = exercise.loadMode === 'per_dumbbell';
  const chartPoints =
    exercise.logType === 'weight_reps'
      ? [...sessions]
          .reverse()
          .map((s) => ({ s, best: Math.max(0, ...s.sets.filter((x) => !x.isWarmup).map((x) => estimateOneRepMax(x.weightKg, x.reps) ?? 0)) }))
          .filter((p) => p.best > 0)
          .map((p) => ({ x: p.s.startedAt, y: p.best, label: formatDay(p.s.date).slice(4) }))
      : [];

  const takePhoto = async () => {
    setBusy(true);
    try {
      const pid = await photos.capture();
      if (!pid) return;
      if (exercise.photoId) await photos.remove(exercise.photoId);
      repos.exercises.setPhoto(exercise.id, pid);
    } finally {
      setBusy(false);
    }
  };

  const menuActions = [
    ...(photos.canCapture ? [{ label: exercise.photoId ? 'Replace photo' : 'Add a photo', onPress: () => void takePhoto() }] : []),
    ...(exercise.photoId ? [{ label: 'Remove photo', onPress: () => { void photos.remove(exercise.photoId!); repos.exercises.setPhoto(exercise.id, null); } }] : []),
    { label: 'Edit exercise', onPress: () => router.push({ pathname: '/exercise/edit', params: { id: String(exercise.id) } }) },
    { label: 'Archive exercise', destructive: true, onPress: () => { repos.exercises.setArchived(exercise.id, true); router.back(); } },
  ];

  return (
    <Screen back title={exercise.name} right={<IconButton icon="more" label="Exercise options" onPress={() => setMenu(true)} disabled={busy} />}>
      <ExerciseHero exercise={exercise} />

      <View style={styles.facts}>
        <View style={styles.row}>
          <EquipmentGlyph equipment={exercise.equipment} size={20} />
          <Text variant="label" style={styles.flex}>
            {EQUIPMENT_LABELS[exercise.equipment]}
            <Text variant="label" color="muted">
              {'  ·  '}
              {LOG_TYPE_LABELS[exercise.logType]}
              {each ? '  ·  weight per dumbbell' : ''}
            </Text>
          </Text>
        </View>
        <MuscleLegend exercise={exercise} />
      </View>

      {photos.canCapture && !exercise.photoId && (
        <Button label="Add your own photo" icon="camera" kind="secondary" compact onPress={() => void takePhoto()} loading={busy} style={styles.photoBtn} />
      )}

      {exercise.cues.length > 0 && (
        <>
          <SectionTitle>How to</SectionTitle>
          <Cues cues={exercise.cues} />
        </>
      )}

      <SectionTitle>Personal records</SectionTitle>
      {sessions.length === 0 ? (
        <Text color="muted">Records appear after your first session with this exercise.</Text>
      ) : (
        <View style={styles.prGrid}>
          {metrics.map((m) => (
            <View key={m} style={[styles.prCard, { borderColor: c.line, backgroundColor: c.surface }]} accessible accessibilityLabel={`${PR_LABELS[m]}: ${bests[m] != null ? formatRecord({ metric: m, value: bests[m]!, previous: 0 }, exercise, units) : 'none yet'}`}>
              <Text variant="caption" color="muted">{PR_LABELS[m]}</Text>
              <RecordValue text={bests[m] != null ? formatRecord({ metric: m, value: bests[m]!, previous: 0 }, exercise, units) : '—'} />
            </View>
          ))}
        </View>
      )}

      {chartPoints.length >= 2 && (
        <>
          <SectionTitle>Estimated 1RM</SectionTitle>
          <Card>
            <LineChart
              points={chartPoints}
              format={(v) => `${displayWeight(v, units)} ${unitLabel(units)}${each ? ' each' : ''}`}
              accessibilityLabel={`Estimated one-rep max over ${chartPoints.length} sessions, latest ${displayWeight(chartPoints[chartPoints.length - 1]!.y, units)} ${unitLabel(units)}`}
            />
          </Card>
        </>
      )}

      <SectionTitle>History</SectionTitle>
      {sessions.length === 0 ? (
        <Text color="muted">No sessions yet.</Text>
      ) : (
        <Card padded={false}>
          {sessions.map((s, i) => (
            <View key={s.workoutId}>
              {i > 0 && <Divider inset={space.md} />}
              <View style={styles.session}>
                <Text variant="label" color="muted" onPress={() => router.push({ pathname: '/workouts/history', params: { id: String(s.workoutId) } })}>
                  {formatDay(s.date)}
                </Text>
                {s.sets.map((x, n) => (
                  <Text key={x.id} numeric color={x.isWarmup ? 'muted' : 'ink'}>
                    {x.isWarmup ? 'W  ' : `${n + 1}  `}
                    {formatSetLong(x, exercise, units)}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </Card>
      )}

      <ActionSheet visible={menu} onClose={() => setMenu(false)} title={exercise.name} actions={menuActions} />
    </Screen>
  );
}

/** "31.75 kg each" → large "31.75" with "kg each" beneath, so values never wrap mid-unit. */
function RecordValue({ text }: { text: string }) {
  const { c } = useTheme();
  const [num, ...rest] = text.split(' ');
  return (
    <View>
      <Text style={[styles.prValue, { color: c.ink }]} numeric>
        {num}
      </Text>
      {rest.length > 0 && (
        <Text variant="caption" color="muted">
          {rest.join(' ')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, flexWrap: 'wrap' },
  facts: { gap: space.sm, marginTop: space.lg },
  photoBtn: { marginTop: space.md, alignSelf: 'flex-start' },
  prGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  prCard: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.xxs },
  prValue: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34 },
  session: { padding: space.md, gap: 2 },
});
