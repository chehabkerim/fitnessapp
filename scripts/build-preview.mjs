// Builds the app as one self-contained HTML page for the private claude.ai preview:
// every script, style and font inline, sql.js's asm.js build instead of WASM, no service worker.
// Output: dist-preview/plus-ultra.html. The real site is still `npm run build:web`.
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'dist-preview');
const EXPORT = join(OUT, 'export');

execSync(`npx expo export -p web --output-dir ${EXPORT}`, {
  cwd: ROOT,
  stdio: 'inherit',
  env: { ...process.env, PLUS_ULTRA_PREVIEW: '1', EXPO_OFFLINE: '1' },
});

const html = readFileSync(join(EXPORT, 'index.html'), 'utf8');

function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

// Fonts as data URIs, keyed by family ("BarlowCondensed_800ExtraBold_Italic").
const fonts = {};
for (const file of walk(join(EXPORT, 'assets')).filter((f) => f.endsWith('.ttf'))) {
  const family = basename(file).split('.')[0];
  fonts[family] = `data:font/ttf;base64,${readFileSync(file).toString('base64')}`;
}

// Scripts in document order, inlined. `</script` and `<!--` can't appear inside an inline script.
const scripts = [...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(([, src]) => {
  const code = readFileSync(join(EXPORT, src.replace(/^\//, '')), 'utf8');
  return code.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');
});
if (scripts.length === 0) throw new Error('No scripts found in the exported index.html');

const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map(([s]) => s).join('\n');

// Runs before the app:
// - The router reads location.pathname, so start at "/" (which redirects to Train).
// - expo-font writes @font-face rules with file URLs; point them at the inlined fonts instead.
const shim = `
(function () {
  try { if (location.pathname !== '/') history.replaceState(null, '', '/'); } catch (e) {}
  var FONTS = ${JSON.stringify(fonts)};
  var create = document.createTextNode.bind(document);
  document.createTextNode = function (text) {
    if (typeof text === 'string' && text.indexOf('@font-face') === 0) {
      text = text.replace(/src:url\\("([^"]+)"\\)/, function (m, url) {
        var family = url.split('/').pop().split('.')[0];
        return FONTS[family] ? 'src:url("' + FONTS[family] + '")' : m;
      });
    }
    return create(text);
  };
})();
`;

const page = `<title>Plus Ultra</title>
<meta name="theme-color" content="#0E0E10">
${styles}
<style>
  :root { color-scheme: dark; }
  html, body { height: 100%; background: #0E0E10; }
  body { overflow: hidden; }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<noscript>Plus Ultra needs JavaScript.</noscript>
<div id="root"></div>
<script>${shim}</script>
${scripts.map((s) => `<script>${s}</script>`).join('\n')}
`;

mkdirSync(OUT, { recursive: true });
const target = join(OUT, 'plus-ultra.html');
writeFileSync(target, page);
console.log(`${target}: ${(page.length / 1024 / 1024).toFixed(1)} MB`);
