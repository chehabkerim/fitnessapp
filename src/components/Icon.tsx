import Svg, { Circle, Path } from 'react-native-svg';

import type { Equipment } from '../lib/domain';
import { useTheme } from '../theme';

// Original thin-line icons on a 24 grid, 1.5px stroke at every size.
const PATHS = {
  back: ['M15 5 L8 12 L15 19'],
  forward: ['M9 5 L16 12 L9 19'],
  close: ['M6 6 L18 18', 'M18 6 L6 18'],
  plus: ['M12 5 V19', 'M5 12 H19'],
  minus: ['M5 12 H19'],
  check: ['M5.5 12.5 L10 17 L18.5 7.5'],
  more: [],
  trash: ['M4.5 7 H19.5', 'M9.5 7 V4.5 H14.5 V7', 'M6.5 7 L7.5 19.5 H16.5 L17.5 7', 'M10 10.5 V16', 'M14 10.5 V16'],
  search: ['M10.5 17 A6.5 6.5 0 1 0 10.5 4 A6.5 6.5 0 1 0 10.5 17 Z', 'M15.5 15.5 L20 20'],
  edit: ['M4.5 19.5 L5.5 15 L15.5 5 L19 8.5 L9 18.5 Z', 'M13.5 7 L17 10.5'],
  up: ['M6 14.5 L12 8.5 L18 14.5'],
  down: ['M6 9.5 L12 15.5 L18 9.5'],
  repeat: ['M5 11 V9.5 A3 3 0 0 1 8 6.5 H18', 'M15.5 4 L18 6.5 L15.5 9', 'M19 13 V14.5 A3 3 0 0 1 16 17.5 H6', 'M8.5 20 L6 17.5 L8.5 15'],
  camera: ['M4 8.5 H7.5 L9 6 H15 L16.5 8.5 H20 V18.5 H4 Z', 'M12 16 A3 3 0 1 0 12 10 A3 3 0 1 0 12 16 Z'],
  info: ['M12 21 A9 9 0 1 0 12 3 A9 9 0 1 0 12 21 Z', 'M12 11 V16.5', 'M12 7.5 V8'],
  // tabs
  today: ['M12 20.5 A8.5 8.5 0 1 0 12 3.5 A8.5 8.5 0 1 0 12 20.5 Z', 'M12 7.5 V12 L15 14'],
  food: ['M4 11 H20', 'M5 11 A7 7 0 0 0 19 11', 'M9 18.5 H15'],
  workouts: ['M9 12 H15', 'M6 8.5 H9 V15.5 H6 Z', 'M15 8.5 H18 V15.5 H15 Z'],
  progress: ['M4 19.5 H20', 'M5 16 L10 11 L13 14 L19 7'],
  settings: ['M4 7 H20', 'M4 12 H20', 'M4 17 H20', 'M8 5 V9', 'M15 10 V14', 'M10 15 V19'],
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 24, color, strokeWidth = 1.5 }: { name: IconName; size?: number; color?: string; strokeWidth?: number }) {
  const { c } = useTheme();
  const stroke = color ?? c.ink;
  const sw = (strokeWidth * 24) / size;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      {name === 'more'
        ? [6, 12, 18].map((x) => <Circle key={x} cx={x} cy={12} r={1.4} fill={stroke} />)
        : PATHS[name].map((d) => <Path key={d} d={d} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />)}
    </Svg>
  );
}

// Equipment glyphs (readable at 20px). Barbell, EZ bar, bodyweight and other are text only.
const GLYPHS: Partial<Record<Equipment, string[]>> = {
  dumbbell: ['M9 12 H15', 'M6 8.5 H9 V15.5 H6 Z', 'M15 8.5 H18 V15.5 H15 Z'],
  cable: ['M12 9 A3 3 0 1 0 12 3 A3 3 0 1 0 12 9', 'M12 9 V14.5', 'M6.5 14.5 H17.5 L15 20.5 H9 Z'],
  machine: ['M12 3 V8', 'M5.5 8 H18.5 V20.5 H5.5 Z', 'M5.5 12.2 H18.5', 'M5.5 16.4 H18.5'],
  kettlebell: ['M9 9 C9 5 15 5 15 9', 'M12 20.5 A6 6 0 1 0 12 8.5 A6 6 0 1 0 12 20.5'],
};

export function EquipmentGlyph({ equipment, size = 20, color }: { equipment: Equipment; size?: number; color?: string }) {
  const { c } = useTheme();
  const paths = GLYPHS[equipment];
  if (!paths) return null;
  const sw = (1.5 * 24) / size;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessibilityElementsHidden importantForAccessibility="no">
      {paths.map((d) => (
        <Path key={d} d={d} stroke={color ?? c.muted} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}
