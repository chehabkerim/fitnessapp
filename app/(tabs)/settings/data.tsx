import { useState, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

import { ActionSheet, Button, Card, Screen, SectionTitle, Text } from '@/components';
import { EXPORT_FORMAT, EXPORT_VERSION, flushNow, useLive, useRepos, validateExport, type ExportFile } from '@/db';
import { toLocalDate } from '@/lib/dates';
import { formatLongDate } from '@/lib/format';
import { files } from '@/platform/files';
import { install } from '@/platform/install';
import { photos } from '@/platform/photos';
import { space } from '@/theme';

export default function DataSettings() {
  const repos = useRepos();
  const state = useLive((r) => r.appState.get());
  const mode = useSyncExternalStore(install.subscribe, install.mode, () => 'none' as const);
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<ExportFile | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);

  const doExport = async () => {
    setBusy(true);
    try {
      const tables = repos.data.exportTables();
      const ids = (tables.exercises as { photo_id?: string; photoId?: string }[]).map((e) => e.photoId ?? e.photo_id).filter((x): x is string => !!x);
      const file: ExportFile = { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), tables, photos: await photos.exportAll(ids) };
      await files.saveJson(`plus-ultra-${toLocalDate()}.json`, file);
      repos.appState.update({ lastExportAt: Date.now() });
      setStatus({ tone: 'ok', text: 'Backup saved.' });
    } catch (e) {
      setStatus({ tone: 'error', text: `Export failed: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const pickImport = async () => {
    setStatus(null);
    try {
      const data = await files.openJson();
      if (data == null) return;
      setPendingImport(validateExport(data));
    } catch (e) {
      setStatus({ tone: 'error', text: e instanceof Error ? e.message : String(e) });
    }
  };

  const doImport = async (file: ExportFile) => {
    setBusy(true);
    try {
      await photos.clear();
      await photos.importAll(file.photos);
      repos.data.importTables(file);
      await flushNow();
      setStatus({ tone: 'ok', text: `Imported your backup from ${formatLongDate(file.exportedAt.slice(0, 10))}.` });
    } catch (e) {
      setStatus({ tone: 'error', text: `Import failed: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const doReset = async () => {
    await photos.clear();
    repos.data.resetAll();
    await flushNow();
    setStatus({ tone: 'ok', text: 'All data was reset. Your library and templates are back to the originals.' });
  };

  return (
    <Screen back title="Your data">
      {mode !== 'none' && (
        <>
          <SectionTitle>Install</SectionTitle>
          <Card style={styles.card}>
            <Text variant="bodyMedium">Add Plus Ultra to your home screen</Text>
            <Text color="muted">
              It opens like an app, works offline at the gym, and your browser won’t clear its data after a week without visits.
            </Text>
            {mode === 'prompt' && <Button label="Install app" onPress={() => void install.prompt()} />}
            {mode === 'ios' && <Text>In Safari, tap Share, then “Add to Home Screen”.</Text>}
            {mode === 'manual' && <Text>Use your browser’s menu and choose “Install” or “Add to Home Screen”.</Text>}
          </Card>
        </>
      )}

      <SectionTitle>Backup</SectionTitle>
      <Card style={styles.card}>
        <Text variant="bodyMedium">Last export</Text>
        <Text color="muted" numeric>
          {state.lastExportAt ? formatLongDate(toLocalDate(new Date(state.lastExportAt))) : 'Never'}
        </Text>
        {files.canExport ? (
          <View style={styles.buttons}>
            <Button label="Export JSON" onPress={() => void doExport()} loading={busy} />
            <Button label="Import JSON" kind="secondary" onPress={() => void pickImport()} disabled={busy} />
          </View>
        ) : (
          <Text color="muted">Export and import arrive with the mobile app build.</Text>
        )}
        <Text variant="caption" color="muted">
          The export includes your workouts, templates, custom exercises, settings and photos.
        </Text>
      </Card>
      {status && (
        <Text color={status.tone === 'ok' ? 'ink' : 'danger'} style={styles.status} accessibilityLiveRegion="polite">
          {status.text}
        </Text>
      )}

      <SectionTitle>Start over</SectionTitle>
      <Button label="Reset all data" kind="danger" onPress={() => setConfirmReset(true)} />

      <ActionSheet
        visible={!!pendingImport}
        onClose={() => setPendingImport(null)}
        title="Replace everything with this backup?"
        message={pendingImport ? `Backup from ${formatLongDate(pendingImport.exportedAt.slice(0, 10))}. Your current log will be replaced.` : undefined}
        actions={[{ label: 'Import and replace', destructive: true, onPress: () => pendingImport && void doImport(pendingImport) }]}
      />
      <ActionSheet
        visible={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all data?"
        message="Workouts, templates, custom exercises and photos are deleted. Export a backup first if you might want them back."
        actions={[{ label: 'Delete everything', destructive: true, onPress: () => void doReset() }]}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xs },
  buttons: { gap: space.sm, marginTop: space.sm },
  status: { marginTop: space.md },
});
