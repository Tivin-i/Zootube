import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Watch page
 */
export class WatchPage {
  readonly page: Page;
  readonly videoPlayer: Locator;
  readonly videoTitle: Locator;
  readonly breakModal: Locator;
  readonly doneModal: Locator;
  readonly recommendations: Locator;

  constructor(page: Page) {
    this.page = page;
    this.videoPlayer = page.locator('#youtube-player, iframe[src*="youtube"], iframe[src*="youtu.be"], button[aria-label="Play video in fullscreen"]');
    this.videoTitle = page.getByTestId('video-title');
    this.breakModal = page.locator('text=/break|pause|rest|Take a Break/i');
    this.doneModal = page.locator('text=/done|complete|finished|I\'m done/i');
    this.recommendations = page.locator('button[aria-label^="Watch"]');
  }

  async goto(videoId: string) {
    await this.page.goto(`/watch/${videoId}`);
    await this.page.waitForLoadState('networkidle');
  }

  async waitForVideoPlayer() {
    const playButton = this.page.locator('button[aria-label="Play video in fullscreen"]');
    await playButton.waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  }

  async isVideoPlayerVisible(): Promise<boolean> {
    const playButton = this.page.locator('button[aria-label="Play video in fullscreen"]');
    const container = this.page.locator('#youtube-player');
    return (await playButton.isVisible().catch(() => false)) || (await container.isVisible().catch(() => false));
  }

  async getRecommendationCount(): Promise<number> {
    return await this.recommendations.count();
  }

  async clickRecommendation(index: number = 0) {
    await this.recommendations.nth(index).click();
  }

  async waitForBreakModal() {
    await this.breakModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }

  async waitForDoneModal() {
    await this.doneModal.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  }
}
