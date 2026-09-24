import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, IconButton, MuscleMap, Screen, SectionTitle, SegmentedControl, Text, Toggle, usePhotoUrl } from '@/components';
import { useLive, useRepos, type ExerciseRow } from '@/db';
import { EQUIPMENT, EQUIPMENT_LABELS, LOG_TYPE_LABELS, LOG_TYPES, MUSCLE_LABELS, MUSCLES, type Equipment, type LogType, type Muscle } from '@/lib/domain';
import { REGION_VISIBILITY } from '@/lib/muscles';
import { photos } from '@/platform/photos';
import { fonts, radius, space, useTheme } from '@/theme';

const HIGHLIGHTABLE = MUSCLES.filter((m) => REGION_VISIBILITY.front[m] != null || REGION_VISIBILITY.back[m] != null);
const OTHER = MUSCLES.filter((m) => !HIGHLIGHTABLE.includes(m));
const REST = [45, 60, 90, 120, 180];

export default function ExerciseEditor() {
  const { id, addTo } = useLocalSearchParams<{ id?: string; addTo?: string }>();
  const existing = useLive((r) => (id ? r.exercises.get(Number(id)) : undefined), [id]);
  if (id && !existing) return null;
  return <ExerciseForm key={id ?? 'new'} existing={existing} addTo={addTo} />;
}

function ExerciseForm({ existing, addTo }: { existing?: ExerciseRow; addTo?: string }) {
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const [name, setName] = useState(existing?.name ?? '');
  const [equipment, setEquipment] = useState<Equipment>(existing?.equipment ?? 'dumbbell');
  const [logType, setLogType] = useState<LogType>(existing?.logType ?? 'weight_reps');
  const [perDumbbell, setPerDumbbell] = useState(existing ? existing.loadMode === 'per_dumbbell' : true);
  const [primary, setPrimary] = useState<Muscle[]>(existing?.primaryMuscles ?? []);
  const [secondary, setSecondary] = useState<Muscle[]>(existing?.secondaryMuscles ?? []);
  const [rest, setRest] = useState<number | null>(existing ? existing.defaultRestSec : 90);
  const [cues, setCues] = useState(existing?.cues.join('\n') ?? '');
  const [photoId, setPhotoId] = useState<string | null>(existing?.photoId ?? null);
  const photoUrl = usePhotoUrl(photoId, 'thumb');

  const cycle = (m: Muscle) => {
    if (primary.includes(m)) {
      setPrimary((p) => p.filter((x) => x !== m));
      setSecondary((s) => [...s, m]);
    } else if (secondary.includes(m)) {
      setSecondary((s) => s.filter((x) => x !== m));
    } else {
      setPrimary((p) => [...p, m]);
    }
  };

  const valid = name.trim().length > 0 && primary.length > 0;
  const save = () => {
    const input = {
      name,
      equipment,
      logType,
      loadMode: equipment === 'dumbbell' && perDumbbell && (logType === 'weight_reps') ? ('per_dumbbell' as const) : ('total' as const),
      primaryMuscles: primary,
      secondaryMuscles: secondary,
      defaultRestSec: rest,
      cues: cues.split('\n').map((s) => s.trim()).filter(Boolean),
    };
    let exerciseId: number;
    if (existing) {
      repos.exercises.update(existing.id, input);
      exerciseId = existing.id;
    } else {
      exerciseId = repos.exercises.create(input);
    }
    if (photoId !== (existing?.photoId ?? null)) {
      if (existing?.photoId) void photos.remove(existing.photoId);
      repos.exercises.setPhoto(exerciseId, photoId);
    }
    if (!existing && addTo === 'workout') {
      const active = repos.workouts.active();
      if (active) repos.workouts.addExercise(active.id, exerciseId);
    }
    router.back();
  };

  return (
    <Screen back title={existing ? 'Edit exercise' : 'New exercise'} right={<Button label="Save" compact disabled={!valid} onPress={save} />}>
      <TextInput value={name} onChangeText={setName} placeholder="Exercise name" placeholderTextColor={c.muted} accessibilityLabel="Exercise name" style={[styles.name, { color: c.ink, borderBottomColor: c.line }]} />

      <SectionTitle>Equipment</SectionTitle>
      <View style={styles.chips}>
        {EQUIPMENT.map((e) => (
          <Chip key={e} label={EQUIPMENT_LABELS[e]} on={equipment === e} onPress={() => setEquipment(e)} />
        ))}
      </View>
      {equipment === 'dumbbell' && logType === 'weight_reps' && (
        <View style={styles.toggleRow}>
          <Text style={styles.flex}>Weight is per dumbbell</Text>
          <Toggle value={perDumbbell} onChange={setPerDumbbell} label="Weight is per dumbbell" />
        </View>
      )}

      <SectionTitle>Logging</SectionTitle>
      <View style={styles.chips}>
        {LOG_TYPES.map((t) => (
          <Chip key={t} label={LOG_TYPE_LABELS[t]} on={logType === t} onPress={() => setLogType(t)} />
        ))}
      </View>

      <SectionTitle>Muscles</SectionTitle>
      <Text variant="caption" color="muted" style={styles.hint}>
        Tap once for primary, twice for secondary, three times to clear.
      </Text>
      <View style={styles.preview}>
        {(['front', 'back'] as const).map((v) => (
          <MuscleMap key={v} view={v} primary={primary} secondary={secondary} size="large" px={200} gapColor={c.bg} />
        ))}
      </View>
      <View style={styles.chips}>
        {HIGHLIGHTABLE.map((m) => (
          <Chip key={m} label={MUSCLE_LABELS[m]} on={primary.includes(m)} half={secondary.includes(m)} onPress={() => cycle(m)} />
        ))}
      </View>
      <Text variant="caption" color="muted" style={styles.hint}>
        Other muscles (not highlighted on the figure yet)
      </Text>
      <View style={styles.chips}>
        {OTHER.map((m) => (
          <Chip key={m} label={MUSCLE_LABELS[m]} on={primary.includes(m)} half={secondary.includes(m)} onPress={() => cycle(m)} />
        ))}
      </View>

      <SectionTitle>Default rest</SectionTitle>
      <SegmentedControl
        label="Default rest"
        value={String(rest ?? 'none')}
        options={[{ value: 'none', label: 'App default' }, ...REST.map((s) => ({ value: String(s), label: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }))]}
        onChange={(v) => setRest(v === 'none' ? null : Number(v))}
      />

      <SectionTitle>Form cues</SectionTitle>
      <TextInput
        value={cues}
        onChangeText={setCues}
        multiline
        placeholder="One short cue per line"
        placeholderTextColor={c.muted}
        accessibilityLabel="Form cues, one per line"
        style={[styles.cues, { color: c.ink, borderColor: c.line, backgroundColor: c.surface }]}
      />

      {photos.canCapture && (
        <>
          <SectionTitle>Photo</SectionTitle>
          <View style={styles.photoRow}>
            {photoUrl ? <Image source={{ uri: photoUrl }} style={styles.photo} accessibilityLabel="Exercise photo" /> : null}
            <Button label={photoId ? 'Replace photo' : 'Add a photo'} icon="camera" kind="secondary" compact onPress={async () => { const p = await photos.capture(); if (p) setPhotoId(p); }} />
            {photoId && <IconButton icon="trash" label="Remove photo" onPress={() => setPhotoId(null)} />}
          </View>
        </>
      )}
    </Screen>
  );
}

