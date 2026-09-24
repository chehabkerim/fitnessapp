import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Divider, EmptyState, Screen, Sheet, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { formatDay, formatDuration } from '@/lib/format';
import { formatRecord, formatVolumeIn } from '@/features/workouts/format';
import { PR_LABELS } from '@/lib/prs';
import { unitLabel } from '@/lib/units';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const units = useLive((r) => r.settings.get().units);
  const summary = useLive((r) => r.workouts.summary(Number(id)), [id]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saved, setSaved] = useState(false);
  const insets = useSafeAreaInsets();

  if (!summary) {
    return (
      <Screen back>
        <EmptyState title="Workout not found" />
      </Screen>
    );
  }
  const w = summary.workout;
  const done = () => router.replace('/workouts');

  return (
    <Screen eyebrow={formatDay(w.date)} title="Workout complete" footer={<View style={[styles.footer, { borderTopColor: c.line, backgroundColor: c.bg, paddingBottom: insets.bottom + space.md }]}><Button label="Done" onPress={done} /></View>}>
      <Text variant="subheading" color="muted" style={styles.name}>
        {w.name ?? 'Workout'}
      </Text>
      <View style={styles.grid}>
        <Stat label="Duration" value={formatDuration(summary.durationMs)} />
        <Stat label={`Volume (${unitLabel(units)})`} value={formatVolumeIn(summary.volume, units)} />
        <Stat label="Sets" value={String(summary.setsCompleted)} />
        <Stat label="Exercises" value={String(summary.exerciseCount)} />
      </View>

      {summary.records.length > 0 && (
        <Card style={styles.prCard}>
          <Text style={[styles.prHead, { color: c.accent }]} accessibilityRole="header">
            Plus Ultra
          </Text>
          <Text variant="caption" color="muted" style={styles.prSub}>
            New personal records
          </Text>
          {summary.records.map((x, i) => (
            <View key={x.exercise.id}>
              {i > 0 && <Divider />}
              <View style={styles.prBlock}>
                <Text variant="bodyMedium">{x.exercise.name}</Text>
                {x.records.map((r) => (
                  <View key={r.metric} style={styles.prRow}>
                    <Text variant="caption" color="muted" style={styles.flex}>
                      {PR_LABELS[r.metric]}
                    </Text>
                    <Text variant="bodyMedium" color="accentStrong" numeric>
                      {formatRecord(r, x.exercise, units)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </Card>
      )}

      <View style={styles.actions}>
        <Button label={saved ? 'Saved as template' : 'Save as template'} kind="secondary" disabled={saved} onPress={() => { setTemplateName(w.name ?? ''); setSaveOpen(true); }} />
      </View>

      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)} title="Save as template">
        <TextInput
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="Template name"
          placeholderTextColor={c.faint}
          accessibilityLabel="Template name"
          autoFocus
          style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.bg }]}
        />
        <Button
          label="Save template"
          disabled={!templateName.trim()}
          onPress={() => {
            repos.templates.fromWorkout(w.id, templateName.trim());
            setSaveOpen(false);
            setSaved(true);
          }}
        />
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { c } = useTheme();
  return (
    <View style={[styles.stat, { borderColor: c.line }]} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text variant="overline" color="muted">
        {label}
      </Text>
      <Text style={[styles.statValue, { color: c.ink }]} numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  name: { marginTop: -space.sm, marginBottom: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  stat: { flexBasis: '47%', flexGrow: 1, borderWidth: 1, borderRadius: radius.lg, padding: space.md, gap: space.xxs },
  statValue: { fontFamily: fonts.display, fontSize: 32, lineHeight: 38 },
  prCard: { marginTop: space.xl, gap: space.xs },
  prHead: { fontFamily: fonts.displayItalic, fontSize: 32, lineHeight: 38 },
  prSub: { marginTop: -space.xxs, marginBottom: space.xs },
  prBlock: { paddingVertical: space.sm, gap: space.xxs },
  prRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 28 },
  actions: { marginTop: space.xl, gap: space.sm },
  footer: { padding: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  input: { borderWidth: 1, borderRadius: radius.md, minHeight: 48, paddingHorizontal: space.sm, fontFamily: fonts.body, fontSize: 16, marginBottom: space.md },
});
