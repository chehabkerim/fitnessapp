import type { CSSProperties } from 'react';
import { View } from 'react-native';

import type { OutlinedTextProps } from './OutlinedText.types';

/** Web: a real CSS stroke painted under the fill (paint-order: stroke fill). */
export function OutlinedText({ children, fontFamily, fontSize, lineHeight, color, strokeWidth = 2, strokeColor = '#0E0E10', uppercase, letterSpacing, accessible = true }: OutlinedTextProps) {
  const style: CSSProperties & Record<string, unknown> = {
    fontFamily,
    fontSize,
    lineHeight: `${lineHeight ?? fontSize}px`,
    color,
    letterSpacing,
    textTransform: uppercase ? 'uppercase' : undefined,
    WebkitTextStroke: `${strokeWidth}px ${strokeColor}`,
    paintOrder: 'stroke fill',
    whiteSpace: 'pre-wrap',
    display: 'inline-block',
  };
  return (
    <View accessible={accessible}>
      <span style={style}>{children}</span>
    </View>
  );
}
