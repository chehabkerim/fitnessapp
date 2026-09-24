import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, Divider, EmptyState, Screen, Sheet, Text } from '@/components';
import { useLive, useRepos } from '@/db';
import { formatRecord, formatVolumeIn } from '@/features/workouts/format';
import { formatClock, formatDayMonth } from '@/lib/format';
import { PR_LABELS } from '@/lib/prs';
import { headlineRecord } from '@/lib/train';
import { unitLabel } from '@/lib/units';
import { fonts, radius, space, useTheme } from '@/theme';

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const repos = useRepos();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const units = useLive((r) => r.settings.get().units);
  const summary = useLive((r) => r.workouts.summary(Number(id)), [id]);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [saved, setSaved] = useState(false);

  if (!summary) {
    return (
      <Screen back>
        <EmptyState title="Workout not found" />
      </Screen>
    );
  }
  const w = summary.workout;
  // One row per exercise: its headline record, with any others named underneath.
  const records = summary.records.map((x) => {
    const metric = headlineRecord(x.records.map((r) => r.metric))!;
    const record = x.records.find((r) => r.metric === metric)!;
    const also = x.records.filter((r) => r !== record).map((r) => PR_LABELS[r.metric].replace(/^\w/, (ch) => ch.toLowerCase()));
    return { exercise: x.exercise, record, also };
  });

  const footer = (
    <View style={[styles.footer, { backgroundColor: c.bg, paddingBottom: insets.bottom + space.md }]}>
      <Button
        label={saved ? 'Saved' : 'Save as template'}
        kind="secondary"
        disabled={saved}
        style={styles.flex}
        onPress={() => {
          setTemplateName(w.name ?? '');
          setSaveOpen(true);
        }}
      />
      <Button label="Done" style={styles.flex} onPress={() => router.replace('/workouts')} />
    </View>
  );

  return (
    <Screen footer={footer}>
      <View style={styles.top} />
      <Text variant="overline" color="muted">
        {formatDayMonth(w.date)} · {w.name ?? 'Workout'}
      </Text>
      <Text variant="display" style={styles.title} accessibilityRole="header">
        Workout complete
      </Text>

      <View style={styles.stats}>
        <Stat label="Duration" value={formatClock(summary.durationMs / 1000)} />
        <Stat label={`${unitLabel(units)} volume`} value={formatVolumeIn(summary.volume, units)} />
        <Stat label="Sets" value={String(summary.setsCompleted)} />
      </View>

      {records.length > 0 && (
        <Card accent style={styles.records}>
          <View style={styles.recordsHead}>
            <Text style={[styles.recordsTitle, { color: c.accentText }]} accessibilityRole="header">
              Plus Ultra
            </Text>
            <Text variant="caption" color="muted">
              {records.length} new record{records.length === 1 ? '' : 's'}
            </Text>
          </View>
          {records.map(({ exercise, record, also }) => (
            <View key={`${exercise.id}-${record.metric}`}>
              <Divider />
              <View style={styles.recordRow} accessible accessibilityLabel={`${exercise.name}, ${PR_LABELS[record.metric]}: ${formatRecord(record, exercise, units)}, was ${formatRecord({ ...record, value: record.previous }, exercise, units)}`}>
                <View style={styles.flex}>
                  <Text variant="subheading">{exercise.name}</Text>
                  <Text variant="caption" color="muted">
                    {PR_LABELS[record.metric]}
                    {also.length ? ` · also ${also.join(', ')}` : ''}
                  </Text>
                </View>
                <View style={styles.recordValue}>
                  <Text style={[styles.value, { color: c.ink }]} numeric>
                    {formatRecord(record, exercise, units)}
                  </Text>
                  <Text variant="caption" color="muted" numeric>
                    was {formatRecord({ ...record, value: record.previous }, exercise, units).split(' ')[0]}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </Card>
      )}

      <Sheet visible={saveOpen} onClose={() => setSaveOpen(false)} title="Save as template">
        <TextInput
          value={templateName}
          onChangeText={setTemplateName}
          placeholder="Template name"
          placeholderTextColor={c.muted}
          accessibilityLabel="Template name"
          autoFocus
          style={[styles.input, { color: c.ink, borderColor: c.line, backgroundColor: c.raised }]}
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
    <Card style={styles.stat} accessible accessibilityLabel={`${label}: ${value}`}>
      <Text style={[styles.statValue, { color: c.ink }]} numeric numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text variant="overline" color="muted" numberOfLines={1}>
        {label}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  title: { fontSize: 64, lineHeight: 60, marginTop: space.xxs, marginBottom: space.lg },
  top: { height: space.xl },
  stats: { flexDirection: 'row', gap: space.xs },
  stat: { flex: 1, paddingVertical: space.sm, paddingHorizontal: space.sm },
  statValue: { fontFamily: fonts.cond800i, fontSize: 34, lineHeight: 38 },
  records: { marginTop: space.lg, gap: space.xs, padding: space.lg },
  recordsHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.xs },
  recordsTitle: { fontFamily: fonts.cond800i, fontSize: 40, lineHeight: 42, textTransform: 'uppercase' },
  recordRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: space.sm },
  recordValue: { alignItems: 'flex-end', maxWidth: '45%' },
  value: { fontFamily: fonts.cond800i, fontSize: 26, lineHeight: 28, textAlign: 'right' },
  footer: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.md, paddingTop: space.sm },
  input: { borderWidth: 1, borderRadius: radius.md, minHeight: 52, paddingHorizontal: space.sm, fontFamily: fonts.body, fontSize: 16, marginBottom: space.md },
});
