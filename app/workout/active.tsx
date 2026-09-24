import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionSheet, Button, EmptyState, IconButton, Screen, Text } from '@/components';
import { flushNow, useLive, useRepos, type WorkoutDetail } from '@/db';
import { RestTimerBar } from '@/features/workouts/RestTimerBar';
import { WorkoutEditor } from '@/features/workouts/WorkoutEditor';
import { useNow } from '@/hooks/useNow';
import { formatElapsed } from '@/lib/format';
import { useKeepAwakeWhile } from '@/platform/keepAwake';
import { requestPersistentStorage } from '@/platform/storage';
import { fonts, space, useTheme } from '@/theme';

export default function ActiveWorkout() {
  const router = useRouter();
  const active = useLive((r) => r.workouts.active());
  const detail = useLive((r) => (active ? r.workouts.detail(active.id) : undefined), [active?.id]);
  useKeepAwakeWhile(!!active);
  const minimise = () => (router.canGoBack() ? router.back() : router.replace('/workouts'));

  if (!detail) {
    return (
      <Screen back={minimise}>
        <EmptyState title="No workout in progress" body="Start one from the Workouts tab.">
          <Button label="Go to workouts" onPress={() => router.replace('/workouts')} />
        </EmptyState>
      </Screen>
    );
  }
  return <ActiveWorkoutBody key={detail.workout.id} detail={detail} minimise={minimise} />;
}

function ActiveWorkoutBody({ detail, minimise }: { detail: WorkoutDetail; minimise: () => void }) {
  const { c } = useTheme();
  const router = useRouter();
  const repos = useRepos();
  const active = detail.workout;
  const now = useNow(1000);
  const [name, setName] = useState(active.name ?? '');
  const [notes, setNotes] = useState(active.notes ?? '');
  const [menu, setMenu] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState<number | null>(null);

  const finish = async (discardIncomplete: boolean) => {
    const id = active.id;
    const firstEver = repos.workouts.finishedCount() === 0;
    repos.workouts.finish(id, { discardIncomplete });
    repos.appState.update({ restEndsAt: null, restDurationSec: null });
    const state = repos.appState.get();
    if (firstEver && state.storagePersistRequestedAt == null) {
      repos.appState.update({ storagePersistRequestedAt: Date.now() });
      void requestPersistentStorage();
    }
    await flushNow();
    router.replace({ pathname: '/workout/summary', params: { id: String(id) } });
  };

  const onFinish = () => {
    const incomplete = repos.workouts.incompleteCount(active.id);
    if (incomplete > 0) setConfirmFinish(incomplete);
    else void finish(false);
  };

  const lastDone = detail.entries
    .flatMap((e) => e.sets.map((s) => ({ s, name: e.exercise.name })))
    .filter((x) => x.s.completedAt != null)
    .sort((a, b) => (b.s.completedAt ?? 0) - (a.s.completedAt ?? 0))[0];

  return (
    <Screen
      back={minimise}
      right={
        <View style={styles.headerRight}>
          <IconButton icon="more" label="Workout options" onPress={() => setMenu(true)} />
          <Button label="Finish" compact onPress={onFinish} />
        </View>
      }
      footer={<RestTimerBar label={lastDone?.name ?? 'your exercise'} />}
    >
      <View style={styles.titleBlock}>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={() => repos.workouts.rename(active.id, name)}
          onSubmitEditing={() => repos.workouts.rename(active.id, name)}
          placeholder="Workout"
          placeholderTextColor={c.faint}
          accessibilityLabel="Workout name"
          style={[styles.name, { color: c.ink }]}
          returnKeyType="done"
        />
        <Text style={styles.elapsed} numeric accessibilityLabel={`Elapsed ${formatElapsed(active.startedAt, now)}`}>
          {formatElapsed(active.startedAt, now)}
        </Text>
      </View>

      <View style={styles.editor}>
        <WorkoutEditor detail={detail} live />
      </View>

      <TextInput
        value={notes}
        onChangeText={setNotes}
        onBlur={() => repos.workouts.setNotes(active.id, notes)}
        placeholder="Notes"
        placeholderTextColor={c.faint}
        multiline
        accessibilityLabel="Workout notes"
        style={[styles.notes, { color: c.ink, borderColor: c.line }]}
      />

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title="Workout"
        actions={[
          {
            label: 'Discard workout',
            destructive: true,
            onPress: () => {
              repos.workouts.discard(active.id);
              repos.appState.update({ restEndsAt: null, restDurationSec: null });
              router.replace('/workouts');
            },
          },
        ]}
      />
      <ActionSheet
        visible={confirmFinish != null}
        onClose={() => setConfirmFinish(null)}
        title="Finish workout?"
        message={`${confirmFinish} set${confirmFinish === 1 ? " isn't" : "s aren't"} ticked. Unticked sets are discarded.`}
        actions={[
          { label: 'Discard them and finish', onPress: () => void finish(true) },
          { label: 'Keep logging', onPress: () => {} },
        ]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  titleBlock: { marginTop: space.xs, marginBottom: space.lg },
  name: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, padding: 0, minHeight: 44 },
  elapsed: { fontFamily: fonts.display, fontSize: 44, lineHeight: 50, marginTop: space.xxs },
  editor: { marginHorizontal: -space.xs },
  notes: { marginTop: space.xl, borderWidth: 1, borderRadius: 12, padding: space.sm, minHeight: 88, fontFamily: fonts.body, fontSize: 16, textAlignVertical: 'top' },
});
