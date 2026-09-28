import type { SqlJsStatic } from 'sql.js';
import initAsm from 'sql.js/dist/sql-asm.js';
import initWasm from 'sql.js/dist/sql-wasm-browser.js';

/**
 * sql.js for the single-file preview (`npm run build:preview`): nothing is fetched, so it runs as one
 * self-contained HTML page. The page inlines the WASM as base64 (globalThis.__PU_SQL_WASM); if the host
 * doesn't allow compiling WASM, fall back to the slower asm.js build.
 */
export async function loadSqlJs(): Promise<SqlJsStatic> {
  const b64 = (globalThis as { __PU_SQL_WASM?: string }).__PU_SQL_WASM;
  if (b64) {
    try {
      const wasmBinary = Uint8Array.from(atob(b64), (ch) => ch.charCodeAt(0));
      await WebAssembly.compile(wasmBinary); // throws where a content policy forbids WASM
      return await initWasm({ wasmBinary: wasmBinary.buffer });
    } catch {
      // fall through to asm.js
    }
  }
  return initAsm();
}
