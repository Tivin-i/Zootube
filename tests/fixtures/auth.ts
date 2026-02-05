import { Page } from '@playwright/test';

// Cookie names must match the app (lib/utils/constants.ts)
const DEVICE_TOKEN_COOKIE_NAME = 'safetube_device_token';
const PARENT_ID_COOKIE_NAME = 'safetube_parent_id_secure';

/**
 * Authentication fixtures and helpers for E2E tests
 */

/**
 * Sets device linking cookies to simulate a linked device.
 * Pass householdId (and optionally parentId for legacy). App expects GET /api/device-token to return householdId.
 * For DB-backed flow, use mockDeviceTokenAPI() instead.
 */
export async function setDeviceToken(page: Page, householdId: string, parentId?: string) {
  const domain = new URL(process.env.BASE_URL || 'http://localhost:3001').hostname;
  const pid = parentId ?? householdId;
  await page.context().addCookies([
    {
      name: DEVICE_TOKEN_COOKIE_NAME,
      value: `e2e-token-${householdId}`,
      domain,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
    {
      name: PARENT_ID_COOKIE_NAME,
      value: pid,
      domain,
      path: '/',
      httpOnly: true,
      secure: false,
      sameSite: 'Lax',
    },
  ]);
}

/**
 * Clears device token to simulate unlinked device
 */
export async function clearDeviceToken(page: Page) {
  await page.context().clearCookies();
}

/**
 * Mocks the device token API response. App expects householdId (and optionally parentId).
 */
export async function mockDeviceTokenAPI(page: Page, householdId: string, parentId?: string) {
  const pid = parentId ?? householdId;
  await page.route('**/api/device-token', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ householdId, parentId: pid }),
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, householdId, parentId: pid }),
      });
    }
  });
}

/**
 * Mocks the parent-by-email API response. Returns parentId and households for link-device flow.
 */
export async function mockParentByEmailAPI(
  page: Page,
  email: string,
  parentId: string,
  households: { id: string; name: string }[] = [{ id: parentId, name: 'My list' }]
) {
  await page.route('**/api/parent-by-email*', async (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('email') === email) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ parentId, households }),
      });
      return;
    }
    await route.continue();
  });
}
