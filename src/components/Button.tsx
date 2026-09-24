import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { layout, radius, space, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

type Kind = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  kind?: Kind;
  icon?: IconName;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, kind = 'primary', icon, loading, compact, disabled, style, ...rest }: ButtonProps) {
  const { c } = useTheme();
  const bg = kind === 'primary' ? c.accentStrong : kind === 'secondary' ? c.surface : 'transparent';
  const fg = kind === 'primary' ? c.onAccent : kind === 'danger' ? c.danger : kind === 'ghost' ? c.accentStrong : c.ink;
  const border = kind === 'secondary' ? c.line : 'transparent';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        compact && styles.compact,
        { backgroundColor: bg, borderColor: border, opacity: disabled ? 0.45 : (state as { hovered?: boolean }).hovered || state.pressed ? 0.85 : 1 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={20} color={fg} />}
          <Text variant="bodyMedium" style={{ color: fg }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color,
  size = 24,
  disabled,
  style,
  ...rest
}: { icon: IconName; label: string; color?: string; size?: number; style?: StyleProp<ViewStyle> } & Omit<PressableProps, 'style' | 'children'>) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={(state) => [styles.icon, { opacity: disabled ? 0.4 : state.pressed ? 0.6 : 1, backgroundColor: (state as { hovered?: boolean }).hovered ? c.surfaceAlt : 'transparent' }, style]}
      {...rest}
    >
      <Icon name={icon} size={size} color={color ?? c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compact: { minHeight: layout.minTap, paddingHorizontal: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  icon: { width: layout.minTap, height: layout.minTap, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
