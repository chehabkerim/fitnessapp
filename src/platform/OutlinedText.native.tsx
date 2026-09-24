import { StyleSheet, Text, View } from 'react-native';

import type { OutlinedTextProps } from './OutlinedText.types';

// React Native has no text stroke and only one text shadow, so the outline is eight copies of the text
// in the stroke colour, offset around the fill copy. Reads the same as the web's CSS stroke.
const OFFSETS = [-1, 0, 1].flatMap((x) => [-1, 0, 1].map((y) => [x, y] as const)).filter(([x, y]) => x || y);

export function OutlinedText({ children, fontFamily, fontSize, lineHeight, color, strokeWidth = 2, strokeColor = '#0E0E10', uppercase, letterSpacing, accessible = true }: OutlinedTextProps) {
  const base = { fontFamily, fontSize, lineHeight: lineHeight ?? fontSize, letterSpacing, textTransform: uppercase ? ('uppercase' as const) : undefined };
  const d = strokeWidth / 2; // matches paint-order: half the stroke shows outside the glyph
  return (
    <View accessible={accessible} accessibilityLabel={children}>
      {OFFSETS.map(([x, y]) => (
        <Text key={`${x}${y}`} style={[base, styles.abs, { color: strokeColor, transform: [{ translateX: x * d }, { translateY: y * d }] }]} importantForAccessibility="no" accessibilityElementsHidden>
          {children}
        </Text>
      ))}
      <Text style={[base, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({ abs: { position: 'absolute', left: 0, top: 0 } });
