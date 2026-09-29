import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { COLOR_SCHEMES, type ColorScheme } from '@/lib/domain';
import { readableOn } from '@/lib/theme';
import { fonts, radius, space, themes, useTheme } from '@/theme';
import { SCHEMES } from '@/theme/schemes';

/**
 * Settings → Appearance → Colour: one card per scheme with a mini preview in the current mode
 * (background, accent swatch, purple button). The selected card is outlined in its accent with a check.
 */
export function SchemePicker({ value, onChange }: { value: ColorScheme; onChange: (s: ColorScheme) => void }) {
  const { c, mode } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Colour scheme">
      {COLOR_SCHEMES.map((id) => {
        const t = themes[id][mode];
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
              { backgroundColor: c.surface, borderColor: selected ? c.accent : c.outline, borderWidth: selected ? 2 : 1, transform: [{ scale: s.pressed ? 0.97 : 1 }] },
            ]}
          >
            <View style={[styles.preview, { backgroundColor: t.bg, borderColor: t.line }]}>
              <View style={[styles.swatch, { backgroundColor: t.accentFill }]} />
              <View style={[styles.button, { backgroundColor: t.purple }]} />
              {selected && (
                <View style={[styles.check, { backgroundColor: t.accent }]}>
                  <Icon name="check" size={12} color={readableOn(t.accent)} strokeWidth={3} />
                </View>
              )}
            </View>
            <Text style={[styles.name, { color: selected ? c.ink : c.muted }]} numberOfLines={1}>
              {name}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Runs to the screen edges (past the page padding) so a partly visible card shows the row scrolls.
  bleed: { marginHorizontal: -space.lg },
  row: { gap: space.xs, paddingVertical: 2, paddingHorizontal: space.lg },
  card: { width: 96, borderRadius: radius.md, padding: space.xs, gap: space.xs },
  preview: { height: 56, borderRadius: radius.sm, borderWidth: 1, padding: space.xs, justifyContent: 'space-between' },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  button: { height: 12, borderRadius: 6, alignSelf: 'stretch' },
  check: { position: 'absolute', top: 6, right: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.bodySemi, fontSize: 14, lineHeight: 18, textAlign: 'center' },
});
