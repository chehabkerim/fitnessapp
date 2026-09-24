// Renders the five Ignite reference screens at 390px, dark and light, into design/ignite/built/.
// Builds a realistic history with Playwright's clock, then captures on a touch device (keypad, no hover).
// Usage: npm run build:web && node scripts/serve.mjs 4173 & node scripts/ignite-screens.mjs
import { chromium } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const BASE = 'http://localhost:4173';
const OUT = new URL('../design/ignite/built/', import.meta.url).pathname;
const EXE = process.env.PW_CHROMIUM_PATH || undefined;
const EX = 'Incline Dumbbell Bench Press';
const LAT = 'Lat Pulldown';
const at = (d, hms) => new Date(`2026-09-${d}T${hms}`);

/** Close pages first so pagehide saves, like a real tab close. */
async function close(ctx) {
  for (const pg of ctx.pages()) await pg.close({ runBeforeUnload: true });
  await ctx.close();
}

async function context(profile, { touch }) {
  return chromium.launchPersistentContext(profile, {
    executablePath: EXE,
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    hasTouch: touch,
    isMobile: touch,
  });
}

async function page(ctx, time) {
  await ctx.clock.install({ time });
  await ctx.clock.resume();
  const p = await ctx.newPage();
  await p.goto(`${BASE}/workouts`);
  await p.getByText('Up next').or(p.getByRole('button', { name: 'Finish' })).first().waitFor();
  return p;
}

const skipRest = async (p) => {
  const skip = p.getByRole('button', { name: 'Skip rest' });
  if (await skip.isVisible().catch(() => false)) await skip.click();
};
const notNow = async (p) => {
  const b = p.getByRole('button', { name: 'Not now' });
  if (await b.isVisible({ timeout: 800 }).catch(() => false)) await b.click();
};

/** Desktop logging (typing into the value boxes). */
async function log(p, exercise, set, w, r) {
  await p.getByLabel(new RegExp(`^(Weight|Added weight), ${exercise}, set ${set}$`)).fill(w);
  await p.getByLabel(`Reps, ${exercise}, set ${set}`, { exact: true }).fill(r);
  await p.getByRole('button', { name: `Complete ${exercise}, set ${set}`, exact: true }).click();
  await notNow(p);
  await skipRest(p);
}

async function goTo(p, exercise) {
  await p.getByRole('button', { name: `Go to ${exercise}` }).first().click();
}

async function finish(p) {
  await p.getByRole('button', { name: 'Finish' }).first().click();
  const discard = p.getByRole('button', { name: 'Discard them and finish' });
  if (await discard.isVisible({ timeout: 1500 }).catch(() => false)) await discard.click();
  await p.getByText('Workout complete').waitFor();
  await p.getByRole('button', { name: 'Done', exact: true }).click();
}

async function history(profile, theme) {
  const ctx = await context(profile, { touch: false });
  const p = await page(ctx, at(20, '09:00:00'));
  if (theme === 'light') {
    await p.goto(`${BASE}/settings`);
    await p.getByRole('radio', { name: 'Light' }).click();
    await p.waitForTimeout(600);
    await p.goto(`${BASE}/workouts`);
    await p.getByText('Up next').waitFor();
  }
  // Sunday 20: Back & Chest
  await p.getByRole('button', { name: 'Start Back & Chest' }).click();
  await log(p, EX, 1, '22.5', '10');
  await log(p, EX, 2, '22.5', '9');
  await log(p, EX, 3, '22.5', '8');
  await goTo(p, LAT);
  await log(p, LAT, 1, '70', '2');
  await log(p, LAT, 2, '60', '8');
  await finish(p);
  // Mon 21, Tue 22 (Arms), Wed 23
  for (const [day, start] of [['21', 'Start an empty workout'], ['22', 'Start Arms'], ['23', 'Start an empty workout']]) {
    await ctx.clock.setSystemTime(at(day, '18:00:00'));
    await p.reload();
    await p.getByText('Up next').waitFor();
    if (start === 'Start Arms') {
      await p.getByRole('button', { name: 'Start Arms' }).click();
      for (const [ex, w, r] of [['Tricep Pushdown', '30', '12'], ['Tricep Pushdown', '32.5', '10'], ['Tricep Pushdown', '32.5', '9']]) {
        const n = await p.getByRole('checkbox', { name: new RegExp(`^Completed ${ex}`) }).count();
        await log(p, ex, n + 1, w, r);
      }
    } else {
      await p.getByRole('button', { name: 'Start an empty workout' }).click();
      await p.getByRole('button', { name: 'Add exercise' }).click();
      await p.getByRole('checkbox', { name: 'Upper Back Row' }).click();
      await p.getByRole('button', { name: 'Add 1 exercise' }).click();
      await log(p, 'Upper Back Row', 1, '45', '12');
      await p.getByRole('button', { name: /Add set to Upper Back Row/ }).click();
      await log(p, 'Upper Back Row', 2, '45', '11');
    }
    await finish(p);
  }
  await close(ctx);
}

