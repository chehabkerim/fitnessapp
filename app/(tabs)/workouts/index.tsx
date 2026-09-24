import { useRouter } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Icon, MuscleTile, Screen, Text } from '@/components';
import { useLive, useRepos, type TemplateDetail } from '@/db';
import { formatVolumeIn } from '@/features/workouts/format';
import { useStartWorkout } from '@/features/workouts/useStartWorkout';
import { useNow } from '@/hooks/useNow';
import { toLocalDate } from '@/lib/dates';
import type { Muscle } from '@/lib/domain';
import { formatElapsed, formatFullDate } from '@/lib/format';
import { shouldShowInstallNudge } from '@/lib/nudge';
import { lastDoneLabel, orderByUpNext, weekTotals } from '@/lib/train';
import { unitLabel } from '@/lib/units';
import { install } from '@/platform/install';
import { fonts, radius, space, useTheme } from '@/theme';

/** Primary muscles across a template (secondary = the rest of its secondaries). */
function templateMuscles(t: TemplateDetail): { primary: Muscle[]; secondary: Muscle[] } {
  const primary = [...new Set(t.items.flatMap((i) => i.exercise.primaryMuscles))];
  const secondary = [...new Set(t.items.flatMap((i) => i.exercise.secondaryMuscles))].filter((m) => !primary.includes(m));
  return { primary, secondary };
}

