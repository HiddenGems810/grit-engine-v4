'use client';

import { RefObject, useEffect } from 'react';
import { drawCanvasToPreview } from '@/lib/engine/canvas-utils';
import { PREVIEW_UPSCALE_MEMORY_LIMIT_BYTES, validateUpscaleMemoryBudget } from '@/lib/upscale/memory';
import type { UpscaleSettings } from '@/lib/upscale/types';

type UseUpscalePreviewOptions = {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  renderSurfaceRef: RefObject<HTMLCanvasElement | null>;
  imageSrc: string | null;
  renderRevision: number;
  upscaleEnabled: boolean;
  isSliderInteracting: boolean;
  previewUpscaleSettings: UpscaleSettings;
  requestRef: RefObject<number>;
  setIsUpscalePreviewing: (value: boolean) => void;
  setUpscaleFallbackNotice: (value: boolean) => void;
};

export const useUpscalePreview = ({
  canvasRef,
  renderSurfaceRef,
  imageSrc,
  renderRevision,
  upscaleEnabled,
  isSliderInteracting,
  previewUpscaleSettings,
  requestRef,
  setIsUpscalePreviewing,
  setUpscaleFallbackNotice
}: UseUpscalePreviewOptions) => {
  useEffect(() => {
    const previewCanvas = canvasRef.current;
    const renderSurface = renderSurfaceRef.current;

    if (!previewCanvas || !renderSurface || !imageSrc) {
      return;
    }

    if (!upscaleEnabled || isSliderInteracting) {
      drawCanvasToPreview(renderSurface, previewCanvas);
      queueMicrotask(() => {
        setIsUpscalePreviewing(false);
        if (!upscaleEnabled) {
          setUpscaleFallbackNotice(false);
        }
      });
      return;
    }

    let active = true;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const memoryCheck = validateUpscaleMemoryBudget({
      width: renderSurface.width,
      height: renderSurface.height,
      scaleFactor: previewUpscaleSettings.scaleFactor,
      limitBytes: PREVIEW_UPSCALE_MEMORY_LIMIT_BYTES
    });

    if (!memoryCheck.ok) {
      drawCanvasToPreview(renderSurface, previewCanvas);
      queueMicrotask(() => {
        setIsUpscalePreviewing(false);
        setUpscaleFallbackNotice(true);
      });
      return;
    }

    const previewTimer = setTimeout(() => {
      if (!active || requestId !== requestRef.current) return;
      setIsUpscalePreviewing(true);

      void (async () => {
        try {
          const { upscaleCanvas } = await import('@/lib/upscale/engine');
          const upscaledCanvas = await upscaleCanvas(renderSurface, previewUpscaleSettings);
          if (!active || requestId !== requestRef.current) return;
          drawCanvasToPreview(upscaledCanvas, previewCanvas);
          setUpscaleFallbackNotice(false);
        } catch (error) {
          if (!active || requestId !== requestRef.current) return;
          console.warn('Upscale preview failed, using base render.', error);
          drawCanvasToPreview(renderSurface, previewCanvas);
          setUpscaleFallbackNotice(true);
        } finally {
          if (active && requestId === requestRef.current) {
            setIsUpscalePreviewing(false);
          }
        }
      })();
    }, 220);

    return () => {
      active = false;
      clearTimeout(previewTimer);
    };
  }, [canvasRef, imageSrc, isSliderInteracting, previewUpscaleSettings, renderRevision, renderSurfaceRef, requestRef, setIsUpscalePreviewing, setUpscaleFallbackNotice, upscaleEnabled]);
};
