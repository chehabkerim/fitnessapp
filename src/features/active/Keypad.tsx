import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Icon, Text } from '@/components';
import { adjustText, applyKey } from '@/lib/keypad';
import { nativeDriver } from '@/platform/animation';
import { haptics } from '@/platform/haptics';
import { fonts, layout, radius, space, useTheme } from '@/theme';

export interface KeypadProps {
  /** "Weight", "Reps", "Added", "Seconds". */
  title: string;
  setLabel: string;
  unit: string;
  value: string;
  decimal: boolean;
  chips: number[];
  /** Called on every key: the value is saved immediately. */
  onChange(text: string): void;
  switchLabel?: string;
  switchDirection?: 'forward' | 'back';
  onSwitch?(): void;
  onDone(): void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const;

/** Bottom-sheet keypad that replaces the system keyboard while logging (touch devices). */
export function Keypad({ visible, ...p }: KeypadProps & { visible: boolean }) {
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={p.onDone} statusBarTranslucent>
      {visible && <KeypadBody key={`${p.title}-${p.setLabel}`} {...p} />}
    </Modal>
  );
}

function KeypadBody(p: KeypadProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState(p.value);
  // Refs hold the working value so fast taps never read a stale render.
  const textRef = useRef(p.value);
  const freshRef = useRef(true); // the first key replaces the value
  const [slide] = useState(() => new Animated.Value(0));
  useEffect(() => {
    Animated.timing(slide, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
  }, [slide]);

  const set = (next: string) => {
    textRef.current = next;
    freshRef.current = false;
    setText(next);
    p.onChange(next);
    haptics.selection();
  };

  return (
    <View style={styles.fill}>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} onPress={p.onDone} accessibilityLabel="Close keypad" accessibilityRole="button" />
      <View style={styles.anchor} pointerEvents="box-none">
        <Animated.View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.cardBorder, paddingBottom: insets.bottom + space.md, transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }] }]} accessibilityViewIsModal>
          <View style={[styles.grabber, { backgroundColor: c.outline }]} />
          <View style={styles.header}>
            <Text variant="overline" color="accentText" style={styles.flex}>
              {p.title} · {p.setLabel}
            </Text>
            <Text variant="overline" color="muted">
              {p.unit}
            </Text>
          </View>
          <View style={[styles.well, { backgroundColor: c.raised, borderColor: c.accent }]} accessible accessibilityLabel={`${p.title}: ${text || 'empty'}`} accessibilityLiveRegion="polite">
            <Text style={[styles.value, { color: c.ink }]} numeric>
              {text || ' '}
            </Text>
            <View style={[styles.caret, { backgroundColor: c.accent }]} />
          </View>
          <View style={styles.chips}>
            {p.chips.map((d) => (
              <Pressable
                key={d}
                onPress={() => set(adjustText(textRef.current, d))}
                accessibilityRole="button"
                accessibilityLabel={`${d > 0 ? 'Add' : 'Subtract'} ${Math.abs(d)}`}
                style={(s) => [styles.chip, { borderColor: c.outline, opacity: s.pressed ? 0.6 : 1 }]}
              >
                <Text style={[styles.chipText, { color: c.ink }]} numeric>
                  {d > 0 ? `+${d}` : `−${-d}`}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.grid}>
            {KEYS.map((k) => {
              const disabled = k === '.' && !p.decimal;
              return (
                <Pressable
                  key={k}
                  disabled={disabled}
                  onPress={() => set(applyKey(textRef.current, k, freshRef.current, p.decimal))}
                  accessibilityRole="button"
                  accessibilityLabel={k === 'back' ? 'Delete' : k === '.' ? 'Decimal point' : k}
                  style={(s) => [styles.key, { backgroundColor: c.raised, opacity: disabled ? 0.3 : s.pressed ? 0.6 : 1 }]}
                >
                  {k === 'back' ? <Icon name="backspace" size={26} color={c.ink} /> : <Text style={[styles.keyText, { color: c.ink }]}>{k}</Text>}
                </Pressable>
              );
            })}
          </View>
          <View style={styles.footer}>
            {p.onSwitch && p.switchLabel ? (
              <Button
                kind="secondary"
                label={p.switchDirection === 'back' ? `← ${p.switchLabel}` : `${p.switchLabel} →`}
                a11yLabel={`Switch to ${p.switchLabel}`}
                onPress={p.onSwitch}
                style={styles.flex}
              />
            ) : (
              <View style={styles.flex} />
            )}
            <Button label="Done" onPress={p.onDone} style={styles.flex} />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  anchor: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: layout.maxWidth, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, borderWidth: 1, paddingHorizontal: space.md, paddingTop: space.xs, gap: space.sm },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginBottom: space.xs },
  header: { flexDirection: 'row', alignItems: 'center' },
  well: { borderWidth: 2, borderRadius: radius.button, minHeight: 104, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.cond800i, fontSize: 84, lineHeight: 92 },
  caret: { width: 3, height: 64, marginLeft: 4, borderRadius: 1.5 },
  chips: { flexDirection: 'row', gap: space.xs },
  chip: { flex: 1, minHeight: layout.minTap, borderWidth: 1.5, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: fonts.cond700, fontSize: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs },
  key: { flexBasis: '30%', flexGrow: 1, height: 60, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  keyText: { fontFamily: fonts.cond700, fontSize: 30 },
  footer: { flexDirection: 'row', gap: space.sm, marginTop: space.xxs },
});
