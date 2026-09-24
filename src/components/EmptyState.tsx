import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '../theme';
import { Text } from './Text';

export function EmptyState({ title, body, children }: { title: string; body?: string; children?: ReactNode }) {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <Text variant="heading" align="center">
        {title}
      </Text>
      {body ? (
        <Text color="muted" align="center" style={styles.body}>
          {body}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: space.huge, paddingHorizontal: space.xl, gap: space.xs },
  body: { maxWidth: 320 },
  actions: { marginTop: space.lg, alignSelf: 'stretch', gap: space.sm },
});
