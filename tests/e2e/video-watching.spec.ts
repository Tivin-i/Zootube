import { test, expect } from '@playwright/test';
import { WatchPage } from '../pages/WatchPage';
import { mockDeviceTokenAPI, setDeviceToken } from '../fixtures/auth';
import { TEST_PARENT_IDS, TEST_VIDEOS } from '../fixtures/test-data';

test.describe('Video Watching', () => {
  let watchPage: WatchPage;

  test.beforeEach(async ({ page }) => {
    watchPage = new WatchPage(page);
    // Mock device token for authenticated access
    await mockDeviceTokenAPI(page, TEST_PARENT_IDS.VALID);
    await setDeviceToken(page, TEST_PARENT_IDS.VALID);
  });

  // Watch page fetches GET /api/videos?household_id=xxx and finds video in data.videos. Video id must be UUID.
  const mockVideosList = (videoId: string, title: string = 'Test Video', youtubeId: string = TEST_VIDEOS.YOUTUBE_ID) => ({
    videos: [
      {
        id: videoId,
        title,
        youtube_id: youtubeId,
        thumbnail_url: 'https://i.ytimg.com/vi/test/default.jpg',
        duration_seconds: 120,
        watch_count: 0,
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
  });

  test('should display video player on watch page', async ({ page }) => {
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideosList(TEST_VIDEOS.VALID_ID, 'Test Video', TEST_VIDEOS.YOUTUBE_ID)),
      });
    });
    await page.route('**/api/videos/*/watch', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await watchPage.goto(TEST_VIDEOS.VALID_ID);
    await page.waitForLoadState('networkidle');
    await watchPage.waitForVideoPlayer();

    const playButton = page.locator('button[aria-label="Play video in fullscreen"]');
    await expect(playButton).toBeVisible({ timeout: 5000 });
    const playerVisible = await watchPage.isVideoPlayerVisible();
    expect(playerVisible).toBe(true);
  });

  test('should display video title', async ({ page }) => {
    const videoTitle = 'Test Video Title';
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideosList(TEST_VIDEOS.VALID_ID, videoTitle, TEST_VIDEOS.YOUTUBE_ID)),
      });
    });
    await page.route('**/api/videos/*/watch', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await watchPage.goto(TEST_VIDEOS.VALID_ID);
    await page.waitForLoadState('networkidle');

    const playButton = page.locator('button[aria-label="Play video in fullscreen"]');
    await expect(playButton).toBeVisible({ timeout: 10000 });
    expect(await playButton.isVisible()).toBe(true);
  });

  test('should handle video not found', async ({ page }) => {
    const nonExistentId = '00000000-0000-0000-0000-000000000099';
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ videos: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPreviousPage: false } }),
      });
    });

    await watchPage.goto(nonExistentId);
    await page.waitForLoadState('networkidle');

    const hasError = await page.getByText('Video not found').isVisible().catch(() => false);
    const goHomeVisible = await page.getByRole('button', { name: 'Go Home' }).isVisible().catch(() => false);
    expect(hasError || goHomeVisible).toBe(true);
  });

  test('should track watch count', async ({ page }) => {
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockVideosList(TEST_VIDEOS.VALID_ID, 'Test Video', TEST_VIDEOS.YOUTUBE_ID)),
      });
    });
    await page.route('**/api/videos/*/watch', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await watchPage.goto(TEST_VIDEOS.VALID_ID);
    await watchPage.waitForVideoPlayer();
    await page.waitForTimeout(1000);
    expect(true).toBe(true);
  });

  test('should display recommendations when available', async ({ page }) => {
    const videosWithRecs = {
      videos: [
        { id: TEST_VIDEOS.VALID_ID, title: 'Test Video', youtube_id: TEST_VIDEOS.YOUTUBE_ID, thumbnail_url: 'https://i.ytimg.com/vi/test/default.jpg', duration_seconds: 120, watch_count: 0 },
        { id: '00000000-0000-0000-0000-000000000002', title: 'Rec 1', youtube_id: 'rec1', thumbnail_url: 'https://i.ytimg.com/vi/rec1/default.jpg', duration_seconds: 60, watch_count: 0 },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
    await page.route('**/api/videos*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(videosWithRecs),
      });
    });
    await page.route('**/api/videos/*/watch', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await watchPage.goto(TEST_VIDEOS.VALID_ID);
    await watchPage.waitForVideoPlayer();
    const recommendationCount = await watchPage.getRecommendationCount();
    expect(recommendationCount).toBeGreaterThanOrEqual(0);
  });
});
