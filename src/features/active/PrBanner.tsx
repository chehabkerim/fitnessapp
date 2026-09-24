import { useEffect, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { nativeDriver } from '@/platform/animation';
import { OutlinedText } from '@/platform/OutlinedText';
import { fonts, radius, space, useTheme } from '@/theme';

/** Purple PLUS ULTRA banner: slides in and replaces the set card for the rest period after a record. */
export function PrBanner({ record, value }: { record: string; value: string }) {
  const { c } = useTheme();
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: nativeDriver, speed: 18, bounciness: 6 }).start();
  }, [anim]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [48, 0] });

  return (
    <Animated.View
      style={[styles.banner, { backgroundColor: c.purple, opacity: anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1], easing: Easing.out(Easing.quad) }), transform: [{ translateX }] }]}
      accessible
      accessibilityLabel="Personal record. Plus Ultra"
      accessibilityHint={`${record}: ${value}`}
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.row}>
        <Icon name="bolt" size={16} color={c.onPurple} />
        <Text variant="overline" style={{ color: c.onPurple }}>
          New personal record
        </Text>
      </View>
      <OutlinedText fontFamily={fonts.cond800i} fontSize={64} lineHeight={68} color={c.onPurple} strokeWidth={2.5} uppercase accessible={false}>
        Plus Ultra
      </OutlinedText>
      <View style={styles.row}>
        <Text style={[styles.record, { color: c.onPurple }]}>{record}</Text>
        <View style={styles.flex} />
        <OutlinedText fontFamily={fonts.cond800i} fontSize={24} color={c.onPurple} accessible={false}>
          {value}
        </OutlinedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: { borderRadius: radius.card, padding: space.lg, gap: space.xxs },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  record: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
