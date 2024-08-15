// @ts-check
import { test, expect, defineConfig, chromium } from '@playwright/test';

export default defineConfig({
  timeout: 10 * 60 * 1000,
});

const iterationCount = 10;
const minTimeout = 500;
const maxTimeout = 2000;
const minX = 0;
const maxX = 1300;
const minY = 100;
const maxY = 1000;
const testUsers = 10;
const promises: Promise<void>[] = [];

const baseUrl = 'http://localhost:4200';

test.beforeAll(() => {
  test.setTimeout(10 * 60 * 1000);
});

test('has title', async ({ page }) => {
  await page.goto(baseUrl);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/MasterFrontendWeb/);
});

// test.afterAll(async () => {
//   await Promise.all(promises);
// });

test('Register users', async ({ page }) => {
  await page.goto(baseUrl);

  for (let i = 39; i <= testUsers; i++) {
    await page.click('#login-register-switch');
    await page.type('#email-input', `test${i}@test${i}.com`);
    await page.type('#name-or-email-input', `Test${i}`);
    await page.type('#password-input', '123');
    await page.click('#submit-button');
    await page.click('#logout-button');
    await page.waitForSelector('#password-input');
  }
});

test('Add Members to Board', async ({ page }) => {
  test.setTimeout(10 * 60 * 1000);
  await page.goto(baseUrl);
  await page.type('#name-or-email-input', `Test0`);
  await page.type('#password-input', '123');
  await page.click('#submit-button');
  await page.waitForSelector('.board-list-container');
  await page.click('#enter-board-button-0');
  await page.waitForSelector('.element-selection');

  for (let i = 0; i <= testUsers; i++) {
    await page.click('#button-member-add');
    await page.type('#member-add-input', `Test${i}`);
    await page.click('#dialog-submit');
    await page.waitForTimeout(100);
  }
  await page.click('#logout-button');
  await page.waitForSelector('#password-input');
});

async function runWorker(testNumber: number): Promise<void> {
  console.log(`Started Worker: ${testNumber}`);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseUrl);

  await page.type('#name-or-email-input', `Test${testNumber}`);
  await page.type('#password-input', '123');
  await page.click('#submit-button');
  await page.waitForSelector('.board-list-container');
  await page.click('#enter-board-button-0');
  await page.waitForSelector('.element-selection');
  // await page.click('#element-button-0');
  await page.waitForSelector('.canvas');
  for (let iteration = 0; iteration < iterationCount; iteration++) {
    console.log(`Iteration ${iteration} in Worker: ${testNumber}`);
    const timeout = Math.floor(Math.random() * (maxTimeout - minTimeout + 1)) + minTimeout;
    console.log('Neues Timeout in s: ', timeout / 1000);
    await page.waitForTimeout(timeout);
    const x = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
    const y = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
    await page.mouse.move(x, y, { steps: 100 });
    const decision = Math.random();
    if (decision < 0.333) {
      await page.mouse.click(x, y);
      await page.mouse.down();
      const newX = Math.floor(Math.random() * (maxX - minX + 1)) + minX;
      const newY = Math.floor(Math.random() * (maxY - minY + 1)) + minY;
      await page.mouse.move(newX, newY, { steps: 100 });
      await page.mouse.up();
    } else if (decision >= 0.333 && decision < 0.666) {
      const elementButtons = await page.locator('.element-button').all();
      if (elementButtons.length) {
        const button = elementButtons[Math.floor(Math.random() * elementButtons.length)];
        await button.click();
      }
    }
  }
  await page.click('#logout-button');
  await page.waitForSelector('#password-input');
}

test('Test Canvas', async ({ page }, testInfo) => {
  test.setTimeout(10 * 60 * 1000);
  console.log(testInfo.timeout);
  for (let i = 0; i <= testUsers; i++) {
    promises.push(runWorker(i));
  }
  // expect(page).toHaveURL(/.*auth/);
  await Promise.all(promises);
});
