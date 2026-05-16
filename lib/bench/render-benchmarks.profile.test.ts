import { describe, it, vi } from 'vitest';
import { runRenderBenchmarks } from './render-benchmarks';

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

describe.skipIf(process.env.FORMAT_BENCHMARK_PROFILE !== '1')('render benchmark profile', () => {
  it('prints decision-grade kernel timings for local profiling', async () => {
    const results = await runRenderBenchmarks({
      sizes: [
        { label: '512px preview', width: 512, height: 512 },
        { label: '1024px preview', width: 1024, height: 1024 },
        { label: '1600px preview', width: 1600, height: 1600 }
      ],
      iterations: 2,
      includeCanvasKernels: false
    });

    for (const result of results) {
      console.log(`${result.sizeLabel}\t${result.kernelId}\tavg=${result.averageMs.toFixed(2)}ms\tmax=${result.maxMs.toFixed(2)}ms\tmem=${result.memoryRisk}\trec=${result.recommendation}`);
    }
  });
});