async function capture(profile, theme) {
  const shot = (p, name) => p.screenshot({ path: join(OUT, `${name}-${theme}.png`) });
  // Thursday 24: Train
  let ctx = await context(profile, { touch: true });
  let p = await page(ctx, at(24, '18:00:00'));
  const nudge = p.getByRole('button', { name: 'Not now' });
  if (await nudge.isVisible().catch(() => false)) await nudge.click();
  await p.waitForTimeout(600);
  await shot(p, '1-train');

  // Start Back & Chest; set 1 done (desktop typing is simplest for set-up), set 2 prefilled 25 × 8
  await close(ctx);
  ctx = await context(profile, { touch: false });
  p = await page(ctx, at(24, '18:00:00'));
  await p.getByRole('button', { name: 'Start Back & Chest' }).click();
  await log(p, EX, 1, '22.5', '10');
  await p.getByLabel(`Weight, ${EX}, set 2`, { exact: true }).fill('25');
  await p.getByLabel(`Reps, ${EX}, set 2`, { exact: true }).fill('8');
  await p.getByLabel(`Weight, ${EX}, set 3`, { exact: true }).count();
  await p.waitForTimeout(400);
  await close(ctx);

  // Touch device from here: active workout at 24:13
  ctx = await context(profile, { touch: true });
  p = await page(ctx, at(24, '18:24:13'));
  await p.goto(`${BASE}/workout/active`);
  await p.getByRole('button', { name: 'Finish' }).waitFor();
  await p.waitForTimeout(600);
  await shot(p, '2-active');

  // Keypad for the weight of set 2
  await p.getByRole('button', { name: new RegExp(`^Weight, ${EX}, set 2: `) }).click();
  await p.waitForTimeout(400);
  await shot(p, '3-keypad');
  await p.getByRole('button', { name: 'Done', exact: true }).click();

  // Complete set 2 → PR; rest showing 1:24 of 2:00
  await ctx.clock.setSystemTime(at(24, '18:25:02'));
  await p.getByRole('button', { name: `Complete ${EX}, set 2`, exact: true }).click();
  await ctx.clock.setSystemTime(at(24, '18:25:38'));
  await p.waitForTimeout(700);
  await shot(p, '4-pr-rest');

  // Finish with Lat Pulldown records too
  await p.getByRole('button', { name: 'Skip rest' }).click();
  await close(ctx);
  ctx = await context(profile, { touch: false });
  p = await page(ctx, at(24, '18:40:00'));
  await p.goto(`${BASE}/workout/active`);
  await p.getByRole('button', { name: 'Finish' }).waitFor();
  await p.getByLabel(`Weight, ${EX}, set 3`, { exact: true }).fill('25');
  await p.getByLabel(`Reps, ${EX}, set 3`, { exact: true }).fill('8');
  await p.getByRole('button', { name: `Complete ${EX}, set 3`, exact: true }).click();
  await skipRest(p);
  await goTo(p, LAT);
  await log(p, LAT, 1, '65', '6');
  await log(p, LAT, 2, '65', '6');
  await ctx.clock.setSystemTime(at(24, '18:52:18'));
  await close(ctx);
  ctx = await context(profile, { touch: true });
  p = await page(ctx, at(24, '18:52:18'));
  await p.goto(`${BASE}/workout/active`);
  await p.getByRole('button', { name: 'Finish' }).first().click();
  await p.getByRole('button', { name: 'Discard them and finish' }).click();
  await p.getByText('Workout complete').waitFor();
  await p.waitForTimeout(600);
  await shot(p, '5-complete');

  // The restyled secondary screens (not in the reference sheet)
  await p.getByRole('button', { name: 'Done', exact: true }).click();
  for (const [path, name, ready] of [
    ['/history', '6-history', 'History'],
    ['/exercises', '7-exercises', 'Back & Chest'],
    ['/settings', '9-settings', 'Units'],
  ]) {
    await p.goto(`${BASE}${path}`);
    await p.getByText(ready).first().waitFor({ timeout: 5000 }).catch(() => {});
    await p.waitForTimeout(500);
    await shot(p, name);
  }
  await p.goto(`${BASE}/exercises`);
  await p.getByText(EX).first().click();
  await p.waitForTimeout(700);
  await shot(p, '8-exercise-detail');
  await close(ctx);
}

for (const theme of ['dark', 'light']) {
  const profile = mkdtempSync(join(tmpdir(), `ignite-${theme}-`));
  await history(profile, theme);
  await capture(profile, theme);
  console.log(`captured ${theme}`);
}
