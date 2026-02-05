import { test, expect } from '@playwright/test';

/**
 * Admin login smoke tests.
 * These do not perform real authentication; they verify the login page loads and form is present.
 * Full auth E2E would require a test Supabase project or mocked auth.
 */
test.describe('Admin Login', () => {
  test('should display parent login page with form', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Parent Login' })).toBeVisible();
    await expect(page.getByTestId('admin-login-email')).toBeVisible();
    await expect(page.getByTestId('admin-login-password')).toBeVisible();
    await expect(page.getByTestId('admin-login-submit')).toBeVisible();
  });

  test('should have sign up link', async ({ page }) => {
    await page.goto('/admin/login');
    await page.waitForLoadState('networkidle');

    const signUpLink = page.getByRole('link', { name: 'Sign up' });
    await expect(signUpLink).toBeVisible();
    await expect(signUpLink).toHaveAttribute('href', '/admin/signup');
  });
});
