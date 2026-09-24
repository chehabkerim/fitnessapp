import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { space, useTheme } from '../theme';
import { IconButton } from './Button';
import { Text } from './Text';

export interface ScreenProps {
  title?: string;
  /** Small label above the title. */
  eyebrow?: string;
  back?: boolean | (() => void);
  right?: ReactNode;
  children: ReactNode;
  scroll?: boolean;
  footer?: ReactNode;
  scrollProps?: ScrollViewProps;
  /** Tab screens: the tab bar already handles the bottom inset. */
  inTabs?: boolean;
}

export function Screen({ title, eyebrow, back, right, children, scroll = true, footer, scrollProps, inTabs }: ScreenProps) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const onBack = typeof back === 'function' ? back : () => (router.canGoBack() ? router.back() : router.replace('/workouts'));

  const header =
    title || back || right ? (
      <View style={[styles.header, { paddingTop: insets.top + (back || right ? space.xs : space.xxl) }]}>
        {back || right ? (
          <View style={styles.headerRow}>
            {back ? <IconButton icon="back" label="Back" onPress={onBack} style={styles.backBtn} /> : null}
            <View style={styles.flex} />
            {right}
          </View>
        ) : null}
        {eyebrow ? (
          <Text variant="overline" color="muted" style={styles.eyebrow}>
            {eyebrow}
          </Text>
        ) : null}
        {title ? (
          <Text variant="title" accessibilityRole="header">
            {title}
          </Text>
        ) : null}
      </View>
    ) : (
      <View style={{ height: insets.top }} />
    );

  const bottomPad = inTabs ? space.xl : insets.bottom + space.xl;
  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          {...scrollProps}
        >
          {header}
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content]}>
          {header}
          {children}
        </View>
      )}
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: space.lg },
  header: { paddingBottom: space.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, marginHorizontal: -space.xs },
  backBtn: {},
  eyebrow: { marginTop: space.xs },
});
