import { describe, expect, it, vi } from 'vitest';
import { createSyntheticKernelInput } from './pixel-kernels';
import { createKernelWorkerClient } from './kernel-worker-client';

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

vi.stubGlobal('ImageData', TestImageData);

type WorkerMessage = {
  requestId: number;
  kernelId: string;
  input: { width: number; height: number; data: Uint8ClampedArray; seed: number };
};

class EchoWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  transfers: Transferable[][] = [];

  postMessage(message: WorkerMessage, transfer: Transferable[]) {
    this.transfers.push(transfer);
    queueMicrotask(() => {
      this.onmessage?.({
        data: {
          type: 'complete',
          requestId: message.requestId,
          output: {
            width: message.input.width,
            height: message.input.height,
            data: message.input.data
          }
        }
      } as MessageEvent);
    });
  }

  terminate() {}
}

class CrashWorker extends EchoWorker {
  postMessage() {
    queueMicrotask(() => {
      this.onerror?.({ message: 'worker crashed' } as ErrorEvent);
    });
  }
}

describe('kernel worker client', () => {
  it('uses transferable buffers and returns worker output metadata', async () => {
    const worker = new EchoWorker();
    const client = createKernelWorkerClient({ createWorker: () => worker as unknown as Worker });
    const result = await client.runKernel({
      requestId: 1,
      kernelId: 'ordered-dither',
      input: createSyntheticKernelInput(6, 6, 10),
      settings: { strength: 60, outputBitDepth: 1 },
      priority: 'preview'
    });

    expect(result.output.width).toBe(6);
    expect(result.output.height).toBe(6);
    expect(result.meta.backend).toBe('worker');
    expect(result.meta.fallbackUsed).toBe(false);
    expect(worker.transfers[0]).toHaveLength(1);
  });

  it('falls back to TypeScript when Worker is unavailable', async () => {
    const client = createKernelWorkerClient({ createWorker: null });
    const result = await client.runKernel({
      requestId: 2,
      kernelId: 'film-emulsion',
      input: createSyntheticKernelInput(4, 4, 11),
      settings: { profile: 'fine-35mm', strength: 30, portraitSafe: true },
      priority: 'preview'
    });

    expect(result.output.width).toBe(4);
    expect(result.meta.backend).toBe('typescript');
    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.warnings[0]).toContain('Worker unavailable');
  });

  it('falls back to TypeScript after Worker failure without losing deterministic output', async () => {
    const client = createKernelWorkerClient({ createWorker: () => new CrashWorker() as unknown as Worker });
    const input = createSyntheticKernelInput(4, 4, 12);
    const result = await client.runKernel({
      requestId: 3,
      kernelId: 'ordered-dither',
      input,
      settings: { strength: 80, outputBitDepth: 1 },
      priority: 'preview'
    });

    expect(result.output.width).toBe(4);
    expect(result.meta.backend).toBe('typescript');
    expect(result.meta.fallbackUsed).toBe(true);
    expect(result.meta.warnings.join(' ')).toContain('worker crashed');
  });
});
