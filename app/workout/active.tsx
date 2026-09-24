import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet, Button, EmptyState, IconButton, Screen, Text } from '@/components';
import { flushNow, useLive, useRepos, type WorkoutDetail } from '@/db';
import { FocusWorkout } from '@/features/active/FocusWorkout';
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
        <EmptyState title="No workout in progress" body="Start one from the Train tab.">
          <Button label="Go to Train" onPress={() => router.replace('/workouts')} />
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
  const insets = useSafeAreaInsets();
  const w = detail.workout;
  const now = useNow(1000);
  const [menu, setMenu] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState<number | null>(null);

  const finish = async (discardIncomplete: boolean) => {
    const firstEver = repos.workouts.finishedCount() === 0;
    repos.workouts.finish(w.id, { discardIncomplete });
    repos.appState.update({ restEndsAt: null, restDurationSec: null });
    if (firstEver && repos.appState.get().storagePersistRequestedAt == null) {
      repos.appState.update({ storagePersistRequestedAt: Date.now() });
      void requestPersistentStorage();
    }
    await flushNow();
    router.replace({ pathname: '/workout/summary', params: { id: String(w.id) } });
  };
  const onFinish = () => {
    const incomplete = repos.workouts.incompleteCount(w.id);
    if (incomplete > 0) setConfirmFinish(incomplete);
    else void finish(false);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + space.xs, paddingBottom: insets.bottom }]}>
      <View style={styles.topBar}>
        <IconButton icon="down" label="Minimise workout" outlined onPress={minimise} />
        <View style={styles.center}>
          <Text variant="overline" color="muted" numberOfLines={1}>
            {w.name ?? 'Workout'}
          </Text>
          <Text style={[styles.elapsed, { color: c.ink }]} numeric accessibilityLabel={`Elapsed ${formatElapsed(w.startedAt, now)}`}>
            {formatElapsed(w.startedAt, now)}
          </Text>
        </View>
        <Button label="Finish" kind="accent" compact onPress={onFinish} />
      </View>

      <FocusWorkout detail={detail} onFinish={onFinish} onDiscard={() => setMenu(true)} />

      <ActionSheet
        visible={menu}
        onClose={() => setMenu(false)}
        title="Discard this workout?"
        message="Its sets are deleted. This can't be undone."
        actions={[
          {
            label: 'Discard workout',
            destructive: true,
            onPress: () => {
              repos.workouts.discard(w.id);
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: space.sm, gap: space.xs },
  center: { flex: 1, alignItems: 'center' },
  elapsed: { fontFamily: fonts.cond800i, fontSize: 24, lineHeight: 26 },
});
