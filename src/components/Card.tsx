import { StyleSheet, View, type ViewProps } from 'react-native';

import { radius, space, useTheme } from '../theme';

export function Card({ style, padded = true, ...rest }: ViewProps & { padded?: boolean }) {
  const { c } = useTheme();
  return <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }, padded && styles.padded, style]} {...rest} />;
}

export function Divider({ inset = 0 }: { inset?: number }) {
  const { c } = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth > 0.5 ? StyleSheet.hairlineWidth : 1, backgroundColor: c.line, marginLeft: inset }} />;
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, borderWidth: 1 },
  padded: { padding: space.md },
});
