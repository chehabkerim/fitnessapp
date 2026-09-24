declare module '*.sql' {
  const sql: string;
  export default sql;
}
declare module '*/drizzle/migrations' {
  const bundle: { journal: unknown; migrations: Record<string, string> };
  export default bundle;
}
declare module 'sql.js/dist/sql-wasm-browser.js' {
  import initSqlJs from 'sql.js';
  export default initSqlJs;
}
