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

test('premium preset intensity applies through the export path', async ({ page }) => {
  await page.goto('/');

  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  await page.getByRole('textbox', { name: 'Search specification presets' }).first().fill('Creator Glow');
  const creatorGlowPreset = page.getByRole('button', { name: /Creator Glow/i }).first();
  await creatorGlowPreset.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Active Preset').first()).toBeVisible();
  await expect(page.getByText('Creator Glow').first()).toBeVisible();

  const intensitySlider = page.getByRole('slider', { name: 'Preset Intensity' }).first();
  await intensitySlider.fill('25');
  await expect(intensitySlider).toHaveValue('25');
  await intensitySlider.fill('75');
  await expect(intensitySlider).toHaveValue('75');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);

  await page.getByRole('button', { name: 'Reset' }).first().click();
  await expect(intensitySlider).toBeHidden();
});

test('anti-ai slop repair mode tunes and exports', async ({ page }) => {
  await page.goto('/');

  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  await page.getByRole('button', { name: 'Anti-AI Slop Repair' }).first().click();
  await expect(page.getByText('Active: Anti-AI Slop Repair').first()).toBeVisible();

  const plasticSkinSlider = page.getByRole('slider', { name: 'Plastic Skin' }).first();
  await plasticSkinSlider.fill('88');
  await expect(plasticSkinSlider).toHaveValue('88');

  const fakeSharpnessSlider = page.getByRole('slider', { name: 'Fake Sharpness' }).first();
  await fakeSharpnessSlider.fill('72');
  await expect(fakeSharpnessSlider).toHaveValue('72');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);
});

test('precise number inputs drive shared slider controls', async ({ page }) => {
  await page.goto('/');

  const saturationInput = page.getByRole('spinbutton', { name: 'Saturation Pipeline' }).first();
  await saturationInput.fill('137');
  await expect(page.getByRole('slider', { name: 'Saturation Pipeline' }).first()).toHaveValue('137');

  const hueInput = page.getByRole('spinbutton', { name: 'Color Phase (Hue)' }).first();
  await hueInput.fill('-37');
  await expect(page.getByRole('slider', { name: 'Color Phase (Hue)' }).first()).toHaveValue('-37');

  const plasticSkinInput = page.getByRole('spinbutton', { name: 'Plastic Skin' }).first();
  await plasticSkinInput.fill('84');
  await expect(page.getByRole('slider', { name: 'Plastic Skin' }).first()).toHaveValue('84');

  await page.getByRole('button', { name: /print & crt engine/i }).click();
  const starInput = page.getByRole('spinbutton', { name: 'Y2K Star Filter' }).first();
  await starInput.fill('67');
  await expect(page.getByRole('slider', { name: 'Y2K Star Filter' }).first()).toHaveValue('67');
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

test('disposable flash film effect applies and exports as jpeg with workers disabled', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/?disableWorkers=1');
  const imagePath = path.resolve(process.cwd(), 'test-image-to-use.png');
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await expect(page.getByRole('button', { name: 'Render Output' })).toBeEnabled({ timeout: 15_000 });

  const effectsLab = page.getByLabel('Effects Lab');
  await expect(effectsLab.getByText('Premium Effects Lab')).toBeVisible();
  await effectsLab.getByRole('button', { name: /FORMAT Instant Flash/i }).click();
  await expect(effectsLab.getByText('FORMAT Instant Flash').first()).toBeVisible();

  await effectsLab.getByRole('spinbutton', { name: 'Effect Intensity' }).fill('0');
  await expect(effectsLab.getByRole('spinbutton', { name: 'Flash Strength' })).toHaveValue('0');
  await effectsLab.getByRole('spinbutton', { name: 'Effect Intensity' }).fill('100');
  await expect(effectsLab.getByRole('spinbutton', { name: 'Flash Strength' })).toHaveValue('70');
  await effectsLab.getByRole('spinbutton', { name: 'Flash Strength' }).fill('84');
  await effectsLab.getByRole('spinbutton', { name: 'Warm Light Leak' }).fill('52');
  await effectsLab.getByRole('spinbutton', { name: 'Dust & Scratches' }).fill('44');
  await effectsLab.getByLabel('Date Stamp Mode').selectOption('custom');
  await effectsLab.getByLabel('Custom Stamp Date').fill('2026-05-19');
  await effectsLab.getByLabel('Stamp Format').selectOption('YYYY_MM_DD');
  await effectsLab.getByLabel('Stamp Color').selectOption('white');
  await effectsLab.getByLabel('Stamp Position').selectOption('bottom-right');
  await effectsLab.getByLabel('Print Frame Mode').selectOption('expanded-print');
  await expect(page.getByLabel('Export Quality')).toContainText('Base Export');

  const customPresetName = `Flash QA ${Date.now()}`;
  await page.getByRole('button', { name: 'Save Specification Preset' }).click();
  await page.getByPlaceholder('Example: Editorial Brass Portrait').fill(customPresetName);
  await page.getByRole('button', { name: 'Save Preset' }).click();
  await expect(page.getByText(customPresetName).first()).toBeVisible();

  await effectsLab.getByLabel('Date Stamp Mode').selectOption('off');
  await effectsLab.getByLabel('Print Frame Mode').selectOption('off');
  const savedPreset = page.getByRole('button', { name: new RegExp(customPresetName) }).first();
  await savedPreset.focus();
  await page.keyboard.press('Enter');
  await expect(effectsLab.getByLabel('Date Stamp Mode')).toHaveValue('custom');
  await expect(effectsLab.getByLabel('Custom Stamp Date')).toHaveValue('2026-05-19');
  await expect(effectsLab.getByLabel('Print Frame Mode')).toHaveValue('expanded-print');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Render Output' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/format-system-04.*\.jpeg$/);

  await effectsLab.getByRole('button', { name: 'Reset Effect' }).click();
  await expect(effectsLab.getByLabel('Effect Family')).toHaveValue('none');
  await expect(effectsLab.getByRole('spinbutton', { name: 'Effect Intensity' })).toHaveCount(0);
});

test('browser can encode a 4096px export canvas without crashing', async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit',
    'Headless WebKit on Windows passes the 4096px toBlob check but hangs during worker teardown; WebKit export behavior is covered by the real import/export smoke tests.'
  );

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
