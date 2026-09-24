// Builds preview.html (light + dark). Usage: node render.mjs <dir with @expo-google-fonts ttf folders> <out.html>
// preview-light.png / preview-dark.png are Chromium screenshots of each panel.
import { writeFileSync } from 'node:fs';
import { THEMES, smallSvg, largeSvg, smallView } from './figure-svg.mjs';
import { GLYPHS, GLYPH_LABELS } from './glyphs.mjs';
import { EXERCISES, MUSCLE_LABEL } from './exercises.mjs';

const [fontsDir = '', out = './preview.html'] = process.argv.slice(2);
const FEATURED = ['Incline Dumbbell Bench Press', 'Lat Pulldown', 'Upper Back Row', 'Lateral Raise', 'Tricep Pushdown', 'Hammer Curl'];

function glyph(key, color, px) {
  if (!GLYPHS[key]) return '';
  return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="${((1.5 * 24) / px).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${GLYPHS[key].map((d) => `<path d="${d}"/>`).join('')}</svg>`;
}
const muscles = (ex) => ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ');

function panel(name, t) {
  const rows = EXERCISES.map((ex) => `
    <div class="row"><div class="tile56">${smallSvg(ex, t, 56, t.surface)}</div>
      <div><div class="exname">${ex.name}</div>
      <div class="meta">${muscles(ex)}<span class="dot">·</span>${glyph(ex.equipment, t.muted, 20)}${GLYPH_LABELS[ex.equipment]}</div></div></div>`).join('<div class="hr"></div>');

  const figs = EXERCISES.filter((e) => FEATURED.includes(e.name)).map((ex) => `
    <section class="ex"><h3>${ex.name}</h3>
      <div class="legend"><span class="sw" style="background:${t.primary}"></span>${ex.primary.map((m) => MUSCLE_LABEL[m]).join(', ')}
      ${ex.secondary.length ? `<span class="sw" style="background:${t.secondary}"></span>${ex.secondary.map((m) => MUSCLE_LABEL[m]).join(', ')}` : ''}</div>
      <div class="sizes"><div class="smalls"><div class="cap">56 · ${smallView(ex.primary, ex.secondary)}</div><div class="tile56 solo">${smallSvg(ex, t, 56, t.surface)}</div>
        <div class="cap">44</div><div class="tile44 solo">${smallSvg(ex, t, 44, t.surface)}</div></div>
        <div class="pair"><figure>${largeSvg('front', ex, t, 320, t.bg)}<figcaption>Front</figcaption></figure><figure>${largeSvg('back', ex, t, 320, t.bg)}<figcaption>Back</figcaption></figure></div></div>
    </section>`).join('');

  const check = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${t.surface}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5 L10 16.5 L18 8"/></svg>`;
  const incline = EXERCISES[0];
  const setCard = `
    <div class="card wcard">
      <div class="whead"><div class="tile44">${smallSvg(incline, t, 44, t.surface)}</div><div><div class="exname">${incline.name}</div><div class="meta">${glyph('dumbbell', t.muted, 20)}Dumbbell</div></div></div>
      <div class="sethead"><span>Set</span><span>Previous</span><span>kg each</span><span>Reps</span><span></span></div>
      <div class="setrow done"><span class="setn">1</span><span class="prev">22.5 × 10</span><span class="inp">22.5</span><span class="inp">10</span><span class="ck">${check}</span></div>
      <div class="setrow done"><span class="setn">2</span><span class="prev">22.5 × 9</span><span class="inp">25</span><span class="inp">8</span><span class="ck">${check}</span><span class="pu">Plus Ultra</span></div>
      <div class="setrow"><span class="setn">3</span><span class="prev">22.5 × 8</span><span class="inp">25</span><span class="inp"></span><span class="ck empty"></span></div>
    </div>`;

  const glyphs = Object.keys(GLYPHS).map((k) => `<div class="gcell"><div class="gpair">${glyph(k, t.ink, 20)}${glyph(k, t.ink, 40)}</div><div class="cap">${GLYPH_LABELS[k]}</div></div>`).join('');

  return `<div class="panel" style="--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--line:${t.line};--accentText:${t.accentText};--sage:${t.sage};--sageTint:${t.sageTint}">
    <div class="title">Plus Ultra <span>· ${name === 'light' ? 'Light' : 'Dark'}</span></div>
    <h2>Library · all 12 exercises (56px)</h2><div class="card">${rows}</div>
    <h2>Active workout card · PR on set 2</h2>${setCard}
    <h2>Equipment glyphs · 20px and 40px, 1.5px stroke</h2><div class="glyphs">${glyphs}</div>
    <div class="note">Bodyweight, EZ bar and Other are text only.</div>
    <h2>Small (56, 44) and large figures</h2>${figs}
  </div>`;
}

