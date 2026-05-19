import { expect, test } from '@playwright/test';
import fs from 'node:fs/promises';
import os from 'node:os';
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

  await page.getByRole('textbox', { name: 'Search specification presets' }).first().fill('film');
  await expect(page.getByText('Warm Film Editorial').first()).toBeVisible();

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

test('custom preset bundles can be exported and imported with schema validation', async ({ page }) => {
  await page.goto('/');
  const presetName = `Bundle QA ${Date.now()}`;

  await page.getByRole('button', { name: 'Save Specification Preset' }).click();
  await page.getByPlaceholder('Example: Editorial Brass Portrait').fill(presetName);
  await page.getByRole('button', { name: 'Save Preset' }).click();
  await expect(page.getByText(presetName).first()).toBeVisible();

  await page.getByRole('button', { name: /^file$/i }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('menuitem', { name: 'Export Preset Bundle' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('format-custom-presets');

  await page.evaluate(() => localStorage.removeItem('format-custom-presets'));
  await page.reload();
  await expect(page.getByText(presetName)).toHaveCount(0);

  const importedBundlePath = path.join(os.tmpdir(), `format-import-${Date.now()}.json`);
  await fs.writeFile(importedBundlePath, JSON.stringify({
    app: 'FORMAT',
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    presets: [{
      id: `custom-${Date.now()}`,
      name: presetName,
      category: 'Custom Presets',
      shadowCrush: 40,
      midtones: 8,
      highlights: 8,
      saturation: 104,
      hueShift: 0,
      inkBleed: 8,
      halation: 4,
      grain: 12,
      clarity: 10,
      skinSmoothing: 4,
      skinPolish: 10
    }]
  }));

  await page.locator('input[accept="application/json,.json"]').setInputFiles(importedBundlePath);
  await expect(page.getByText(presetName).first()).toBeVisible();
});

test('worker disabled mode still renders a material pass and exports', async ({ page }) => {
  await page.goto('/?disableWorkers=1');
  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  await page.getByRole('button', { name: /material finish/i }).click();
  await page.getByLabel('Material Profile').selectOption('cold-press-paper');
  await page.getByRole('spinbutton', { name: 'Material Strength' }).fill('24');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);
});

test('surface texture options and Y2K star filter render without export failure', async ({ page }) => {
  await page.goto('/');
  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  await page.getByRole('button', { name: /particles & texture/i }).click();
  for (const textureId of [
    'paper',
    'canvas',
    'linen',
    'stone',
    'metal',
    'grunge',
    '4k_film_dust',
    '4k_leather_grain',
    '4k_glass_refraction',
    '4k_holographic_foil',
    '4k_crushed_plastic'
  ]) {
    await page.getByLabel('Surface Specification').selectOption(textureId);
    await page.waitForTimeout(60);
  }

  await page.getByRole('button', { name: /print & crt engine/i }).click();
  await page.getByRole('slider', { name: 'Y2K Star Filter' }).fill('55');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);
});

test('browser can encode a 4096px export canvas without crashing', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 4096;
    canvas.height = 4096;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#181818';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#e8a82d';
    ctx.fillRect(256, 256, 1024, 1024);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    return Boolean(blob && blob.size > 0);
  });

  expect(result).toBe(true);
});
