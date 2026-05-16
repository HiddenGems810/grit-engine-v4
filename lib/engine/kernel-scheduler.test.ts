import { describe, expect, it } from 'vitest';
import { KernelScheduler } from './kernel-scheduler';
import { createSyntheticKernelInput } from './pixel-kernels';
import type { KernelRunRequest, KernelRunResult } from './kernel-worker-client';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });
  return { promise, resolve };
};

describe('kernel scheduler', () => {
  it('marks older preview jobs stale when newer preview jobs supersede them', async () => {
    const first = deferred<KernelRunResult>();
    const second = deferred<KernelRunResult>();
    const calls: KernelRunRequest[] = [];
    const scheduler = new KernelScheduler({
      runKernel: (request) => {
        calls.push(request);
        return calls.length === 1 ? first.promise : second.promise;
      },
      close: () => {}
    });

    const firstRun = scheduler.schedule({
      requestId: 1,
      kernelId: 'ordered-dither',
      input: createSyntheticKernelInput(2, 2, 1),
      settings: { strength: 50, outputBitDepth: 1 },
      priority: 'preview'
    });
    const secondRun = scheduler.schedule({
      requestId: 2,
      kernelId: 'ordered-dither',
      input: createSyntheticKernelInput(2, 2, 2),
      settings: { strength: 50, outputBitDepth: 1 },
      priority: 'preview'
    });

    first.resolve({
      output: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
      meta: { backend: 'worker', elapsedMs: 1, fallbackUsed: false, warnings: [] }
    });
    second.resolve({
      output: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
      meta: { backend: 'worker', elapsedMs: 1, fallbackUsed: false, warnings: [] }
    });

    expect((await firstRun).stale).toBe(true);
    expect((await secondRun).stale).toBe(false);
  });

  it('lets export jobs supersede active preview jobs', async () => {
    const preview = deferred<KernelRunResult>();
    const exportJob = deferred<KernelRunResult>();
    const calls: KernelRunRequest[] = [];
    const scheduler = new KernelScheduler({
      runKernel: (request) => {
        calls.push(request);
        return request.priority === 'export' ? exportJob.promise : preview.promise;
      },
      close: () => {}
    });

    const previewRun = scheduler.schedule({
      requestId: 10,
      kernelId: 'film-emulsion',
      input: createSyntheticKernelInput(2, 2, 10),
      settings: { profile: 'fine-35mm', strength: 40, portraitSafe: true },
      priority: 'preview'
    });
    const exportRun = scheduler.schedule({
      requestId: 11,
      kernelId: 'film-emulsion',
      input: createSyntheticKernelInput(2, 2, 11),
      settings: { profile: 'fine-35mm', strength: 40, portraitSafe: true },
      priority: 'export'
    });

    preview.resolve({
      output: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
      meta: { backend: 'worker', elapsedMs: 4, fallbackUsed: false, warnings: [] }
    });
    exportJob.resolve({
      output: { width: 2, height: 2, data: new Uint8ClampedArray(16) },
      meta: { backend: 'worker', elapsedMs: 4, fallbackUsed: false, warnings: [] }
    });

    expect((await previewRun).stale).toBe(true);
    expect((await exportRun).stale).toBe(false);
  });
});
