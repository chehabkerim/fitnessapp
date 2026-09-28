import type { SqlJsStatic } from 'sql.js';

// scripts/copy-wasm.mjs copies the WASM into public/ (served from our origin, precached by the service worker).
const WASM_URL = '/sql-wasm.wasm';

/** sql.js, WASM build. The single-file preview build swaps this module for ./sqljs.preview (see metro.config.js). */
export function loadSqlJs(): Promise<SqlJsStatic> {
  return import('sql.js/dist/sql-wasm-browser.js').then((m) => m.default({ locateFile: () => WASM_URL }));
}
