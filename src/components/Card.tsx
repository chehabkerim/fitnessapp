import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, space, useTheme } from '../theme';

/** Dark: 1px hairline border. Light: 2px accent border. `accent` forces an accent border (records card). */
export function Card({ style, padded = true, accent, ...rest }: ViewProps & { padded?: boolean; accent?: boolean }) {
  const { c } = useTheme();
  return (
    <View
      style={[styles.card, { backgroundColor: c.surface, borderColor: accent ? c.accent : c.cardBorder, borderWidth: accent ? Math.max(1.5, c.cardBorderWidth) : c.cardBorderWidth }, padded && styles.padded, style]}
      {...rest}
    />
  );
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c.line, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.card },
  padded: { padding: space.md },
});