function Chip({ label, on, half, onPress }: { label: string; on: boolean; half?: boolean; onPress(): void }) {
  const { c } = useTheme();
  // Primary: accent outline and accent text. Secondary: outlined in the figure's secondary colour.
  const bg = on || half ? c.raised : 'transparent';
  const fg = on ? c.accentText : c.ink;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on || !!half }}
      aria-pressed={on || !!half}
      accessibilityLabel={`${label}${on ? ', primary' : half ? ', secondary' : ''}`}
      style={[styles.chip, { backgroundColor: bg, borderColor: on ? c.accent : half ? c.figureSecondary : c.outline, borderWidth: on || half ? 2 : 1 }]}
    >
      <Text variant="label" style={{ color: fg }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  name: { fontFamily: fonts.cond800i, fontSize: 30, lineHeight: 36, borderBottomWidth: 1, paddingVertical: space.xs, minHeight: 48 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  chip: { minHeight: 40, paddingHorizontal: space.sm, borderRadius: radius.pill, borderWidth: 1, justifyContent: 'center' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.md, minHeight: 44 },
  hint: { marginBottom: space.sm },
  preview: { flexDirection: 'row', justifyContent: 'center', gap: space.xl, marginBottom: space.md },
  cues: { borderWidth: 1, borderRadius: radius.md, minHeight: 120, padding: space.sm, fontFamily: fonts.body, fontSize: 16, textAlignVertical: 'top' },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  photo: { width: 56, height: 56, borderRadius: radius.md },
});
