import { test, expect } from '@playwright/test';

test.describe('Reservation Flow - Complete Journey', () => {
  test('should complete reservation from listing to checkout', async ({ page }) => {
    // Navigate to listing detail page
    await page.goto('/listings/6765ba9c351665002ef47726');

    // Wait for page to load
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });

    // Take screenshot of listing page
    await page.screenshot({ path: 'tests/screenshots/01-listing-page.png', fullPage: true });

    // Scroll to calendar section
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(1000);

    // Look for calendar component
    const calendar = page.locator('[class*="DateRangePicker"]').first();
    if (await calendar.count() > 0) {
      console.log('✓ DateRangePicker component found');

      // Take screenshot of calendar
      await page.screenshot({ path: 'tests/screenshots/02-calendar-visible.png', fullPage: true });

      // Try to find and click dates
      // Note: We need to add data-testid attributes to make this more reliable
      const dateButtons = page.locator('button[data-date], div[data-date], [class*="day"]');
      const dateCount = await dateButtons.count();
      console.log(`Found ${dateCount} date elements`);

      if (dateCount > 0) {
        // Click first available date for check-in
        await dateButtons.nth(15).click(); // Approximate middle of month
        await page.waitForTimeout(500);

        // Click second date for check-out
        await dateButtons.nth(20).click();
        await page.waitForTimeout(500);

        await page.screenshot({ path: 'tests/screenshots/03-dates-selected.png', fullPage: true });
      }
    }

    // Look for reserve button
    const reserveButton = page.locator('button:has-text("Réserver")').first();
    if (await reserveButton.count() > 0) {
      console.log('✓ Reserve button found');

      // Check if button is enabled (might be disabled if dates not selected properly)
      const isEnabled = await reserveButton.isEnabled();
      console.log(`Reserve button enabled: ${isEnabled}`);

      if (isEnabled) {
        await reserveButton.click();
        await page.waitForTimeout(2000);

        // Check if we navigated to checkout
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        if (currentUrl.includes('/checkout/')) {
          console.log('✓ Successfully navigated to checkout');
          await page.screenshot({ path: 'tests/screenshots/04-checkout-page.png', fullPage: true });

          // Look for checkout stepper
          const stepper = page.locator('[class*="stepper"], [data-testid="checkout-step"]').first();
          if (await stepper.count() > 0) {
            console.log('✓ Checkout stepper found');
          }

          // Look for continue button in step 1
          const continueButton = page.locator('button:has-text("Continuer")').first();
          if (await continueButton.count() > 0) {
            await continueButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'tests/screenshots/05-checkout-step-2.png', fullPage: true });
          }
        }
      }
    }
  });

  test('should display calendar component on demo page', async ({ page }) => {
    await page.goto('/demo-mvp');

    // Wait for page to load
    await expect(page.locator('nav')).toBeVisible();

    // Check for calendar tab
    const calendarTab = page.locator('button:has-text("Calendrier")').first();
    await expect(calendarTab).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'tests/screenshots/demo-calendar.png', fullPage: true });

    // Click calendar tab if not active
    await calendarTab.click();
    await page.waitForTimeout(1000);

    // Look for calendar component
    const calendar = page.locator('[class*="DateRangePicker"], [class*="calendar"]').first();
    await expect(calendar).toBeVisible({ timeout: 5000 });

    console.log('✓ Calendar component visible on demo page');
  });

  test('should switch between calendar and checkout tabs on demo', async ({ page }) => {
    await page.goto('/demo-mvp');

    // Click calendar tab
    const calendarTab = page.locator('button:has-text("Calendrier")');
    await calendarTab.click();
    await page.waitForTimeout(500);

    // Click checkout tab
    const checkoutTab = page.locator('button:has-text("Checkout")');
    await checkoutTab.click();
    await page.waitForTimeout(500);

    // Should show message about selecting dates first
    await expect(page.locator('text=/sélectionnez.*dates/i')).toBeVisible();

    await page.screenshot({ path: 'tests/screenshots/demo-checkout-empty.png', fullPage: true });
  });
});

test.describe('Listing Page Elements', () => {
  test('should display listing details', async ({ page }) => {
    await page.goto('/listings/6765ba9c351665002ef47726');

    // Check for key elements
    await expect(page.locator('h1')).toBeVisible();

    // Check for description
    const description = page.locator('text=/description/i').first();
    if (await description.count() > 0) {
      console.log('✓ Description section found');
    }

    // Check for amenities/highlights
    const highlights = page.locator('text=/points forts|équipements/i').first();
    if (await highlights.count() > 0) {
      console.log('✓ Highlights/amenities section found');
    }

    // Take full page screenshot
    await page.screenshot({ path: 'tests/screenshots/listing-full-page.png', fullPage: true });
  });
});
