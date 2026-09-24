// Equipment glyphs: 24x24 grid, 1.5px stroke at every size, max 4 strokes, round caps. Original drawings.
// Bodyweight, EZ bar and Other have no glyph (text only). EZ bar was dropped: its zigzag reads as a squiggle at 20px.
export const GLYPHS = {
  dumbbell: ['M8 12 H16', 'M5 8.5 H8 V15.5 H5 Z', 'M16 8.5 H19 V15.5 H16 Z'],
  barbell: ['M2.5 12 H21.5', 'M6.5 6.5 V17.5', 'M17.5 6.5 V17.5'],
  cable: ['M12 9 A3 3 0 1 0 12 3 A3 3 0 1 0 12 9', 'M12 9 V14.5', 'M6.5 14.5 H17.5 L15 20.5 H9 Z'],
  machine: ['M12 3 V8', 'M5.5 8 H18.5 V20.5 H5.5 Z', 'M5.5 12.2 H18.5', 'M5.5 16.4 H18.5'],
  kettlebell: ['M9 9 C9 5 15 5 15 9', 'M12 20.5 A6 6 0 1 0 12 8.5 A6 6 0 1 0 12 20.5'],
};
export const GLYPH_LABELS = { dumbbell: 'Dumbbell', barbell: 'Barbell', ez_bar: 'EZ bar', cable: 'Cable', machine: 'Machine', kettlebell: 'Kettlebell', bodyweight: 'Bodyweight', other: 'Other' };
