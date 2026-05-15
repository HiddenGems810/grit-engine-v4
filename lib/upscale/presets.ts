import { ResolvedUpscaleSettings, UpscaleContentProfileDescriptor, UpscaleModeDescriptor, UpscaleSettings, UpscaleTuningPreset, UpscaleTuningPresetDescriptor } from '@/lib/upscale/types';

export const UPSCALE_MODE_PRESETS: UpscaleModeDescriptor[] = [
  {
    id: 'balanced',
    label: 'Balanced',
    description: 'General purpose upscale with restrained edge lift.',
    detailBias: 1,
    edgeBias: 1,
    antiHaloBias: 1
  },
  {
    id: 'edge-fidelity',
    label: 'Edge Fidelity',
    description: 'Crisper contours with tighter edge protection.',
    detailBias: 1.12,
    edgeBias: 1.18,
    antiHaloBias: 1.08
  },
  {
    id: 'natural',
    label: 'Natural',
    description: 'Gentle detail recovery tuned for realistic texture.',
    detailBias: 0.88,
    edgeBias: 0.94,
    antiHaloBias: 1.12
  },
  {
    id: 'soft',
    label: 'Soft Preserve',
    description: 'Low-halo upscale with minimal micro-contrast push.',
    detailBias: 0.72,
    edgeBias: 0.82,
    antiHaloBias: 1.2
  }
];

export const DEFAULT_UPSCALE_SETTINGS: UpscaleSettings = {
  enabled: false,
  scaleFactor: 2,
  modePreset: 'balanced',
  contentProfile: 'photo-general',
  detailRecovery: 46,
  edgeProtection: 62,
  antiHalo: 74
};

export const UPSCALE_CONTENT_PROFILES: UpscaleContentProfileDescriptor[] = [
  {
    id: 'photo-general',
    label: 'Photo General',
    description: 'Balanced natural detail for mixed photography.',
    detailBias: 1,
    edgeBias: 1,
    antiHaloBias: 1
  },
  {
    id: 'portrait',
    label: 'Portrait',
    description: 'Protects skin gradients while recovering facial detail.',
    detailBias: 0.9,
    edgeBias: 0.88,
    antiHaloBias: 1.18
  },
  {
    id: 'graphic',
    label: 'Graphic',
    description: 'Tighter contour hold for logos, UI, and hard edges.',
    detailBias: 1.16,
    edgeBias: 1.2,
    antiHaloBias: 0.96
  },
  {
    id: 'print',
    label: 'Print',
    description: 'Moderate sharpening tuned for raster export and layout work.',
    detailBias: 1.04,
    edgeBias: 1.06,
    antiHaloBias: 1.08
  }
];

export const UPSCALE_TUNING_PRESETS: UpscaleTuningPresetDescriptor[] = [
  {
    id: 'portrait-clean',
    label: 'Portrait Clean',
    description: 'Soft facial texture retention with stronger halo control.',
    modePreset: 'natural',
    contentProfile: 'portrait',
    detailRecovery: 28,
    edgeProtection: 82,
    antiHalo: 92
  },
  {
    id: 'graphic-crisp',
    label: 'Graphic Crisp',
    description: 'Sharper contour recovery for logos, UI, and typographic edges.',
    modePreset: 'edge-fidelity',
    contentProfile: 'graphic',
    detailRecovery: 46,
    edgeProtection: 74,
    antiHalo: 82
  },
  {
    id: 'print-safe',
    label: 'Print Safe',
    description: 'Controlled sharpening intended for cleaner raster output.',
    modePreset: 'balanced',
    contentProfile: 'print',
    detailRecovery: 38,
    edgeProtection: 78,
    antiHalo: 88
  }
];

export const applyUpscaleTuningPreset = (settings: UpscaleSettings, presetId: UpscaleTuningPreset): UpscaleSettings => {
  const preset = UPSCALE_TUNING_PRESETS.find((candidate) => candidate.id === presetId);
  if (!preset) {
    return settings;
  }

  return {
    ...settings,
    modePreset: preset.modePreset,
    contentProfile: preset.contentProfile,
    detailRecovery: preset.detailRecovery,
    edgeProtection: preset.edgeProtection,
    antiHalo: preset.antiHalo
  };
};

export const MAX_OUTPUT_EDGE = 6144;
export const TILE_TRIGGER_PIXELS = 9000000;
export const WORKER_TRIGGER_PIXELS = 3600000;
export const UPSCALE_TILE_SIZE = 1024;
export const UPSCALE_TILE_OVERLAP = 24;

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const resolveUpscaleSettings = (
  sourceWidth: number,
  sourceHeight: number,
  settings: UpscaleSettings
): ResolvedUpscaleSettings => {
  const preset = UPSCALE_MODE_PRESETS.find((candidate) => candidate.id === settings.modePreset) ?? UPSCALE_MODE_PRESETS[0];
  const profile = UPSCALE_CONTENT_PROFILES.find((candidate) => candidate.id === settings.contentProfile) ?? UPSCALE_CONTENT_PROFILES[0];
  const requestedScale = clampNumber(settings.scaleFactor, 1, 4);
  const requestedWidth = Math.max(1, Math.round(sourceWidth * requestedScale));
  const requestedHeight = Math.max(1, Math.round(sourceHeight * requestedScale));
  const longestEdge = Math.max(requestedWidth, requestedHeight);
  const safeScale = longestEdge > MAX_OUTPUT_EDGE ? MAX_OUTPUT_EDGE / longestEdge : 1;
  const outputWidth = Math.max(1, Math.round(requestedWidth * safeScale));
  const outputHeight = Math.max(1, Math.round(requestedHeight * safeScale));
  const outputPixels = outputWidth * outputHeight;
  const actualScaleX = outputWidth / Math.max(1, sourceWidth);
  const actualScaleY = outputHeight / Math.max(1, sourceHeight);

  return {
    ...settings,
    scaleFactor: requestedScale * safeScale,
    detailRecovery: clampNumber(settings.detailRecovery, 0, 100),
    edgeProtection: clampNumber(settings.edgeProtection, 0, 100),
    antiHalo: clampNumber(settings.antiHalo, 0, 100),
    sourceWidth,
    sourceHeight,
    outputWidth,
    outputHeight,
    detailStrength: (clampNumber(settings.detailRecovery, 0, 100) / 100) * preset.detailBias * profile.detailBias,
    edgeStrength: (clampNumber(settings.edgeProtection, 0, 100) / 100) * preset.edgeBias * profile.edgeBias,
    antiRingStrength: (clampNumber(settings.antiHalo, 0, 100) / 100) * preset.antiHaloBias * profile.antiHaloBias,
    actualScaleX,
    actualScaleY,
    useWorker: outputPixels >= WORKER_TRIGGER_PIXELS || requestedScale >= 3,
    useTiling: outputPixels >= TILE_TRIGGER_PIXELS || outputWidth > UPSCALE_TILE_SIZE * 2 || outputHeight > UPSCALE_TILE_SIZE * 2,
    tileSize: UPSCALE_TILE_SIZE,
    tileOverlap: UPSCALE_TILE_OVERLAP
  };
};
