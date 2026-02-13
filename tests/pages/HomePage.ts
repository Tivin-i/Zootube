import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Home page
 */
export class HomePage {
  readonly page: Page;
  readonly videoCards: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly noVideosMessage: Locator;
  readonly header: Locator;

  constructor(page: Page) {
    this.page = page;
    this.videoCards = page.getByTestId('video-card').first();
    this.loadingSpinner = page.getByTestId('loading-spinner');
    this.errorMessage = page.getByTestId('error-message');
    this.noVideosMessage = page.getByTestId('empty-state');
    this.header = page.locator('header, [role="banner"]');
  }

  async goto() {
    await this.page.goto('/feed');
    await this.page.waitForLoadState('networkidle');
  }

  async waitForVideos() {
    // Wait for either videos to load or no videos message
    await Promise.race([
      this.page.getByTestId('video-card').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.noVideosMessage.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
    ]);
  }

  async getVideoCount(): Promise<number> {
    const cards = this.page.getByTestId('video-card');
    return await cards.count();
  }

  async clickVideo(index: number = 0) {
    const cards = this.page.getByTestId('video-card');
    await cards.nth(index).click();
  }

  async isRedirectedToLinkDevice(): Promise<boolean> {
    await this.page.waitForURL(/\/link-device/, { timeout: 5000 }).catch(() => {});
    return this.page.url().includes('/link-device');
  }
}
