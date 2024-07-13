// @ts-check
import { test, expect } from '@playwright/test';

const baseUrl = 'http://localhost:4200';

test('has title', async ({ page }) => {
  await page.goto(baseUrl);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MasterFrontendWeb/);
});

test('Go to Canvas', async ({ page }) => {
  await page.goto(baseUrl);

  await page.type('#name-or-email-input', 'Test0');
  await page.type('#password-input', '123');
  await page.click('#submit-button');
  await page.waitForSelector();
});
