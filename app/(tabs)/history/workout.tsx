import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionSheet, Button, Card, Divider, EmptyState, ExerciseTile, IconButton, Screen, Sheet, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { formatSetLong, formatVolumeIn } from '@/features/workouts/format';
import { useStartWorkout } from '@/features/workouts/useStartWorkout';
import { WorkoutEditor } from '@/features/workouts/WorkoutEditor';
import { formatDay, formatDuration } from '@/lib/format';
import { unitLabel } from '@/lib/units';
import { fonts, radius, space, useTheme } from '@/theme';

export default function PastWorkout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const { start, sheet } = useStartWorkout();
  const detail = useLive((r) => r.workouts.detail(Number(id)), [id]);
  const row = useLive((r) => r.workouts.history().find((h) => h.workout.id === Number(id)), [id]);
  const units = useLive((r) => r.settings.get().units);
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');

  if (!detail) {
    return (
      <Screen back>
        <EmptyState title="Workout not found" body="It may have been deleted." />
      </Screen>
    );
  }
  const w = detail.workout;

  return (
    <Screen
      back
      eyebrow={formatDay(w.date)}
      title={w.name ?? 'Workout'}
      right={
        editing ? (
          <Button label="Done" compact onPress={() => setEditing(false)} />
        ) : (
          <View style={styles.row}>
            <IconButton icon="edit" label="Edit workout" onPress={() => setEditing(true)} />
            <IconButton icon="more" label="Workout options" onPress={() => setMenu(true)} />
          </View>
        )
      }
    >
      {row && (
        <Text color="muted" numeric style={styles.meta}>
          {formatDuration(row.durationMs)} · {formatVolumeIn(row.volume, units)} {unitLabel(units)} · {row.setsCompleted} sets
        </Text>
      )}

      {editing ? (
        <View style={styles.editor}>
          <WorkoutEditor detail={detail} live={false} />
        </View>
      ) : (
        <View style={styles.list}>
          {detail.entries.map((e) => (
            <Card key={e.we.id} style={styles.card}>
              <View style={styles.row}>
                <ExerciseTile exercise={e.exercise} px={44} />
                <Text variant="subheading" style={styles.flex} onPress={() => router.push({ pathname: '/exercises/detail', params: { id: String(e.exercise.id) } })}>
                  {e.exercise.name}
                </Text>
              </View>
              <Divider />
              {(() => {
                let n = 0;
                return e.sets.map((s) => (
                  <View key={s.id} style={styles.setLine}>
                    <Text variant="label" color={s.isWarmup ? 'accentText' : 'muted'} style={styles.setNo} numeric>
                      {s.isWarmup ? 'W' : ++n}
                    </Text>
                    <Text numeric>{formatSetLong(s, e.exercise, units)}</Text>
                  </View>
                ));
              })()}
            </Card>
          ))}
          {w.notes ? (
            <Card>
              <Text variant="overline" color="muted">Notes</Text>
              <Text>{w.notes}</Text>
            </Card>
          ) : null}
          <Button label="Repeat this workout" icon="repeat" onPress={() => start({ kind: 'repeat', workoutId: w.id })} />
        </View>
      )}

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title={w.name ?? 'Workout'}
        actions={[
          { label: 'Repeat this workout', onPress: () => start({ kind: 'repeat', workoutId: w.id }) },
          { label: 'Save as template', onPress: () => { setTemplateName(w.name ?? ''); setTimeout(() => setSaveOpen(true), 250); } },
          { label: 'Delete workout', destructive: true, onPress: () => setTimeout(() => setConfirmDelete(true), 250) },
        ]}
      />
      <ActionSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this workout?"
        message="Its sets and any records it set are removed. This can't be undone."
        actions={[{ label: 'Delete workout', destructive: true, onPress: () => { repos.workouts.remove(w.id); router.back(); } }]}
      />
      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)} title="Save as template">
        <TextInput
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="Template name"
          placeholderTextColor={c.muted}
          accessibilityLabel="Template name"
          style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
        />
        <Button label="Save template" disabled={!templateName.trim()} onPress={() => { repos.templates.fromWorkout(w.id, templateName.trim()); setSaveOpen(false); }} />
      </Sheet>
      {sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  meta: { marginTop: -space.sm, marginBottom: space.lg },
  list: { gap: space.md },
  editor: { marginHorizontal: -space.xs },
  card: { gap: space.sm },
  setLine: { flexDirection: 'row', alignItems: 'center', minHeight: 28, gap: space.sm },
  setNo: { width: 22 },
  input: { borderWidth: 1, borderRadius: radius.md, minHeight: 48, paddingHorizontal: space.sm, fontFamily: fonts.body, fontSize: 16, marginBottom: space.md },
});
