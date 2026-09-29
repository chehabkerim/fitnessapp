// Renders Train, the active workout and Settings → Appearance for every colour scheme × mode at 390px
// into design/ignite/built/schemes/. Needs `npm run build:web` and dist/ served on port 4173.
import { chromium } from '@playwright/test';
import { mkdirSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:4173';
const OUT = new URL('../design/ignite/built/schemes/', import.meta.url).pathname;
const EX = 'Incline Dumbbell Bench Press';
const SCHEMES = ['Neon', 'Ultraviolet', 'Volt', 'Mono', 'Coral'];
mkdirSync(OUT, { recursive: true });

const ctx = await chromium.launchPersistentContext(mkdtempSync(join(tmpdir(), 'schemes-')), {
  executablePath: process.env.PW_CHROMIUM_PATH || undefined,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1.5,
  hasTouch: true,
  isMobile: true,
});
const p = await ctx.newPage();
await p.goto(`${BASE}/workouts`);
await p.getByText('Up next').first().waitFor();

// A workout in progress: set 1 done (keypad), set 2 current.
await p.getByRole('button', { name: 'Start Back & Chest' }).click();
for (const [field, keys] of [['Weight', ['2', '2', '.', '5']], ['Reps', ['1', '0']]]) {
  await p.getByRole('button', { name: new RegExp(`^${field}, ${EX}, set 1: `) }).click();
  for (const k of keys) await p.getByRole('button', { name: k === '.' ? /^(\.|Decimal point|Point)$/ : k, exact: k !== '.' }).click();
  await p.getByRole('button', { name: 'Done', exact: true }).click();
}
await p.getByRole('button', { name: `Complete ${EX}, set 1`, exact: true }).click();
const notNow = p.getByRole('button', { name: 'Not now' });
if (await notNow.isVisible({ timeout: 1000 }).catch(() => false)) await notNow.click();
await p.getByRole('button', { name: 'Skip rest' }).click().catch(() => {});
await p.getByRole('button', { name: 'Minimise workout' }).click();

for (const scheme of SCHEMES) {
  for (const mode of ['Dark', 'Light']) {
    await p.getByRole('tab', { name: 'Settings' }).click();
    await p.getByRole('radio', { name: new RegExp(`^${scheme} colour scheme`) }).click();
    await p.getByRole('radio', { name: mode, exact: true }).click();
    await p.waitForTimeout(300);
    const name = `${scheme.toLowerCase()}-${mode.toLowerCase()}`;
    await p.screenshot({ path: join(OUT, `${name}-settings.png`) });
    await p.getByRole('tab', { name: 'Train' }).click();
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, `${name}-train.png`) });
    await p.getByRole('button', { name: 'Resume workout' }).click();
    await p.getByRole('button', { name: 'Finish' }).waitFor();
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, `${name}-active.png`) });
    await p.getByRole('button', { name: 'Minimise workout' }).click();
  }
}
await ctx.close();
console.log(`wrote ${SCHEMES.length * 2 * 3} screenshots to ${OUT}`);
