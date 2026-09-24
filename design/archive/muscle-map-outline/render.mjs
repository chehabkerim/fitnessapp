// Builds preview.html (light + dark) from figure.mjs / glyphs.mjs. Usage: node render.mjs <dir with @expo-google-fonts ttf folders>
// preview-light.png / preview-dark.png are Chromium screenshots of that page.
import { writeFileSync } from 'node:fs';
import { VIEWBOX, HEAD, SILHOUETTE_HALF, REGIONS, DETAILS } from './figure.mjs';
import { GLYPHS, GLYPH_LABELS } from './glyphs.mjs';

const fontsDir = process.argv[2] ?? '';
export const THEMES = {
  light: { bg: '#F6F1EA', surface: '#FBF8F3', ink: '#1F1A17', muted: '#6E625A', line: '#E4D9CB', primary: '#C4623F', secondary: '#E4D9CB', outline: 0.30, silhouette: 0.55 },
  dark: { bg: '#1A1512', surface: '#231D19', ink: '#F2E9DE', muted: '#A89A8C', line: '#3A302A', primary: '#D9774F', secondary: '#5C4B3D', outline: 0.24, silhouette: 0.45 },
};

const EXERCISES = [
  { name: 'Incline Dumbbell Bench Press', equipment: 'dumbbell', primary: ['upper_chest'], secondary: ['front_delts', 'triceps'] },
  { name: 'Lat Pulldown', equipment: 'cable', primary: ['lats'], secondary: ['biceps', 'rear_delts'] },
  { name: 'Upper Back Row', equipment: 'cable', primary: ['upper_back', 'rear_delts'], secondary: ['biceps'] },
  { name: 'Lateral Raise', equipment: 'dumbbell', primary: ['side_delts'], secondary: ['traps'] },
  { name: 'Tricep Pushdown', equipment: 'cable', primary: ['triceps'], secondary: [] },
];
const LABEL = { upper_chest: 'Upper chest', chest: 'Chest', front_delts: 'Front delts', side_delts: 'Side delts', rear_delts: 'Rear delts', traps: 'Traps', upper_back: 'Upper back', lats: 'Lats', biceps: 'Biceps', triceps: 'Triceps', forearms: 'Forearms' };

// Same rule the app will use: the view with more primary regions, then secondary, then front.
export function smallView(primary, secondary) {
  const count = (view, list) => list.filter((m) => m in REGIONS[view]).length;
  const f = [count('front', primary), count('front', secondary)], b = [count('back', primary), count('back', secondary)];
  return b[0] > f[0] || (b[0] === f[0] && b[1] > f[1]) ? 'back' : 'front';
}

const mirror = `transform="translate(${VIEWBOX.w},0) scale(-1,1)"`;
function figure(view, primary, secondary, t, { size, detail }) {
  // stroke widths in viewBox units so they render at ~1px regardless of size
  const k = VIEWBOX.h / size;
  const sw = (1 * k).toFixed(2);
  const halves = (inner) => `<g>${inner}</g><g ${mirror}>${inner}</g>`;
  const regions = Object.entries(REGIONS[view]).map(([key, d]) => {
    const role = primary.includes(key) ? 'p' : secondary.includes(key) ? 's' : null;
    if (!role && !detail) return '';
    const fill = role === 'p' ? t.primary : role === 's' ? t.secondary : 'none';
    const stroke = detail ? `stroke="${t.ink}" stroke-opacity="${t.outline}" stroke-width="${sw}"` : 'stroke="none"';
    return `<path d="${d}" fill="${fill}" ${stroke} stroke-linejoin="round"/>`;
  }).join('');
  const details = detail ? DETAILS[view].map((d) => `<path d="${d}" fill="none" stroke="${t.ink}" stroke-opacity="${t.outline}" stroke-width="${sw}" stroke-linecap="round"/>`).join('') : '';
  const sil = `<path d="${SILHOUETTE_HALF}" fill="none" stroke="${t.ink}" stroke-opacity="${t.silhouette}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const head = `<ellipse cx="${HEAD.cx}" cy="${HEAD.cy}" rx="${HEAD.rx}" ry="${HEAD.ry}" fill="none" stroke="${t.ink}" stroke-opacity="${t.silhouette}" stroke-width="${sw}"/>`;
  return halves(regions + details + sil) + head;
}

function smallMap(ex, t, px = 56) {
  const view = smallView(ex.primary, ex.secondary);
  // thumbnail crops to the upper body (all seeded exercises are upper-body); leg regions will use the full figure
  const vb = '28 12 144 196';
  return `<svg width="${px}" height="${px}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${ex.name} muscles, ${view}">${figure(view, ex.primary, ex.secondary, t, { size: px * (420 / 196), detail: false })}</svg>`;
}
function largeMap(ex, t, h = 300) {
  const w = h * (VIEWBOX.w / VIEWBOX.h);
  const one = (view) => `<figure><svg width="${w}" height="${h}" viewBox="0 0 ${VIEWBOX.w} ${VIEWBOX.h}">${figure(view, ex.primary, ex.secondary, t, { size: h, detail: true })}</svg><figcaption>${view === 'front' ? 'Front' : 'Back'}</figcaption></figure>`;
  return `<div class="pair">${one('front')}${one('back')}</div>`;
}
function glyph(key, t, px = 24) {
  return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${t.ink}" stroke-width="${(1.5 * 24 / px).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[key].map((d) => `<path d="${d}"/>`).join('')}</svg>`;
}
const muscleLine = (ex) => [...ex.primary].map((m) => LABEL[m]).join(', ');

