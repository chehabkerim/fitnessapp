import type { StyleProp, TextStyle } from 'react-native';

import { useNow } from '../hooks/useNow';
import { formatElapsed } from '../lib/format';
import { Text } from './Text';

/** Ticking "24:13" since `startedAt`. Its own component so only this text re-renders each second. */
export function ElapsedText({ startedAt, style, label }: { startedAt: number; style?: StyleProp<TextStyle>; label?: boolean }) {
  const elapsed = formatElapsed(startedAt, useNow(1000));
  return (
    <Text style={style} numeric accessibilityLabel={label ? `Elapsed ${elapsed}` : undefined}>
      {elapsed}
    </Text>
  );
}
