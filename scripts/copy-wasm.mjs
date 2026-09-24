// Copies the sql.js browser WASM into public/ with its version in the name, so the web app
// loads it from our own origin (no CDN) and the service worker can precache it.
import { copyFileSync, readdirSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(join(root, 'node_modules/sql.js/package.json'), 'utf8'));
const pub = join(root, 'public');
for (const f of readdirSync(pub)) if (/^sql-wasm-.*\.wasm$/.test(f)) rmSync(join(pub, f));
copyFileSync(join(root, 'node_modules/sql.js/dist/sql-wasm-browser.wasm'), join(pub, `sql-wasm-${version}.wasm`));
console.log(`public/sql-wasm-${version}.wasm`);
