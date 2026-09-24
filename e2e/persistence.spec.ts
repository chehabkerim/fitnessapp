import { expect, test } from '@playwright/test';

import { check, closeQuietly, crash, hide, launch, logSet, newProfileDir, openApp, reps, selectSet, startTemplate, weight } from './helpers';
import type { BrowserContext } from '@playwright/test';

const EX = 'Incline Dumbbell Bench Press';

/** Reopen the app (same browser profile) and check the logged set is there. */
async function expectSetKept(ctx: BrowserContext, typedReps?: string) {
  const page = await openApp(ctx, '/workout/active');
  // The set card opens on the first unfinished set (set 2); set 1 is selected from the set list.
  if (typedReps) await expect(reps(page, EX, 2)).toHaveValue(typedReps);
  await expect(check(page, EX, 1)).toHaveAttribute('aria-checked', 'true');
  await selectSet(page, 1).click();
  await expect(weight(page, EX, 1)).toHaveValue('22.5');
  await expect(reps(page, EX, 1)).toHaveValue('10');
}

test.describe('kill test: a logged set survives the app being killed', () => {
  test('hidden, then killed immediately (app switcher swipe)', async () => {
    const profile = newProfileDir();
    const ctx = await launch(profile);
    const page = await openApp(ctx);
    await startTemplate(page, 'Back & Chest');
    await logSet(page, EX, 1, '22.5', '10');
    await reps(page, EX, 2).fill('9'); // mid-typing the next set
    await hide(page); // visibilitychange → immediate save, before the 200ms debounce would fire
    await page.waitForTimeout(100);
    await crash(page);
    await expectSetKept(ctx, '9');
    await closeQuietly(ctx);
  });

  test('killed with no warning after the short debounce', async () => {
    const profile = newProfileDir();
    const ctx = await launch(profile);
    const page = await openApp(ctx);
    await startTemplate(page, 'Back & Chest');
    await logSet(page, EX, 1, '22.5', '10');
    await reps(page, EX, 2).fill('9');
    await page.waitForTimeout(1100); // longest the debounced save can wait
    await crash(page);
    await expectSetKept(ctx, '9');
    await closeQuietly(ctx);
  });

  test('page closed straight after logging (pagehide)', async () => {
    const profile = newProfileDir();
    const ctx = await launch(profile);
    const page = await openApp(ctx);
    await startTemplate(page, 'Back & Chest');
    await logSet(page, EX, 1, '22.5', '10');
    await page.close({ runBeforeUnload: true });
    await ctx.close();
    // full browser restart from the same profile
    const again = await launch(profile);
    await expectSetKept(again);
    await again.close();
  });
});

test('a second tab shows "open in another tab" and can take over', async () => {
  const ctx = await launch(newProfileDir());
  const first = await openApp(ctx);
  await startTemplate(first, 'Arms');
  const second = await openApp(ctx);
  await expect(second.getByText('Plus Ultra is open in another tab')).toBeVisible();
  await second.getByRole('button', { name: 'Use here instead' }).click();
  await expect(second.getByText('Resume workout')).toBeVisible();
  await expect(first.getByText('Plus Ultra is open in another tab')).toBeVisible();
  await ctx.close();
});

test('opens offline once installed by the service worker', async () => {
  const ctx = await launch(newProfileDir());
  const page = await openApp(ctx);
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active?.state;
  });
  await page.waitForTimeout(500);
  await ctx.setOffline(true);
  await page.reload();
  await expect(page.getByText('Up next')).toBeVisible();
  await ctx.close();
});
