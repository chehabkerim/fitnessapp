import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, EquipmentGlyph, ExerciseTile, IconButton, Text } from '@/components';
import type { SetRow as SetRowData, WorkoutEntry } from '@/db';
import { EQUIPMENT_LABELS, type Units } from '@/lib/domain';
import { unitLabel } from '@/lib/units';
import { radius, space, useTheme } from '@/theme';
import { formatSetShort } from './format';
import { SET_COLUMNS, SetRow, type SetRowHandle } from './SetRow';

export interface ExerciseCardProps {
  entry: WorkoutEntry;
  units: Units;
  lastSession: SetRowData[];
  prSetIds: Set<number>;
  onPatchSet(id: number, patch: Partial<Pick<SetRowData, 'weightKg' | 'reps' | 'durationSec'>>): void;
  onToggleComplete(set: SetRowData): void;
  onToggleWarmup(set: SetRowData): void;
  onDeleteSet(set: SetRowData): void;
  onSetMenu(set: SetRowData): void;
  onAddSet(): void;
  onMenu(): void;
  onInfo(): void;
  /** Called after Enter completes the last row, to move to the next card. */
  focusRegistry: Map<number, SetRowHandle | null>;
  nextSetAfter(setId: number): number | undefined;
}

export function ExerciseCard(p: ExerciseCardProps) {
  const { c } = useTheme();
  const router = useRouter();
  const { entry, units } = p;
  const ex = entry.exercise;
  const each = ex.loadMode === 'per_dumbbell';
  const weightHeader = ex.logType === 'bodyweight_added' ? `+${unitLabel(units)}` : `${unitLabel(units)}${each ? ' each' : ''}`;
  const hasWeight = ex.logType === 'weight_reps' || ex.logType === 'bodyweight_added';
  const lastWorking = p.lastSession;
  const pendingFocus = useRef<number | null>(null);

  let working = 0;
  const rows = entry.sets.map((s, index) => {
    const label = s.isWarmup ? 'W' : String(++working);
    const prev = lastWorking[index];
    return { s, label, prev };
  });

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={styles.header}>
        <Pressable onPress={p.onInfo} accessibilityRole="button" accessibilityLabel={`${ex.name}: form cues and muscles`} hitSlop={4}>
          <ExerciseTile exercise={ex} px={44} />
        </Pressable>
        <Pressable
          style={styles.titleCol}
          onPress={() => router.push({ pathname: '/workouts/exercise', params: { id: String(ex.id) } })}
          accessibilityRole="link"
          accessibilityLabel={`${ex.name}, open exercise history`}
        >
          <Text variant="subheading" numberOfLines={2}>
            {ex.name}
          </Text>
          <View style={styles.meta}>
            <EquipmentGlyph equipment={ex.equipment} size={16} />
            <Text variant="caption" color="muted">
              {EQUIPMENT_LABELS[ex.equipment]}
            </Text>
          </View>
        </Pressable>
        <IconButton icon="more" label={`${ex.name} options`} onPress={p.onMenu} />
      </View>

      <View style={[styles.cols, { borderBottomColor: c.line }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text variant="caption" color="muted" style={{ width: SET_COLUMNS.set }}>
          Set
        </Text>
        <Text variant="caption" color="muted" style={styles.flex}>
          Previous
        </Text>
        {hasWeight && (
          <Text variant="caption" color="muted" align="center" style={{ width: SET_COLUMNS.weight + 2 * 26 }}>
            {weightHeader}
          </Text>
        )}
        <Text variant="caption" color="muted" align="center" style={{ width: hasWeight ? SET_COLUMNS.reps : SET_COLUMNS.weight + 2 * 26 }}>
          {ex.logType === 'duration' ? 'Sec' : 'Reps'}
        </Text>
        <View style={{ width: SET_COLUMNS.check + 2 }} />
      </View>

      {rows.map(({ s, label, prev }) => (
        <SetRow
          key={s.id}
          ref={(h) => {
            p.focusRegistry.set(s.id, h);
            if (h && pendingFocus.current === s.id) {
              pendingFocus.current = null;
              h.focusFirst();
            }
          }}
          set={s}
          label={label}
          logType={ex.logType}
          units={units}
          exerciseName={ex.name}
          previous={prev ? { text: formatSetShort(prev, ex, units), weightKg: prev.weightKg, reps: prev.reps, durationSec: prev.durationSec } : undefined}
          pr={p.prSetIds.has(s.id)}
          onPatch={(patch) => p.onPatchSet(s.id, patch)}
          onToggleComplete={() => p.onToggleComplete(s)}
          onToggleWarmup={() => p.onToggleWarmup(s)}
          onDelete={() => p.onDeleteSet(s)}
          onOpenMenu={() => p.onSetMenu(s)}
          onSubmit={() => {
            if (s.completedAt == null) p.onToggleComplete(s);
            const next = p.nextSetAfter(s.id);
            if (next != null) p.focusRegistry.get(next)?.focusFirst();
          }}
        />
      ))}

      <Button label="Add set" icon="plus" kind="ghost" compact onPress={p.onAddSet} style={styles.addSet} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: space.sm, paddingRight: space.xxs, paddingVertical: space.sm },
  titleCol: { flex: 1, gap: 2 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cols: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingBottom: 6, borderBottomWidth: StyleSheet.hairlineWidth },
  flex: { flex: 1 },
  addSet: { alignSelf: 'center', marginVertical: space.xxs },
});
