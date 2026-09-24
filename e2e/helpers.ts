import { chromium, expect, type BrowserContext, type Page } from '@playwright/test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const BASE = 'http://localhost:4173';

/** A browser profile on disk, so IndexedDB survives closing and relaunching (like a phone). */
export function newProfileDir() {
  return mkdtempSync(join(tmpdir(), 'plus-ultra-'));
}

export async function launch(profileDir: string): Promise<BrowserContext> {
  return chromium.launchPersistentContext(profileDir, {
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    viewport: { width: 390, height: 844 },
  });
}

export async function openApp(ctx: BrowserContext, path = '/workouts'): Promise<Page> {
  const page = await ctx.newPage();
  await page.goto(BASE + path);
  await expect(page.getByText('Start from a template').or(page.getByText('Plus Ultra is open in another tab')).or(page.getByRole('button', { name: 'Finish' }))).toBeVisible();
  return page;
}

export const weight = (page: Page, exercise: string, set: number) => page.getByLabel(new RegExp(`^(Weight|Added weight), ${exercise}, set ${set}$`));
export const reps = (page: Page, exercise: string, set: number) => page.getByLabel(`Reps, ${exercise}, set ${set}`, { exact: true });
export const check = (page: Page, exercise: string, set: number) => page.getByRole('checkbox', { name: new RegExp(`^(Complete|Completed) ${exercise}, set ${set}$`) });

export async function startTemplate(page: Page, name: string) {
  await page.getByRole('button', { name: `Start ${name}` }).click();
  await expect(page.getByRole('button', { name: 'Finish' })).toBeVisible();
}

export async function logSet(page: Page, exercise: string, set: number, w: string, r: string) {
  await weight(page, exercise, set).fill(w);
  await reps(page, exercise, set).fill(r);
  await check(page, exercise, set).click();
  await expect(check(page, exercise, set)).toHaveAttribute('aria-checked', 'true');
  await dismissRestAlertPrompt(page);
}

/** The first rest timer explains notifications before asking; tests answer "Not now". */
export async function dismissRestAlertPrompt(page: Page) {
  const notNow = page.getByRole('button', { name: 'Not now' });
  if (await notNow.isVisible({ timeout: 1500 }).catch(() => false)) {
    await notNow.click();
    await expect(notNow).toBeHidden();
  }
}

/** Emulates the app being sent to the background (iOS app switcher): visibility → hidden. */
export async function hide(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

/** Kills the page's renderer process without unload handlers (like iOS killing a backgrounded page). */
export async function crash(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  void cdp.send('Page.crash').catch(() => {}); // never resolves: the renderer is gone
  await expect.poll(() => page.evaluate(() => 1).catch(() => 'crashed'), { timeout: 5000 }).toBe('crashed');
}

/** Close without hanging on crashed pages. */
export async function closeQuietly(ctx: BrowserContext) {
  await Promise.race([ctx.close().catch(() => {}), new Promise((r) => setTimeout(r, 3000))]);
}
