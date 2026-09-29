import { expect, test } from '@playwright/test';

import { launch, newProfileDir, openApp } from './helpers';

const themeColor = (page: import('@playwright/test').Page) => page.locator('meta[name="theme-color"]').first().getAttribute('content');
const pageBg = (page: import('@playwright/test').Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('colour schemes apply instantly, persist, and combine with the mode', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);
  await page.getByRole('tab', { name: 'Settings' }).click();

  await expect(page.getByRole('radio', { name: 'Neon colour scheme, selected' })).toBeVisible();
  expect(await themeColor(page)).toBe('#0E0E10');

  // Instant: no reload
  await page.getByRole('radio', { name: /^Ultraviolet colour scheme/ }).click();
  await expect(page.getByRole('radio', { name: 'Ultraviolet colour scheme, selected' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: 'Neon colour scheme' })).toHaveAttribute('aria-checked', 'false');
  await expect.poll(() => themeColor(page)).toBe('#0D0A1A');
  await expect.poll(() => pageBg(page)).toBe('rgb(13, 10, 26)');

  // Mode on top of the scheme: Ultraviolet's violet-tinted light base
  await page.getByRole('radio', { name: 'Light', exact: true }).click();
  await expect.poll(() => themeColor(page)).toBe('#F3F1F8');

  // Persists, even when reloaded straight after the change
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Ultraviolet colour scheme, selected' })).toBeVisible();
  await expect.poll(() => themeColor(page)).toBe('#F3F1F8');
  await ctx.close();
});
