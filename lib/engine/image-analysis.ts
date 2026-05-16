import type { Preset } from '../presets';

export interface ImageAestheticProfile {
  avgLuma: number;
  minLuma: number;
  maxLuma: number;
  contrastRange: number;
  avgSaturation: number;
  colorTemperatureEstimate: number;
  greenCastRisk: boolean;
  redCastRisk: boolean;
  highlightClipRisk: boolean;
  shadowClipRisk: boolean;
  lowContrastScene: boolean;
  highContrastScene: boolean;
  darkScene: boolean;
  brightScene: boolean;
  mutedScene: boolean;
  saturatedScene: boolean;
  skinRisk: boolean;
  noiseRisk: boolean;
  faceLikely: boolean;
  productLikely: boolean;
  dominantHueBuckets: Record<'red' | 'orange' | 'yellow' | 'green' | 'cyan' | 'blue' | 'magenta', number>;
  warmBias: boolean;
  coolBias: boolean;
}

export type ImageProfile = Pick<ImageAestheticProfile, 'avgLuma'> & {
  avgSat: number;
  isDarkScene: boolean;
  isBrightScene: boolean;
  isMutedScene: boolean;
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const hueBucketForRgb = (r: number, g: number, b: number): keyof ImageAestheticProfile['dominantHueBuckets'] => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (delta < 10) return 'yellow';

  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  if (hue < 20 || hue >= 335) return 'red';
  if (hue < 48) return 'orange';
  if (hue < 75) return 'yellow';
  if (hue < 165) return 'green';
  if (hue < 205) return 'cyan';
  if (hue < 265) return 'blue';
  return 'magenta';
};

const maybeSkinPixel = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return r > 45 && g > 25 && b > 15 && max - min > 12 && r >= g - 8 && r >= b - 4 && g >= b - 28;
};

export const sampleImageAestheticProfile = (img: HTMLImageElement): ImageAestheticProfile | null => {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 128;
  tempCanvas.height = 128;
  const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
  if (!tempCtx) return null;

  tempCtx.drawImage(img, 0, 0, 128, 128);
  const data = tempCtx.getImageData(0, 0, 128, 128).data;
  const buckets: ImageAestheticProfile['dominantHueBuckets'] = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    cyan: 0,
    blue: 0,
    magenta: 0
  };

  let lumaSum = 0;
  let satSum = 0;
  let minLuma = 255;
  let maxLuma = 0;
  let warmPixels = 0;
  let coolPixels = 0;
  let greenDominantPixels = 0;
  let redDominantPixels = 0;
  let clippedHighlights = 0;
  let clippedShadows = 0;
  let skinPixels = 0;
  let noisyEdges = 0;
  let previousLuma = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;

    lumaSum += luma;
    satSum += sat;
    minLuma = Math.min(minLuma, luma);
    maxLuma = Math.max(maxLuma, luma);
    buckets[hueBucketForRgb(r, g, b)] += 1;

    if (r + g > b * 2.05) warmPixels += 1;
    if (b > r * 1.08 || g > r * 1.18) coolPixels += 1;
    if (g > r * 1.12 && g > b * 1.08) greenDominantPixels += 1;
    if (r > g * 1.22 && r > b * 1.18) redDominantPixels += 1;
    if (r > 244 || g > 244 || b > 244) clippedHighlights += 1;
    if (r < 12 && g < 12 && b < 12) clippedShadows += 1;
    if (maybeSkinPixel(r, g, b)) skinPixels += 1;
    if (i > 0 && Math.abs(luma - previousLuma) > 64) noisyEdges += 1;
    previousLuma = luma;
  }

  const pixelCount = 128 * 128;
  const avgLuma = lumaSum / pixelCount;
  const avgSaturation = satSum / pixelCount;
  const contrastRange = maxLuma - minLuma;
  const skinRatio = skinPixels / pixelCount;
  const highlightClipRatio = clippedHighlights / pixelCount;
  const shadowClipRatio = clippedShadows / pixelCount;

  return {
    avgLuma,
    minLuma,
    maxLuma,
    contrastRange,
    avgSaturation,
    colorTemperatureEstimate: (warmPixels - coolPixels) / pixelCount,
    greenCastRisk: greenDominantPixels / pixelCount > 0.22,
    redCastRisk: redDominantPixels / pixelCount > 0.2,
    highlightClipRisk: highlightClipRatio > 0.08,
    shadowClipRisk: shadowClipRatio > 0.12,
    lowContrastScene: contrastRange < 92,
    highContrastScene: contrastRange > 205,
    darkScene: avgLuma < 86,
    brightScene: avgLuma > 170,
    mutedScene: avgSaturation < 0.18,
    saturatedScene: avgSaturation > 0.48,
    skinRisk: skinRatio > 0.08,
    noiseRisk: noisyEdges / pixelCount > 0.24 || (avgLuma < 74 && avgSaturation < 0.22),
    faceLikely: skinRatio > 0.12 && avgLuma > 38,
    productLikely: skinRatio < 0.035 && contrastRange > 118 && avgSaturation < 0.34,
    dominantHueBuckets: buckets,
    warmBias: warmPixels > coolPixels * 1.25,
    coolBias: coolPixels > warmPixels * 1.18
  };
};

