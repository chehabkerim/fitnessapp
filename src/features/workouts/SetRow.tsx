import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type TextInput } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { Icon, IconButton, NumberInput, Text } from '@/components';
import type { SetRow as SetRowData } from '@/db';
import type { LogType, Units } from '@/lib/domain';
import { usesReps, usesWeight } from '@/lib/domain';
import { displayWeight, parseDecimal, parseInteger, stepWeight, toKg } from '@/lib/units';
import { hasHover } from '@/platform/shell';
import { fonts, layout, motion, useTheme } from '@/theme';

export interface SetRowHandle {
  focusFirst(): void;
}

export interface SetRowProps {
  set: SetRowData;
  label: string; // "1", "2" or "W"
  logType: LogType;
  units: Units;
  exerciseName: string;
  previous?: { text: string; weightKg: number | null; reps: number | null; durationSec: number | null };
  pr: boolean;
  onPatch(patch: Partial<Pick<SetRowData, 'weightKg' | 'reps' | 'durationSec'>>): void;
  onToggleComplete(): void;
  onToggleWarmup(): void;
  onDelete(): void;
  onOpenMenu(): void;
  /** Enter in any input: complete this set and move to the next row. */
  onSubmit(): void;
}

export const SET_COLUMNS = { set: 28, weight: 64, stepper: 34, reps: 54, check: layout.minTap };

