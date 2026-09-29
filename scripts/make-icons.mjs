// Renders the PWA and native icons from design/plus-ultra/app-icon.svg and app-icon-maskable.svg, and the
// splash image from the two-tone wordmark, with the local Chromium (dev-only; no extra dependency).
// Usage: node scripts/make-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const read = (f) => readFileSync(join(root, 'design/plus-ultra', f), 'utf8').replace(/<\?xml[^>]*>\s*/, '');
const icon = read('app-icon.svg');
const maskable = read('app-icon-maskable.svg');
const wordmark = read('logo-wordmark-two-tone.svg');
// Android adaptive icon layers: the maskable artwork without its purple square (app.config supplies it).
const foreground = maskable.replace(/<rect[^>]*\/>/, '');
const monochrome = foreground.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#000000"');

const sized = (svg, w, h = w) => svg.replace(/<svg ([^>]*?)(?:\s*width="\d+" height="\d+")?>/, `<svg $1 width="${w}" height="${h}">`);

const outputs = [
  ['public/icons/icon-192.png', 192, icon],
  ['public/icons/icon-512.png', 512, icon],
  ['public/icons/maskable-512.png', 512, maskable],
  ['public/icons/apple-touch-icon.png', 180, icon],
  ['public/favicon.png', 48, icon],
  ['assets/favicon.png', 48, icon],
  ['assets/icon.png', 1024, icon],
  ['assets/android-icon-foreground.png', 512, foreground],
  ['assets/android-icon-monochrome.png', 512, monochrome],
  ['assets/splash-icon.png', [1040, 545], wordmark],
];

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined });
const page = await browser.newPage();
for (const [out, size, svg] of outputs) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<html><body style="margin:0;background:transparent">${sized(svg, w, h)}</body></html>`);
  await page.screenshot({ path: join(root, out), omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } });
  console.log(out);
}
await browser.close();