export const sampleImageProfile = (img: HTMLImageElement): ImageProfile | null => {
  const profile = sampleImageAestheticProfile(img);
  if (!profile) return null;
  return {
    avgLuma: profile.avgLuma,
    avgSat: profile.avgSaturation,
    isDarkScene: profile.darkScene,
    isBrightScene: profile.brightScene,
    isMutedScene: profile.mutedScene
  };
};

const isGraphicPreset = (preset: Preset) => preset.family === 'graphic' || preset.family === 'experimental';

export const adaptPresetToAestheticProfile = (preset: Preset, profile: ImageAestheticProfile): Preset => {
  const nextPreset: Preset = { ...preset };
  const portraitSensitive = preset.skinSafe || preset.subjectBias === 'portrait' || profile.faceLikely || profile.skinRisk;
  const graphic = isGraphicPreset(preset);

  if (portraitSensitive && !graphic) {
    nextPreset.shadowCrush = clampNumber(nextPreset.shadowCrush, 0, profile.darkScene || profile.shadowClipRisk ? 24 : 34);
    nextPreset.midtones = Math.max(nextPreset.midtones ?? 0, profile.darkScene ? 14 : 9);
    nextPreset.highlights = Math.max(nextPreset.highlights ?? 0, profile.brightScene || profile.highlightClipRisk ? 6 : 5);
    nextPreset.saturation = clampNumber(nextPreset.saturation, 88, profile.saturatedScene ? 112 : 122);
    nextPreset.hueShift = clampNumber(nextPreset.hueShift, -14, 14);
    nextPreset.clarity = clampNumber(nextPreset.clarity ?? 0, 0, 20);
    nextPreset.skinSmoothing = clampNumber(nextPreset.skinSmoothing ?? 0, 0, 16);
    nextPreset.beautyBoost = clampNumber(nextPreset.beautyBoost ?? 0, 0, 30);
    nextPreset.skinPolish = clampNumber(nextPreset.skinPolish ?? 0, 0, 28);
    nextPreset.faceSlimming = clampNumber(nextPreset.faceSlimming ?? 0, 0, 4);
    if (profile.greenCastRisk && nextPreset.hueShift < 0) nextPreset.hueShift = Math.max(nextPreset.hueShift, -6);
    if (profile.redCastRisk && nextPreset.hueShift > 0) nextPreset.hueShift = Math.min(nextPreset.hueShift, 6);
  }

  if (profile.darkScene && !graphic) {
    nextPreset.shadowCrush = Math.max(0, nextPreset.shadowCrush - (portraitSensitive ? 8 : 5));
    nextPreset.midtones = Math.max(nextPreset.midtones ?? 0, portraitSensitive ? 14 : 8);
    nextPreset.highlights = Math.max(nextPreset.highlights ?? 0, 5);
    if (profile.noiseRisk) {
      nextPreset.grain = Math.min(nextPreset.grain, portraitSensitive ? 10 : 18);
      nextPreset.artifactRemoval = Math.max(nextPreset.artifactRemoval ?? 0, portraitSensitive ? 10 : 6);
    }
  }

  if ((profile.brightScene || profile.highlightClipRisk) && !graphic) {
    nextPreset.highlights = Math.min(nextPreset.highlights ?? 0, 10);
    nextPreset.halation = Math.min(nextPreset.halation, preset.previewTone === 'film' ? 16 : 10);
    nextPreset.glowUp = Math.min(nextPreset.glowUp ?? 0, 12);
  }

  if (profile.mutedScene && preset.previewTone !== 'graphic' && preset.previewTone !== 'experimental') {
    nextPreset.saturation = Math.min(nextPreset.saturation + (preset.family === 'social' ? 8 : 5), preset.skinSafe ? 122 : 136);
  }

  if (profile.saturatedScene && !graphic) {
    nextPreset.saturation = Math.min(nextPreset.saturation, preset.skinSafe ? 112 : 124);
  }

  if (preset.family === 'product' || profile.productLikely) {
    nextPreset.skinSmoothing = 0;
    nextPreset.beautyBoost = 0;
    nextPreset.skinPolish = 0;
    nextPreset.faceSlimming = 0;
    nextPreset.makeupStrength = 0;
    nextPreset.clarity = Math.max(nextPreset.clarity ?? 0, 18);
    nextPreset.grain = Math.min(nextPreset.grain, 8);
    nextPreset.saturation = clampNumber(nextPreset.saturation, 90, 124);
  }

  if (preset.family === 'film' && !graphic) {
    nextPreset.halation = clampNumber(nextPreset.halation, 4, profile.highlightClipRisk ? 14 : 22);
    nextPreset.grain = clampNumber(nextPreset.grain, 8, profile.noiseRisk ? 24 : 42);
    nextPreset.saturation = clampNumber(nextPreset.saturation, 75, preset.skinSafe ? 122 : 132);
  }

  return nextPreset;
};

