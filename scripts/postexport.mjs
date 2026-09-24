// After `expo export -p web`: writes dist/sw.js with a precache list of the exported files and a
// content-derived version, so each deploy replaces the old cache.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const dist = join(root, 'dist');
const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

const files = walk(dist)
  .map((f) => '/' + relative(dist, f).split('\\').join('/'))
  .filter((f) => f !== '/sw.js' && f !== '/_headers' && !f.endsWith('.map') && !f.includes('/_sitemap') && !f.startsWith('/(tabs)'))
  .sort();

const hash = createHash('sha256');
for (const f of files) hash.update(f).update(readFileSync(join(dist, f)));
const version = hash.digest('hex').slice(0, 12);

// Clean URLs for pages, plus the files themselves.
const urls = files.map((f) => encodeURI(f));
const template = readFileSync(join(root, 'scripts/sw.template.js'), 'utf8');
writeFileSync(join(dist, 'sw.js'), template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(urls, null, 0)));
console.log(`dist/sw.js: ${urls.length} files precached, version ${version}`);
