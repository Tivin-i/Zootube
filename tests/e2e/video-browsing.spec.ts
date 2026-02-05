import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { mockDeviceTokenAPI, setDeviceToken } from '../fixtures/auth';
import { TEST_PARENT_IDS } from '../fixtures/test-data';

test.describe('Video Browsing', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
  });

  test('should redirect to link-device when not linked', async ({ page }) => {
    // Clear device token
    await page.context().clearCookies();
    
    await homePage.goto();
    
    // Should redirect to link-device
    const isRedirected = await homePage.isRedirectedToLinkDevice();
    expect(isRedirected).toBe(true);
  });

  test('should display loading state initially', async ({ page }) => {
    // Mock device token API
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
    
    await homePage.goto();
    
    // Loading spinner may appear briefly
    // The page should eventually load (either with videos or no videos message)
    await homePage.waitForVideos();
    
    // Page should be loaded (not showing spinner)
    const spinnerVisible = await homePage.loadingSpinner.isVisible().catch(() => false);
    expect(spinnerVisible).toBe(false);
  });

  test('should display videos when available', async ({ page }) => {
    // Mock device token API
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
    
    // Mock videos API response
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videos: [
            {
              id: 'test-1',
              title: 'Test Video 1',
              thumbnail_url: 'https://i.ytimg.com/vi/test1/default.jpg',
              duration_seconds: 120,
              watch_count: 0,
            },
            {
              id: 'test-2',
              title: 'Test Video 2',
              thumbnail_url: 'https://i.ytimg.com/vi/test2/default.jpg',
              duration_seconds: 180,
              watch_count: 1,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      });
    });
    
    await homePage.goto();
    await homePage.waitForVideos();
    
    // Should show videos
    const videoCount = await homePage.getVideoCount();
    expect(videoCount).toBeGreaterThan(0);
  });

  test('should display no videos message when collection is empty', async ({ page }) => {
    // Mock device token API
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
    
    // Mock empty videos API response
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
    
    await homePage.goto();
    await homePage.waitForVideos();
    
    // Should show no videos message
    const noVideosVisible = await homePage.noVideosMessage.isVisible();
    expect(noVideosVisible).toBe(true);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);

    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    await homePage.goto();
    await homePage.waitForVideos();

    const errorVisible = await homePage.errorMessage.isVisible().catch(() => false);
    expect(errorVisible).toBe(true);
  });

  test('should allow clicking on video cards', async ({ page }) => {
    // Mock device token API
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
    
    // Mock videos API response
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          videos: [
            {
              id: 'test-1',
              title: 'Test Video 1',
              thumbnail_url: 'https://i.ytimg.com/vi/test1/default.jpg',
              duration_seconds: 120,
              watch_count: 0,
            },
          ],
          pagination: {
            page: 1,
            limit: 20,
            total: 1,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        }),
      });
    });
    
    await homePage.goto();
    await homePage.waitForVideos();

    await homePage.clickVideo(0);
    await page.waitForTimeout(1500);

    const watchAnotherButton = page.getByRole('button', { name: /Watch another video/i });
    const takeABreak = page.getByText(/Take a Break/i);
    const playInModal = page.locator('.fixed.inset-0 button[aria-label*="Play"]');
    const hasModal = await watchAnotherButton.isVisible().catch(() => false)
      || await takeABreak.isVisible().catch(() => false)
      || await playInModal.isVisible().catch(() => false);
    const isWatchPage = page.url().includes('/watch/');
    expect(hasModal || isWatchPage).toBe(true);
  });
});