export const adaptPresetToImage = (preset: Preset, img: HTMLImageElement): Preset => {
  const profile = sampleImageAestheticProfile(img);
  if (!profile) return preset;
  return adaptPresetToAestheticProfile(preset, profile);
};

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

export const computeAutoTone = (img: HTMLImageElement): AutoToneResult => {
  const profile = sampleImageAestheticProfile(img);
  if (!profile) {
    return {
      shadowCrush: 20,
      midtones: 0,
      highlights: 0,
      saturation: 100,
      monochrome: false,
      hueShift: 0,
      colorKnockout: 'none',
      gradientMap: 'none'
    };
  }

  let shadowCrush = 22;
  let midtones = 6;
  let highlights = 6;
  let saturation = 104;

  if (profile.darkScene) {
    shadowCrush = 4;
    midtones = 18;
    highlights = 7;
  } else if (profile.brightScene) {
    shadowCrush = 24;
    midtones = 2;
    highlights = 4;
  }

  if (profile.lowContrastScene) {
    shadowCrush += 18;
    highlights += 8;
  }
  if (profile.highlightClipRisk) highlights = Math.min(highlights, 6);
  if (profile.shadowClipRisk) shadowCrush = Math.max(0, shadowCrush - 10);
  if (profile.mutedScene) saturation = 124;
  if (profile.saturatedScene || profile.redCastRisk || profile.greenCastRisk) saturation = 92;
  if (profile.skinRisk) saturation = clampNumber(saturation, 94, 112);

  return {
    shadowCrush: clampNumber(shadowCrush, 0, 72),
    midtones: clampNumber(midtones, -8, 24),
    highlights: clampNumber(highlights, 0, 18),
    saturation: clampNumber(saturation, 80, 132),
    monochrome: false,
    hueShift: 0,
    colorKnockout: 'none',
    gradientMap: 'none'
  };
};