const css = `
@font-face{font-family:Inter;src:url('${fontsDir}/400Regular/Inter_400Regular.ttf');font-weight:400}
@font-face{font-family:Inter;src:url('${fontsDir}/500Medium/Inter_500Medium.ttf');font-weight:500}
@font-face{font-family:Fraunces;src:url('${fontsDir}/500Medium/Fraunces_500Medium.ttf');font-weight:500}
@font-face{font-family:Fraunces;font-style:italic;src:url('${fontsDir}/500Medium_Italic/Fraunces_500Medium_Italic.ttf');font-weight:500}
*{box-sizing:border-box}body{margin:0;display:flex;font-family:Inter,sans-serif}
.panel{width:820px;background:var(--bg);color:var(--ink);padding:36px 32px}
.title{font-family:Fraunces;font-weight:500;font-size:36px}.title span{color:var(--muted);font-size:24px}
h2{font:500 12px Inter;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:36px 0 12px}
h3{font-family:Fraunces;font-weight:500;font-size:22px;margin:0 0 6px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:4px 16px;width:390px}
.row{display:flex;gap:14px;align-items:center;padding:12px 0}.hr{height:1px;background:var(--line)}
.tile56{width:56px;height:56px;border-radius:12px;overflow:hidden;background:var(--surface);flex:none}
.tile44{width:44px;height:44px;border-radius:10px;overflow:hidden;background:var(--surface);flex:none}
.solo{border:1px solid var(--line)}
.exname{font-weight:500;font-size:16px}.meta{font-size:13px;color:var(--muted);margin-top:3px;display:flex;align-items:center;gap:5px}.dot{margin:0 1px}
.wcard{padding:16px}.whead{display:flex;gap:12px;align-items:center;margin-bottom:14px}
.sethead,.setrow{display:grid;grid-template-columns:34px 1fr 72px 56px 44px;align-items:center;gap:8px;position:relative}
.sethead{font-size:12px;color:var(--muted);padding:0 6px 6px;border-bottom:1px solid var(--line)}
.setrow{padding:6px;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}
.setrow.done{background:var(--sageTint)}
.setn{font-weight:500}.prev{color:var(--muted);font-size:14px}
.inp{height:44px;border:1px solid var(--line);border-radius:10px;background:var(--bg);display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:500}
.ck{width:44px;height:44px;border-radius:22px;background:var(--sage);display:flex;align-items:center;justify-content:center}.ck.empty{background:none;border:1.5px solid var(--line)}
.pu{position:absolute;left:40px;bottom:3px;font-family:Fraunces;font-style:italic;font-weight:500;font-size:13px;color:var(--accentText)}
.glyphs{display:flex;flex-wrap:wrap;gap:26px}.gcell{display:flex;flex-direction:column;align-items:center;gap:8px}.gpair{display:flex;align-items:center;gap:14px}
.cap{font-size:12px;color:var(--muted);text-align:center}.note{font-size:12px;color:var(--muted);margin-top:10px}
.ex{border-top:1px solid var(--line);padding:24px 0}
.legend{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px;margin-bottom:14px}.sw{width:12px;height:12px;border-radius:3px;margin-left:6px}
.sizes{display:flex;gap:36px;align-items:flex-start}.smalls{display:flex;flex-direction:column;gap:6px;align-items:center}
.pair{display:flex;gap:18px}figure{margin:0;text-align:center}figcaption{font-size:12px;color:var(--muted);margin-top:4px}
`;
writeFileSync(out, `<!doctype html><html><head><meta charset="utf-8"><title>Plus Ultra · figure preview</title><style>${css}</style></head><body>${panel('light', THEMES.light)}${panel('dark', THEMES.dark)}</body></html>`);
