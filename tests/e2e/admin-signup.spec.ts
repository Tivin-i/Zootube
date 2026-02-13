import { test, expect } from '@playwright/test';

/**
 * Admin signup smoke tests.
 * Verifies the signup page loads with invite code field and form.
 * Does not perform real signup; when BETA_INVITE_CODE is unset, backend accepts any code.
 */
test.describe('Admin Signup', () => {
  test('should display signup page with invite code, email, password and submit', async ({ page }) => {
    await page.goto('/admin/signup');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Create Parent Account' })).toBeVisible();
    await expect(page.getByTestId('admin-signup-invite-code')).toBeVisible();
    await expect(page.getByPlaceholder('Invite code')).toBeVisible();
    await expect(page.getByPlaceholder('Email address')).toBeVisible();
    await expect(page.getByPlaceholder('Password (min. 6 characters)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign up' })).toBeVisible();
  });

  test('should have log in link', async ({ page }) => {
    await page.goto('/admin/signup');
    await page.waitForLoadState('networkidle');

    const logInLink = page.getByRole('link', { name: 'Log in' });
    await expect(logInLink).toBeVisible();
    await expect(logInLink).toHaveAttribute('href', '/admin/login');
  });
});