export default function Train() {
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
  const now = useNow(active ? 1000 : 60_000);
  const today = toLocalDate(new Date(now));

  const ordered = orderByUpNext(
    templates.map((t) => ({ ...t, id: t.template.id, name: t.template.name, position: t.template.position })),
    history.map((h) => ({ templateId: h.workout.templateId, name: h.workout.name, date: h.workout.date, startedAt: h.workout.startedAt })),
  );
  const [upNext, ...others] = ordered;
  const week = weekTotals(history.map((h) => ({ date: h.workout.date, volume: h.volume, setsCompleted: h.setsCompleted })), today);
  const nudge = shouldShowInstallNudge({ finishedWorkouts: history.length, standalone, lastExportAt: state.lastExportAt, shownAt: state.installNudgeShownAt, now });

  return (
    <Screen inTabs>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text variant="overline" color="muted">
            {formatFullDate(today)}
          </Text>
          <Text variant="display" accessibilityRole="header">
            Train
          </Text>
        </View>
        <View style={styles.weekCount} accessible accessibilityLabel={`${week.workouts} workouts this week`}>
          <Text style={[styles.bigNumber, { color: c.ink }]} numeric>
            {week.workouts}
          </Text>
          <Text variant="overline" color="muted">
            This week
          </Text>
        </View>
      </View>

      {active && (
        <Pressable onPress={() => router.push('/workout/active')} accessibilityRole="button" accessibilityLabel="Resume workout">
          <Card accent style={styles.resume}>
            <View style={styles.flex}>
              <Text variant="overline" color="accentText">
                Resume workout
              </Text>
              <Text variant="heading" numberOfLines={1}>
                {active.name ?? 'Workout'}
              </Text>
            </View>
            <Text style={[styles.elapsed, { color: c.ink }]} numeric>
              {formatElapsed(active.startedAt, now)}
            </Text>
            <Icon name="play" size={22} color={c.accent} />
          </Card>
        </Pressable>
      )}

      {nudge && (
        <Card style={styles.gapCard}>
          <Text variant="overline" color="accentText">
            Keep your log safe
          </Text>
          <Text color="listText">Your training lives in this browser. Add Plus Ultra to your home screen, or export a backup, so it’s never cleared.</Text>
          <View style={styles.row}>
            <Button label="Show me how" kind="secondary" compact onPress={() => { repos.appState.update({ installNudgeShownAt: Date.now() }); router.push('/settings/data'); }} />
            <Button label="Not now" kind="ghost" compact onPress={() => repos.appState.update({ installNudgeShownAt: Date.now() })} />
          </View>
        </Card>
      )}

      {upNext ? (
        <Card style={styles.upNext}>
          <View style={styles.upNextTop}>
            <View style={styles.flex}>
              <Text variant="overline" color="accentText">
                Up next
              </Text>
              <Text style={[styles.upNextName, { color: c.ink }]} accessibilityRole="header">
                {upNext.template.name}
              </Text>
            </View>
            <MuscleTile px={84} label={upNext.template.name} {...templateMuscles(upNext.template)} />
          </View>
          <Text variant="caption" color="muted">
            {upNext.template.items.length} exercises · {lastDoneLabel(upNext.lastDone, today)}
          </Text>
          <Text variant="caption" color="listText" style={styles.names}>
            {upNext.template.items.map((i) => i.exercise.name).join(' · ')}
          </Text>
          <Button label="Start workout" icon="play" a11yLabel={`Start ${upNext.template.name}`} onPress={() => start({ kind: 'template', templateId: upNext.template.id })} />
        </Card>
      ) : (
        <Card style={styles.gapCard}>
          <Text variant="heading">No templates yet</Text>
          <Text color="muted">Start an empty workout, then save it as a template from the summary.</Text>
        </Card>
      )}

      {others.map((o) => (
        <Card key={o.template.id} style={styles.compact}>
          <MuscleTile px={60} label={o.template.name} {...templateMuscles(o.template)} />
          <View style={styles.flex}>
            <Text style={[styles.compactName, { color: c.ink }]}>{o.template.name}</Text>
            <Text variant="caption" color="muted">
              {o.template.items.length} exercises · {lastDoneLabel(o.lastDone, today)}
            </Text>
          </View>
          <Button label="Start" kind="secondary" compact a11yLabel={`Start ${o.template.name}`} onPress={() => start({ kind: 'template', templateId: o.template.id })} />
        </Card>
      ))}

      <Button label="Start an empty workout" kind="link" onPress={() => start({ kind: 'empty' })} style={styles.empty} />

      <View style={styles.stats}>
        <Card style={styles.stat} accessible accessibilityLabel={`${formatVolumeIn(week.volume, units)} ${unitLabel(units)} lifted this week`}>
          <Text style={[styles.statValue, { color: c.ink }]} numeric>
            {formatVolumeIn(week.volume, units)}
          </Text>
          <Text variant="overline" color="muted">
            {unitLabel(units)} lifted this week
          </Text>
        </Card>
        <Card style={styles.stat} accessible accessibilityLabel={`${week.sets} sets this week`}>
          <Text style={[styles.statValue, { color: c.ink }]} numeric>
            {week.sets}
          </Text>
          <Text variant="overline" color="muted">
            Sets this week
          </Text>
        </Card>
      </View>
      {sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  header: { flexDirection: 'row', alignItems: 'flex-end', marginTop: space.xl, marginBottom: space.md },
  weekCount: { alignItems: 'flex-end', paddingBottom: 6 },
  bigNumber: { fontFamily: fonts.cond800i, fontSize: 40, lineHeight: 40 },
  resume: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.sm },
  elapsed: { fontFamily: fonts.cond700, fontSize: 26, lineHeight: 30 },
  gapCard: { gap: space.xs, marginBottom: space.sm },
  upNext: { gap: space.xs, padding: space.lg },
  upNextTop: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  upNextName: { fontFamily: fonts.cond800i, fontSize: 46, lineHeight: 44, textTransform: 'uppercase', marginTop: 2 },
  names: { marginTop: space.xs, marginBottom: space.sm, lineHeight: 20 },
  compact: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: space.sm },
  compactName: { fontFamily: fonts.cond800i, fontSize: 30, lineHeight: 32, textTransform: 'uppercase' },
  empty: { alignSelf: 'center', marginVertical: space.md },
  stats: { flexDirection: 'row', gap: space.sm },
  stat: { flex: 1, gap: 2, borderRadius: radius.card },
  statValue: { fontFamily: fonts.cond800i, fontSize: 40, lineHeight: 42 },
});
