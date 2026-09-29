import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, IconButton, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { BADGE_COUNT, nextBadge, progressText } from '@/lib/badges';
import { space, useTheme } from '@/theme';
import { BadgeEmblem } from './BadgeEmblem';
import { ProgressBar } from './ProgressBar';

/** Train home: the closest unearned badge and its progress; opens the badge case. */
export function NextBadgeCard() {
  const router = useRouter();
  const units = useLive((r) => r.settings.get().units);
  const next = useLive((r) => nextBadge(r.badges.overview().statuses) ?? null);

  if (!next) {
    return (
      <Pressable onPress={() => router.push('/badges')} accessibilityRole="button" accessibilityLabel={`All ${BADGE_COUNT} badges earned. Open badges`}>
        <Card style={styles.card}>
          <Text variant="overline" color="accentText">
            Badges
          </Text>
          <Text variant="subheading">All {BADGE_COUNT} earned</Text>
        </Card>
      </Pressable>
    );
  }

  const b = next.badge;
  const progress = progressText(b, next.value, units);
  return (
    <Pressable onPress={() => router.push('/badges')} accessibilityRole="button" accessibilityLabel={`Next badge: ${b.name}, ${b.unit === 'once' ? b.description : progress}. Open badges`}>
      <Card style={[styles.card, styles.row]}>
        <BadgeEmblem badge={b} earned={false} value={next.value} units={units} size={48} />
        <View style={styles.flex}>
          <Text variant="overline" color="accentText">
            Next badge
          </Text>
          <Text variant="subheading">{b.name}</Text>
          {b.unit === 'once' ? (
            <Text variant="caption" color="muted">
              {b.description}
            </Text>
          ) : (
            <View style={styles.progress}>
              <View style={styles.flex}>
                <ProgressBar fraction={next.fraction} />
              </View>
              <Text variant="caption" color="muted" numeric>
                {progress}
              </Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

/** One-off card after the silent backfill (first launch of badges, or an import): "You've already earned N badges". */
export function BadgesNoticeCard() {
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const count = useLive((r) => r.appState.get().badgesNotice);
  if (!count) return null;
  return (
    <Card accent style={styles.notice}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="overline" color="accentText">
            Badges
          </Text>
          <Text variant="heading">You’ve already earned {count} {count === 1 ? 'badge' : 'badges'}</Text>
        </View>
        <IconButton icon="close" label="Dismiss" color={c.muted} onPress={() => repos.badges.dismissNotice()} />
      </View>
      <Button
        label="See your badges"
        kind="secondary"
        compact
        onPress={() => {
          repos.badges.dismissNotice();
          router.push('/badges');
        }}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: { marginTop: space.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  progress: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 6 },
  notice: { gap: space.sm, marginBottom: space.sm },
});
