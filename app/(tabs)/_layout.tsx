import { usePathname, useRouter } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { forwardRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, Text, type IconName } from '@/components';
import { FEATURES } from '@/config/features';
import { useLive } from '@/db';
import { useNow } from '@/hooks/useNow';
import { formatElapsed } from '@/lib/format';
import { fonts, layout, space, useTheme } from '@/theme';

type Href = '/' | '/food' | '/progress' | '/workouts' | '/history' | '/exercises' | '/settings';
const TABS: { name: string; href: Href; label: string; icon: IconName; visible: boolean }[] = [
  { name: 'index', href: '/', label: 'Today', icon: 'today', visible: FEATURES.today },
  { name: 'food', href: '/food', label: 'Food', icon: 'food', visible: FEATURES.food },
  { name: 'workouts', href: '/workouts', label: 'Train', icon: 'train', visible: true },
  { name: 'history', href: '/history', label: 'History', icon: 'history', visible: true },
  { name: 'exercises', href: '/exercises', label: 'Exercises', icon: 'list', visible: true },
  { name: 'progress', href: '/progress', label: 'Progress', icon: 'progress', visible: FEATURES.progress },
  { name: 'settings', href: '/settings', label: 'Settings', icon: 'settings', visible: true },
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
            <TabButton label={t.label} icon={t.icon} hidden={!t.visible} />
          </TabTrigger>
        ))}
      </TabList>
    </Tabs>
  );
}

const TabButton = forwardRef<View, TabTriggerSlotProps & { label: string; icon: IconName; hidden: boolean }>(function TabButton({ label, icon, isFocused, hidden, ...props }, ref) {
  const { c } = useTheme();
  if (hidden) return <View ref={ref} style={styles.hidden} />;
  const color = isFocused ? c.accentText : c.muted;
  return (
    <Pressable ref={ref} {...props} accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: !!isFocused }} aria-selected={!!isFocused} style={styles.tab}>
      <Icon name={icon} size={24} color={isFocused ? c.accent : c.muted} strokeWidth={isFocused ? 2 : 1.5} />
      <Text style={[styles.label, { color }]} maxFontSizeMultiplier={1.3}>
        {label}
      </Text>
    </Pressable>
  );
});

/** Slim bar above the tabs while a workout is minimised (Train shows a full Resume card instead). */
function ActiveWorkoutBar() {
  const { c } = useTheme();
  const router = useRouter();
  const path = usePathname();
  const active = useLive((r) => r.workouts.active());
  const now = useNow(1000, !!active);
  if (!active || path === '/workouts') return null;
  const name = active.name ?? 'Workout';
  const elapsed = formatElapsed(active.startedAt, now);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Return to ${name}, ${elapsed} elapsed`}
      onPress={() => router.push('/workout/active')}
      style={(s) => [styles.activeBar, { backgroundColor: c.surface, borderTopColor: c.accent, opacity: s.pressed ? 0.85 : 1 }]}
    >
      <Text variant="overline" color="accentText" style={styles.fill} numberOfLines={1}>
        {name}
      </Text>
      <Text style={{ fontFamily: fonts.cond700, fontSize: 20, color: c.ink }} numeric>
        {elapsed}
      </Text>
      <Icon name="up" size={20} color={c.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  activeBar: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: 52, paddingHorizontal: space.lg, borderTopWidth: 1.5 },
  fill: { flex: 1 },
  tabBar: { flexDirection: 'row', borderTopWidth: 1, paddingTop: space.xs },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: layout.minTap + 8, gap: 4 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 1, textTransform: 'uppercase' },
  hidden: { display: 'none' },
});
