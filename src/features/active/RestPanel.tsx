import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { useNow } from '@/hooks/useNow';
import { formatClock } from '@/lib/format';
import { adjustRest, remainingMs } from '@/lib/rest';
import { haptics } from '@/platform/haptics';
import { restAlerts } from '@/platform/restAlerts';
import { restCue } from '@/platform/restCue';
import { fonts, radius, space, useTheme } from '@/theme';

/** True while a rest timer is stored. */
export function useRestActive(): boolean {
  return useLive((r) => r.appState.get().restEndsAt != null);
}

/**
 * Rest panel (replaces the Complete button area): countdown, draining bar, −15s / +15s / Skip.
 * Timestamp-based; background alerts and the end cue are unchanged from Phase 1.
 */
export function RestPanel({ label, next, onFinished }: { label: string; next: string; onFinished(): void }) {
  const { c } = useTheme();
  const repos = useRepos();
  const state = useLive((r) => r.appState.get());
  const tone = useLive((r) => r.settings.get().restToneEnabled);
  const rest = useMemo(
    () => (state.restEndsAt != null && state.restDurationSec != null ? { endsAt: state.restEndsAt, durationSec: state.restDurationSec } : null),
    [state.restEndsAt, state.restDurationSec],
  );
  const now = useNow(250, !!rest);
  const left = remainingMs(rest, now);
  const cued = useRef<number | null>(null);

  useEffect(() => {
    restAlerts.sync(rest ? { endsAt: rest.endsAt, label } : null);
  }, [rest, label]);
  useEffect(() => () => restAlerts.sync(null), []);

  // Rest ended on screen: cue once, then clear and let the workout move on.
  useEffect(() => {
    if (!rest || left > 0 || cued.current === rest.endsAt) return;
    cued.current = rest.endsAt;
    const recent = now - rest.endsAt < 5000;
    if (recent) {
      haptics.success();
      restCue.ended({ tone });
    }
    const t = setTimeout(() => {
      repos.appState.update({ restEndsAt: null, restDurationSec: null });
      onFinished();
    }, recent ? 1200 : 0);
    return () => clearTimeout(t);
  }, [rest, left, now, tone, repos, onFinished]);

  if (!rest) return null;
  const set = (s: { endsAt: number; durationSec: number } | null) => repos.appState.update({ restEndsAt: s?.endsAt ?? null, restDurationSec: s?.durationSec ?? null });
  const progress = rest.durationSec > 0 ? Math.min(1, left / (rest.durationSec * 1000)) : 0;
  const over = left <= 0;

  return (
    <View style={styles.panel} accessibilityRole="timer" accessibilityLabel={over ? 'Rest is over' : `Rest, ${formatClock(left / 1000)} left`}>
      <View style={styles.row}>
        <Text variant="overline" color="accentText" style={styles.flex}>
          {over ? 'Rest is over' : 'Rest'}
        </Text>
        <Text variant="caption" color="muted" numberOfLines={1} style={styles.next}>
          {next}
        </Text>
      </View>
      <Text style={[styles.clock, { color: c.ink }]} numeric accessibilityElementsHidden>
        {formatClock(Math.ceil(left / 1000))}
      </Text>
      <View style={[styles.track, { backgroundColor: c.raised }]}>
        <View style={[styles.fill, { backgroundColor: c.accent, width: `${(over ? 0 : progress) * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <Chip label="−15s" a11y="Subtract 15 seconds" onPress={() => set(adjustRest(rest, -15, Date.now()))} />
        <Chip label="+15s" a11y="Add 15 seconds" onPress={() => set(adjustRest(rest, 15, Date.now()))} />
        <Button
          label="Skip"
          kind="accent"
          compact
          a11yLabel="Skip rest"
          style={styles.skip}
          onPress={() => {
            set(null);
            onFinished();
          }}
        />
      </View>
    </View>
  );
}

function Chip({ label, a11y, onPress }: { label: string; a11y: string; onPress(): void }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={a11y} style={(s) => [styles.chip, { backgroundColor: c.raised, opacity: s.pressed ? 0.6 : 1 }]}>
      <Text style={[styles.chipText, { color: c.ink }]} numeric>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { gap: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  next: { maxWidth: '65%' },
  clock: { fontFamily: fonts.cond800i, fontSize: 100, lineHeight: 104, textAlign: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: space.xs },
  fill: { height: 6, borderRadius: 3 },
  chip: { flex: 1, minHeight: 56, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: fonts.cond800i, fontSize: 22 },
  skip: { flex: 1, minHeight: 56 },
});
