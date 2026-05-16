export const BYTES_PER_RGBA_PIXEL = 4;
export const PREVIEW_UPSCALE_MEMORY_LIMIT_BYTES = 256 * 1024 * 1024;
export const EXPORT_UPSCALE_MEMORY_LIMIT_BYTES = 768 * 1024 * 1024;

type UpscaleMemoryInput = {
  width: number;
  height: number;
  scaleFactor: number;
  workingSurfaces?: number;
};

export type UpscaleMemoryBudgetInput = UpscaleMemoryInput & {
  limitBytes: number;
};

export type UpscaleMemoryBudgetResult = {
  ok: boolean;
  estimatedBytes: number;
  limitBytes: number;
  outputWidth: number;
  outputHeight: number;
  reason: string | null;
};

const safeDimension = (value: number) => Math.max(1, Math.floor(Number.isFinite(value) ? value : 1));
const safeScale = (value: number) => Math.max(1, Number.isFinite(value) ? value : 1);

export const estimateUpscaleMemoryBytes = ({
  width,
  height,
  scaleFactor,
  workingSurfaces = 4
}: UpscaleMemoryInput) => {
  const sourceWidth = safeDimension(width);
  const sourceHeight = safeDimension(height);
  const scale = safeScale(scaleFactor);
  const outputWidth = Math.max(1, Math.round(sourceWidth * scale));
  const outputHeight = Math.max(1, Math.round(sourceHeight * scale));
  const sourceBytes = sourceWidth * sourceHeight * BYTES_PER_RGBA_PIXEL;
  const outputBytes = outputWidth * outputHeight * BYTES_PER_RGBA_PIXEL;

  return sourceBytes + outputBytes * Math.max(1, workingSurfaces);
};

export const validateUpscaleMemoryBudget = ({
  width,
  height,
  scaleFactor,
  workingSurfaces,
  limitBytes
}: UpscaleMemoryBudgetInput): UpscaleMemoryBudgetResult => {
  const outputWidth = Math.max(1, Math.round(safeDimension(width) * safeScale(scaleFactor)));
  const outputHeight = Math.max(1, Math.round(safeDimension(height) * safeScale(scaleFactor)));
  const estimatedBytes = estimateUpscaleMemoryBytes({ width, height, scaleFactor, workingSurfaces });
  const safeLimit = Math.max(1, Math.floor(Number.isFinite(limitBytes) ? limitBytes : 1));
  const ok = estimatedBytes <= safeLimit;

  return {
    ok,
    estimatedBytes,
    limitBytes: safeLimit,
    outputWidth,
    outputHeight,
    reason: ok
      ? null
      : `Upscale requires approximately ${Math.ceil(estimatedBytes / 1024 / 1024)} MB of canvas memory.`
  };
};
