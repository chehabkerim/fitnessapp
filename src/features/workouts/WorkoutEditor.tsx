import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionSheet, Button, Sheet, Text } from '@/components';
import { useLive, useRepos, type Repos, type SetRow as SetRowData, type WorkoutDetail } from '@/db';
import { prFlags } from '@/lib/prs';
import { resolveRestSec, startRest } from '@/lib/rest';
import { haptics } from '@/platform/haptics';
import { restAlerts } from '@/platform/restAlerts';
import { restCue } from '@/platform/restCue';
import { space } from '@/theme';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseInfoSheet } from './ExerciseInfoSheet';
import { ExercisePickerSheet } from './ExercisePickerSheet';
import type { SetRowHandle } from './SetRow';

const REST_CHOICES = [45, 60, 90, 120, 150, 180];

/** Starts the rest timer for an exercise; the first time, asks (via onAsk) before requesting notification permission. */
function beginRest(repos: Repos, entry: WorkoutDetail['entries'][number], onAsk: () => void) {
  const sec = resolveRestSec(entry.we.restSec, entry.exercise.defaultRestSec, repos.settings.get().defaultRestSec);
  const r = startRest(Date.now(), sec);
  restCue.unlock();
  repos.appState.update({ restEndsAt: r.endsAt, restDurationSec: r.durationSec });
  if (!repos.appState.get().restNotificationAsked) {
    void restAlerts.permission().then((p) => {
      if (p === 'default') onAsk();
      else repos.appState.update({ restNotificationAsked: true });
    });
  }
}

/**
 * The set table for a whole workout: used by the active workout (with rest timer) and by the edit mode of a
 * past workout (no rest timer). Every change is written immediately.
 */
