import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

/** Thin accent progress bar (0–1). Decorative: the text next to it carries the numbers. */
export function ProgressBar({ fraction, height = 6 }: { fraction: number; height?: number }) {
  const { c } = useTheme();
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <View style={[styles.track, { height, borderRadius: height / 2, backgroundColor: c.raised }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={{ width: `${f * 100}%`, height, borderRadius: height / 2, backgroundColor: c.accent }} />
    </View>
  );
}

const styles = StyleSheet.create({ track: { overflow: 'hidden', alignSelf: 'stretch' } });
