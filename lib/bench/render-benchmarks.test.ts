import { describe, expect, it, vi } from 'vitest';
import { estimateKernelMemoryRisk, runRenderBenchmarks } from './render-benchmarks';

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

describe('render benchmark harness', () => {
  it('runs small synthetic kernel benchmarks and returns decision metadata', async () => {
    const results = await runRenderBenchmarks({
      sizes: [{ label: 'tiny', width: 16, height: 16 }],
      iterations: 2,
      includeCanvasKernels: false
    });

    if (process.env.FORMAT_BENCHMARK_LOG === '1') {
      console.table(results.map((result) => ({
        size: result.sizeLabel,
        kernel: result.kernelId,
        avg: result.averageMs.toFixed(2),
        max: result.maxMs.toFixed(2),
        memory: result.memoryRisk,
        recommendation: result.recommendation
      })));
    }

    expect(results.length).toBeGreaterThanOrEqual(4);
    expect(results.every((result) => result.averageMs >= 0 && result.maxMs >= 0)).toBe(true);
    expect(results.every((result) => ['stay-typescript', 'move-to-worker', 'wasm-candidate', 'webgpu-candidate', 'defer'].includes(result.recommendation))).toBe(true);
  });

  it('estimates memory risk from image dimensions', () => {
    expect(estimateKernelMemoryRisk(512, 512).risk).toBe('low');
    expect(estimateKernelMemoryRisk(4096, 4096).estimatedBytes).toBeGreaterThan(512 * 512 * 4);
  });
});
