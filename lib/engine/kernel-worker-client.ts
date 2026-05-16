import type { KernelBackend, KernelExecutionMeta, PixelKernelInput, PixelKernelOutput } from './kernel-types';
import { runTypeScriptKernelById, type PixelKernelId, type PixelKernelSettingsMap } from './pixel-kernels';

export type KernelPriority = 'preview' | 'export';
export type KernelQuality = 'fast-preview' | 'full-preview' | 'export';

export interface KernelRunRequest<TKernelId extends PixelKernelId = PixelKernelId> {
  requestId: number;
  kernelId: TKernelId;
  input: PixelKernelInput;
  settings: PixelKernelSettingsMap[TKernelId];
  priority: KernelPriority;
  quality?: KernelQuality;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface KernelRunResult {
  output: PixelKernelOutput;
  meta: KernelExecutionMeta;
}

type KernelWorkerResponse =
  | { type: 'complete'; requestId: number; output: PixelKernelOutput; elapsedMs?: number }
  | { type: 'error'; requestId: number; error: string };

type PendingRequest = {
  resolve: (value: KernelRunResult) => void;
  reject: (error: Error) => void;
  startedAt: number;
  timeoutId: ReturnType<typeof setTimeout> | null;
};

export interface KernelWorkerClient {
  runKernel: <TKernelId extends PixelKernelId>(request: KernelRunRequest<TKernelId>) => Promise<KernelRunResult>;
  close: () => void;
}

export interface KernelWorkerClientOptions {
  createWorker?: (() => Worker | null) | null;
  now?: () => number;
}

const defaultNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

const createDefaultWorker = (): Worker | null => {
  if (typeof Worker === 'undefined') return null;
  return new Worker(new URL('./kernel-worker.ts', import.meta.url), { type: 'module' });
};

const cloneInput = (input: PixelKernelInput): PixelKernelInput => ({
  width: input.width,
  height: input.height,
  seed: input.seed,
  data: new Uint8ClampedArray(input.data)
});

const runFallback = async <TKernelId extends PixelKernelId>(
  request: KernelRunRequest<TKernelId>,
  backend: KernelBackend,
  fallbackUsed: boolean,
  warnings: string[],
  now: () => number,
  fallbackInput?: PixelKernelInput
): Promise<KernelRunResult> => {
  const startedAt = now();
  const output = await runTypeScriptKernelById(request.kernelId, fallbackInput ?? cloneInput(request.input), request.settings);
  return {
    output,
    meta: {
      backend,
      elapsedMs: Math.max(0, now() - startedAt),
      fallbackUsed,
      warnings
    }
  };
};

export const createKernelWorkerClient = (options: KernelWorkerClientOptions = {}): KernelWorkerClient => {
  const now = options.now ?? defaultNow;
  const createWorker = options.createWorker === undefined ? createDefaultWorker : options.createWorker;
  let worker: Worker | null = null;
  let workerUnavailableReason: string | null = null;
  const pending = new Map<number, PendingRequest>();

  const ensureWorker = () => {
    if (worker || workerUnavailableReason) return worker;
    if (!createWorker) {
      workerUnavailableReason = 'Worker unavailable';
      return null;
    }

    try {
      const nextWorker = createWorker();
      if (!nextWorker) {
        workerUnavailableReason = 'Worker unavailable';
        return null;
      }
      worker = nextWorker;
      worker.onmessage = (event: MessageEvent<KernelWorkerResponse>) => {
        const message = event.data;
        const request = pending.get(message.requestId);
        if (!request) return;
        pending.delete(message.requestId);
        if (request.timeoutId) clearTimeout(request.timeoutId);

        if (message.type === 'error') {
          request.reject(new Error(message.error));
          return;
        }

        request.resolve({
          output: message.output,
          meta: {
            backend: 'worker',
            elapsedMs: message.elapsedMs ?? Math.max(0, now() - request.startedAt),
            fallbackUsed: false,
            warnings: []
          }
        });
      };
      worker.onerror = (event) => {
        const message = event.message || 'Worker failed';
        for (const request of pending.values()) {
          if (request.timeoutId) clearTimeout(request.timeoutId);
          request.reject(new Error(message));
        }
        pending.clear();
        worker?.terminate();
        worker = null;
        workerUnavailableReason = message;
      };
    } catch (error) {
      workerUnavailableReason = error instanceof Error ? error.message : 'Worker unavailable';
      worker = null;
    }

    return worker;
  };

  const runKernel = async <TKernelId extends PixelKernelId>(request: KernelRunRequest<TKernelId>): Promise<KernelRunResult> => {
    const fallbackInput = cloneInput(request.input);
    const currentWorker = ensureWorker();
    if (!currentWorker) {
      return runFallback(request, 'typescript', true, [workerUnavailableReason ?? 'Worker unavailable'], now, fallbackInput);
    }

    if (request.signal?.aborted) {
      throw new DOMException('Kernel job aborted.', 'AbortError');
    }

    try {
      return await new Promise<KernelRunResult>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          pending.delete(request.requestId);
          reject(new Error(`Worker kernel timed out: ${request.kernelId}`));
        }, request.timeoutMs ?? (request.priority === 'export' ? 12000 : 3500));

        const abortHandler = () => {
          pending.delete(request.requestId);
          clearTimeout(timeoutId);
          reject(new DOMException('Kernel job aborted.', 'AbortError'));
        };

        request.signal?.addEventListener('abort', abortHandler, { once: true });
        pending.set(request.requestId, {
          resolve: (value) => {
            request.signal?.removeEventListener('abort', abortHandler);
            resolve(value);
          },
          reject: (error) => {
            request.signal?.removeEventListener('abort', abortHandler);
            reject(error);
          },
          startedAt: now(),
          timeoutId
        });

        currentWorker.postMessage({
          type: 'run',
          requestId: request.requestId,
          kernelId: request.kernelId,
          input: request.input,
          settings: request.settings,
          priority: request.priority,
          quality: request.quality
        }, [request.input.data.buffer]);
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      const warning = error instanceof Error ? error.message : 'Worker failed';
      return runFallback(request, 'typescript', true, [warning], now, fallbackInput);
    }
  };

  return {
    runKernel,
    close: () => {
      for (const request of pending.values()) {
        if (request.timeoutId) clearTimeout(request.timeoutId);
        request.reject(new Error('Worker client closed'));
      }
      pending.clear();
      worker?.terminate();
      worker = null;
    }
  };
};
