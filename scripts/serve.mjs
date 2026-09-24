// Minimal static server for dist/ (clean URLs → .html), used for local checks and the Playwright tests.
// Usage: node scripts/serve.mjs [port]
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = join(new URL('..', import.meta.url).pathname, 'dist');
const port = Number(process.argv[2] ?? 8081);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.png': 'image/png', '.ico': 'image/x-icon', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };

createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  const safe = normalize(url).replace(/^(\.\.[/\\])+/, '');
  const candidates = [join(root, safe), join(root, `${safe}.html`), join(root, safe, 'index.html')];
  const file = candidates.find((f) => existsSync(f) && statSync(f).isFile()) ?? join(root, '+not-found.html');
  res.writeHead(file.endsWith('+not-found.html') && !candidates.includes(file) ? 404 : 200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': file.endsWith('sw.js') ? 'no-cache' : 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Serving dist on http://localhost:${port}`));