export function WorkoutEditor({ detail, live }: { detail: WorkoutDetail; live: boolean }) {
  const repos = useRepos();
  const units = useLive((r) => r.settings.get().units);
  const workoutId = detail.workout.id;
  const exerciseIds = detail.entries.map((e) => e.exercise.id).join(',');

  // History for "Previous" and PR checks (only changes when other workouts change).
  const context = useLive(
    (r) =>
      new Map(
        detail.entries.map((e) => [
          e.we.id,
          { last: r.workouts.lastSession(e.exercise.id, workoutId), bests: r.workouts.historyBests(e.exercise, detail.workout.startedAt, workoutId) },
        ]),
      ),
    [exerciseIds, workoutId],
  );

  const prSetIds = useMemo(() => {
    const ids = new Set<number>();
    for (const e of detail.entries) {
      const ctx = context.get(e.we.id);
      if (!ctx) continue;
      prFlags(e.sets, ctx.bests, e.exercise).forEach((_, id) => ids.add(id));
    }
    return ids;
  }, [detail, context]);

  const [focusRegistry] = useState(() => new Map<number, SetRowHandle | null>());
  const order = detail.entries.flatMap((e) => e.sets.map((s) => s.id));
  const nextSetAfter = (id: number) => order[order.indexOf(id) + 1];

  const [picker, setPicker] = useState(false);
  const [info, setInfo] = useState<WorkoutDetail['entries'][number]['exercise'] | null>(null);
  const [exMenu, setExMenu] = useState<WorkoutDetail['entries'][number] | null>(null);
  const [restMenu, setRestMenu] = useState<WorkoutDetail['entries'][number] | null>(null);
  const [setMenu, setSetMenu] = useState<{ set: SetRowData; name: string } | null>(null);
  const [askNotify, setAskNotify] = useState(false);

  const startRestFor = (entry: WorkoutDetail['entries'][number]) => {
    if (live) beginRest(repos, entry, () => setAskNotify(true));
  };

  const toggleComplete = (entry: WorkoutDetail['entries'][number], s: SetRowData) => {
    const done = s.completedAt == null;
    repos.workouts.setCompleted(s.id, done);
    if (done) {
      haptics.light();
      startRestFor(entry);
    }
  };

  return (
    <View style={styles.wrap}>
      {detail.entries.length === 0 && (
        <View style={styles.empty}>
          <Text variant="heading">Add your first exercise</Text>
          <Text color="muted">Pick from your library, or create one of your own.</Text>
        </View>
      )}
      {detail.entries.map((entry) => (
        <ExerciseCard
          key={entry.we.id}
          entry={entry}
          units={units}
          lastSession={context.get(entry.we.id)?.last ?? []}
          prSetIds={prSetIds}
          onPatchSet={(id, patch) => repos.workouts.updateSet(id, patch)}
          onToggleComplete={(s) => toggleComplete(entry, s)}
          onToggleWarmup={(s) => {
            haptics.selection();
            repos.workouts.setWarmup(s.id, !s.isWarmup);
          }}
          onDeleteSet={(s) => repos.workouts.deleteSet(s.id)}
          onSetMenu={(s) => setSetMenu({ set: s, name: entry.exercise.name })}
          onAddSet={() => {
            const id = repos.workouts.addSet(entry.we.id);
            setTimeout(() => focusRegistry.get(id)?.focusFirst(), 50);
          }}
          onMenu={() => setExMenu(entry)}
          onInfo={() => setInfo(entry.exercise)}
          focusRegistry={focusRegistry}
          nextSetAfter={nextSetAfter}
        />
      ))}
      <Button label="Add exercise" icon="plus" kind="secondary" onPress={() => setPicker(true)} />

      <ExercisePickerSheet
        visible={picker}
        onClose={() => setPicker(false)}
        addTo={live ? 'workout' : 'template'}
        onPick={(ids) => ids.forEach((id) => repos.workouts.addExercise(workoutId, id))}
      />
      <ExerciseInfoSheet exercise={info} onClose={() => setInfo(null)} />

      <ActionSheet
        visible={!!exMenu}
        onClose={() => setExMenu(null)}
        title={exMenu?.exercise.name ?? ''}
        actions={
          exMenu
            ? [
                { label: 'Move up', disabled: detail.entries[0]?.we.id === exMenu.we.id, onPress: () => repos.workouts.moveExercise(exMenu.we.id, -1) },
                { label: 'Move down', disabled: detail.entries[detail.entries.length - 1]?.we.id === exMenu.we.id, onPress: () => repos.workouts.moveExercise(exMenu.we.id, 1) },
                ...(live ? [{ label: 'Rest time', onPress: () => setTimeout(() => setRestMenu(exMenu), 250) }] : []),
                { label: 'Remove exercise', destructive: true, onPress: () => repos.workouts.removeExercise(exMenu.we.id) },
              ]
            : []
        }
      />
      <ActionSheet
        visible={!!restMenu}
        onClose={() => setRestMenu(null)}
        title="Rest time"
        message={restMenu ? `Rest after each set of ${restMenu.exercise.name}.` : undefined}
        actions={REST_CHOICES.map((sec) => ({
          label: `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}${restMenu && resolveRestSec(restMenu.we.restSec, restMenu.exercise.defaultRestSec, 90) === sec ? '  ✓' : ''}`,
          onPress: () => restMenu && repos.workouts.setRest(restMenu.we.id, sec),
        }))}
      />
      <ActionSheet
        visible={!!setMenu}
        onClose={() => setSetMenu(null)}
        title={setMenu ? `${setMenu.name} · set` : ''}
        actions={
          setMenu
            ? [
                { label: setMenu.set.isWarmup ? 'Mark as working set' : 'Mark as warm-up', onPress: () => repos.workouts.setWarmup(setMenu.set.id, !setMenu.set.isWarmup) },
                { label: 'Delete set', destructive: true, onPress: () => repos.workouts.deleteSet(setMenu.set.id) },
              ]
            : []
        }
      />
      <Sheet visible={askNotify} onClose={() => { setAskNotify(false); repos.appState.update({ restNotificationAsked: true }); }} title="Rest alerts">
        <Text style={styles.gap}>Allow notifications so we can tell you when rest is over, even if you switch apps.</Text>
        <Button
          label="Continue"
          onPress={() => {
            setAskNotify(false);
            repos.appState.update({ restNotificationAsked: true });
            void restAlerts.requestPermission();
          }}
        />
        <Button label="Not now" kind="ghost" compact onPress={() => { setAskNotify(false); repos.appState.update({ restNotificationAsked: true }); }} />
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.md },
  empty: { gap: space.xxs, paddingVertical: space.xl },
  gap: { marginBottom: space.lg },
});
