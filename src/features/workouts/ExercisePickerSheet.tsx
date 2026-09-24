import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, ExerciseTile, Icon, Sheet, Text } from '@/components';
import { useLive } from '@/db';
import { MUSCLE_LABELS } from '@/lib/domain';
import { fonts, radius, space, useTheme } from '@/theme';

/** Library as a sheet: search, grouped like the library, multi-select, plus "Create custom exercise". */
export function ExercisePickerSheet({ visible, onClose, onPick, addTo }: { visible: boolean; onClose(): void; onPick(ids: number[]): void; addTo: 'workout' | 'template' }) {
  const { c } = useTheme();
  const router = useRouter();
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<number[]>([]);
  const groups = useLive((r) => r.exercises.library(q), [q]);

  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const close = () => {
    setSelected([]);
    setQ('');
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={close} title="Add exercise" full scroll={false}>
      <View style={[styles.search, { backgroundColor: c.bg, borderColor: c.line }]}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search exercises"
          placeholderTextColor={c.muted}
          accessibilityLabel="Search exercises"
          style={[styles.searchInput, { color: c.ink }]}
          autoCorrect={false}
        />
      </View>
      <View style={styles.list}>
        <ScrollView keyboardShouldPersistTaps="handled">
          {groups.map((g) => (
            <View key={g.key}>
              <Text variant="overline" color="muted" style={styles.groupTitle}>
                {g.title}
              </Text>
              {g.exercises.length === 0 && <Text color="muted">Exercises you create appear here.</Text>}
              {g.exercises.map((e) => {
                const on = selected.includes(e.id);
                return (
                  <Pressable
                    key={`${g.key}-${e.id}`}
                    onPress={() => toggle(e.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: on }}
                    aria-checked={on}
                    accessibilityLabel={e.name}
                    style={(s) => [styles.row, { opacity: s.pressed ? 0.7 : 1 }]}
                  >
                    <ExerciseTile exercise={e} px={44} />
                    <View style={styles.flex}>
                      <Text variant="bodyMedium">{e.name}</Text>
                      <Text variant="caption" color="muted">
                        {e.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ')}
                      </Text>
                    </View>
                    <View style={[styles.box, on ? { backgroundColor: c.tick, borderColor: c.tick } : { borderColor: c.line }]}>
                      {on && <Icon name="check" size={16} color={c.onTick} strokeWidth={2} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        <Button
          label={selected.length ? `Add ${selected.length} exercise${selected.length > 1 ? 's' : ''}` : 'Select exercises'}
          disabled={!selected.length}
          onPress={() => {
            onPick(selected);
            close();
          }}
        />
        <Button
          label="Create custom exercise"
          kind="ghost"
          compact
          onPress={() => {
            close();
            router.push({ pathname: '/exercise/edit', params: { addTo } });
          }}
        />
      </View>
    </Sheet>
  );
}


const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.xs, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.sm, minHeight: 48 },
  searchInput: { flex: 1, fontSize: 16, fontFamily: fonts.body, minHeight: 44 },
  list: { flex: 1, marginTop: space.sm },
  groupTitle: { marginTop: space.md, marginBottom: space.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 60 },
  box: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  footer: { gap: space.xxs, paddingTop: space.sm },
});
