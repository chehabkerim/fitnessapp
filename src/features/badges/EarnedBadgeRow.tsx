import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { tierLabel, type BadgeDef } from '@/lib/badges';
import type { Units } from '@/lib/domain';
import { nativeDriver } from '@/platform/animation';
import { haptics } from '@/platform/haptics';
import { space } from '@/theme';
import { BadgeEmblem } from './BadgeEmblem';

/**
 * A newly earned badge on the Workout complete screen: emblem, "DIAMOND · TIER IV", name and description.
 * With `revealAfter` (ms) it fades in after that delay, plays the shine and a strong haptic.
 */
export function EarnedBadgeRow({ badge, units, revealAfter, onPress }: { badge: BadgeDef; units: Units; revealAfter?: number; onPress(): void }) {
  const [shown, setShown] = useState(revealAfter == null);
  const [anim] = useState(() => new Animated.Value(revealAfter == null ? 1 : 0));

  useEffect(() => {
    if (revealAfter == null) return;
    let cancelled = false;
    const t = setTimeout(() => {
      if (cancelled) return;
      setShown(true);
      haptics.strong();
      void AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
        if (cancelled) return;
        if (reduce) anim.setValue(1);
        else Animated.timing(anim, { toValue: 1, duration: 200, easing: Easing.out(Easing.quad), useNativeDriver: nativeDriver }).start();
      });
    }, revealAfter);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [revealAfter, anim]);

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${badge.name} badge, ${tierLabel(badge).replace(' · ', ', ')}. ${badge.description}`} style={styles.row}>
        <BadgeEmblem badge={badge} earned value={badge.target} units={units} size={56} shine={shown && revealAfter != null} />
        <View style={styles.text}>
          <Text variant="overline" color="accentText">
            {tierLabel(badge)}
          </Text>
          <Text variant="subheading">{badge.name}</Text>
          <Text variant="caption" color="muted">
            {badge.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingVertical: space.xs, minHeight: 48 },
  text: { flex: 1, gap: 2 },
});
