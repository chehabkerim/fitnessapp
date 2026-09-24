import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { layout, radius, space, useTheme } from '../theme';
import { Icon } from './Icon';
import { Text } from './Text';

export function SegmentedControl<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  const { c } = useTheme();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={[styles.segment, { backgroundColor: c.surfaceAlt }]}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            aria-checked={selected}
            accessibilityLabel={o.label}
            onPress={() => onChange(o.value)}
            style={[styles.segItem, selected && { backgroundColor: c.surface, borderColor: c.line }]}
          >
            <Text variant="label" color={selected ? 'ink' : 'muted'}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  const { c } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      accessibilityLabel={label}
      trackColor={{ false: c.line, true: c.sage }}
      thumbColor={c.surface}
      {...({ activeThumbColor: c.surface } as object)}
    />
  );
}

export function ListRow({ label, detail, onPress, right, accessibilityHint }: { label: string; detail?: string; onPress?: () => void; right?: ReactNode; accessibilityHint?: string }) {
  const { c } = useTheme();
  const content = (
    <>
      <View style={styles.flex}>
        <Text variant="bodyMedium">{label}</Text>
        {detail ? (
          <Text variant="caption" color="muted">
            {detail}
          </Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="forward" size={20} color={c.muted} /> : null)}
    </>
  );
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      style={(s) => [styles.row, { opacity: s.pressed ? 0.7 : 1 }]}
    >
      {content}
    </Pressable>
  );
}

export function SectionTitle({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="overline" color="muted" accessibilityRole="header" style={styles.flex}>
        {children}
      </Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  segment: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  segItem: { flex: 1, minHeight: layout.minTap - 4, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm, borderWidth: 1, borderColor: 'transparent' },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 56, gap: space.sm, paddingVertical: space.xs },
  section: { flexDirection: 'row', alignItems: 'center', marginTop: space.xxl, marginBottom: space.sm, minHeight: 24 },
});
