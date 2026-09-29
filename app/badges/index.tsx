import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card, Divider, Screen, SectionTitle, Text } from '@/components';
import { useLive } from '@/db';
import { BadgeEmblem } from '@/features/badges/BadgeEmblem';
import { ProgressBar } from '@/features/badges/ProgressBar';
import { BADGE_BY_ID, BADGE_COUNT, CATEGORIES, progressText, tierLabel, type BadgeStatus } from '@/lib/badges';
import type { Units } from '@/lib/domain';
import { formatShortDate } from '@/lib/format';
import { space } from '@/theme';

/** Badge case: every badge by category, earned first, then locked with progress. */
export default function BadgeCase() {
  const router = useRouter();
  const units = useLive((r) => r.settings.get().units);
  const overview = useLive((r) => {
    const o = r.badges.overview();
    return { statuses: o.statuses, earnedAt: Object.fromEntries([...o.earned].map(([k, v]) => [k, v.earnedAt])), workouts: o.stats.workouts };
  });
  const earnedCount = overview.statuses.filter((s) => s.earned).length;
  const open = (id: string) => router.push({ pathname: '/badges/detail', params: { id } });

  return (
    <Screen back title="Badges">
      <Text variant="overline" color="accentText" accessibilityRole="header">
        {earnedCount} / {BADGE_COUNT} earned
      </Text>

      {overview.workouts === 0 && earnedCount === 0 && (
        <Card style={styles.empty}>
          <BadgeEmblem badge={BADGE_BY_ID.get('first_rep')!} earned={false} value={0} units={units} size={56} />
          <View style={styles.flex}>
            <Text variant="subheading">No workouts yet</Text>
            <Text color="muted">Finish your first workout to earn First Rep. Every badge rewards showing up, and rest days never cost you anything.</Text>
          </View>
        </Card>
      )}

      {CATEGORIES.map((cat) => {
        const items = overview.statuses.filter((s) => s.badge.category === cat.id);
        const earned = items.filter((s) => s.earned);
        const locked = items.filter((s) => !s.earned);
        return (
          <View key={cat.id}>
            <SectionTitle>{`${cat.name} · ${earned.length}/${items.length}`}</SectionTitle>
            <Card padded={false}>
              {[...earned, ...locked].map((s, i) => (
                <View key={s.badge.id}>
                  {i > 0 && <Divider inset={space.md + 44 + space.md} />}
                  <BadgeListRow status={s} units={units} earnedAt={overview.earnedAt[s.badge.id]} onPress={() => open(s.badge.id)} />
                </View>
              ))}
            </Card>
          </View>
        );
      })}
    </Screen>
  );
}

function BadgeListRow({ status: s, units, earnedAt, onPress }: { status: BadgeStatus; units: Units; earnedAt?: number; onPress(): void }) {
  const b = s.badge;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${b.name}, ${tierLabel(b).replace(' · ', ', ')}, ${s.earned ? `earned${earnedAt ? ` ${formatShortDate(earnedAt)}` : ''}` : `locked, ${progressText(b, s.value, units)}`}`}
      style={styles.row}
    >
      <BadgeEmblem badge={b} earned={s.earned} value={s.value} units={units} size={44} />
      <View style={styles.flex}>
        <Text variant="bodyMedium" color={s.earned ? 'ink' : 'muted'}>
          {b.name}
        </Text>
        {s.earned ? (
          <Text variant="caption" color="muted">
            {tierLabel(b)}
            {earnedAt ? ` · Earned ${formatShortDate(earnedAt)}` : ''}
          </Text>
        ) : (
          <View style={styles.progress}>
            <View style={styles.flex}>
              <ProgressBar fraction={s.fraction} />
            </View>
            <Text variant="caption" color="muted" numeric>
              {progressText(b, s.value, units)}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  empty: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 64 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 },
});
