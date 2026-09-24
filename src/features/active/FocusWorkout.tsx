import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type TextInput } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { ActionSheet, Button, ExerciseTile, IconButton, Sheet, Text } from '@/components';
import { useLive, useRepos, type SetRow, type WorkoutDetail, type WorkoutEntry } from '@/db';
import { ExerciseInfoSheet } from '@/features/workouts/ExerciseInfoSheet';
import { ExercisePickerSheet } from '@/features/workouts/ExercisePickerSheet';
import { formatSetLong } from '@/features/workouts/format';
import { beginRest } from '@/features/workouts/rest';
import { usePointerFine } from '@/hooks/usePointerFine';
import { EQUIPMENT_LABELS, MUSCLE_LABELS, type Units } from '@/lib/domain';
import { chipsFor } from '@/lib/keypad';
import { PR_LABELS, prFlags } from '@/lib/prs';
import { headlineRecord } from '@/lib/train';
import { displayWeight, parseDecimal, parseInteger, toKg, unitLabel } from '@/lib/units';
import { haptics } from '@/platform/haptics';
import { restAlerts } from '@/platform/restAlerts';
import { fonts, radius, space, useTheme } from '@/theme';
import { AllExercisesSheet } from './AllExercisesSheet';
import { setParts } from './format';
import { Keypad } from './Keypad';
import { PrBanner } from './PrBanner';
import { RestPanel, useRestActive } from './RestPanel';
import { SetList } from './SetList';
import { ValueBox } from './ValueBox';

type Field = 'weight' | 'reps' | 'duration';

const firstIncomplete = (entries: WorkoutEntry[]) => Math.max(0, entries.findIndex((e) => e.sets.some((s) => s.completedAt == null)));

/** Label for a set within its exercise: "1", "2", or "W" for warm-ups. */
function setLabel(sets: SetRow[], set: SetRow): string {
  if (set.isWarmup) return 'W';
  return String(sets.filter((s) => !s.isWarmup).indexOf(set) + 1);
}

/**
 * Focus mode: one exercise at a time, one big set card, the set list, and Complete / Rest in the thumb zone.
 * Every edit is written immediately (web: saved within 250ms, and at once when the app is hidden).
 */
