'use client';

import { ChangeEvent, FormEvent, RefObject, useCallback } from 'react';
import { EngineSnapshot, createNeutralSnapshot } from '@/lib/editor-config';
import { validateCanvasCapability } from '@/lib/browser/capabilities';

const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIDE = 8192;
const MAX_IMAGE_BYTES = 50 * 1024 * 1024;

type ImageWorkspaceOptions = {
  originalImageRef: RefObject<HTMLImageElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  renderSurfaceRef: RefObject<HTMLCanvasElement | null>;
  setImageSrc: (value: string | null) => void;
  setPreviewImageSrc: (value: string | null) => void;
  setSourceImageSize: (value: { width: number; height: number }) => void;
  setWorkspaceNotice: (value: string | null) => void;
  setImageReady: (value: number) => void;
  setIsFocusMode: (value: boolean) => void;
  setRenderRevision: (value: number) => void;
  setIsUpscalePreviewing: (value: boolean) => void;
  setUpscaleFallbackNotice: (value: boolean) => void;
  setIsProcessing: (value: boolean) => void;
  setPortraitSuppressed: (value: boolean) => void;
  applySnapshot: (snapshot: EngineSnapshot) => void;
  resetUpscaleControls: () => void;
  clearPendingHistoryMeta: () => void;
  buildExportCanvas: () => Promise<HTMLCanvasElement | null>;
  upscaleEnabled: boolean;
  upscaleScaleFactor: number;
};

const canvasToBlob = (canvas: HTMLCanvasElement, format: 'png' | 'jpeg') => new Promise<Blob>((resolve, reject) => {
  canvas.toBlob(
    (blob) => {
      if (!blob) {
        reject(new Error('Canvas export returned an empty blob.'));
        return;
      }

      resolve(blob);
    },
    `image/${format}`,
    format === 'jpeg' ? 0.95 : undefined
  );
});

export const useImageWorkspace = ({
  originalImageRef,
  canvasRef,
  renderSurfaceRef,
  setImageSrc,
  setPreviewImageSrc,
  setSourceImageSize,
  setWorkspaceNotice,
  setImageReady,
  setIsFocusMode,
  setRenderRevision,
  setIsUpscalePreviewing,
  setUpscaleFallbackNotice,
  setIsProcessing,
  setPortraitSuppressed,
  applySnapshot,
  resetUpscaleControls,
  clearPendingHistoryMeta,
  buildExportCanvas,
  upscaleEnabled,
  upscaleScaleFactor
}: ImageWorkspaceOptions) => {
  const handleImageUpload = useCallback((e: ChangeEvent<HTMLInputElement> | FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setWorkspaceNotice(null);

    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      setWorkspaceNotice('Use a JPG, PNG, or WebP image. SVG and other formats are blocked for export safety.');
      input.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setWorkspaceNotice('This file is over 50 MB. Use an optimized source file for stable browser rendering.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new globalThis.Image();

      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const canvasCapability = validateCanvasCapability(width, height, {
          maxCanvasSide: MAX_IMAGE_SIDE,
          maxCanvasPixels: MAX_IMAGE_SIDE * MAX_IMAGE_SIDE
        });

        if (!canvasCapability.ok) {
          setWorkspaceNotice(canvasCapability.reason ?? 'This image exceeds the safe browser canvas limit.');
          input.value = '';
          return;
        }

        applySnapshot(createNeutralSnapshot());
        resetUpscaleControls();
        clearPendingHistoryMeta();
        originalImageRef.current = img;
        setPortraitSuppressed(false);
        setPreviewImageSrc(src);
        setSourceImageSize({ width, height });
        setImageSrc(src);
        setImageReady(Date.now());
        setIsFocusMode(false);
        setWorkspaceNotice(`Loaded ${file.name} (${width}x${height}).`);
      };

      img.onerror = () => {
        setWorkspaceNotice('The image could not be decoded. Try a standard JPG, PNG, or WebP export.');
        input.value = '';
      };

      img.src = src;
    };

    reader.onerror = () => {
      setWorkspaceNotice('The image could not be read by the browser.');
      input.value = '';
    };

    reader.readAsDataURL(file);
  }, [applySnapshot, clearPendingHistoryMeta, originalImageRef, resetUpscaleControls, setImageReady, setImageSrc, setIsFocusMode, setPortraitSuppressed, setPreviewImageSrc, setSourceImageSize, setWorkspaceNotice]);

  const handleRemoveImage = useCallback(() => {
    setImageSrc(null);
    setPreviewImageSrc(null);
    setWorkspaceNotice(null);
    setImageReady(0);
    setIsFocusMode(false);
    setRenderRevision(0);
    setIsUpscalePreviewing(false);
    setUpscaleFallbackNotice(false);
    setPortraitSuppressed(false);

    if (originalImageRef.current) {
      originalImageRef.current = null;
      setSourceImageSize({ width: 0, height: 0 });
    }

    if (canvasRef.current) {
      const previewCtx = canvasRef.current.getContext('2d');
      previewCtx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      canvasRef.current.width = 0;
      canvasRef.current.height = 0;
    }

    if (renderSurfaceRef.current) {
      const renderCtx = renderSurfaceRef.current.getContext('2d');
      renderCtx?.clearRect(0, 0, renderSurfaceRef.current.width, renderSurfaceRef.current.height);
      renderSurfaceRef.current.width = 0;
      renderSurfaceRef.current.height = 0;
    }
  }, [canvasRef, originalImageRef, renderSurfaceRef, setImageReady, setImageSrc, setIsFocusMode, setIsUpscalePreviewing, setPortraitSuppressed, setPreviewImageSrc, setRenderRevision, setSourceImageSize, setUpscaleFallbackNotice, setWorkspaceNotice]);

  const exportImage = useCallback(async (format: 'png' | 'jpeg') => {
    if (!renderSurfaceRef.current) {
      setWorkspaceNotice('Import an image before rendering an output.');
      return;
    }

    setIsProcessing(true);
    setWorkspaceNotice(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const outputCanvas = await buildExportCanvas();
      if (!outputCanvas) {
        setWorkspaceNotice('No render surface is available yet. Wait for the preview to finish and try again.');
        return;
      }

      const blob = await canvasToBlob(outputCanvas, format);
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const upscaleSuffix = upscaleEnabled ? `-${upscaleScaleFactor.toFixed(2).replace(/\.00$/, '').replace('.', '_')}x` : '';
      link.download = `format-system-04${upscaleSuffix}.${format}`;
      link.href = objectUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
      setWorkspaceNotice(`Rendered ${format.toUpperCase()} output.`);
    } catch (error) {
      console.warn('Export failed.', error);
      setWorkspaceNotice('Export failed. Try lowering upscale size or clearing Texture Surface before rendering again.');
    } finally {
      setIsProcessing(false);
    }
  }, [buildExportCanvas, renderSurfaceRef, setIsProcessing, setWorkspaceNotice, upscaleEnabled, upscaleScaleFactor]);

  return {
    exportImage,
    handleImageUpload,
    handleRemoveImage
  };
};
