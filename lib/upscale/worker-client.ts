'use client';

import { upscaleImageData } from '@/lib/upscale/core';
import { ResolvedUpscaleSettings } from '@/lib/upscale/types';

type WorkerResolver = {
  resolve: (imageData: ImageData) => void;
  reject: (error: Error) => void;
  timeoutId: ReturnType<typeof setTimeout>;
};

type UpscaleWorkerResponse = {
  id: number;
  imageData?: ImageData;
  error?: string;
};

let workerInstance: Worker | null = null;
let requestId = 0;
const pendingRequests = new Map<number, WorkerResolver>();
const WORKER_REQUEST_TIMEOUT_MS = 45_000;

const canUseWorker = () => typeof Worker !== 'undefined';

const getWorker = () => {
  if (!canUseWorker()) return null;
  if (workerInstance) return workerInstance;

  workerInstance = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  workerInstance.onmessage = (event: MessageEvent<UpscaleWorkerResponse>) => {
    const pending = pendingRequests.get(event.data.id);
    if (!pending) return;
    pendingRequests.delete(event.data.id);
    clearTimeout(pending.timeoutId);

    if (event.data.error || !event.data.imageData) {
      pending.reject(new Error(event.data.error ?? 'Upscale worker failed.'));
      return;
    }

    pending.resolve(event.data.imageData);
  };
  workerInstance.onerror = () => {
    pendingRequests.forEach(({ reject, timeoutId }) => {
      clearTimeout(timeoutId);
      reject(new Error('Upscale worker crashed.'));
    });
    pendingRequests.clear();
    workerInstance?.terminate();
    workerInstance = null;
  };

  return workerInstance;
};

export const upscaleImageDataWithWorker = async (imageData: ImageData, settings: ResolvedUpscaleSettings) => {
  const worker = getWorker();
  if (!worker) {
    return upscaleImageData(imageData, settings);
  }

  return await new Promise<ImageData>((resolve, reject) => {
    const id = ++requestId;
    const timeoutId = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error('Upscale worker timed out.'));
    }, WORKER_REQUEST_TIMEOUT_MS);

    pendingRequests.set(id, { resolve, reject, timeoutId });

    try {
      worker.postMessage({ id, imageData, settings });
    } catch (error) {
      const pending = pendingRequests.get(id);
      if (pending) {
        clearTimeout(pending.timeoutId);
        pendingRequests.delete(id);
      }
      reject(error instanceof Error ? error : new Error('Unable to post upscale job to worker.'));
    }
  }).catch(() => upscaleImageData(imageData, settings));
};
