import { expect, test } from '@playwright/test';

import { launch, logSet, newProfileDir, openApp, startTemplate } from './helpers';

test('badges: First Rep is the first goal, is earned on finishing, and shows in the case and detail', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);

  // Empty state: First Rep is the obvious first goal
  await expect(page.getByRole('button', { name: /^Next badge: First Rep/ })).toBeVisible();
  await page.getByRole('tab', { name: 'History' }).click();
  await page.getByRole('button', { name: 'Badges' }).click();
  await expect(page.getByText('0 / 26 earned')).toBeVisible();
  await expect(page.getByText(/^Finish your first workout to earn First Rep/)).toBeVisible();
  await page.goBack();
  await page.getByRole('tab', { name: 'Train' }).click();

  // Earned when the workout finishes, revealed on the summary
  await startTemplate(page, 'Arms');
  await logSet(page, 'Tricep Pushdown', 1, '30', '12');
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('button', { name: 'Discard them and finish' }).click();
  await expect(page.getByText('Badges earned')).toBeVisible();
  await expect(page.getByRole('button', { name: /^First Rep badge, Bronze, Tier I\./ })).toBeVisible();

  await page.getByRole('button', { name: 'See all badges' }).click();
  await expect(page.getByText('1 / 26 earned')).toBeVisible();
  await expect(page.getByRole('img', { name: 'First Rep badge, bronze, earned' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Ten Down badge, bronze, locked, 1 of 10 workouts' })).toBeVisible();

  await page.getByRole('button', { name: /^First Rep, Bronze, Tier I, earned/ }).click();
  await expect(page.getByRole('heading', { name: 'First Rep' })).toBeVisible();
  await expect(page.getByText('9 more workouts to Ten Down', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: /^Earned in Arms/ }).click();
  await expect(page).toHaveURL(/\/history\/workout\?id=/);
  await ctx.close();
});
