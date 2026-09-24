import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';

import { type ColorKey, type TypeVariant, type as typeScale, useTheme } from '../theme';

export interface TextProps extends RNTextProps {
  variant?: TypeVariant;
  color?: ColorKey;
  /** Tabular numerals: use for every number. */
  numeric?: boolean;
  align?: TextStyle['textAlign'];
}

export function Text({ variant = 'body', color = 'ink', numeric, align, style, ...rest }: TextProps) {
  const { c } = useTheme();
  return <RNText {...rest} style={[typeScale[variant], { color: c[color], textAlign: align }, numeric && { fontVariant: ['tabular-nums'] }, style]} />;
}
