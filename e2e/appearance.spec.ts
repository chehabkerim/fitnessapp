import { chromium, expect, test, type Page } from '@playwright/test';

import { launch, newProfileDir, openApp } from './helpers';

const themeColor = (page: Page) => page.locator('meta[name="theme-color"]').first().getAttribute('content');
const pageBg = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const buttonBg = (page: Page, name: string) => page.getByRole('button', { name }).first().evaluate((el) => getComputedStyle(el).backgroundColor);

test('colour schemes apply instantly and persist; the app stays dark', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);
  // Neon: primary buttons are accent-filled
  expect(await buttonBg(page, 'Start Back & Chest')).toBe('rgb(57, 255, 20)');
  await page.getByRole('tab', { name: 'Settings' }).click();

  await expect(page.getByRole('radio', { name: 'Neon colour scheme, selected' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /colour scheme/ })).toHaveCount(4); // Ultraviolet unlocks later
  await expect(page.getByText('Plus Ultra is dark by design, so your colour always pops.')).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Light', exact: true })).toHaveCount(0); // no light mode
  expect(await themeColor(page)).toBe('#0E0E10');

  // Instant: no reload
  await page.getByRole('radio', { name: /^Mono colour scheme/ }).click();
  await expect(page.getByRole('radio', { name: 'Mono colour scheme, selected' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Neon colour scheme' })).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => themeColor(page)).toBe('#0B0B0C');
  await expect.poll(() => pageBg(page)).toBe('rgb(11, 11, 12)');

  // Persists, even when reloaded straight after the change
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Mono colour scheme, selected' })).toBeVisible();
  await page.getByRole('tab', { name: 'Train' }).click();
  expect(await buttonBg(page, 'Start Back & Chest')).toBe('rgb(255, 255, 255)'); // Mono's accent
  await ctx.close();
});

test('ignores the phone’s light setting', async () => {
  const ctx = await chromium.launchPersistentContext(newProfileDir(), {
    executablePath: process.env.PW_CHROMIUM_PATH || undefined,
    viewport: { width: 390, height: 844 },
    colorScheme: 'light',
  });
  const page = await openApp(ctx);
  expect(await pageBg(page)).toBe('rgb(14, 14, 16)');
  expect(await themeColor(page)).toBe('#0E0E10');
  await ctx.close();
});