export const SetRow = forwardRef<SetRowHandle, SetRowProps>(function SetRow(props, ref) {
  const { set, label, logType, units, exerciseName, previous, pr, onPatch, onToggleComplete, onToggleWarmup, onDelete, onOpenMenu, onSubmit } = props;
  const { c } = useTheme();
  const done = set.completedAt != null;
  const weightRef = useRef<TextInput>(null);
  const repsRef = useRef<TextInput>(null);
  const [hovered, setHovered] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const swipeRef = useRef<{ close(): void } | null>(null);

  useImperativeHandle(ref, () => ({ focusFirst: () => (weightRef.current ?? repsRef.current)?.focus() }));

  // 200ms ease-out tint when a set is completed; PR label fades in over 200ms.
  const [tint] = useState(() => new Animated.Value(done ? 1 : 0));
  const [prOpacity] = useState(() => new Animated.Value(pr ? 1 : 0));
  useEffect(() => void Animated.timing(tint, { toValue: done ? 1 : 0, duration: motion.base, useNativeDriver: false }).start(), [done, tint]);
  useEffect(() => void Animated.timing(prOpacity, { toValue: pr ? 1 : 0, duration: motion.base, useNativeDriver: false }).start(), [pr, prOpacity]);
  const bg = tint.interpolate({ inputRange: [0, 1], outputRange: [c.surface, c.current] });

  const showWeight = usesWeight(logType);
  const showReps = usesReps(logType);
  const nameForA11y = `${exerciseName}, set ${label === 'W' ? 'warm-up' : label}`;
  const showHoverDelete = hasHover() && (hovered || focusWithin);

  const row = (
    <Animated.View style={[styles.row, { backgroundColor: bg, borderBottomColor: c.line }]}>
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onFocus={() => setFocusWithin(true)}
        onBlur={() => setFocusWithin(false)}
        style={styles.inner}
        focusable={false}
        accessible={false}
      >
        <Pressable
          onPress={onOpenMenu}
          onLongPress={onToggleWarmup}
          delayLongPress={350}
          accessibilityRole="button"
          accessibilityLabel={`${nameForA11y}. Options`}
          accessibilityHint="Opens set options. Long-press toggles warm-up."
          style={styles.setCell}
          hitSlop={{ top: 8, bottom: 8 }}
        >
          <Text variant="bodyMedium" color={label === 'W' ? 'accentText' : 'ink'} numeric>
            {label}
          </Text>
        </Pressable>

        <View style={styles.prevCell}>
          {showHoverDelete ? (
            <IconButton icon="trash" label={`Delete ${nameForA11y}`} size={20} color={c.danger} onPress={onDelete} />
          ) : (
            <Pressable
              disabled={!previous}
              focusable={false}
              tabIndex={-1}
              accessibilityRole="button"
              accessibilityLabel={previous ? `Previous: ${previous.text}. Copy into this set` : 'No previous set'}
              onPress={() => previous && onPatch({ weightKg: previous.weightKg, reps: previous.reps, durationSec: previous.durationSec })}
              style={styles.prevBtn}
            >
              <Text variant="caption" color="muted" numeric numberOfLines={1}>
                {previous?.text ?? '—'}
              </Text>
            </Pressable>
          )}
        </View>

        {showWeight && (
          <View style={styles.weightGroup}>
            <Stepper icon="minus" label={`Decrease weight, ${nameForA11y}`} onPress={() => onPatch({ weightKg: stepWeight(set.weightKg, -1, units) })} />
            <NumberInput
              ref={weightRef}
              decimal
              label={`${logType === 'bodyweight_added' ? 'Added weight' : 'Weight'}, ${nameForA11y}`}
              value={displayWeight(set.weightKg, units)}
              placeholder={logType === 'bodyweight_added' ? '+0' : '0'}
              onChangeText={(t) => {
                const v = parseDecimal(t);
                onPatch({ weightKg: v == null ? null : toKg(v, units) });
              }}
              onSubmitEditing={onSubmit}
              tint={done ? 'done' : 'default'}
              style={styles.weightInput}
            />
            <Stepper icon="plus" label={`Increase weight, ${nameForA11y}`} onPress={() => onPatch({ weightKg: stepWeight(set.weightKg, 1, units) })} />
          </View>
        )}

        <NumberInput
          ref={repsRef}
          label={`${showReps ? 'Reps' : 'Seconds'}, ${nameForA11y}`}
          value={showReps ? (set.reps?.toString() ?? '') : (set.durationSec?.toString() ?? '')}
          placeholder="0"
          onChangeText={(t) => (showReps ? onPatch({ reps: parseInteger(t) }) : onPatch({ durationSec: parseInteger(t) }))}
          onSubmitEditing={onSubmit}
          tint={done ? 'done' : 'default'}
          style={[styles.repsInput, !showWeight && styles.repsWide]}
        />

        <Pressable
          onPress={onToggleComplete}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          aria-checked={done}
          accessibilityLabel={`${done ? 'Completed' : 'Complete'} ${nameForA11y}`}
          style={[styles.check, done ? { backgroundColor: c.tick } : { borderColor: c.line, borderWidth: 1.5 }]}
        >
          <Icon name="check" size={22} color={done ? c.onTick : c.muted} strokeWidth={2} />
        </Pressable>
      </Pressable>
      {pr && (
        <Animated.Text
          style={[styles.pr, { color: c.accentText, opacity: prOpacity }]}
          accessibilityLabel="Personal record. Plus Ultra"
          accessibilityLiveRegion="polite"
          maxFontSizeMultiplier={1.4}
        >
          Plus Ultra
        </Animated.Text>
      )}
    </Animated.View>
  );

  return (
    <ReanimatedSwipeable
      ref={swipeRef as never}
      friction={2}
      rightThreshold={60}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${nameForA11y}`} onPress={onDelete} style={[styles.swipeDelete, { backgroundColor: c.danger }]}>
          <Icon name="trash" size={22} color={c.onPurple} />
        </Pressable>
      )}
      onSwipeableOpen={(dir) => {
        if (dir === 'left') {
          swipeRef.current?.close();
          onDelete();
        }
      }}
    >
      {row}
    </ReanimatedSwipeable>
  );
});

function Stepper({ icon, label, onPress }: { icon: 'minus' | 'plus'; label: string; onPress(): void }) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      focusable={false}
      tabIndex={-1}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={{ top: 6, bottom: 6 }}
      style={(s) => [styles.stepper, { opacity: s.pressed ? 0.5 : 1 }]}
    >
      <Icon name={icon} size={16} color={c.muted} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6 },
  setCell: { width: SET_COLUMNS.set, minHeight: layout.minTap, justifyContent: 'center' },
  prevCell: { flex: 1, minWidth: 48, minHeight: layout.minTap, justifyContent: 'center' },
  prevBtn: { minHeight: layout.minTap, justifyContent: 'center' },
  weightGroup: { flexDirection: 'row', alignItems: 'center' },
  stepper: { width: 26, height: layout.minTap, alignItems: 'center', justifyContent: 'center' },
  weightInput: { width: SET_COLUMNS.weight },
  repsInput: { width: SET_COLUMNS.reps },
  repsWide: { width: SET_COLUMNS.weight + 2 * 26 },
  check: { width: SET_COLUMNS.check, height: SET_COLUMNS.check, borderRadius: SET_COLUMNS.check / 2, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
  pr: { fontFamily: fonts.cond800i, fontSize: 13, lineHeight: 16, textAlign: 'right', paddingRight: SET_COLUMNS.check + 12, paddingTop: 2 },
  swipeDelete: { width: 88, alignItems: 'center', justifyContent: 'center' },
});
