import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for the Link Device page
 */
export class LinkDevicePage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('link-device-email');
    this.submitButton = page.getByTestId('link-device-submit');
    this.errorMessage = page.getByTestId('link-device-error');
    this.successMessage = page.getByTestId('link-device-success');
    this.loadingSpinner = page.getByTestId('loading-spinner').or(page.locator('.animate-spin, [role="status"]'));
  }

  async goto() {
    await this.page.goto('/link-device');
    await this.page.waitForLoadState('networkidle');
  }

  async linkDevice(email: string) {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }

  async waitForResponse() {
    // Wait for either success or error
    await Promise.race([
      this.successMessage.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.errorMessage.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {}),
      this.page.waitForResponse(resp => 
        resp.url().includes('/api/parent-by-email') || 
        resp.url().includes('/api/device-token'),
        { timeout: 10000 }
      ).catch(() => {}),
    ]);
  }

  async isSuccess(): Promise<boolean> {
    const successVisible = await this.successMessage.isVisible().catch(() => false);
    const redirected = this.page.url().includes('/') && !this.page.url().includes('/link-device');
    return successVisible || redirected;
  }

  async getErrorMessage(): Promise<string | null> {
    if (await this.errorMessage.isVisible()) {
      return await this.errorMessage.textContent();
    }
    return null;
  }
}