export function FocusWorkout({ detail, onFinish, onDiscard }: { detail: WorkoutDetail; onFinish(): void; onDiscard(): void }) {
  const { c } = useTheme();
  const repos = useRepos();
  const units = useLive((r) => r.settings.get().units);
  const typing = usePointerFine();
  const restActive = useRestActive();
  const workoutId = detail.workout.id;
  const entries = detail.entries;

  const [exIndex, setExIndex] = useState(() => firstIncomplete(entries));
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [keypad, setKeypad] = useState<Field | null>(null);
  const [banner, setBanner] = useState<{ record: string; value: string } | null>(null);
  const [sheet, setSheet] = useState<'all' | 'picker' | 'info' | 'notify' | null>(null);
  const [menuSet, setMenuSet] = useState<SetRow | null>(null);
  const [notes, setNotes] = useState(detail.workout.notes ?? '');
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const completeRef = useRef<View>(null);
  const focusAfterRender = useRef(false);

  const idx = Math.min(exIndex, Math.max(0, entries.length - 1));
  const entry = entries[idx];
  const ex = entry?.exercise;
  const current = entry ? (entry.sets.find((s) => s.id === selectedId) ?? entry.sets.find((s) => s.completedAt == null) ?? entry.sets[entry.sets.length - 1]) : undefined;
  const allDone = !!entry && entry.sets.length > 0 && entry.sets.every((s) => s.completedAt != null);

  const context = useLive(
    (r) => (entry ? { last: r.workouts.lastSession(entry.exercise.id, workoutId), bests: r.workouts.historyBests(entry.exercise, detail.workout.startedAt, workoutId) } : null),
    [entry?.we.id, workoutId],
  );
  const prIds = new Set(entry && context ? prFlags(entry.sets, context.bests, entry.exercise).keys() : []);

  // After completing with the keyboard, move focus to the next set's weight.
  useEffect(() => {
    if (!focusAfterRender.current) return;
    focusAfterRender.current = false;
    (weightRef.current ?? repsRef.current)?.focus();
  }, [current?.id]);

  const go = useCallback(
    (i: number) => {
      setExIndex(Math.max(0, Math.min(entries.length - 1, i)));
      setSelectedId(null);
      setBanner(null);
    },
    [entries.length],
  );

  // Rest ended (timer or Skip): drop the banner; after an exercise's last set, move to the next exercise.
  const onRestFinished = useCallback(() => {
    setBanner(null);
    const fresh = repos.workouts.detail(workoutId);
    const e = fresh?.entries[idx];
    if (e && e.sets.length > 0 && e.sets.every((s) => s.completedAt != null) && idx < (fresh?.entries.length ?? 0) - 1) go(idx + 1);
  }, [repos, workoutId, idx, go]);

  if (!entry || !ex || !current) {
    return (
      <View style={styles.empty}>
        <Text variant="heading">Add your first exercise</Text>
        <Text color="muted">Pick from your library, or create one of your own.</Text>
        <Button label="Add exercise" icon="plus" onPress={() => setSheet('picker')} />
        <ExercisePickerSheet visible={sheet === 'picker'} onClose={() => setSheet(null)} addTo="workout" onPick={(ids) => ids.forEach((id) => repos.workouts.addExercise(workoutId, id))} />
      </View>
    );
  }

  const label = setLabel(entry.sets, current);
  const working = entry.sets.filter((s) => !s.isWarmup);
  const each = ex.loadMode === 'per_dumbbell';
  const weightCaption = ex.logType === 'bodyweight_added' ? 'Added' : `${unitLabel(units)}${each ? ' each' : ''}`;
  const hasWeight = ex.logType === 'weight_reps' || ex.logType === 'bodyweight_added';
  const secondField: Field = ex.logType === 'duration' ? 'duration' : 'reps';
  const prev = context?.last[entry.sets.indexOf(current)];
  const setName = `${ex.name}, set ${label === 'W' ? 'warm-up' : label}`;

  const patch = (p: Partial<Pick<SetRow, 'weightKg' | 'reps' | 'durationSec'>>) => repos.workouts.updateSet(current.id, p);
  const setField = (field: Field, text: string) => {
    if (field === 'weight') {
      const v = parseDecimal(text);
      patch({ weightKg: v == null ? null : toKg(v, units) });
    } else if (field === 'reps') patch({ reps: parseInteger(text) });
    else patch({ durationSec: parseInteger(text) });
  };
  const fieldText = (field: Field) => (field === 'weight' ? displayWeight(current.weightKg, units) : field === 'reps' ? (current.reps?.toString() ?? '') : (current.durationSec?.toString() ?? ''));

  const complete = (set: SetRow) => {
    if (set.completedAt != null) {
      setSelectedId(null);
      return;
    }
    repos.workouts.setCompleted(set.id, true);
    haptics.strong();
    const fresh = repos.workouts.detail(workoutId)?.entries.find((e) => e.we.id === entry.we.id);
    if (fresh) {
      const bests = repos.workouts.historyBests(fresh.exercise, detail.workout.startedAt, workoutId);
      const metrics = prFlags(fresh.sets, bests, fresh.exercise).get(set.id);
      const metric = metrics && headlineRecord(metrics);
      const done = fresh.sets.find((s) => s.id === set.id)!;
      if (metric) {
        setBanner({ record: PR_LABELS[metric], value: formatSetLong(done, fresh.exercise, units) });
        haptics.strong();
      } else setBanner(null);
      beginRest(repos, fresh, () => setSheet('notify'));
    }
    setSelectedId(null);
    focusAfterRender.current = typing;
  };

  // What comes after the rest: the first unfinished set here (usually the current one), else the next exercise.
  const nextSet = entry.sets.find((s) => s.completedAt == null);
  const nextText = nextSet
    ? `Next: set ${setLabel(entry.sets, nextSet)} · ${setParts(nextSet, ex, units).text}`
    : entries[idx + 1]
      ? `Next: ${entries[idx + 1]!.exercise.name}`
      : 'Last set of the workout';

  const swipe = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-16, 16])
    .runOnJS(true)
    .onEnd((e) => {
      if (e.translationX < -60) go(idx + 1);
      else if (e.translationX > 60) go(idx - 1);
    });

  const bottom = restActive ? (
    <RestPanel label={ex.name} next={nextText} onFinished={onRestFinished} />
  ) : allDone && current.completedAt != null ? (
    idx < entries.length - 1 ? (
      <Button label="Next exercise" icon="arrowRight" onPress={() => go(idx + 1)} />
    ) : (
      <Button label="Finish workout" icon="check" onPress={onFinish} />
    )
  ) : (
    <View ref={completeRef} collapsable={false}>
      <Button
        label={current.completedAt != null ? 'Done editing' : `Complete set ${label}`}
        icon="check"
        a11yLabel={current.completedAt != null ? `Done editing ${setName}` : `Complete ${setName}`}
        onPress={() => complete(current)}
        testID="complete-set"
      />
    </View>
  );

  return (
    <View style={styles.fill}>
      <GestureDetector gesture={swipe}>
        <View style={styles.fill}>
          <ScrollBody>
            {!banner && (
              <View style={styles.progressRow}>
                <Pressable onPress={() => setSheet('all')} accessibilityRole="button" accessibilityLabel={`Exercise ${idx + 1} of ${entries.length}. All exercises`} style={styles.counter}>
                  <Text variant="overline" color="muted" numeric>
                    Exercise {idx + 1} of {entries.length}
                  </Text>
                </Pressable>
                <View style={styles.dashes}>
                  {entries.map((e, i) => {
                    const done = e.sets.length > 0 && e.sets.every((s) => s.completedAt != null);
                    return (
                      <Pressable key={e.we.id} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={`Go to ${e.exercise.name}`} hitSlop={{ top: 14, bottom: 14 }} style={styles.dashHit}>
                        <View style={[styles.dash, { backgroundColor: i === idx || done ? c.accent : c.line, opacity: done && i !== idx ? 0.55 : 1 }]} />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {banner ? (
              <Text style={[styles.exName, styles.exNameCompact, { color: c.ink }]} numberOfLines={1} accessibilityRole="header">
                {ex.name}
              </Text>
            ) : (
              <View style={styles.exHeader}>
                <Pressable onPress={() => setSheet('info')} accessibilityRole="button" accessibilityLabel={`${ex.name}: form cues and muscles`}>
                  <ExerciseTile exercise={ex} px={64} />
                </Pressable>
                <View style={styles.flex}>
                  <Text style={[styles.exName, { color: c.ink }]} accessibilityRole="header">
                    {ex.name}
                  </Text>
                  <Text variant="caption" color="muted">
                    {ex.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')} · {EQUIPMENT_LABELS[ex.equipment]}
                  </Text>
                </View>
                <IconButton icon="info" label={`How to do ${ex.name}`} outlined round onPress={() => setSheet('info')} />
              </View>
            )}

            {banner ? (
              <PrBanner record={banner.record} value={banner.value} />
            ) : (
              <View style={[styles.setCard, { backgroundColor: c.surface, borderColor: c.cardBorder, borderWidth: c.cardBorderWidth }]}>
                <View style={styles.setHead}>
                  <Text variant="overline" color="accentText" numeric style={styles.flex}>
                    {label === 'W' ? 'Warm-up set' : `Set ${label} of ${working.length}`}
                  </Text>
                  <Text variant="overline" color="muted">
                    {typing ? 'Type or tap a number' : 'Tap a number to change it'}
                  </Text>
                </View>
                <View style={styles.values}>
                  {hasWeight && (
                    <>
                      <ValueBox
                        ref={weightRef}
                        label={`${ex.logType === 'bodyweight_added' ? 'Added weight' : 'Weight'}, ${setName}`}
                        caption={weightCaption}
                        value={fieldText('weight')}
                        placeholder={ex.logType === 'bodyweight_added' ? '+0' : '0'}
                        decimal
                        typing={typing}
                        onChangeText={(t) => setField('weight', t)}
                        onSubmit={() => complete(current)}
                        onOpenKeypad={() => setKeypad('weight')}
                      />
                      <Text style={[styles.times, { color: c.times }]} accessibilityElementsHidden>
                        ×
                      </Text>
                    </>
                  )}
                  <ValueBox
                    ref={repsRef}
                    label={`${secondField === 'duration' ? 'Seconds' : 'Reps'}, ${setName}`}
                    caption={secondField === 'duration' ? 'Sec' : 'Reps'}
                    value={fieldText(secondField)}
                    typing={typing}
                    onChangeText={(t) => setField(secondField, t)}
                    onSubmit={() => complete(current)}
                    onOpenKeypad={() => setKeypad(secondField)}
                    onTabForward={() => focusFirstButton(completeRef.current)}
                    size={hasWeight ? 'large' : 'wide'}
                  />
                </View>
                <Pressable
                  disabled={!prev}
                  tabIndex={-1}
                  onPress={() => prev && patch({ weightKg: prev.weightKg, reps: prev.reps, durationSec: prev.durationSec })}
                  accessibilityRole="button"
                  accessibilityLabel={prev ? `Previous: ${setParts(prev, ex, units).text}. Copy into this set` : 'No previous set'}
                  style={(s) => [styles.previous, { borderColor: c.outline, opacity: s.pressed ? 0.6 : 1 }]}
                >
                  <Text variant="overline" color="muted">
                    Previous
                  </Text>
                  <Text style={[styles.prevValue, { color: c.ink }]} numeric>
                    {prev ? setParts(prev, ex, units).text : '—'}
                  </Text>
                  <Text variant="caption" color="muted">
                    {prev ? 'Tap to copy' : 'First time'}
                  </Text>
                </Pressable>
              </View>
            )}

            <SetList
              exercise={ex}
              sets={entry.sets}
              units={units}
              currentId={current.completedAt == null ? current.id : undefined}
              resting={restActive}
              prIds={prIds}
              onSelect={(s) => setSelectedId(s.id)}
              onToggleDone={(s) => repos.workouts.setCompleted(s.id, false)}
              onMenu={setMenuSet}
              onDelete={(s) => repos.workouts.deleteSet(s.id)}
              onAddSet={() => setSelectedId(repos.workouts.addSet(entry.we.id))}
            />
          </ScrollBody>
        </View>
      </GestureDetector>

      <View
        style={[
          styles.bottom,
          restActive
            ? [styles.restSheet, { backgroundColor: c.surface, borderColor: c.line }]
            : { backgroundColor: c.bg },
        ]}
      >
        {bottom}
      </View>

      <Keypad
        visible={keypad != null}
        title={keypad === 'weight' ? (ex.logType === 'bodyweight_added' ? 'Added' : 'Weight') : keypad === 'duration' ? 'Seconds' : 'Reps'}
        setLabel={label === 'W' ? 'Warm-up' : `Set ${label}`}
        unit={keypad === 'weight' ? weightCaption : keypad === 'duration' ? 'sec' : 'reps'}
        value={keypad ? fieldText(keypad) : ''}
        decimal={keypad === 'weight'}
        chips={keypad ? chipsFor(keypad, units as Units) : []}
        onChange={(t) => keypad && setField(keypad, t)}
        switchLabel={hasWeight ? (keypad === 'weight' ? (secondField === 'duration' ? 'Seconds' : 'Reps') : 'Weight') : undefined}
        switchDirection={keypad === 'weight' ? 'forward' : 'back'}
        onSwitch={hasWeight ? () => setKeypad(keypad === 'weight' ? secondField : 'weight') : undefined}
        onDone={() => setKeypad(null)}
      />
      <ExerciseInfoSheet exercise={sheet === 'info' ? ex : null} onClose={() => setSheet(null)} />
      <AllExercisesSheet
        visible={sheet === 'all'}
        onClose={() => setSheet(null)}
        entries={entries}
        currentIndex={idx}
        onJump={(i) => {
          go(i);
          setSheet(null);
        }}
        onMove={(e, d) => repos.workouts.moveExercise(e.we.id, d)}
        onRemove={(e) => repos.workouts.removeExercise(e.we.id)}
        onAdd={() => {
          setSheet(null);
          setTimeout(() => setSheet('picker'), 250);
        }}
        notes={notes}
        onNotes={setNotes}
        onNotesDone={() => repos.workouts.setNotes(workoutId, notes)}
        onDiscard={() => {
          setSheet(null);
          setTimeout(onDiscard, 250);
        }}
      />
      <ExercisePickerSheet visible={sheet === 'picker'} onClose={() => setSheet(null)} addTo="workout" onPick={(ids) => ids.forEach((id) => repos.workouts.addExercise(workoutId, id))} />
      <ActionSheet
        visible={!!menuSet}
        onClose={() => setMenuSet(null)}
        title={menuSet ? `${ex.name} · set ${setLabel(entry.sets, menuSet)}` : ''}
        actions={
          menuSet
            ? [
                { label: menuSet.isWarmup ? 'Mark as working set' : 'Mark as warm-up', onPress: () => repos.workouts.setWarmup(menuSet.id, !menuSet.isWarmup) },
                ...(menuSet.completedAt != null ? [{ label: 'Mark as not done', onPress: () => repos.workouts.setCompleted(menuSet.id, false) }] : []),
                { label: 'Delete set', destructive: true, onPress: () => repos.workouts.deleteSet(menuSet.id) },
              ]
            : []
        }
      />
      <Sheet visible={sheet === 'notify'} onClose={() => { setSheet(null); repos.appState.update({ restNotificationAsked: true }); }} title="Rest alerts">
        <Text style={styles.gap}>Allow notifications so we can tell you when rest is over, even if you switch apps.</Text>
        <Button
          label="Continue"
          onPress={() => {
            setSheet(null);
            repos.appState.update({ restNotificationAsked: true });
            void restAlerts.requestPermission();
          }}
        />
        <Button label="Not now" kind="ghost" compact onPress={() => { setSheet(null); repos.appState.update({ restNotificationAsked: true }); }} />
      </Sheet>
    </View>
  );
}

/** Focus the first focusable element (the Complete button) inside a wrapper on web. */
function focusFirstButton(node: unknown) {
  const el = node as { querySelector?: (s: string) => { focus(): void } | null } | null;
  el?.querySelector?.('[role="button"]')?.focus();
}

function ScrollBody({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: space.md, paddingBottom: space.xl, gap: space.md },
  empty: { flex: 1, padding: space.xl, gap: space.md, justifyContent: 'center' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  counter: { minHeight: 32, justifyContent: 'center', flex: 1 },
  dashes: { flexDirection: 'row', gap: 6 },
  dashHit: { paddingVertical: 8 },
  dash: { width: 18, height: 3, borderRadius: 2 },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  exName: { fontFamily: fonts.cond800i, fontSize: 30, lineHeight: 30, textTransform: 'uppercase' },
  exNameCompact: { fontSize: 26, lineHeight: 30 },
  setCard: { borderRadius: radius.card, padding: space.md, gap: space.sm },
  setHead: { flexDirection: 'row', alignItems: 'center' },
  values: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  times: { fontFamily: fonts.cond700, fontSize: 24 },
  previous: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderStyle: 'dashed', borderRadius: radius.row, paddingHorizontal: space.md, minHeight: 48 },
  prevValue: { fontFamily: fonts.cond700, fontSize: 22 },
  bottom: { paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm },
  restSheet: { paddingTop: space.md, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1 },
  gap: { marginBottom: space.lg },
});
