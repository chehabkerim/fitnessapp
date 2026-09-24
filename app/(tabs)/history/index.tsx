import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, EmptyState, Screen, Text } from '@/components';
import { useLive } from '@/db';
import { formatVolumeIn } from '@/features/workouts/format';
import { useStartWorkout } from '@/features/workouts/useStartWorkout';
import { groupByWeek, toLocalDate } from '@/lib/dates';
import { formatDayMonth, formatDuration, formatWeekLabel } from '@/lib/format';
import { unitLabel } from '@/lib/units';
import { fonts, space, useTheme } from '@/theme';

export default function History() {
  const router = useRouter();
  const { c } = useTheme();
  const { start, sheet } = useStartWorkout();
  const units = useLive((r) => r.settings.get().units);
  // PR count per workout: records it broke against everything before it.
  const rows = useLive((r) => r.workouts.history().map((h) => ({ ...h, prs: r.workouts.summary(h.workout.id)?.records.reduce((n, x) => n + x.records.length, 0) ?? 0 })));
  const today = toLocalDate();
  const weeks = groupByWeek(rows, (h) => h.workout.date);

  return (
    <Screen title="History" inTabs>
      {rows.length === 0 ? (
        <EmptyState title="No workouts yet" body="Finished workouts appear here, week by week, with their volume and records.">
          <Button label="Go to Train" onPress={() => router.push('/workouts')} />
        </EmptyState>
      ) : (
        weeks.map((wk) => (
          <View key={wk.weekStart} style={styles.week}>
            <Text variant="overline" color="accentText" style={styles.weekLabel}>
              {formatWeekLabel(wk.weekStart, today)}
            </Text>
            {wk.items.map((h) => {
              const name = h.workout.name ?? 'Workout';
              return (
                <Card key={h.workout.id} style={styles.card}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/history/workout', params: { id: String(h.workout.id) } })}
                    accessibilityRole="button"
                    accessibilityLabel={`${formatDayMonth(h.workout.date)}, ${name}`}
                    style={styles.main}
                  >
                    <Text variant="overline" color="muted">
                      {formatDayMonth(h.workout.date)}
                    </Text>
                    <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
                      {name}
                    </Text>
                    <View style={styles.metaRow}>
                      <Text style={[styles.metric, { color: c.ink }]} numeric>
                        {formatVolumeIn(h.volume, units)}
                        <Text variant="caption" color="muted">
                          {' '}
                          {unitLabel(units)}
                        </Text>
                      </Text>
                      <Text style={[styles.metric, { color: c.ink }]} numeric>
                        {formatDuration(h.durationMs)}
                      </Text>
                      {h.prs > 0 && (
                        <Text style={[styles.pr, { color: c.accentText }]} numeric>
                          {h.prs} PR{h.prs === 1 ? '' : 's'}
                        </Text>
                      )}
                    </View>
                    <Text variant="caption" color="muted" numberOfLines={1}>
                      {h.exerciseNames.join(' · ')}
                    </Text>
                  </Pressable>
                  <Button label="Repeat" kind="secondary" compact icon="repeat" a11yLabel={`Repeat ${name}`} onPress={() => start({ kind: 'repeat', workoutId: h.workout.id })} />
                </Card>
              );
            })}
          </View>
        ))
      )}
      {sheet}
    </Screen>
  );
}

const styles = StyleSheet.create({
  week: { marginBottom: space.lg, gap: space.sm },
  weekLabel: { marginBottom: -space.xxs },
  card: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  main: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.cond800i, fontSize: 28, lineHeight: 30, textTransform: 'uppercase' },
  metaRow: { flexDirection: 'row', alignItems: 'baseline', gap: space.md },
  metric: { fontFamily: fonts.cond700, fontSize: 20 },
  pr: { fontFamily: fonts.cond800i, fontSize: 18 },
});
