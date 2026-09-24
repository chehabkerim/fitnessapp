import { useRouter } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components';
import { useLive } from '@/db';
import { useNow } from '@/hooks/useNow';
import { formatElapsed } from '@/lib/format';
import { layout, space, useTheme } from '@/theme';

const TABS: { name: string; href: '/' | '/food' | '/workouts' | '/progress' | '/settings'; label: string; icon: IconName }[] = [
  { name: 'index', href: '/', label: 'Today', icon: 'today' },
  { name: 'food', href: '/food', label: 'Food', icon: 'food' },
  { name: 'workouts', href: '/workouts', label: 'Workouts', icon: 'workouts' },
  { name: 'progress', href: '/progress', label: 'Progress', icon: 'progress' },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings' },
];

export default function TabsLayout() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tabs style={styles.fill}>
      <TabSlot style={styles.fill} />
      <ActiveWorkoutBar />
      <TabList style={[styles.tabBar, { backgroundColor: c.bg, borderTopColor: c.line, paddingBottom: Math.max(insets.bottom, space.xs) }]}>
        {TABS.map((t) => (
          <TabTrigger key={t.name} name={t.name} href={t.href} asChild>
            <TabButton label={t.label} icon={t.icon} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string; icon: IconName }>(function TabButton({ label, icon, isFocused, ...props }, ref) {
  const { c } = useTheme();
  const color = isFocused ? c.accentStrong : c.muted;
  return (
    <Pressable ref={ref} {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} style={styles.tab}>
      <Icon name={icon} size={24} color={color} />
      <Text variant="caption" style={{ color, fontSize: 11 }} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
});

/** Slim bar above the tab bar while a workout is minimised: "Push day · 24:13". */
function ActiveWorkoutBar() {
  const { c } = useTheme();
  const router = useRouter();
  const active = useLive((r) => r.workouts.active());
  const now = useNow(1000, !!active);
  if (!active) return null;
  const name = active.name ?? 'Workout';
  const elapsed = formatElapsed(active.startedAt, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Return to ${name}, ${elapsed} elapsed`}
      onPress={() => router.push('/workout/active')}
      style={(s) => [styles.activeBar, { backgroundColor: c.surface, borderTopColor: c.line, opacity: s.pressed ? 0.85 : 1 }]}
    >
      <View style={[styles.dot, { backgroundColor: c.sage }]} />
      <Text variant="bodyMedium" numberOfLines={1} style={styles.fill}>
        {name} <Text color="muted">·</Text> <Text variant="bodyMedium" numeric>{elapsed}</Text>
      </Text>
      <Text variant="label" color="accentStrong">
        Resume
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: space.xxs },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: layout.minTap + 8, gap: 2 },
  activeBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 48, paddingHorizontal: space.lg, borderTopWidth: StyleSheet.hairlineWidth },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
