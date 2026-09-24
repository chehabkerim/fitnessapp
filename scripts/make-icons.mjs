// Renders PWA and app icons from assets/brand/mark.svg with the local Chromium (dev-only script).
// Usage: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const mark = readFileSync(join(root, 'assets/brand/mark.svg'), 'utf8');
const inner = mark.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const glyph = inner.replace(/<rect[^>]*\/>/, ''); // the plus marks only

// full: rounded tile; square: full-bleed (maskable/Android, safe zone 80%); bare: glyph on transparent or given bg
const svg = (kind, bg) => {
  if (kind === 'full') return mark;
  const scale = kind === 'maskable' ? 0.72 : 0.9;
  const t = 256 - 256 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg ? `<rect width="512" height="512" fill="${bg}"/>` : ''}<g transform="translate(${t} ${t}) scale(${scale})">${glyph}</g></svg>`;
};

const outputs = [
  ['public/icons/icon-192.png', 192, svg('full')],
  ['public/icons/icon-512.png', 512, svg('full')],
  ['public/icons/maskable-512.png', 512, svg('maskable', '#C4623F')],
  ['public/icons/apple-touch-icon.png', 180, svg('maskable', '#C4623F')],
  ['public/favicon.png', 48, svg('full')],
  ['assets/favicon.png', 48, svg('full')],
  ['assets/icon.png', 1024, svg('maskable', '#C4623F')],
  ['assets/splash-icon.png', 512, svg('full')],
  ['assets/android-icon-foreground.png', 512, svg('maskable')],
  ['assets/android-icon-monochrome.png', 512, svg('maskable').replaceAll('#F6F1EA', '#000000')],
];

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const [out, size, markup] of outputs) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${markup.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: join(root, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
  console.log(out);
}
await browser.close();
