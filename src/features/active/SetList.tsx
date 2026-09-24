import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';

import { Button, Icon, IconButton, Text } from '@/components';
import type { ExerciseRow, SetRow } from '@/db';
import type { Units } from '@/lib/domain';
import { nativeDriver } from '@/platform/animation';
import { hasHover } from '@/platform/shell';
import { fonts, layout, radius, space, useTheme } from '@/theme';
import { setParts } from './format';

export interface SetListProps {
  exercise: ExerciseRow;
  sets: SetRow[];
  units: Units;
  currentId: number | undefined;
  prIds: Set<number>;
  /** While resting the current set reads UP NEXT instead of NOW. */
  resting?: boolean;
  onSelect(set: SetRow): void;
  onToggleDone(set: SetRow): void;
  onMenu(set: SetRow): void;
  onDelete(set: SetRow): void;
  onAddSet(): void;
}

/** Done sets with a tick, the current set outlined with NOW, upcoming dimmed with NEXT. */
export function SetList(p: SetListProps) {
  const currentIndex = p.sets.findIndex((s) => s.id === p.currentId);
  let working = 0;
  return (
    <View style={styles.list}>
      {p.sets.map((s, i) => {
        const label = s.isWarmup ? 'W' : String(++working);
        const state = s.completedAt != null ? 'done' : s.id === p.currentId ? 'now' : i === currentIndex + 1 || (currentIndex < 0 && i === 0) ? 'next' : 'later';
        return <Row key={s.id} {...p} set={s} label={label} state={state} pr={p.prIds.has(s.id)} />;
      })}
      <Button label="+ Add set" kind="ghost" compact onPress={p.onAddSet} style={styles.add} a11yLabel={`Add set to ${p.exercise.name}`} />
    </View>
  );
}

function Row({ set, label, state, pr, exercise, units, resting, onSelect, onToggleDone, onMenu, onDelete }: SetListProps & { set: SetRow; label: string; state: 'done' | 'now' | 'next' | 'later'; pr: boolean }) {
  const { c } = useTheme();
  const [hover, setHover] = useState(false);
  const now = state === 'now' && !resting;
  const upNext = state === 'now' && !!resting;
  const dim = (state === 'next' && !resting) || state === 'later';
  const parts = setParts(set, exercise, units);
  const status = state === 'done' ? 'done' : now ? 'current' : 'upcoming';
  const name = `${exercise.name}, set ${label === 'W' ? 'warm-up' : label}`;
  const valueColor = dim ? c.muted : c.ink;

  return (
    <Pressable
      onPress={() => onSelect(set)}
      onLongPress={() => onMenu(set)}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      delayLongPress={350}
      accessibilityRole="button"
      accessibilityLabel={`Set ${label}, ${parts.text}, ${status}${pr ? ', personal record' : ''}. Edit`}
      accessibilityHint="Long-press for warm-up and delete"
      style={[
        styles.row,
        dim
          ? { backgroundColor: c.cardBorderWidth > 1 ? c.raised : c.surface, borderColor: 'transparent', borderWidth: 1 }
          : { backgroundColor: now ? c.current : c.surface, borderColor: now ? c.accent : upNext || c.cardBorderWidth > 1 ? c.line : c.surface, borderWidth: now ? 1.5 : 1 },
      ]}
    >
      <Text style={[styles.num, { color: now ? c.accentText : c.muted }]} numeric>
        {label}
      </Text>
      <Text style={[styles.value, { color: valueColor }]} numeric numberOfLines={1}>
        {parts.left}
        {parts.times ? <Text style={[styles.times, { color: c.times }]}>{'  ×  '}</Text> : null}
        {parts.right}
      </Text>
      {pr && (
        <Text style={[styles.pr, { color: c.accentText }]} accessibilityElementsHidden>
          PR
        </Text>
      )}
      <View style={styles.flex} />
      {hover && hasHover() ? (
        <IconButton icon="trash" label={`Delete ${name}`} size={20} color={c.danger} onPress={() => onDelete(set)} />
      ) : null}
      {state === 'done' ? (
        <Pressable
          onPress={() => onToggleDone(set)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: true }}
          aria-checked
          accessibilityLabel={`Completed ${name}`}
          style={styles.tickHit}
        >
          <Tick completedAt={set.completedAt} />
        </Pressable>
      ) : now ? (
        <Text variant="overline" color="accentText">
          Now
        </Text>
      ) : upNext ? (
        <Text variant="overline" color="muted">
          Up next
        </Text>
      ) : state === 'next' && !resting ? (
        <Text variant="overline" color="muted">
          Next
        </Text>
      ) : null}
      <IconButton icon="more" label={`${name} options`} size={18} color={c.muted} onPress={() => onMenu(set)} style={styles.more} />
    </Pressable>
  );
}

/** The completed tick. Springs in when the set was completed just now; sets done earlier render still. */
function Tick({ completedAt }: { completedAt: number | null }) {
  const { c } = useTheme();
  const [fresh] = useState(() => completedAt != null && Date.now() - completedAt < 1500);
  const [scale] = useState(() => new Animated.Value(fresh ? 0.4 : 1));
  useEffect(() => {
    if (fresh) Animated.spring(scale, { toValue: 1, useNativeDriver: nativeDriver, speed: 22, bounciness: 12 }).start();
  }, [fresh, scale]);
  return (
    <Animated.View style={[styles.tick, { backgroundColor: c.tick, transform: [{ scale }] }]}>
      <Icon name="check" size={18} color={c.onTick} strokeWidth={2.5} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.xs },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, borderRadius: radius.row, paddingLeft: space.md, paddingRight: 2 },
  num: { fontFamily: fonts.cond700, fontSize: 18, width: 18 },
  value: { fontFamily: fonts.cond700, fontSize: 24, lineHeight: 28 },
  times: { fontFamily: fonts.cond700, fontSize: 18 },
  pr: { fontFamily: fonts.cond800i, fontSize: 16, letterSpacing: 0.5 },
  tickHit: { width: layout.minTap, height: layout.minTap, alignItems: 'center', justifyContent: 'center' },
  tick: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  more: { width: 36, height: layout.minTap },
  add: { alignSelf: 'flex-start' },
});
