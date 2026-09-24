import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { useNow } from '@/hooks/useNow';
import { formatClock } from '@/lib/format';
import { adjustRest, remainingMs } from '@/lib/rest';
import { haptics } from '@/platform/haptics';
import { restAlerts } from '@/platform/restAlerts';
import { restCue } from '@/platform/restCue';
import { nativeDriver } from '@/platform/animation';
import { fonts, layout, motion, space, useTheme } from '@/theme';

/** Compact bar at the bottom of the active workout: countdown in large numerals, −15s / +15s / Skip. */
export function RestTimerBar({ label }: { label: string }) {
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
  const [appear] = useState(() => new Animated.Value(rest ? 1 : 0));

  useEffect(() => {
    Animated.timing(appear, { toValue: rest ? 1 : 0, duration: motion.base, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [rest, appear]);

  // Background alerts (notification / tab title) follow the stored rest.
  useEffect(() => {
    restAlerts.sync(rest ? { endsAt: rest.endsAt, label } : null);
  }, [rest, label]);
  useEffect(() => () => restAlerts.sync(null), []);

  // Rest ended while on screen: cue once, then clear.
  useEffect(() => {
    if (!rest || left > 0 || cued.current === rest.endsAt) return;
    cued.current = rest.endsAt;
    const recent = now - rest.endsAt < 5000; // don't cue for a rest that ended long ago (e.g. app reopened)
    if (recent) {
      haptics.success();
      restCue.ended({ tone });
    }
    const t = setTimeout(() => repos.appState.update({ restEndsAt: null, restDurationSec: null }), recent ? 1500 : 0);
    return () => clearTimeout(t);
  }, [rest, left, now, tone, repos]);

  if (!rest) return null;
  const set = (next: { endsAt: number; durationSec: number } | null) =>
    repos.appState.update({ restEndsAt: next?.endsAt ?? null, restDurationSec: next?.durationSec ?? null });
  const progress = rest.durationSec > 0 ? Math.min(1, left / (rest.durationSec * 1000)) : 0;
  const over = left <= 0;

  return (
    <Animated.View
      style={[styles.bar, { backgroundColor: c.surface, borderTopColor: c.line, opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}
      accessibilityRole="timer"
      accessibilityLabel={over ? 'Rest is over' : `Rest, ${formatClock(left / 1000)} left`}
    >
      <View style={[styles.track, { backgroundColor: c.line }]}>
        <View style={[styles.fill, { backgroundColor: over ? c.tick : c.accent, width: `${(over ? 1 : progress) * 100}%` }]} />
      </View>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text variant="overline" color="muted">
            {over ? 'Rest is over' : 'Rest'}
          </Text>
          <Text style={[styles.clock, { color: over ? c.tick : c.ink }]} numeric accessibilityElementsHidden>
            {formatClock(Math.ceil(left / 1000))}
          </Text>
        </View>
        <Chip label="−15s" a11y="Subtract 15 seconds" onPress={() => set(adjustRest(rest, -15, Date.now()))} />
        <Chip label="+15s" a11y="Add 15 seconds" onPress={() => set(adjustRest(rest, 15, Date.now()))} />
        <Chip label="Skip" a11y="Skip rest" strong onPress={() => set(null)} />
      </View>
    </Animated.View>
  );
}

function Chip({ label, a11y, onPress, strong }: { label: string; a11y: string; onPress(): void; strong?: boolean }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={(s) => [styles.chip, { borderColor: c.line, backgroundColor: strong ? c.bg : 'transparent', opacity: s.pressed ? 0.6 : 1 }]}
    >
      <Text variant="label" color={strong ? 'accentText' : 'ink'} numeric>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.lg, paddingBottom: space.sm },
  track: { height: 2, marginHorizontal: -space.lg },
  fill: { height: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingTop: space.sm },
  flex: { flex: 1 },
  clock: { fontFamily: fonts.cond800i, fontSize: 40, lineHeight: 46 },
  chip: { minHeight: layout.minTap, minWidth: 56, paddingHorizontal: space.sm, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
