import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Card, EmptyState, Icon, Screen, Text } from '@/components';
import { useLive } from '@/db';
import { BadgeEmblem } from '@/features/badges/BadgeEmblem';
import { ProgressBar } from '@/features/badges/ProgressBar';
import { BADGES, BADGE_BY_ID, badgeA11yLabel, CATEGORIES, nextInCategory, progressText, remainingText, tierLabel, valueSentence } from '@/lib/badges';
import { formatDayMonth, formatShortDate } from '@/lib/format';
import { space, useTheme } from '@/theme';

/**
 * Badge detail: the category as the header, the large emblem inside a ring showing progress to the next badge
 * in the category, tier, name and what you've done, a bar to the next emblem, the category's ladder, and the
 * workout that earned it.
 */
export default function BadgeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { c } = useTheme();
  const units = useLive((r) => r.settings.get().units);
  const badge = BADGE_BY_ID.get(id ?? '');
  const data = useLive(
    (r) => {
      const o = r.badges.overview();
      const row = o.earned.get(id ?? '');
      const workout = row?.workoutId != null ? r.workouts.get(row.workoutId) : undefined;
      return {
        statuses: o.statuses,
        progress: badge ? badge.progress(o.stats) : 0,
        earnedAt: row?.earnedAt ?? null,
        workout: workout ? { id: workout.id, name: workout.name, date: workout.date } : null,
      };
    },
    [id],
  );

  if (!badge) {
    return (
      <Screen back>
        <EmptyState title="Badge not found" />
      </Screen>
    );
  }

  const status = data.statuses.find((s) => s.badge.id === badge.id)!;
  const ladder = BADGES.filter((b) => b.category === badge.category);
  const statusOf = (bid: string) => data.statuses.find((s) => s.badge.id === bid)!;
  // The ring and the bar point at the next badge to earn in this category: this one if it's locked.
  const goal = status.earned ? nextInCategory(badge.id) : badge;
  const goalStatus = goal ? statusOf(goal.id) : undefined;
  const ring = goalStatus ? goalStatus.fraction : 1;
  const from = status.earned ? badge : ladder[ladder.indexOf(badge) - 1];
  const category = CATEGORIES.find((x) => x.id === badge.category)!.name;
  const open = (bid: string) => router.setParams({ id: bid });

  return (
    <Screen back title={category}>
      <View style={styles.hero}>
        <ProgressRing size={236} fraction={ring} />
        <View style={styles.heroEmblem}>
          <BadgeEmblem badge={badge} earned={status.earned} value={status.value} units={units} size={150} />
        </View>
      </View>

      <View style={styles.center}>
        <Text variant="overline" color={status.earned ? 'accentText' : 'muted'}>
          {tierLabel(badge)}
          {status.earned ? '' : ' · Locked'}
        </Text>
        <Text variant="title" align="center" accessibilityRole="header">
          {badge.name}
        </Text>
        <Text color="muted" align="center">
          {/* A kept badge whose history later shrank shows just when it was earned. */}
          {[status.earned && badge.unit !== 'once' && data.progress < badge.target ? null : valueSentence(badge, data.progress, units), data.earnedAt ? `Earned ${formatShortDate(data.earnedAt)}` : null].filter(Boolean).join(' · ')}
        </Text>
        {badge.unit !== 'once' && <Text color="muted" align="center">{badge.description}</Text>}
      </View>

      {goal && goalStatus && (
        <Card style={styles.next}>
          <View style={styles.nextRow}>
            {from ? <BadgeEmblem badge={from} earned={statusOf(from.id).earned} value={statusOf(from.id).value} units={units} size={40} /> : <View style={styles.spacer} />}
            <View style={styles.flex}>
              <ProgressBar fraction={goalStatus.fraction} height={8} />
            </View>
            <BadgeEmblem badge={goal} earned={false} value={goalStatus.value} units={units} size={40} />
          </View>
          <Text variant="caption" color="muted" align="center" numeric>
            {goal.unit === 'once' ? goal.description : `${progressText(goal, goalStatus.value, units)} · ${remainingText(goal, goalStatus.value, units)}`}
          </Text>
        </Card>
      )}

      <Text variant="overline" color="muted" style={styles.ladderTitle} accessibilityRole="header">
        {category}
      </Text>
      <View style={styles.ladder}>
        {ladder.map((b) => {
          const s = statusOf(b.id);
          return (
            <Pressable key={b.id} onPress={() => open(b.id)} accessibilityRole="button" accessibilityLabel={badgeA11yLabel(b, s.earned, s.value, units)} accessibilityState={{ selected: b.id === badge.id }} aria-selected={b.id === badge.id} style={[styles.rung, b.id === badge.id && { borderColor: c.accent }]}>
              <BadgeEmblem badge={b} earned={s.earned} value={s.value} units={units} size={44} />
            </Pressable>
          );
        })}
      </View>

      {data.workout && (
        <Pressable onPress={() => router.push({ pathname: '/history/workout', params: { id: String(data.workout!.id) } })} accessibilityRole="button" accessibilityLabel={`Earned in ${data.workout.name ?? 'Workout'}, ${formatDayMonth(data.workout.date)}. Open workout`}>
          <Card style={styles.workout}>
            <View style={styles.flex}>
              <Text variant="overline" color="muted">
                Earned in
              </Text>
              <Text variant="subheading">{data.workout.name ?? 'Workout'}</Text>
              <Text variant="caption" color="muted">
                {formatDayMonth(data.workout.date)}
              </Text>
            </View>
            <Icon name="forward" size={18} color={c.muted} />
          </Card>
        </Pressable>
      )}
    </Screen>
  );
}

/** Thin circular progress ring (decorative; the text carries the numbers). */
function ProgressRing({ size, fraction }: { size: number; fraction: number }) {
  const { c } = useTheme();
  const stroke = 6;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <Svg width={size} height={size} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.raised} strokeWidth={stroke} fill="none" />
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.accent} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={`${circ * f} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  hero: { alignSelf: 'center', width: 236, height: 236, marginTop: space.md, alignItems: 'center', justifyContent: 'center' },
  heroEmblem: { position: 'absolute' },
  center: { alignItems: 'center', gap: space.xxs, marginTop: space.md },
  next: { marginTop: space.xl, gap: space.xs },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  spacer: { width: 40 },
  ladderTitle: { marginTop: space.xl, marginBottom: space.sm },
  ladder: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  rung: { padding: 4, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', minWidth: 48, minHeight: 48 },
  workout: { marginTop: space.xl, flexDirection: 'row', alignItems: 'center', gap: space.md },
});
