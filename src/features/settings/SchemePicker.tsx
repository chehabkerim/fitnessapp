import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import type { ColorScheme } from '@/lib/domain';
import { fonts, radius, space, themes, useTheme } from '@/theme';
import { SCHEMES, SELECTABLE_SCHEMES } from '@/theme/schemes';

/**
 * Settings → Appearance: a 3-column grid of scheme cards. Each previews the scheme (its background, a raised
 * card with an accent dot and bar, an accent button). The selected card has a 2px accent border, a check
 * and "SELECTED".
 */
export function SchemePicker({ value, onChange }: { value: ColorScheme; onChange: (s: ColorScheme) => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.grid} accessibilityRole="radiogroup" accessibilityLabel="Colour scheme">
      {SELECTABLE_SCHEMES.map((id) => {
        const t = themes[id];
        const selected = id === value;
        const name = SCHEMES[id].name;
        return (
          <Pressable
            key={id}
            onPress={() => onChange(id)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, selected }}
            aria-checked={selected}
            accessibilityLabel={`${name} colour scheme${selected ? ', selected' : ''}`}
            style={(s) => [
              styles.card,
              { backgroundColor: c.surface, borderColor: selected ? c.accent : c.line, borderWidth: selected ? 2 : 1, transform: [{ scale: s.pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.preview, { backgroundColor: t.bg, borderColor: t.line }]}>
              <View style={[styles.mini, { backgroundColor: t.raised }]}>
                <View style={[styles.dot, { backgroundColor: t.accent }]} />
                <View style={[styles.bar, { backgroundColor: t.accent }]} />
              </View>
              <View style={[styles.button, { backgroundColor: t.accent }]} />
              {selected && (
                <View style={[styles.check, { backgroundColor: t.accent }]}>
                  <Icon name="check" size={12} color={t.onAccent} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={[styles.name, { color: c.ink }]} numberOfLines={1}>
              {name}
            </Text>
            <Text variant="overline" style={[styles.state, { color: selected ? c.accentText : 'transparent' }]} accessibilityElementsHidden>
              Selected
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: space.xs },
  card: { flexBasis: '31.5%', borderRadius: radius.md, padding: space.xs, gap: space.xxs },
  preview: { height: 76, borderRadius: radius.sm, borderWidth: 1, padding: space.xs, gap: space.xs, justifyContent: 'space-between' },
  mini: { flex: 1, borderRadius: 6, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bar: { height: 5, borderRadius: 3, flex: 1, maxWidth: '70%' },
  button: { height: 14, borderRadius: 5 },
  check: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.cond800i, fontSize: 18, lineHeight: 22, textTransform: 'uppercase', marginTop: 2 },
  state: { fontSize: 10, lineHeight: 12, letterSpacing: 1.2 },
});
