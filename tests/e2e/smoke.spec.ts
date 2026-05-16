import { expect, test } from '@playwright/test';
import path from 'node:path';

test('initial workspace shell renders core controls before image import', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('FORMAT by TAGDesigns')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Specifications/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /tone & color/i })).toBeVisible();
  await expect(page.getByText('Upload Image to edit')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Render Output' })).toBeDisabled();
});

test('top menu, preset search, history panel, and help modal are reachable', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('label').filter({ hasText: 'Upload Image to edit' })).toBeVisible();
  await page.getByRole('button', { name: /^help$/i }).click();
  await expect(page.getByRole('button', { name: 'Close Guide' })).toBeVisible();
  await page.getByRole('button', { name: 'Close Guide' }).click();

  await page.getByRole('textbox', { name: 'Search specification presets' }).first().fill('kodachrome');
  await expect(page.getByText('1935 Kodachrome I').first()).toBeVisible();

  await page.getByText('History').first().click();
  await expect(page.getByText('History').first()).toBeVisible();
});

test('right control panels can be toggled with keyboard navigation', async ({ page }) => {
  await page.goto('/');

  const cameraPanel = page.getByRole('button', { name: /camera simulation/i });
  await cameraPanel.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Capture Profile')).toBeVisible();

  const tonePanel = page.getByRole('button', { name: /tone & color/i });
  await tonePanel.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Intelligent Auto-Tone')).toBeHidden();
});

test('user can import a real image and export a jpeg', async ({ page }) => {
  await page.goto('/');

  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);
});

test('release QA screenshots cover desktop tablet and mobile shells', async ({ page }, testInfo) => {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'tablet', width: 900, height: 900 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await expect(page.getByText('FORMAT by TAGDesigns')).toBeVisible();
    await testInfo.attach(`format-${viewport.name}`, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png'
    });
  }
});

test('mobile workspace exposes upload, presets, and settings entry points', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  await expect(page.getByText('Upload Image to edit')).toBeVisible();
  await expect(page.locator('summary').filter({ hasText: 'Specifications' })).toBeVisible();
  await expect(page.locator('summary').filter({ hasText: 'Tone & Color' })).toBeVisible();
  await page.locator('summary').filter({ hasText: 'Tone & Color' }).click();
  await expect(page.getByRole('slider', { name: 'Mobile Saturation' })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Mobile Skin Polish' })).toBeVisible();
});

test('user can save and delete a local custom preset', async ({ page }) => {
  await page.goto('/');
  const presetName = `QA Preset ${Date.now()}`;

  await page.getByRole('button', { name: 'Save Specification Preset' }).click();
  await page.getByPlaceholder('Example: Editorial Brass Portrait').fill(presetName);
  await page.getByRole('button', { name: 'Save Preset' }).click();

  await expect(page.getByText(presetName).first()).toBeVisible();

  await page.locator(`button[aria-label="Delete ${presetName}"]`).dispatchEvent('click');
  await page.getByRole('button', { name: 'Delete Preset' }).click();
  await expect(page.getByText(presetName)).toHaveCount(0);
});
