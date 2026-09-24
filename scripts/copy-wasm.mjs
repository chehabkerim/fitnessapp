// Copies the sql.js browser WASM into public/, so the web app loads it from our own origin (no CDN)
// and the service worker can precache it.
import { copyFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
copyFileSync(join(root, 'node_modules/sql.js/dist/sql-wasm-browser.wasm'), join(root, 'public/sql-wasm.wasm'));
console.log('public/sql-wasm.wasm');
