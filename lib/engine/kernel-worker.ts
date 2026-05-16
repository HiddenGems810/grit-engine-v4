import { runTypeScriptKernelById, type PixelKernelId, type PixelKernelSettingsMap } from './pixel-kernels';
import type { PixelKernelInput } from './kernel-types';
import type { KernelPriority, KernelQuality } from './kernel-worker-client';

type KernelWorkerRequest<TKernelId extends PixelKernelId = PixelKernelId> = {
  type: 'run';
  requestId: number;
  kernelId: TKernelId;
  input: PixelKernelInput;
  settings: PixelKernelSettingsMap[TKernelId];
  priority: KernelPriority;
  quality?: KernelQuality;
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
type WorkerScope = {
  onmessage: ((event: MessageEvent<KernelWorkerRequest>) => void | Promise<void>) | null;
  postMessage: (message: unknown, transfer?: Transferable[]) => void;
};
const workerScope = self as unknown as WorkerScope;

workerScope.onmessage = async (event: MessageEvent<KernelWorkerRequest>) => {
  const message = event.data;
  if (!message || message.type !== 'run') return;

  const startedAt = now();
  try {
    const output = await runTypeScriptKernelById(message.kernelId, message.input, message.settings);
    workerScope.postMessage({
      type: 'complete',
      requestId: message.requestId,
      output,
      elapsedMs: Math.max(0, now() - startedAt)
    }, [output.data.buffer as ArrayBuffer]);
  } catch (error) {
    workerScope.postMessage({
      type: 'error',
      requestId: message.requestId,
      error: error instanceof Error ? error.message : 'Kernel worker failed'
    });
  }
};

export {};
