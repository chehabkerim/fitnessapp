import { StyleSheet, TextInput, View } from 'react-native';

import { Button, ExerciseTile, IconButton, Sheet, Text } from '@/components';
import type { WorkoutEntry } from '@/db';
import { fonts, radius, space, useTheme } from '@/theme';

/** Jump to, reorder, add or remove exercises; workout notes live here too. */
export function AllExercisesSheet(p: {
  visible: boolean;
  onClose(): void;
  entries: WorkoutEntry[];
  currentIndex: number;
  onJump(i: number): void;
  onMove(e: WorkoutEntry, dir: -1 | 1): void;
  onRemove(e: WorkoutEntry): void;
  onAdd(): void;
  notes: string;
  onNotes(t: string): void;
  onNotesDone(): void;
  onDiscard(): void;
}) {
  const { c } = useTheme();
  return (
    <Sheet visible={p.visible} onClose={p.onClose} title="All exercises">
      <View style={styles.list}>
        {p.entries.map((e, i) => {
          const done = e.sets.filter((s) => s.completedAt != null).length;
          const current = i === p.currentIndex;
          return (
            <View key={e.we.id} style={[styles.row, { borderColor: current ? c.accent : c.line, backgroundColor: current ? c.current : 'transparent' }]}>
              <ExerciseTile exercise={e.exercise} px={44} />
              <Button kind="ghost" label="" a11yLabel={`Go to ${e.exercise.name}`} onPress={() => p.onJump(i)} style={styles.jump} />
              <View style={styles.flex} pointerEvents="none">
                <Text variant="subheading" numberOfLines={1}>
                  {e.exercise.name}
                </Text>
                <Text variant="caption" color={done === e.sets.length && e.sets.length ? 'accentText' : 'muted'} numeric>
                  {done}/{e.sets.length} sets
                </Text>
              </View>
              <IconButton icon="up" label={`Move ${e.exercise.name} up`} disabled={i === 0} onPress={() => p.onMove(e, -1)} />
              <IconButton icon="down" label={`Move ${e.exercise.name} down`} disabled={i === p.entries.length - 1} onPress={() => p.onMove(e, 1)} />
              <IconButton icon="close" label={`Remove ${e.exercise.name}`} onPress={() => p.onRemove(e)} />
            </View>
          );
        })}
      </View>
      <Button label="Add exercise" icon="plus" kind="secondary" onPress={p.onAdd} style={styles.add} />
      <Text variant="overline" color="muted" style={styles.notesLabel}>
        Notes
      </Text>
      <TextInput
        value={p.notes}
        onChangeText={p.onNotes}
        onBlur={p.onNotesDone}
        multiline
        placeholder="How did it go?"
        placeholderTextColor={c.muted}
        accessibilityLabel="Workout notes"
        style={[styles.notes, { color: c.ink, borderColor: c.line, backgroundColor: c.raised }]}
      />
      <Button label="Discard workout" kind="danger" compact onPress={p.onDiscard} style={styles.add} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.xs },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs, borderWidth: 1, borderRadius: radius.row, paddingLeft: space.xs, minHeight: 60 },
  jump: { position: 'absolute', left: 0, top: 0, bottom: 0, right: 150, minHeight: 0 },
  add: { marginTop: space.md },
  notesLabel: { marginTop: space.lg, marginBottom: space.xs },
  notes: { borderWidth: 1, borderRadius: radius.row, minHeight: 88, padding: space.sm, fontFamily: fonts.body, fontSize: 16, textAlignVertical: 'top' },
});
