import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LinkDevicePage } from '../pages/LinkDevicePage';
import { mockDeviceTokenAPI, setDeviceToken } from '../fixtures/auth';
import { TEST_PARENT_IDS } from '../fixtures/test-data';

test.describe('Navigation', () => {
  test('marketing page loads at / and shows CTAs', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/$|\/\/[^/]+\/?$/);
    const getStarted = page.getByRole('link', { name: /get started/i });
    const setUpDevice = page.getByRole('link', { name: /set up.*device/i });
    await expect(getStarted.or(setUpDevice).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate between pages correctly', async ({ page }) => {
    const homePage = new HomePage(page);
    const linkDevicePage = new LinkDevicePage(page);
    
    // Start at link-device page
    await linkDevicePage.goto();
    expect(page.url()).toContain('/link-device');
    
    // Navigate to feed (should redirect to link-device if not linked)
    await homePage.goto();
    // Should either be on link-device (if not linked) or feed (if linked)
    const isOnLinkDevice = page.url().includes('/link-device');
    const isOnFeed = page.url().includes('/feed');
    expect(isOnLinkDevice || isOnFeed).toBe(true);
  });

  test('should maintain device link after navigation', async ({ page }) => {
    // Mock device token API
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
    
    // Mock videos API
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videos: [],
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      });
    });
    
    const homePage = new HomePage(page);
    
    // Navigate to home
    await homePage.goto();
    
    // Should not redirect to link-device
    const isRedirected = await homePage.isRedirectedToLinkDevice();
    expect(isRedirected).toBe(false);
    
    // Navigate again
    await homePage.goto();
    
    // Should still not redirect
    const isRedirectedAgain = await homePage.isRedirectedToLinkDevice();
    expect(isRedirectedAgain).toBe(false);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    const linkDevicePage = new LinkDevicePage(page);
    
    // Navigate to link-device
    await linkDevicePage.goto();
    expect(page.url()).toContain('/link-device');
    
    // Navigate to feed (will redirect to link-device if not linked)
    await page.goto('/feed');
    await page.waitForLoadState('networkidle');
    
    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    // Should be on link-device or feed
    const url = page.url();
    expect(url.includes('/link-device') || url.includes('/feed')).toBe(true);
  });
});
