// Solid muscle figure (original drawing). Half-figure shapes left of x=100, mirrored at render.
// Every shape is filled; separations are strokes in the surface colour. viewBox 0 0 200 420.
export const VIEWBOX = { w: 200, h: 420 };
// Regions only partly visible in a view count half when choosing the small view.
export const PARTIAL = { front: { triceps: 0.5 }, back: {} };
export const HEAD = { cx: 100, cy: 28, rx: 12.5, ry: 15.5 };

// Base masses (drawn first, never highlighted)
const TORSO = 'M100,30 L90,30 L90,44 C89,56 80,63 64,67 L60,94 C58,108 60,120 63,128 C64,150 68,176 74,196 C72,206 70,212 68,222 C74,238 86,250 100,256 Z';
const LEG = 'M68,212 C57,236 52,262 55,290 C57,310 62,326 66,338 C63,354 64,374 69,392 C71,400 73,406 73,412 L93,412 C93,398 95,380 96,362 C97,346 95,336 95,326 C97,300 99,276 99,256 C90,250 78,236 68,212 Z';
const ARM = 'M64,67 C49,66 36,74 32,89 C29,100 29,112 31,122 C25,134 23,150 25,163 C23,177 21,194 21,210 C21,222 23,232 26,240 L46,240 C49,224 55,204 59,186 C60,178 61,172 62,166 C64,148 65,126 63,110 C63,96 65,82 66,69 Z';
const HAND = 'M25,238 C21,248 21,261 26,269 C31,276 42,275 46,267 C49,259 48,247 47,238 Z';
const FOOT = 'M73,411 C69,414 67,418 70,420 L94,420 C95,416 94,413 93,411 Z';

const SIDE_DELT = 'M64,67 C49,66 36,74 32,89 C29,100 30,112 34,121 C37,108 41,98 46,90 C52,81 58,73 64,69 Z';
const FRONT_DELT = 'M64,69 C58,73 52,81 46,90 C41,98 37,108 34,121 C43,121 51,116 56,108 C61,99 65,89 67,79 C67,75 66,71 64,69 Z';
const FOREARM = 'M33,170 C26,178 22,193 22,208 C22,220 24,230 27,239 L45,239 C48,224 54,204 58,186 C59,179 60,174 60,169 C53,165 40,165 33,170 Z';
 // front view: biceps plus the lateral head of the triceps as a thin outer strip
const FRONT_BICEPS = 'M57,110 C50,115 41,120 36,127 C33,138 33,152 35,162 C40,168 48,170 57,166 C61,152 63,136 61,122 C60,117 59,113 57,110 Z';
const FRONT_TRICEPS = 'M34,124 C27,132 24,146 25,158 C27,164 30,167 34,167 C32,155 32,139 35,127 Z';
const UPPER_ARM = 'M57,110 C49,115 38,119 31,127 C26,137 25,151 28,161 C33,168 45,170 57,166 C61,152 63,136 61,122 C60,117 59,113 57,110 Z';

export const SHAPES = {
  front: {
    base: [TORSO, LEG, ARM, HAND, FOOT],
    body: [
      'M63,128 C62,142 64,158 68,172 C70,182 72,190 75,197 L85,198 C83,178 83,158 85,139 C77,138 69,134 63,128 Z', // obliques
      'M99,136 C93,138 89,138 85,139 C83,158 83,180 85,200 C90,205 95,207 99,207 Z', // abs block
      'M69,216 C59,234 54,258 57,282 C59,302 64,318 71,326 C78,331 87,329 92,322 C96,300 98,276 97,256 C91,240 81,226 69,216 Z', // quads
    ],
    // large size only: two simple ab separations
    largeLines: ['M85,158 L99,158', 'M85,176 L99,176'],
    regions: {
      traps: 'M91,46 C89,55 81,62 66,67 C72,71 81,73 92,73 L100,73 L100,46 Z',
      upper_chest: 'M99,73 C88,72 77,72 68,75 C66,81 64,87 63,93 C74,93 88,97 99,101 Z',
      chest: 'M99,101 C88,97 74,93 63,93 C60,104 60,116 64,126 C72,136 88,138 99,134 Z',
      front_delts: FRONT_DELT,
      side_delts: SIDE_DELT,
      biceps: FRONT_BICEPS,
      triceps: FRONT_TRICEPS,
      forearms: FOREARM,
    },
  },
  back: {
    base: [TORSO, LEG, ARM, HAND, FOOT],
    body: [
      'M100,206 C92,204 82,206 72,212 C66,222 65,236 71,247 C79,256 92,256 100,252 Z', // glutes
      'M70,256 C64,274 63,294 68,312 C72,323 79,328 88,326 C93,314 96,294 97,272 C96,262 92,256 86,254 C81,257 75,257 70,256 Z', // hamstrings
    ],
    largeLines: [],
    regions: {
      traps: 'M100,38 C96,50 88,59 66,67 C73,75 80,84 86,96 C90,110 95,124 100,136 Z',
      rear_delts: FRONT_DELT,
      side_delts: SIDE_DELT,
      upper_back: 'M86,96 C80,89 73,85 67,83 C63,92 61,102 62,112 C70,120 82,124 94,122 C92,112 90,104 86,96 Z',
      // a wing each side of the spine, tapering to the waist; the lower back between them stays body colour
      lats: 'M62,112 C60,126 62,142 66,158 C70,174 76,188 82,199 C84,184 88,166 92,150 C94,142 95,134 96,126 C95.5,124.5 95,123 94,122 C82,124 70,120 62,112 Z',
      triceps: UPPER_ARM,
      forearms: FOREARM,
    },
  },
};
