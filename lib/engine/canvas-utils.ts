/**
 * Grit Engine v4 — Canvas Utilities
 *
 * Pure canvas helper functions for copying, scaling, and blitting canvases.
 * These are decoupled from React state and work with raw HTMLCanvasElement.
 */

/**
 * Copy the contents of a source canvas to a target canvas.
 * Resizes the target to match the source dimensions.
 */
export const drawCanvasToPreview = (
  sourceCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement
): void => {
  if (!sourceCanvas || !targetCanvas) return;
  
  // Robust dimension check (handles 0, NaN, or negative if somehow possible)
  const sw = sourceCanvas.width;
  const sh = sourceCanvas.height;
  if (!(sw > 0 && sh > 0)) return;
  
  targetCanvas.width = sw;
  targetCanvas.height = sh;
  
  const tw = targetCanvas.width;
  const th = targetCanvas.height;
  if (!(tw > 0 && th > 0)) return;

  const previewCtx = targetCanvas.getContext('2d');
  if (!previewCtx) return;

  previewCtx.clearRect(0, 0, tw, th);
  previewCtx.imageSmoothingEnabled = true;
  previewCtx.imageSmoothingQuality = 'high';
  
  try {
    previewCtx.drawImage(sourceCanvas, 0, 0);
  } catch (e) {
    console.warn('Grit Engine: Failed to draw canvas to preview', e);
  }
};

