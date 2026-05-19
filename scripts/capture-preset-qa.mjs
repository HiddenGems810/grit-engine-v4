import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.FORMAT_QA_URL ?? 'http://127.0.0.1:3101';
const repoRoot = process.cwd();
const imagePath = path.resolve(repoRoot, 'test-image-to-use.png');
const outputDir = path.resolve(repoRoot, 'qa', 'preset-gallery');

const presetGroups = [
  ['clean-01-format-clean', 'FORMAT Clean'],
  ['clean-02-creator-glow', 'Creator Glow'],
  ['clean-03-soft-luxury', 'Soft Luxury'],
  ['film-01-warm-editorial', 'Warm Film Editorial'],
  ['film-02-disposable-flash', 'Disposable Flash'],
  ['film-03-pro-mist', 'Pro Mist Film'],
  ['cinematic-01-teal-shadow', 'Teal Shadow Cinema'],
  ['fashion-01-dark-luxury', 'Dark Luxury'],
  ['fashion-02-street-chrome', 'Street Chrome'],
  ['social-01-viral-soft-pop', 'Viral Soft Pop'],
  ['y2k-01-star-glam', 'Star Filter Glam'],
  ['y2k-02-club-flash', 'Club Bathroom Flash']
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function uploadImage(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('label').filter({ hasText: 'Upload Image to edit' }).locator('input[type="file"]').setInputFiles(imagePath);
  await page.getByRole('button', { name: 'Render Output' }).waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByRole('button', { name: 'All Specs' }).click();
}

async function applyPreset(page, presetName, intensity = 75) {
  await page.getByRole('textbox', { name: 'Search specification presets' }).first().fill(presetName);
  const presetCard = page.getByRole('button', { name: new RegExp(escapeRegExp(presetName), 'i') }).first();
  await presetCard.focus();
  await page.keyboard.press('Enter');
  const intensitySlider = page.getByRole('slider', { name: 'Preset Intensity' }).first();
  await intensitySlider.fill(String(intensity));
  await page.waitForFunction((expected) => {
    const slider = document.querySelector('input[aria-label="Preset Intensity"]');
    return slider instanceof HTMLInputElement && slider.value === String(expected);
  }, intensity);
  await page.waitForTimeout(2200);
}

async function resetStack(page) {
  await page.getByRole('button', { name: /^Reset Stack$/ }).click();
  await page.waitForTimeout(650);
  await page.getByRole('button', { name: 'All Specs' }).click();
}

async function captureCanvas(page, fileName) {
  const canvas = page.locator('main canvas').first();
  await canvas.waitFor({ state: 'visible', timeout: 10_000 });
  await page.waitForFunction(() => {
    const canvasElement = document.querySelector('main canvas');
    return canvasElement instanceof HTMLCanvasElement && canvasElement.width > 0 && canvasElement.height > 0;
  });
  const dataUrl = await page.evaluate(() => {
    const canvasElement = document.querySelector('main canvas');
    if (!(canvasElement instanceof HTMLCanvasElement)) {
      throw new Error('FORMAT preview canvas was not found.');
    }
    const maxWidth = 720;
    const scale = Math.min(1, maxWidth / canvasElement.width);
    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = Math.round(canvasElement.width * scale);
    outputCanvas.height = Math.round(canvasElement.height * scale);
    const outputContext = outputCanvas.getContext('2d');
    if (!outputContext) {
      throw new Error('Unable to create FORMAT QA output canvas.');
    }
    outputContext.imageSmoothingEnabled = true;
    outputContext.imageSmoothingQuality = 'high';
    outputContext.drawImage(canvasElement, 0, 0, outputCanvas.width, outputCanvas.height);
    return outputCanvas.toDataURL('image/jpeg', 0.88);
  });
  await fs.writeFile(path.join(outputDir, fileName), Buffer.from(dataUrl.split(',')[1], 'base64'));
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await uploadImage(page);

for (const [slug, presetName] of presetGroups) {
  await resetStack(page);
  await applyPreset(page, presetName, 75);
  await captureCanvas(page, `${slug}.jpg`);
}

for (const intensity of [0, 25, 50, 75, 100]) {
  await resetStack(page);
  await applyPreset(page, 'Creator Glow', intensity);
  await captureCanvas(page, `intensity-creator-glow-${intensity}.jpg`);
}

await resetStack(page);
await applyPreset(page, 'Creator Glow', 75);
await page.getByRole('button', { name: /particles & texture/i }).click();
await page.getByLabel('Surface Specification').selectOption('linen');
await page.waitForTimeout(2200);
await captureCanvas(page, 'preview-preset-texture-portrait-controls.jpg');

const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Render Output' }).click();
const download = await downloadPromise;
await download.saveAs(path.join(outputDir, 'export-preset-texture-portrait-controls.jpeg'));

await browser.close();

console.log(`Preset QA screenshots written to ${outputDir}`);