function panel(name, t) {
  const rows = EXERCISES.map((ex) => `
    <div class="row">
      <div class="thumb">${smallMap(ex, t)}</div>
      <div class="rowtext"><div class="exname">${ex.name}</div>
        <div class="meta">${muscleLine(ex)} · <span class="g">${glyph(ex.equipment, t, 14)}</span>${GLYPH_LABELS[ex.equipment]}</div></div>
    </div>`).join('<div class="hr"></div>');
  const large = EXERCISES.map((ex) => `
    <section class="ex">
      <h3>${ex.name}</h3>
      <div class="legend"><span class="sw p"></span>Primary: ${ex.primary.map((m) => LABEL[m]).join(', ')}
      ${ex.secondary.length ? `<span class="sw s"></span>Secondary: ${ex.secondary.map((m) => LABEL[m]).join(', ')}` : ''}</div>
      <div class="sizes"><div class="smallwrap"><div class="cap">Small · ${smallView(ex.primary, ex.secondary)}</div><div class="thumb big">${smallMap(ex, t, 56)}</div><div class="thumb big">${smallMap(ex, t, 96)}</div></div>
      ${largeMap(ex, t)}</div>
    </section>`).join('');
  const glyphs = Object.keys(GLYPHS).map((k) => `<div class="gcell">${glyph(k, t, 24)}${glyph(k, t, 48)}<div class="cap">${GLYPH_LABELS[k]}${['barbell', 'kettlebell', 'other'].includes(k) ? ' *' : ''}</div></div>`).join('');
  return `<div class="panel ${name}" style="--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--p:${t.primary};--s:${t.secondary}">
    <div class="title">${name === 'light' ? 'Light' : 'Dark'}</div>
    <h2>Library rows (small map, 56px)</h2><div class="card">${rows}</div>
    <h2>Equipment glyphs (24 and 48px, 1.5 stroke)</h2><div class="glyphs">${glyphs}</div><div class="note">* extra glyphs for custom-exercise equipment</div>
    <h2>Small and large maps</h2>${large}
  </div>`;
}

const css = `
@font-face{font-family:Inter;src:url('${fontsDir}/400Regular/Inter_400Regular.ttf');font-weight:400}
@font-face{font-family:Inter;src:url('${fontsDir}/500Medium/Inter_500Medium.ttf');font-weight:500}
@font-face{font-family:Inter;src:url('${fontsDir}/600SemiBold/Inter_600SemiBold.ttf');font-weight:600}
@font-face{font-family:Fraunces;src:url('${fontsDir}/500Medium/Fraunces_500Medium.ttf');font-weight:500}
*{box-sizing:border-box}body{margin:0;display:flex;font-family:Inter,sans-serif}
.panel{flex:1;background:var(--bg);color:var(--ink);padding:32px 28px;min-width:0}
.title{font-family:Fraunces;font-size:34px;margin-bottom:8px}
h2{font:500 12px Inter;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:32px 0 12px}
h3{font-family:Fraunces;font-weight:500;font-size:22px;margin:0 0 6px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:4px 16px;max-width:390px}
.row{display:flex;gap:14px;align-items:center;padding:12px 0}.hr{height:1px;background:var(--line)}
.thumb{width:56px;height:56px;border-radius:10px;border:1px solid var(--line);display:flex;align-items:center;justify-content:center;flex:none}
.thumb.big{width:auto;height:auto;padding:4px}
.exname{font-weight:500;font-size:16px}.meta{font-size:13px;color:var(--muted);margin-top:3px;display:flex;align-items:center;gap:4px}
.meta svg{stroke:var(--muted)}.g{display:inline-flex}
.glyphs{display:flex;flex-wrap:wrap;gap:18px}.gcell{display:flex;flex-direction:column;align-items:center;gap:8px;width:78px}
.cap{font-size:12px;color:var(--muted);text-align:center}.note{font-size:12px;color:var(--muted);margin-top:8px}
.ex{border-top:1px solid var(--line);padding:22px 0}
.legend{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:12px}
.sw{width:12px;height:12px;border-radius:3px;display:inline-block;margin-left:8px}.sw.p{background:var(--p)}.sw.s{background:var(--s)}
.sizes{display:flex;gap:28px;align-items:flex-start}.smallwrap{display:flex;flex-direction:column;gap:10px;align-items:center}
.pair{display:flex;gap:12px}figure{margin:0;text-align:center}figcaption{font-size:12px;color:var(--muted);margin-top:4px}
`;
writeFileSync(new URL('./preview.html', import.meta.url), `<!doctype html><html><head><meta charset="utf-8"><title>MuscleMap preview</title><style>${css}</style></head><body>${panel('light', THEMES.light)}${panel('dark', THEMES.dark)}</body></html>`);

// contrast check for the accent on each background
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
for (const [n, t] of Object.entries(THEMES)) console.log(n, 'accent/bg', ratio(t.primary, t.bg).toFixed(2), 'muted/bg', ratio(t.muted, t.bg).toFixed(2), 'ink/bg', ratio(t.ink, t.bg).toFixed(2));
