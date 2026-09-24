import { expect, test } from '@playwright/test';

import { check, dismissRestAlertPrompt, launch, logSet, newProfileDir, openApp, reps, startTemplate, weight } from './helpers';

const EX = 'Incline Dumbbell Bench Press';

test('Previous fills in, and beating it shows "Plus Ultra"', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);

  // Session 1: one set, finish (incomplete sets discarded). First session sets the baseline: no PRs.
  await startTemplate(page, 'Back & Chest');
  await logSet(page, EX, 1, '22.5', '10');
  await expect(page.getByLabel(/^Rest, /)).toBeVisible(); // rest timer started
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('button', { name: 'Discard them and finish' }).click();
  await expect(page.getByText('Workout complete')).toBeVisible();
  await expect(page.getByText('Plus Ultra', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Done' }).click();

  // Session 2: repeat it. Set 1 is prefilled and Previous shows last time.
  await page.getByRole('button', { name: 'Repeat Back & Chest' }).click();
  await expect(weight(page, EX, 1)).toHaveValue('22.5');
  await expect(reps(page, EX, 1)).toHaveValue('10');
  await expect(page.getByRole('button', { name: /Previous: 22.5 × 10/ })).toBeVisible();

  await weight(page, EX, 1).fill('25');
  await reps(page, EX, 1).fill('8');
  await check(page, EX, 1).click();
  await dismissRestAlertPrompt(page);
  await expect(page.getByLabel('Personal record. Plus Ultra')).toBeVisible();

  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.getByText('Workout complete')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Plus Ultra' })).toBeVisible();
  await expect(page.getByText('25 kg each').first()).toBeVisible();
  await ctx.close();
});

test('keyboard: Tab moves weight → reps → complete, Enter completes', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);
  await startTemplate(page, 'Back & Chest');
  await weight(page, EX, 1).focus();
  await page.keyboard.type('20');
  await page.keyboard.press('Tab');
  await expect(reps(page, EX, 1)).toBeFocused();
  await page.keyboard.type('12');
  await page.keyboard.press('Tab');
  await expect(check(page, EX, 1)).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(check(page, EX, 1)).toHaveAttribute('aria-checked', 'true');
  await dismissRestAlertPrompt(page);

  // Enter inside an input completes that set and moves to the next row.
  await reps(page, EX, 2).focus();
  await page.keyboard.type('11');
  await page.keyboard.press('Enter');
  await expect(check(page, EX, 2)).toHaveAttribute('aria-checked', 'true');
  await expect(weight(page, EX, 3)).toBeFocused();
  await ctx.close();
});

test('export → reset → import restores the log', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);
  await startTemplate(page, 'Arms');
  await logSet(page, 'Tricep Pushdown', 1, '30', '12');
  await page.getByRole('button', { name: 'Finish' }).click();
  await page.getByRole('button', { name: 'Discard them and finish' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  await page.goto('/settings/data');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export JSON' }).click()]);
  const file = await download.path();

  await page.getByRole('button', { name: 'Reset all data' }).click();
  await page.getByRole('button', { name: 'Delete everything' }).click();
  await expect(page.getByText(/All data was reset/)).toBeVisible();

  const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.getByRole('button', { name: 'Import JSON' }).click()]);
  await chooser.setFiles(file!);
  await page.getByRole('button', { name: 'Import and replace' }).click();
  await expect(page.getByText(/Imported your backup/)).toBeVisible();

  await page.goto('/workouts');
  await expect(page.getByRole('button', { name: /, Arms$/ })).toBeVisible();
  await ctx.close();
});
