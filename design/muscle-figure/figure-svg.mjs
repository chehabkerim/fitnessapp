// Renders the solid figure to an SVG string. Mirrors the logic the RN component will use.
import { VIEWBOX, HEAD, SHAPES } from './figure.mjs';

export const THEMES = {
  light: { bg: '#F6F1EA', surface: '#FBF8F3', ink: '#1F1A17', muted: '#6E625A', line: '#E4D9CB', body: '#E4D9CB', primary: '#C4623F', secondary: '#D19277', accentText: '#B0532F', sage: '#7D8F6E', sageTint: '#E6E8DC' },
  dark: { bg: '#1A1512', surface: '#221C18', ink: '#F2E9DE', muted: '#A89A8C', line: '#3A302A', body: '#3B312A', primary: '#D9774F', secondary: '#8E5A42', accentText: '#D9774F', sage: '#9DAE8C', sageTint: '#2A2D24' },
};

export function hasRegion(view, key) { return key in SHAPES[view].regions; }
// View for the small crop: more primary regions, then more secondary, then front.
export function smallView(primary, secondary) {
  const n = (v, l) => l.filter((k) => hasRegion(v, k)).length;
  const f = [n('front', primary), n('front', secondary)], b = [n('back', primary), n('back', secondary)];
  return b[0] > f[0] || (b[0] === f[0] && b[1] > f[1]) ? 'back' : 'front';
}

const mirror = `transform="translate(${VIEWBOX.w},0) scale(-1,1)"`;
// gapPx: separation width in screen pixels; unitsPerPx converts to viewBox units.
export function figureMarkup(view, primary, secondary, t, { unitsPerPx, gapPx = 1, gapColor, large = false }) {
  const sw = (gapPx * unitsPerPx).toFixed(2);
  const gap = gapColor ?? t.bg;
  const shape = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${gap}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const s = SHAPES[view];
  const half = [
    ...s.base.map((d) => shape(d, t.body)),
    ...s.body.map((d) => shape(d, t.body)),
    ...(large ? s.largeLines.map((d) => `<path d="${d}" fill="none" stroke="${gap}" stroke-width="${sw}" stroke-linecap="round"/>`) : []),
    ...Object.entries(s.regions).map(([k, d]) => shape(d, primary.includes(k) ? t.primary : secondary.includes(k) ? t.secondary : t.body)),
  ].join('');
  const head = `<ellipse cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}" fill="${t.body}" stroke="${gap}" stroke-width="${sw}"/>`;
  return `<g>${half}</g><g ${mirror}>${half}</g>` + head;
}

// Small: head-to-hips crop, square, filling the tile.
export const SMALL_CROP = { x: 4, y: 12, size: 192 }; // tuned while iterating
export function smallSvg(ex, t, px, gapColor) {
  const view = smallView(ex.primary, ex.secondary);
  const c = SMALL_CROP;
  return `<svg width="${px}" height="${px}" viewBox="${c.x} ${c.y} ${c.size} ${c.size}" role="img" aria-label="${ex.name}">${figureMarkup(view, ex.primary, ex.secondary, t, { unitsPerPx: c.size / px, gapPx: 0.9, gapColor })}</svg>`;
}
export function largeSvg(view, ex, t, h, gapColor) {
  const w = (h * VIEWBOX.w) / VIEWBOX.h;
  return `<svg width="${w.toFixed(0)}" height="${h}" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}" role="img" aria-label="${ex.name}, ${view}">${figureMarkup(view, ex.primary, ex.secondary, t, { unitsPerPx: VIEWBOX.h / h, gapPx: 1.2, gapColor, large: true })}</svg>`;
}
