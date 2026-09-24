import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Divider, EquipmentGlyph, ExerciseTile, Icon, Screen, SectionTitle, Text } from '@/components';
import { useLive, useRepos, type ExerciseRow } from '@/db';
import { EQUIPMENT_LABELS, MUSCLE_LABELS } from '@/lib/domain';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Exercises() {
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const [q, setQ] = useState('');
  const groups = useLive((r) => r.exercises.library(q), [q]);
  const archived = useLive((r) => r.exercises.archived());
  const [showArchived, setShowArchived] = useState(false);
  const empty = groups.every((g) => g.exercises.length === 0);

  return (
    <Screen title="Exercises" inTabs right={<Button label="New exercise" icon="plus" kind="ghost" compact onPress={() => router.push('/exercise/edit')} />}>
      <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.line }]}>
        <Icon name="search" size={20} color={c.muted} />
        <TextInput value={q} onChangeText={setQ} placeholder="Search exercises" placeholderTextColor={c.muted} accessibilityLabel="Search exercises" style={[styles.input, { color: c.ink }]} autoCorrect={false} />
      </View>
      {q && empty && <Text color="muted" style={styles.none}>No exercises match “{q}”.</Text>}
      {groups.map((g) => (
        <View key={g.key}>
          <SectionTitle
            right={
              g.templateId != null ? (
                <Button
                  label="Edit template"
                  a11yLabel={`Edit template ${g.title}`}
                  kind="link"
                  compact
                  onPress={() => router.push({ pathname: '/exercises/template', params: { id: String(g.templateId) } })}
                />
              ) : undefined
            }
          >
            {g.title}
          </SectionTitle>
          {g.exercises.length === 0 ? (
            <Text color="muted">Exercises you create appear here.</Text>
          ) : (
            <Card padded={false}>
              {g.exercises.map((e, i) => (
                <View key={e.id}>
                  {i > 0 && <Divider inset={space.md + 56 + space.sm} />}
                  <LibraryRow exercise={e} onPress={() => router.push({ pathname: '/exercises/detail', params: { id: String(e.id) } })} />
                </View>
              ))}
            </Card>
          )}
        </View>
      ))}
      <View style={styles.newTemplate}>
        <Button label="New template" icon="plus" kind="secondary" onPress={() => router.push({ pathname: '/exercises/template', params: { id: 'new' } })} />
      </View>
      {archived.length > 0 && (
        <View style={styles.archived}>
          <Button label={showArchived ? 'Hide archived' : `Archived (${archived.length})`} kind="ghost" compact onPress={() => setShowArchived((v) => !v)} />
          {showArchived &&
            archived.map((e) => (
              <View key={e.id} style={styles.archivedRow}>
                <Text style={styles.flex}>{e.name}</Text>
                <Button label="Restore" kind="secondary" compact onPress={() => repos.exercises.setArchived(e.id, false)} />
              </View>
            ))}
        </View>
      )}
    </Screen>
  );
}

function LibraryRow({ exercise: e, onPress }: { exercise: ExerciseRow; onPress(): void }) {
  const { c } = useTheme();
  const muscles = e.primaryMuscles.map((m) => MUSCLE_LABELS[m]).join(', ');
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${e.name}. ${muscles}. ${EQUIPMENT_LABELS[e.equipment]}`} style={(s) => [styles.row, { opacity: s.pressed ? 0.7 : 1 }]}>
      <ExerciseTile exercise={e} px={56} />
      <View style={styles.flex}>
        <Text variant="bodyMedium">{e.name}</Text>
        <View style={styles.meta}>
          <Text variant="caption" color="muted">{muscles || '—'}</Text>
          <Text variant="caption" color="muted">·</Text>
          <EquipmentGlyph equipment={e.equipment} size={16} />
          <Text variant="caption" color="muted">{EQUIPMENT_LABELS[e.equipment]}</Text>
        </View>
      </View>
      <Icon name="forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  search: { flexDirection: 'row', alignItems: 'center', gap: space.xs, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space.sm, minHeight: 48 },
  input: { flex: 1, fontSize: 16, fontFamily: fonts.body, minHeight: 44 },
  none: { marginTop: space.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap', marginTop: 2 },
  newTemplate: { marginTop: space.xl },
  archived: { marginTop: space.xl, gap: space.xs, alignItems: 'flex-start' },
  archivedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, alignSelf: 'stretch' },
});
