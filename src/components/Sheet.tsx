import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { nativeDriver } from '../platform/animation';
import { layout, motion, radius, space, useTheme } from '../theme';
import { IconButton } from './Button';
import { Text } from './Text';

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Let the content manage its own scrolling (e.g. lists). */
  scroll?: boolean;
  full?: boolean;
}

/** Bottom sheet: fades the scrim, slides the panel up (200ms ease-out). Escape / back / scrim tap close it. */
export function Sheet({ visible, onClose, title, children, scroll = true, full }: SheetProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  if (visible && !mounted) setMounted(true); // mount before animating in; unmount after animating out

  useEffect(() => {
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: motion.base,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
    }).start(({ finished }) => finished && !visible && setMounted(false));
  }, [visible, progress]);

  if (!mounted) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Modal transparent visible onRequestClose={onClose} animationType="none" statusBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.fill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim, opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Close" accessibilityRole="button" />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            accessibilityViewIsModal
            style={[
              styles.panel,
              full && styles.full,
              { backgroundColor: c.surface, paddingBottom: insets.bottom + space.md, opacity: progress, transform: [{ translateY }] },
            ]}
          >
            <View style={styles.header}>
              <Text variant="heading" style={styles.flex} accessibilityRole="header">
                {title ?? ''}
              </Text>
              <IconButton icon="close" label="Close" onPress={onClose} />
            </View>
            {scroll ? (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
                {children}
              </ScrollView>
            ) : (
              <View style={[styles.body, styles.flex]}>{children}</View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export interface ActionItem {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

/** A sheet with a short message and a list of actions (menus and confirmations). */
export function ActionSheet({ visible, onClose, title, message, actions }: { visible: boolean; onClose: () => void; title: string; message?: string; actions: ActionItem[] }) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      {message ? (
        <Text color="muted" style={{ marginBottom: space.md }}>
          {message}
        </Text>
      ) : null}
      {actions.map((a) => (
        <Pressable
          key={a.label}
          accessibilityRole="button"
          accessibilityLabel={a.label}
          disabled={a.disabled}
          onPress={() => {
            onClose();
            a.onPress();
          }}
          style={(state) => [styles.action, { borderColor: c.line, opacity: a.disabled ? 0.4 : state.pressed ? 0.7 : 1, backgroundColor: (state as { hovered?: boolean }).hovered ? c.surfaceAlt : 'transparent' }]}
        >
          <Text variant="bodyMedium" color={a.destructive ? 'danger' : 'ink'}>
            {a.label}
          </Text>
        </Pressable>
      ))}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  anchor: { flex: 1, justifyContent: 'flex-end', alignItems: 'center' },
  panel: {
    width: '100%',
    maxWidth: layout.maxWidth,
    maxHeight: '88%',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingTop: space.xs,
  },
  full: { height: '88%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, paddingRight: space.xs, minHeight: 52 },
  body: { paddingHorizontal: space.lg, paddingBottom: space.md },
  action: { minHeight: 52, justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: space.xxs },
});
