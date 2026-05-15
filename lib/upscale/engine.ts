'use client';

import { resolveUpscaleSettings } from '@/lib/upscale/presets';
import { upscaleImageData } from '@/lib/upscale/core';
import { UpscaleSettings } from '@/lib/upscale/types';

const createCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const cloneCanvas = (source: HTMLCanvasElement) => {
  const canvas = createCanvas(source.width, source.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Unable to create 2D canvas context.');
  }
  ctx.drawImage(source, 0, 0);
  return canvas;
};

export const upscaleCanvas = async (sourceCanvas: HTMLCanvasElement, settings: UpscaleSettings) => {
  if (!settings.enabled || settings.scaleFactor <= 1) {
    return cloneCanvas(sourceCanvas);
  }

  const sourceContext = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!sourceContext) {
    throw new Error('Unable to read source canvas.');
  }

  const resolved = resolveUpscaleSettings(sourceCanvas.width, sourceCanvas.height, settings);
  if (resolved.outputWidth === sourceCanvas.width && resolved.outputHeight === sourceCanvas.height) {
    return cloneCanvas(sourceCanvas);
  }

  const sourceImage = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const outputImage = resolved.useWorker
    ? await import('@/lib/upscale/worker-client').then(({ upscaleImageDataWithWorker }) => upscaleImageDataWithWorker(sourceImage, resolved))
    : upscaleImageData(sourceImage, resolved);
  const resultCanvas = createCanvas(outputImage.width, outputImage.height);
  const resultContext = resultCanvas.getContext('2d');

  if (!resultContext) {
    throw new Error('Unable to create output canvas.');
  }

  resultContext.putImageData(outputImage, 0, 0);
  return resultCanvas;
};
