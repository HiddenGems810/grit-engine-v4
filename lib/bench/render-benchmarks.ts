import { estimatePixelBytes, average, recommendBackend, type BenchmarkSize, type KernelBenchmarkResult } from './benchmark-utils';
import { createSyntheticKernelInput, runPixelKernelWithMeta, typescriptPixelKernels } from '@/lib/engine/pixel-kernels';

export interface RenderBenchmarkOptions {
  sizes?: BenchmarkSize[];
  iterations?: number;
  includeCanvasKernels?: boolean;
}

const defaultSizes: BenchmarkSize[] = [
  { label: '512px preview', width: 512, height: 512 },
  { label: '1024px preview', width: 1024, height: 1024 },
  { label: '1600px preview', width: 1600, height: 1600 },
  { label: '2048px export', width: 2048, height: 2048 }
];

export const estimateKernelMemoryRisk = (width: number, height: number) => {
  const estimatedBytes = estimatePixelBytes(width, height, 4);
  const risk = estimatedBytes > 384 * 1024 * 1024 ? 'high' : estimatedBytes > 96 * 1024 * 1024 ? 'medium' : 'low';
  return { estimatedBytes, risk } as const;
};

export const runRenderBenchmarks = async (options: RenderBenchmarkOptions = {}): Promise<KernelBenchmarkResult[]> => {
  const sizes = options.sizes ?? defaultSizes;
  const iterations = Math.max(1, Math.min(options.iterations ?? 3, 10));
  const cases = [
    {
      kernel: typescriptPixelKernels.orderedDither,
      settings: { strength: 80, outputBitDepth: 1 as const }
    },
    {
      kernel: typescriptPixelKernels.errorDiffusion,
      settings: { strength: 72 }
    },
    {
      kernel: typescriptPixelKernels.filmEmulsion,
      settings: { profile: 'fine-35mm' as const, strength: 42, portraitSafe: true }
    },
    {
      kernel: typescriptPixelKernels.materialNoise,
      settings: { materialId: 'cold-press-paper', strength: 48 }
    }
  ];

  const results: KernelBenchmarkResult[] = [];
  for (const size of sizes) {
    for (const benchmarkCase of cases) {
      const timings: number[] = [];
      for (let iteration = 0; iteration < iterations; iteration += 1) {
        const input = createSyntheticKernelInput(size.width, size.height, 1000 + iteration);
        const result = await runPixelKernelWithMeta(
          benchmarkCase.kernel,
          input,
          benchmarkCase.settings,
          'typescript'
        );
        timings.push(result.meta.elapsedMs);
      }
      const averageMs = average(timings);
      const maxMs = Math.max(...timings);
      const memory = estimateKernelMemoryRisk(size.width, size.height);
      const recommendation = recommendBackend(averageMs, maxMs, size.width);
      results.push({
        kernelId: benchmarkCase.kernel.id,
        sizeLabel: size.label,
        width: size.width,
        height: size.height,
        averageMs,
        maxMs,
        estimatedBytes: memory.estimatedBytes,
        memoryRisk: memory.risk,
        blocksUi: maxMs > 16,
        workerCandidate: recommendation === 'move-to-worker' || recommendation === 'wasm-candidate',
        wasmCandidate: recommendation === 'wasm-candidate',
        recommendation
      });
    }
  }

  return results;
};
