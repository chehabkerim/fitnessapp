import { forwardRef, useEffect, useState } from 'react';
import { StyleSheet, TextInput, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { fonts, layout, radius, useTheme } from '../theme';

export interface NumberInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'style'> {
  /** Formatted value from the database. */
  value: string;
  /** Called on every edit with the raw text (the caller parses and saves immediately). */
  onChangeText: (text: string) => void;
  decimal?: boolean;
  label: string;
  style?: StyleProp<ViewStyle>;
  tint?: 'default' | 'done';
}

/**
 * Large numeric input: numeric keyboard, select-all on focus, tabular numerals, 16px+ so iOS doesn't zoom.
 * While focused it keeps the typed text (so "22." isn't reformatted mid-typing); it re-syncs on blur.
 */
export const NumberInput = forwardRef<TextInput, NumberInputProps>(function NumberInput(
  { value, onChangeText, decimal, label, style, tint = 'default', onFocus, onBlur, ...rest },
  ref,
) {
  const { c } = useTheme();
  const [text, setText] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setText(value);
  }, [value, focused]);

  return (
    <TextInput
      ref={ref}
      value={text}
      onChangeText={(t) => {
        setText(t);
        onChangeText(t);
      }}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        setText(value);
        onBlur?.(e);
      }}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      inputMode={decimal ? 'decimal' : 'numeric'}
      selectTextOnFocus
      accessibilityLabel={label}
      placeholderTextColor={c.faint}
      maxFontSizeMultiplier={1.6}
      returnKeyType="done"
      enterKeyHint="done"
      style={[
        styles.input,
        {
          color: c.ink,
          backgroundColor: tint === 'done' ? 'transparent' : c.bg,
          borderColor: focused ? c.focus : c.line,
        },
        style as object,
      ]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    minHeight: layout.minTap,
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 4,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: fonts.bodySemi,
    fontSize: 18,
    fontVariant: ['tabular-nums'],
  },
});
