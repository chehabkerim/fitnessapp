import { StyleSheet, View } from 'react-native';

import { space } from '../theme';
import { Card } from './Card';
import { Screen } from './Screen';
import { Text } from './Text';

/** Calm placeholder for tabs that arrive in later phases. */
export function Placeholder({ title, eyebrow, body }: { title: string; eyebrow: string; body: string }) {
  return (
    <Screen title={title} eyebrow={eyebrow} inTabs>
      <Card style={styles.card}>
        <Text variant="heading">Coming soon</Text>
        <Text color="muted">{body}</Text>
      </Card>
      <View style={styles.rule} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: space.xs, paddingVertical: space.xl },
  rule: { height: space.huge },
});
