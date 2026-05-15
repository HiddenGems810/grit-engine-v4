/**
 * Grit Engine v4 — Image Analysis
 *
 * Pure functions for sampling image properties and auto-tuning parameters.
 * Extracted from page.tsx lines 238-317, 963-1031.
 */

import type { Preset } from '../presets';

/** Result of sampling an image's tonal profile. */
export interface ImageProfile {
  avgLuma: number;
  avgSat: number;
  isDarkScene: boolean;
  isBrightScene: boolean;
  isMutedScene: boolean;
}

/**
 * Sample the tonal profile of an image element.
 * Uses a 128x128 downscale for ultra-fast analysis.
 */
export const sampleImageProfile = (img: HTMLImageElement): ImageProfile | null => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 128;
  tempCanvas.height = 128;
  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return null;

  tempCtx.drawImage(img, 0, 0, 128, 128);
  const data = tempCtx.getImageData(0, 0, 128, 128).data;
  let lumaSum = 0;
  let satSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumaSum += luma;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
  }

  const pixelCount = 128 * 128;
  const avgLuma = lumaSum / pixelCount;
  const avgSat = satSum / pixelCount;

  return {
    avgLuma,
    avgSat,
    isDarkScene: avgLuma < 88,
    isBrightScene: avgLuma > 168,
    isMutedScene: avgSat < 0.18
  };
};

/**
 * Adapt a preset to the current image's tonal characteristics.
 * Prevents crushing dark images and oversaturating muted scenes.
 */
export const adaptPresetToImage = (preset: Preset, img: HTMLImageElement): Preset => {
  const profile = sampleImageProfile(img);
  if (!profile) return preset;

  const nextPreset: Preset = { ...preset };
  const portraitSafe = (preset.usageTags ?? []).includes('portrait-safe');
  const darkScene = profile.isDarkScene;

  if (darkScene && portraitSafe) {
    nextPreset.shadowCrush = Math.max(0, preset.shadowCrush - 8);
    nextPreset.midtones = Math.max(preset.midtones ?? 0, 10);
    nextPreset.highlights = Math.max(preset.highlights ?? 0, 6);
    if (preset.clarity !== undefined) {
      nextPreset.clarity = Math.max(0, preset.clarity - 4);
    }
  }

  if (darkScene && (preset.usageTags ?? []).includes('dark-scene') === false) {
    nextPreset.shadowCrush = Math.max(0, nextPreset.shadowCrush - 4);
    nextPreset.midtones = Math.max(nextPreset.midtones ?? 0, 6);
    nextPreset.highlights = Math.max(nextPreset.highlights ?? 0, 4);
  }

  if (profile.isBrightScene && (preset.usageTags ?? []).includes('graphic') === false) {
    nextPreset.highlights = Math.min(18, Math.max(nextPreset.highlights ?? 0, 4));
    nextPreset.shadowCrush = Math.min(nextPreset.shadowCrush, preset.shadowCrush + 4);
  }

  if (profile.isMutedScene && (preset.usageTags ?? []).includes('color-bold')) {
    nextPreset.saturation = Math.min(180, preset.saturation + 10);
  }

  return nextPreset;
};

/** Auto-tone result. */
export interface AutoToneResult {
  shadowCrush: number;
  midtones: number;
  highlights: number;
  saturation: number;
  monochrome: false;
  hueShift: 0;
  colorKnockout: 'none';
  gradientMap: 'none';
}

/**
 * Analyze an image and produce optimal tone parameters.
 * Premium Intelligence Auto-Tone algorithm.
 */
export const computeAutoTone = (img: HTMLImageElement): AutoToneResult => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 128;
  tempCanvas.height = 128;
  const tCtx = tempCanvas.getContext('2d')!;
  tCtx.drawImage(img, 0, 0, 128, 128);
  const data = tCtx.getImageData(0, 0, 128, 128).data;

  let lumaSum = 0;
  let minLuma = 255;
  let maxLuma = 0;
  let satSum = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    lumaSum += luma;
    if (luma < minLuma) minLuma = luma;
    if (luma > maxLuma) maxLuma = luma;

    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    satSum += sat;
  }

  const avgLuma = lumaSum / (128 * 128);
  const avgSat = satSum / (128 * 128);

  // Auto-Crush/Levels Logic
  let targetCrush = 20;
  let targetGamma = 0;
  let targetWhite = 0;

  if (avgLuma > 160) {
    targetCrush += 30; // Bright image -> crush down
    targetGamma = -20;
  }
  if (avgLuma < 80) {
    targetCrush = 0;    // Dark image -> open shadows
    targetGamma = 30;
  }

  const contrast = maxLuma - minLuma;
  if (contrast < 100) targetCrush += 40; // Flat image -> boost macro-contrast
  if (maxLuma < 220) targetWhite = 20; // Boost highlights if flat whites

  // Auto-Sat Logic
  let targetSat = 100;
  if (avgSat < 0.25) targetSat = 160;
  else if (avgSat > 0.5) targetSat = 85;
  else targetSat = 120;

  return {
    shadowCrush: Math.min(150, Math.max(0, targetCrush)),
    midtones: targetGamma,
    highlights: targetWhite,
    saturation: targetSat,
    monochrome: false,
    hueShift: 0,
    colorKnockout: 'none',
    gradientMap: 'none'
  };
};
