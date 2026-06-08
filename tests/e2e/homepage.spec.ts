import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display main elements', async ({ page }) => {
    await page.goto('/');

    // Check that page loaded
    await expect(page).toHaveTitle(/sojori/i);

    // Check navigation is visible
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check logo/brand is present
    await expect(page.locator('text=sojori')).toBeVisible();
  });

  test('should navigate to search page', async ({ page }) => {
    await page.goto('/');

    // Find and click search link/button
    const searchLink = page.locator('a[href*="search"]').first();
    if (await searchLink.count() > 0) {
      await searchLink.click();
      await expect(page).toHaveURL(/search/);
    }
  });
});
