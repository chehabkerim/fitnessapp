import Svg, { Path } from 'react-native-svg';

import { brand, useTheme } from '../theme';
import { LOGO_PATHS, LOGO_VIEWBOX } from './logoPaths';

const [, , VB_W, VB_H] = LOGO_VIEWBOX.split(' ').map(Number) as [number, number, number, number];

/** The two-tone wordmark: "PLUS" in brand purple, "LTRA" in the active scheme's accent. */
export function Logo({ width }: { width: number }) {
  const { c } = useTheme();
  return (
    <Svg width={width} height={(width * VB_H) / VB_W} viewBox={LOGO_VIEWBOX} accessibilityRole="image" accessibilityLabel="Plus Ultra">
      {LOGO_PATHS.map((p, i) => (
        <Path key={i} d={p.d} fill={p.part === 'plus' ? brand.purple : c.accent} />
      ))}
    </Svg>
  );
}
