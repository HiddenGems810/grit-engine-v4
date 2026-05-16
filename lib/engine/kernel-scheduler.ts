import type { PixelKernelId, PixelKernelSettingsMap } from './pixel-kernels';
import type { KernelRunRequest, KernelRunResult, KernelWorkerClient } from './kernel-worker-client';

export interface ScheduledKernelJob<TKernelId extends PixelKernelId = PixelKernelId> extends KernelRunRequest<TKernelId> {
  debounceMs?: number;
}

export interface ScheduledKernelResult extends KernelRunResult {
  stale: boolean;
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  if (ms <= 0) {
    resolve();
    return;
  }
  const timeoutId = setTimeout(resolve, ms);
  const abortHandler = () => {
    clearTimeout(timeoutId);
    reject(new DOMException('Kernel job aborted.', 'AbortError'));
  };
  signal?.addEventListener('abort', abortHandler, { once: true });
});

export class KernelScheduler {
  private latestPreviewRequestId = 0;
  private latestExportRequestId = 0;
  private previewAbortController: AbortController | null = null;

  constructor(private readonly client: Pick<KernelWorkerClient, 'runKernel' | 'close'>) {}

  async schedule<TKernelId extends PixelKernelId>(job: ScheduledKernelJob<TKernelId>): Promise<ScheduledKernelResult> {
    if (job.priority === 'export') {
      this.latestExportRequestId = Math.max(this.latestExportRequestId, job.requestId);
      this.previewAbortController?.abort();
      this.previewAbortController = null;
      const result = await this.client.runKernel(job);
      return {
        ...result,
        stale: job.requestId < this.latestExportRequestId
      };
    }

    this.latestPreviewRequestId = Math.max(this.latestPreviewRequestId, job.requestId);
    this.previewAbortController?.abort();
    const abortController = new AbortController();
    this.previewAbortController = abortController;

    try {
      await wait(job.debounceMs ?? (job.quality === 'fast-preview' ? 45 : 0), abortController.signal);
      if (job.requestId !== this.latestPreviewRequestId || this.latestExportRequestId > job.requestId) {
        return {
          output: { width: job.input.width, height: job.input.height, data: new Uint8ClampedArray(job.input.width * job.input.height * 4) },
          meta: { backend: 'typescript', elapsedMs: 0, fallbackUsed: true, warnings: ['Preview job superseded before execution'] },
          stale: true
        };
      }

      const request = {
        ...job,
        signal: abortController.signal
      } as KernelRunRequest<TKernelId>;
      const result = await this.client.runKernel(request);
      return {
        ...result,
        stale: job.requestId !== this.latestPreviewRequestId || this.latestExportRequestId > job.requestId
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return {
          output: { width: job.input.width, height: job.input.height, data: new Uint8ClampedArray(job.input.width * job.input.height * 4) },
          meta: { backend: 'typescript', elapsedMs: 0, fallbackUsed: true, warnings: ['Preview job aborted'] },
          stale: true
        };
      }
      throw error;
    }
  }

  async run<TKernelId extends PixelKernelId>(
    kernelId: TKernelId,
    input: KernelRunRequest<TKernelId>['input'],
    settings: PixelKernelSettingsMap[TKernelId],
    options: Pick<ScheduledKernelJob<TKernelId>, 'requestId' | 'priority' | 'quality' | 'debounceMs'>
  ) {
    return this.schedule({
      ...options,
      kernelId,
      input,
      settings
    });
  }

  close() {
    this.previewAbortController?.abort();
    this.previewAbortController = null;
    this.client.close();
  }
}
