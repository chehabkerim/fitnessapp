import { useRouter } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Divider, EmptyState, Icon, IconButton, ListRow, Screen, SectionTitle, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { formatVolumeIn } from '@/features/workouts/format';
import { useStartWorkout } from '@/features/workouts/useStartWorkout';
import { useNow } from '@/hooks/useNow';
import { groupByWeek, toLocalDate } from '@/lib/dates';
import { formatDay, formatDuration, formatWeekLabel } from '@/lib/format';
import { shouldShowInstallNudge } from '@/lib/nudge';
import { unitLabel } from '@/lib/units';
import { install } from '@/platform/install';
import { radius, space, useTheme } from '@/theme';

export default function WorkoutsHome() {
  const router = useRouter();
  const { c } = useTheme();
  const repos = useRepos();
  const { start, sheet } = useStartWorkout();
  const active = useLive((r) => r.workouts.active());
  const templates = useLive((r) => r.templates.list());
  const history = useLive((r) => r.workouts.history());
  const units = useLive((r) => r.settings.get().units);
  const state = useLive((r) => r.appState.get());
  const standalone = useSyncExternalStore(install.subscribe, install.isStandalone, () => true);
  const now = useNow(60_000);
  const today = toLocalDate(new Date(now));
  const weeks = groupByWeek(history, (h) => h.workout.date);
  const nudge = shouldShowInstallNudge({ finishedWorkouts: history.length, standalone, lastExportAt: state.lastExportAt, shownAt: state.installNudgeShownAt, now });

  return (
    <Screen title="Workouts" eyebrow={formatDay(today)} inTabs>
      {active && (
        <Card style={[styles.activeCard, { borderColor: c.sage }]}>
          <Text variant="overline" color="muted">In progress</Text>
          <Text variant="heading">{active.name ?? 'Workout'}</Text>
          <Button label="Resume workout" onPress={() => router.push('/workout/active')} />
        </Card>
      )}

      {nudge && (
        <Card style={styles.nudge}>
          <Text variant="subheading">Keep your log safe</Text>
          <Text color="muted">
            Your training lives in this browser. Add Plus Ultra to your home screen, or export a backup, so the browser never clears it.
          </Text>
          <View style={styles.row}>
            <Button label="Show me how" compact onPress={() => { repos.appState.update({ installNudgeShownAt: Date.now() }); router.push('/settings/data'); }} />
            <Button label="Not now" kind="ghost" compact onPress={() => repos.appState.update({ installNudgeShownAt: Date.now() })} />
          </View>
        </Card>
      )}

      <SectionTitle right={<Button label="New" kind="ghost" compact icon="plus" onPress={() => router.push({ pathname: '/workouts/template', params: { id: 'new' } })} />}>
        Start from a template
      </SectionTitle>
      {templates.length === 0 && <Text color="muted">No templates yet. Finish a workout and save it as a template, or create one.</Text>}
      <View style={styles.templates}>
        {templates.map((t) => (
          <Card key={t.template.id} style={styles.templateCard}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text variant="heading">{t.template.name}</Text>
                <Text variant="caption" color="muted" numberOfLines={2}>
                  {t.items.length} exercises · {t.items.map((i) => i.exercise.name).join(', ')}
                </Text>
              </View>
              <IconButton icon="edit" label={`Edit ${t.template.name}`} onPress={() => router.push({ pathname: '/workouts/template', params: { id: String(t.template.id) } })} />
            </View>
            <Button label={`Start ${t.template.name}`} onPress={() => start({ kind: 'template', templateId: t.template.id })} />
          </Card>
        ))}
      </View>
      <Button label="Empty workout" kind="secondary" style={styles.empty} onPress={() => start({ kind: 'empty' })} />

      <View style={styles.links}>
        <ListRow label="Exercise library" detail="Cues, muscles, records and your own exercises" onPress={() => router.push('/workouts/library')} />
      </View>

      <SectionTitle>History</SectionTitle>
      {history.length === 0 ? (
        <EmptyState title="Your training log starts here" body="Start a template above. Every set you tick is saved straight away, and your history builds up here week by week." />
      ) : (
        weeks.map((wk) => (
          <View key={wk.weekStart} style={styles.week}>
            <Text variant="label" color="muted" style={styles.weekLabel}>
              {formatWeekLabel(wk.weekStart, today)}
            </Text>
            <Card padded={false}>
              {wk.items.map((h, i) => (
                <View key={h.workout.id}>
                  {i > 0 && <Divider inset={space.md} />}
                  <Pressable
                    onPress={() => router.push({ pathname: '/workouts/history', params: { id: String(h.workout.id) } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDay(h.workout.date)}, ${h.workout.name ?? 'Workout'}`}
                    style={(s) => [styles.historyRow, { opacity: s.pressed ? 0.7 : 1 }]}
                  >
                    <View style={styles.flex}>
                      <Text variant="caption" color="muted">{formatDay(h.workout.date)}</Text>
                      <Text variant="bodyMedium">{h.workout.name ?? 'Workout'}</Text>
                      <Text variant="caption" color="muted" numeric>
                        {formatDuration(h.durationMs)} · {formatVolumeIn(h.volume, units)} {unitLabel(units)}
                      </Text>
                      <Text variant="caption" color="muted" numberOfLines={1}>
                        {h.exerciseNames.join(', ')}
                      </Text>
                    </View>
                    <IconButton icon="repeat" label={`Repeat ${h.workout.name ?? 'workout'}`} onPress={() => start({ kind: 'repeat', workoutId: h.workout.id })} />
                    <Icon name="forward" size={18} color={c.muted} />
                  </Pressable>
                </View>
              ))}
            </Card>
          </View>
        ))
      )}
      {sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  activeCard: { gap: space.xs, marginBottom: space.md },
  nudge: { gap: space.xs, marginBottom: space.md },
  templates: { gap: space.sm },
  templateCard: { gap: space.md },
  empty: { marginTop: space.sm },
  links: { marginTop: space.lg },
  week: { marginBottom: space.lg },
  weekLabel: { marginBottom: space.xs },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs, padding: space.md, paddingRight: space.xs, borderRadius: radius.lg },
});
