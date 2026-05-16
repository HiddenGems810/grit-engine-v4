export type BrowserCapabilities = {
  webgl: boolean;
  worker: boolean;
  offscreenCanvas: boolean;
  maxCanvasPixels: number;
  maxCanvasSide: number;
  memoryLimitBytes: number;
  warnings: string[];
};

const DEFAULT_MAX_CANVAS_SIDE = 8192;
const DEFAULT_MAX_CANVAS_PIXELS = DEFAULT_MAX_CANVAS_SIDE * DEFAULT_MAX_CANVAS_SIDE;
const DEFAULT_MEMORY_LIMIT_BYTES = 768 * 1024 * 1024;

export const detectWebGLSupport = () => {
  if (typeof document === 'undefined') return false;

  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
};

export const detectBrowserCapabilities = (): BrowserCapabilities => {
  const worker = typeof Worker !== 'undefined';
  const offscreenCanvas = typeof OffscreenCanvas !== 'undefined';
  const webgl = detectWebGLSupport();
  const warnings: string[] = [];

  if (!webgl) {
    warnings.push('Face detection may be unavailable because WebGL is not supported.');
  }

  if (!worker) {
    warnings.push('Upscale jobs will run on the main thread because Web Workers are unavailable.');
  }

  return {
    webgl,
    worker,
    offscreenCanvas,
    maxCanvasPixels: DEFAULT_MAX_CANVAS_PIXELS,
    maxCanvasSide: DEFAULT_MAX_CANVAS_SIDE,
    memoryLimitBytes: DEFAULT_MEMORY_LIMIT_BYTES,
    warnings
  };
};

export const validateCanvasCapability = (
  width: number,
  height: number,
  capabilities: Pick<BrowserCapabilities, 'maxCanvasPixels' | 'maxCanvasSide'>
) => {
  const safeWidth = Math.max(0, Math.floor(Number.isFinite(width) ? width : 0));
  const safeHeight = Math.max(0, Math.floor(Number.isFinite(height) ? height : 0));

  if (safeWidth <= 0 || safeHeight <= 0) {
    return { ok: false, reason: 'Image dimensions are invalid.' };
  }

  if (safeWidth > capabilities.maxCanvasSide || safeHeight > capabilities.maxCanvasSide) {
    return {
      ok: false,
      reason: `Image exceeds the safe ${capabilities.maxCanvasSide}px browser canvas side limit.`
    };
  }

  if (safeWidth * safeHeight > capabilities.maxCanvasPixels) {
    return {
      ok: false,
      reason: 'Image exceeds the safe browser canvas pixel budget.'
    };
  }

  return { ok: true, reason: null };
};
