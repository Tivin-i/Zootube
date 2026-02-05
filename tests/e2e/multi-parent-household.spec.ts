import { test, expect } from '@playwright/test';
import { LinkDevicePage } from '../pages/LinkDevicePage';
import { HomePage } from '../pages/HomePage';
import { mockParentByEmailAPI, mockDeviceTokenAPI, setDeviceToken } from '../fixtures/auth';
import { TEST_EMAILS, TEST_PARENT_IDS } from '../fixtures/test-data';

test.describe('Multi-parent household', () => {
  test('link-device shows household picker when parent has multiple households', async ({ page }) => {
    const households = [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Family list' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Weekend list' },
    ];
    await mockParentByEmailAPI(page, TEST_EMAILS.VALID, TEST_PARENT_IDS.VALID, households);

    await page.goto('/link-device');
    await page.getByLabel(/parent's email/i).fill(TEST_EMAILS.VALID);
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByLabel(/which video list/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('combobox')).toContainText('Family list');
    await expect(page.getByRole('combobox')).toContainText('Weekend list');
  });

  test('link-device links to selected household when parent has one household', async ({ page }) => {
    const householdId = '11111111-1111-1111-1111-111111111111';
    const households = [{ id: householdId, name: 'Shared list' }];
    await mockParentByEmailAPI(page, TEST_EMAILS.VALID, TEST_PARENT_IDS.VALID, households);

    const postPromise = page.waitForRequest((req) => req.url().includes('/api/device-token') && req.method() === 'POST');
    await page.route('**/api/device-token', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
        return;
      }
      await route.continue();
    });

    await page.goto('/link-device');
    await page.getByLabel(/parent's email/i).fill(TEST_EMAILS.VALID);
    await page.getByRole('button', { name: /continue/i }).click();

    const postReq = await postPromise;
    const body = postReq.postDataJSON();
    expect(body.householdId).toBe(householdId);
    expect(body.parentId).toBe(TEST_PARENT_IDS.VALID);
  });

  test('child feed fetches videos by household_id when device is linked', async ({ page }) => {
    const householdId = TEST_PARENT_IDS.VALID;
    await mockDeviceTokenAPI(page, householdId);
    await setDeviceToken(page, householdId);

    let requestedHouseholdId: string | null = null;
    await page.route('**/api/videos*', async (route) => {
      const url = new URL(route.request().url());
      requestedHouseholdId = url.searchParams.get('household_id');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videos: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false },
        }),
      });
    });

    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.waitForVideos();

    expect(requestedHouseholdId).toBe(householdId);
  });
});
