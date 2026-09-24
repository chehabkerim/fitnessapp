import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card, Divider, ListRow, Screen, SectionTitle, SegmentedControl, Text, Toggle } from '@/components';
import { useLive, useRepos } from '@/db';
import { health } from '@/health';
import { MOBILE_ONLY_NOTE, type HealthStatus } from '@/health/types';
import type { ThemePref, Units } from '@/lib/domain';
import { restAlerts } from '@/platform/restAlerts';
import type { AlertPermission } from '@/platform/types';
import { space, useTheme } from '@/theme';

const REST = [60, 90, 120, 180];

export default function Settings() {
  const router = useRouter();
  const repos = useRepos();
  const { setPref } = useTheme();
  const settings = useLive((r) => r.settings.get());
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [alerts, setAlerts] = useState<AlertPermission | null>(null);

  useEffect(() => {
    void health.getPermissionStatus().then(setHealthStatus);
    void restAlerts.permission().then(setAlerts);
  }, []);

  return (
    <Screen title="Settings" inTabs>
      <SectionTitle>Units</SectionTitle>
      <SegmentedControl<Units>
        label="Weight units"
        value={settings.units}
        options={[{ value: 'metric', label: 'kg' }, { value: 'imperial', label: 'lb' }]}
        onChange={(units) => repos.settings.update({ units })}
      />

      <SectionTitle>Appearance</SectionTitle>
      <SegmentedControl<ThemePref>
        label="Appearance"
        value={settings.theme}
        options={[{ value: 'system', label: 'System' }, { value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
        onChange={(theme) => {
          setPref(theme);
          repos.settings.update({ theme });
        }}
      />

      <SectionTitle>Rest timer</SectionTitle>
      <Text variant="caption" color="muted" style={styles.hint}>
        Default rest when an exercise has none of its own.
      </Text>
      <SegmentedControl
        label="Default rest"
        value={String(settings.defaultRestSec)}
        options={REST.map((s) => ({ value: String(s), label: `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }))}
        onChange={(v) => repos.settings.update({ defaultRestSec: Number(v) })}
      />
      <Card padded={false} style={styles.card}>
        <View style={styles.pad}>
          <ListRow
            label="Rest timer sound"
            detail="A soft tone when rest ends, while the app is open"
            right={<Toggle value={settings.restToneEnabled} onChange={(v) => repos.settings.update({ restToneEnabled: v })} label="Rest timer sound" />}
          />
        </View>
        <Divider inset={space.md} />
        <View style={styles.pad}>
          <ListRow
            label="Rest alerts"
            detail={
              alerts === 'granted'
                ? 'On. You get a notification when rest ends in the background.'
                : alerts === 'denied'
                  ? "Off. Allow notifications for this app in your device or browser settings. Until then, the tab title shows the countdown."
                  : alerts === 'unsupported'
                    ? 'Not supported here. The tab title shows the countdown instead.'
                    : 'You’ll be asked the first time a rest timer starts.'
            }
          />
        </View>
      </Card>

      <SectionTitle>Health</SectionTitle>
      <Card>
        <Text variant="bodyMedium">Steps and activity</Text>
        <Text color="muted">
          {healthStatus?.available === false ? MOBILE_ONLY_NOTE : 'Connected to your health data.'} Health data never leaves your device.
        </Text>
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card padded={false}>
        <View style={styles.pad}>
          <ListRow label="Backup, install and reset" detail="Export or import your log, install the app, start over" onPress={() => router.push('/settings/data')} />
        </View>
      </Card>

      <SectionTitle>About</SectionTitle>
      <Text variant="heading">Plus Ultra</Text>
      <Text color="muted">Version {Constants.expoConfig?.version ?? '0.1.0'} · Everything stays on this device. No account, no tracking.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hint: { marginBottom: space.sm },
  card: { marginTop: space.md },
  pad: { paddingHorizontal: space.md },
});
