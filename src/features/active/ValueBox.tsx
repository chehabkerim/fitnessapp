import { forwardRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Text } from '@/components';
import { fonts, radius, useTheme } from '@/theme';

export interface ValueBoxProps {
  /** Accessible name, e.g. "Weight, Lat Pulldown, set 2". */
  label: string;
  /** Visible caption under the number: "KG EACH", "REPS", "ADDED". */
  caption: string;
  value: string;
  placeholder?: string;
  decimal?: boolean;
  /** Desktop: a real input so digits type straight in. Touch: a button that opens the keypad. */
  typing: boolean;
  onChangeText(text: string): void;
  onSubmit(): void;
  onOpenKeypad(): void;
  /** Tab from this box moves here (reps → Complete). */
  onTabForward?(): void;
  size?: 'large' | 'wide';
}

/** Big tappable value (84px numerals) in a raised box. */
export const ValueBox = forwardRef<TextInput, ValueBoxProps>(function ValueBox(p, ref) {
  const { c } = useTheme();
  const [text, setText] = useState(p.value);
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : p.value;
  const numberStyle = [styles.number, { color: p.value === '' && !focused ? c.muted : c.ink }];

  return (
    <View style={[styles.box, p.size === 'wide' && styles.wide, { backgroundColor: c.raised, borderColor: focused ? c.accent : c.cardBorderWidth > 1 ? c.accent : c.line, borderWidth: focused ? 2 : c.cardBorderWidth }]}>
      {p.typing ? (
        <TextInput
          ref={ref}
          value={shown}
          onChangeText={(t) => {
            setText(t);
            p.onChangeText(t);
          }}
          onFocus={() => {
            setText(p.value);
            setFocused(true);
          }}
          onBlur={() => setFocused(false)}
          onSubmitEditing={p.onSubmit}
          onKeyPress={(e) => {
            const ev = e as unknown as { nativeEvent: { key: string; shiftKey?: boolean }; preventDefault?: () => void };
            if (ev.nativeEvent.key === 'Tab' && !ev.nativeEvent.shiftKey && p.onTabForward) {
              ev.preventDefault?.();
              p.onTabForward();
            }
          }}
          selectTextOnFocus
          keyboardType={p.decimal ? 'decimal-pad' : 'number-pad'}
          inputMode={p.decimal ? 'decimal' : 'numeric'}
          placeholder={p.placeholder ?? '0'}
          placeholderTextColor={c.muted}
          accessibilityLabel={p.label}
          blurOnSubmit={false}
          style={[numberStyle, styles.input]}
        />
      ) : (
        <Pressable onPress={p.onOpenKeypad} accessibilityRole="button" accessibilityLabel={`${p.label}: ${p.value || 'empty'}. Change`} style={styles.press}>
          <Text style={numberStyle} numeric>
            {p.value || p.placeholder || '0'}
          </Text>
        </Pressable>
      )}
      <Text variant="overline" color="muted" style={styles.caption} numberOfLines={1}>
        {p.caption}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  box: { flex: 1, minHeight: 140, borderRadius: radius.button, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, paddingHorizontal: 4 },
  wide: { flex: 1 },
  number: { fontFamily: fonts.cond800i, fontSize: 84, lineHeight: 92, textAlign: 'center', fontVariant: ['tabular-nums'] },
  input: { width: '100%', padding: 0, minHeight: 92 },
  press: { alignSelf: 'stretch', alignItems: 'center', minHeight: 92, justifyContent: 'center' },
  caption: { marginTop: 2 },
});
