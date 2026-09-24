import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { ActionSheet, Button, Card, EmptyState, ExerciseTile, IconButton, NumberInput, Screen, SectionTitle, Text } from '@/components';
import { useLive, useRepos, type ExerciseRow, type TemplateDetail, type TemplateItemInput } from '@/db';
import { ExercisePickerSheet } from '@/features/workouts/ExercisePickerSheet';
import { parseInteger } from '@/lib/units';
import { fonts, radius, space, useTheme } from '@/theme';

type Item = TemplateItemInput & { key: string; exercise: ExerciseRow };

export default function TemplateEditor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new' || !id;
  const existing = useLive((r) => (isNew ? undefined : r.templates.get(Number(id))), [id]);
  if (!isNew && !existing) {
    return (
      <Screen back>
        <EmptyState title="Template not found" />
      </Screen>
    );
  }
  return <TemplateForm key={id ?? 'new'} id={isNew ? null : Number(id)} initial={existing} />;
}

function TemplateForm({ id, initial }: { id: number | null; initial?: TemplateDetail }) {
  const isNew = id == null;
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const [name, setName] = useState(initial?.template.name ?? '');
  const [items, setItems] = useState<Item[]>(
    () =>
      initial?.items.map(({ item, exercise }) => ({ key: `i${item.id}`, exerciseId: exercise.id, exercise, targetSets: item.targetSets, targetRepsMin: item.targetRepsMin, targetRepsMax: item.targetRepsMax, restSec: item.restSec })) ?? [],
  );
  const [picker, setPicker] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (key: string, patch: Partial<Item>) => setItems((xs) => xs.map((x) => (x.key === key ? { ...x, ...patch } : x)));
  const move = (i: number, d: -1 | 1) =>
    setItems((xs) => {
      const j = i + d;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      return copy;
    });
  const save = () => {
    repos.templates.save({ id: id ?? undefined, name: name.trim(), items: items.map(({ key: _k, exercise: _e, ...rest }) => rest) });
    router.back();
  };

  return (
    <Screen
      back
      eyebrow={isNew ? 'New template' : 'Edit template'}
      right={<Button label="Save" compact disabled={!name.trim() || items.length === 0} onPress={save} />}
    >
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="Template name"
        placeholderTextColor={c.faint}
        accessibilityLabel="Template name"
        style={[styles.name, { color: c.ink, borderBottomColor: c.line }]}
      />

      <SectionTitle>Exercises</SectionTitle>
      {items.length === 0 && <Text color="muted">Add the exercises for this session, in order.</Text>}
      <View style={styles.list}>
        {items.map((it, i) => (
          <Card key={it.key} style={styles.item}>
            <View style={styles.row}>
              <ExerciseTile exercise={it.exercise} px={44} />
              <Text variant="bodyMedium" style={styles.flex}>
                {it.exercise.name}
              </Text>
              <IconButton icon="up" label={`Move ${it.exercise.name} up`} disabled={i === 0} onPress={() => move(i, -1)} />
              <IconButton icon="down" label={`Move ${it.exercise.name} down`} disabled={i === items.length - 1} onPress={() => move(i, 1)} />
              <IconButton icon="close" label={`Remove ${it.exercise.name}`} onPress={() => setItems((xs) => xs.filter((x) => x.key !== it.key))} />
            </View>
            <View style={styles.targets}>
              <Field label="Sets">
                <NumberInput label={`Target sets, ${it.exercise.name}`} value={String(it.targetSets)} onChangeText={(t) => update(it.key, { targetSets: Math.max(1, parseInteger(t) ?? 1) })} style={styles.num} />
              </Field>
              <Text color="muted" style={styles.times}>×</Text>
              <Field label="Reps">
                <View style={styles.row}>
                  <NumberInput label={`Minimum reps, ${it.exercise.name}`} value={it.targetRepsMin?.toString() ?? ''} placeholder="8" onChangeText={(t) => update(it.key, { targetRepsMin: parseInteger(t) })} style={styles.num} />
                  <Text color="muted">–</Text>
                  <NumberInput label={`Maximum reps, ${it.exercise.name}`} value={it.targetRepsMax?.toString() ?? ''} placeholder="12" onChangeText={(t) => update(it.key, { targetRepsMax: parseInteger(t) })} style={styles.num} />
                </View>
              </Field>
              <Field label="Rest (s)">
                <NumberInput
                  label={`Rest seconds, ${it.exercise.name}`}
                  value={it.restSec?.toString() ?? ''}
                  placeholder={String(it.exercise.defaultRestSec ?? 90)}
                  onChangeText={(t) => update(it.key, { restSec: parseInteger(t) })}
                  style={styles.numWide}
                />
              </Field>
            </View>
          </Card>
        ))}
      </View>
      <Button label="Add exercises" icon="plus" kind="secondary" style={styles.add} onPress={() => setPicker(true)} />
      {!isNew && <Button label="Delete template" kind="danger" compact style={styles.add} onPress={() => setConfirmDelete(true)} />}

      <ExercisePickerSheet
        visible={picker}
        addTo="template"
        onClose={() => setPicker(false)}
        onPick={(ids) =>
          setItems((xs) => [
            ...xs,
            ...ids.flatMap((eid) => {
              const exercise = repos.exercises.get(eid);
              return exercise ? [{ key: `n${Date.now()}${eid}`, exerciseId: eid, exercise, targetSets: 3, targetRepsMin: 8, targetRepsMax: 12, restSec: null }] : [];
            }),
          ])
        }
      />
      <ActionSheet
        visible={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this template?"
        message="Past workouts started from it are kept."
        actions={[{ label: 'Delete template', destructive: true, onPress: () => { if (id != null) repos.templates.remove(id); router.back(); } }]}
      />
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text variant="caption" color="muted">{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  name: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, borderBottomWidth: 1, paddingVertical: space.xs, minHeight: 48 },
  list: { gap: space.sm },
  item: { gap: space.sm },
  targets: { flexDirection: 'row', alignItems: 'flex-end', flexWrap: 'wrap', gap: space.sm },
  field: { gap: 4 },
  num: { width: 52 },
  numWide: { width: 64 },
  times: { paddingBottom: 12 },
  add: { marginTop: space.md, borderRadius: radius.md },
});
