import { EXPORT_UPSCALE_MEMORY_LIMIT_BYTES, validateUpscaleMemoryBudget } from '@/lib/upscale/memory';

export type ExportAspectId = 'original' | '1:1' | '4:5' | '9:16' | '16:9' | '3:4';

export const CREATOR_EXPORT_ASPECTS: Array<{ id: ExportAspectId; label: string; ratio: number | null }> = [
  { id: 'original', label: 'Original Ratio', ratio: null },
  { id: '1:1', label: '1:1 Cover', ratio: 1 },
  { id: '4:5', label: '4:5 Post', ratio: 4 / 5 },
  { id: '9:16', label: '9:16 Story/Reel', ratio: 9 / 16 },
  { id: '16:9', label: '16:9 Thumbnail', ratio: 16 / 9 },
  { id: '3:4', label: '3:4 Portrait', ratio: 3 / 4 }
];

export type ExportQualityInfo = {
  sourceDimensions: { width: number; height: number };
  previewDimensions: { width: number; height: number };
  baseExportDimensions: { width: number; height: number };
  upscaledExportDimensions: { width: number; height: number };
  memoryState: 'safe' | 'reduced' | 'no-image';
  fallbackReason: string | null;
};

export const getAspectRatio = (aspect: ExportAspectId, fallbackWidth: number, fallbackHeight: number) => (
  CREATOR_EXPORT_ASPECTS.find((item) => item.id === aspect)?.ratio ?? fallbackWidth / Math.max(1, fallbackHeight)
);

export const computeAspectCrop = (width: number, height: number, aspect: ExportAspectId) => {
  const targetRatio = getAspectRatio(aspect, width, height);
  const currentRatio = width / Math.max(1, height);
  if (aspect === 'original' || Math.abs(targetRatio - currentRatio) < 0.001) {
    return { sx: 0, sy: 0, sw: width, sh: height, width, height };
  }
  if (currentRatio > targetRatio) {
    const sw = Math.round(height * targetRatio);
    return { sx: Math.floor((width - sw) / 2), sy: 0, sw, sh: height, width: sw, height };
  }
  const sh = Math.round(width / targetRatio);
  return { sx: 0, sy: Math.floor((height - sh) / 2), sw: width, sh, width, height: sh };
};

export const computeExportQualityInfo = ({
  sourceDimensions,
  previewDimensions,
  baseExportDimensions,
  upscaleEnabled,
  upscaleScaleFactor
}: {
  sourceDimensions: { width: number; height: number };
  previewDimensions: { width: number; height: number };
  baseExportDimensions: { width: number; height: number };
  upscaleEnabled: boolean;
  upscaleScaleFactor: number;
}): ExportQualityInfo => {
  if (sourceDimensions.width <= 0 || sourceDimensions.height <= 0) {
    return {
      sourceDimensions,
      previewDimensions,
      baseExportDimensions,
      upscaledExportDimensions: { width: 0, height: 0 },
      memoryState: 'no-image',
      fallbackReason: 'Import an image to calculate export quality.'
    };
  }

  const scaleFactor = upscaleEnabled ? upscaleScaleFactor : 1;
  const memoryCheck = validateUpscaleMemoryBudget({
    width: baseExportDimensions.width,
    height: baseExportDimensions.height,
    scaleFactor,
    limitBytes: EXPORT_UPSCALE_MEMORY_LIMIT_BYTES
  });

  return {
    sourceDimensions,
    previewDimensions,
    baseExportDimensions,
    upscaledExportDimensions: {
      width: Math.round(baseExportDimensions.width * scaleFactor),
      height: Math.round(baseExportDimensions.height * scaleFactor)
    },
    memoryState: memoryCheck.ok ? 'safe' : 'reduced',
    fallbackReason: memoryCheck.ok ? null : memoryCheck.reason
  };
};
