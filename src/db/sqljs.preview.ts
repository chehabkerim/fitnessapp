import type { SqlJsStatic } from 'sql.js';
import initSqlJs from 'sql.js/dist/sql-asm.js';

/**
 * sql.js, asm.js build: no WASM file to fetch or compile, so the app runs as one self-contained HTML page
 * (the claude.ai preview frame blocks extra requests). Used only by `npm run build:preview`.
 */
export function loadSqlJs(): Promise<SqlJsStatic> {
  return initSqlJs();
}
