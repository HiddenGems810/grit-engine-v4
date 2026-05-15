import { upscaleImageData } from '@/lib/upscale/core';
import { ResolvedUpscaleSettings } from '@/lib/upscale/types';

type UpscaleWorkerRequest = {
  id: number;
  imageData: ImageData;
  settings: ResolvedUpscaleSettings;
};

type UpscaleWorkerResponse = {
  id: number;
  imageData?: ImageData;
  error?: string;
};

self.onmessage = (event: MessageEvent<UpscaleWorkerRequest>) => {
  const { id, imageData, settings } = event.data;

  try {
    const output = upscaleImageData(imageData, settings);
    const response: UpscaleWorkerResponse = { id, imageData: output };
    self.postMessage(response);
  } catch (error) {
    const response: UpscaleWorkerResponse = {
      id,
      error: error instanceof Error ? error.message : 'Unknown upscale worker error.'
    };
    self.postMessage(response);
  }
};

export {};
