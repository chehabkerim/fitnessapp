import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';

import { OutlinedText } from '../platform/OutlinedText';
import { fonts, layout, radius, space, useTheme } from '../theme';
import { Icon, type IconName } from './Icon';
import { Text } from './Text';

/**
 * primary: purple fill, outlined condensed label, ≥ 64px (Start workout, Complete set, Done)
 * secondary: transparent with a 1.5px neutral outline
 * accent: transparent with an accent outline and accent label (Finish, Skip)
 * ghost: text only, accent ink; link: underlined body text
 * danger: outlined in the danger colour
 */
type Kind = 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'danger';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  kind?: Kind;
  icon?: IconName;
  loading?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessible name when it should differ from the visible label (e.g. "Start Back & Chest"). */
  a11yLabel?: string;
}

export function Button({ label, kind = 'primary', icon, loading, compact, disabled, style, a11yLabel, ...rest }: ButtonProps) {
  const { c } = useTheme();
  const primary = kind === 'primary';
  const fg = primary ? c.onPurple : kind === 'accent' ? c.accentText : kind === 'danger' ? c.danger : kind === 'ghost' ? c.accentText : c.ink;
  const border = kind === 'secondary' ? c.outline : kind === 'accent' ? c.accent : kind === 'danger' ? c.danger : 'transparent';
  const text = kind === 'link' || kind === 'ghost';
  const size = compact ? 20 : 24;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11yLabel ?? label}
      accessibilityState={{ disabled: !!disabled, busy: !!loading }}
      disabled={disabled || loading}
      style={(state) => [
        styles.base,
        text ? styles.text : compact ? styles.compact : primary ? styles.primary : styles.regular,
        { backgroundColor: primary ? c.purple : 'transparent', borderColor: border, borderWidth: text ? 0 : 1.5 },
        { opacity: disabled ? 0.45 : state.pressed ? 0.8 : (state as { hovered?: boolean }).hovered ? 0.9 : 1, transform: [{ scale: state.pressed && primary ? 0.98 : 1 }] },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={styles.row}>
          {icon && <Icon name={icon} size={compact ? 18 : 22} color={fg} strokeWidth={2.25} />}
          {kind === 'link' ? (
            <Text variant="bodyMedium" style={[styles.link, { color: c.ink }]}>
              {label}
            </Text>
          ) : kind === 'ghost' ? (
            <Text variant="label" style={{ color: fg }}>
              {label}
            </Text>
          ) : primary ? (
            <OutlinedText fontFamily={fonts.cond800i} fontSize={size} color={fg} uppercase letterSpacing={0.4} accessible={false}>
              {label}
            </OutlinedText>
          ) : (
            <Text numberOfLines={1} style={{ fontFamily: fonts.cond800i, fontSize: compact ? 18 : 19, lineHeight: compact ? 22 : 24, color: fg, textTransform: 'uppercase' }}>{label}</Text>
          )}
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
  outlined,
  round,
  ...rest
}: { icon: IconName; label: string; color?: string; size?: number; style?: StyleProp<ViewStyle>; outlined?: boolean; round?: boolean } & Omit<PressableProps, 'style' | 'children'>) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={(state) => [
        styles.icon,
        round ? { borderRadius: radius.pill } : { borderRadius: radius.md },
        outlined && { borderWidth: 1.5, borderColor: c.outline },
        { opacity: disabled ? 0.4 : state.pressed ? 0.6 : 1, backgroundColor: (state as { hovered?: boolean }).hovered ? c.raised : 'transparent' },
        style,
      ]}
      {...rest}
    >
      <Icon name={icon} size={size} color={color ?? c.ink} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
  primary: { minHeight: layout.primaryButton, paddingHorizontal: space.lg, borderRadius: radius.button },
  regular: { minHeight: 56, paddingHorizontal: space.lg, borderRadius: radius.button },
  compact: { minHeight: layout.minTap, paddingHorizontal: space.md, borderRadius: radius.md },
  text: { minHeight: layout.minTap, paddingHorizontal: space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  link: { textDecorationLine: 'underline' },
  icon: { width: layout.minTap, height: layout.minTap, alignItems: 'center', justifyContent: 'center' },
});
