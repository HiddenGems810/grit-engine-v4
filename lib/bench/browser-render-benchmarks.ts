import { estimateKernelMemoryRisk } from './render-benchmarks';
import { createSyntheticKernelInput, runTypeScriptKernelById, type PixelKernelId } from '@/lib/engine/pixel-kernels';
import { createKernelWorkerClient } from '@/lib/engine/kernel-worker-client';
import { KernelScheduler } from '@/lib/engine/kernel-scheduler';
import type { KernelBackend } from '@/lib/engine/kernel-types';

export type BrowserBenchmarkSize = {
  label: string;
  width: number;
  height: number;
};

export type BrowserBenchmarkPlanItem = {
  backend: Extract<KernelBackend, 'typescript' | 'worker'>;
  kernelId: PixelKernelId;
  size: BrowserBenchmarkSize;
};

export type BrowserBenchmarkResult = BrowserBenchmarkPlanItem & {
  elapsedMs: number;
  transferOverheadMs: number;
  memoryRisk: 'low' | 'medium' | 'high';
  fallbackUsed: boolean;
  warnings: string[];
};

const kernelCases = [
  { kernelId: 'ordered-dither' as const, settings: { strength: 80, outputBitDepth: 1 as const } },
  { kernelId: 'error-diffusion' as const, settings: { strength: 72 } },
  { kernelId: 'film-emulsion' as const, settings: { profile: 'fine-35mm' as const, strength: 42, portraitSafe: true } },
  { kernelId: 'material-noise' as const, settings: { materialId: 'cold-press-paper', strength: 48 } }
];

export const buildBrowserRenderBenchmarkPlan = (
  sizes: BrowserBenchmarkSize[] = [
    { label: '512px preview', width: 512, height: 512 },
    { label: '1024px preview', width: 1024, height: 1024 },
    { label: '1600px preview', width: 1600, height: 1600 }
  ]
): BrowserBenchmarkPlanItem[] => sizes.flatMap((size) => kernelCases.flatMap((kernelCase) => [
  { backend: 'typescript' as const, kernelId: kernelCase.kernelId, size },
  { backend: 'worker' as const, kernelId: kernelCase.kernelId, size }
]));

export const runBrowserRenderBenchmarks = async (
  sizes?: BrowserBenchmarkSize[]
): Promise<BrowserBenchmarkResult[]> => {
  const workerClient = createKernelWorkerClient();
  const scheduler = new KernelScheduler(workerClient);
  const plan = buildBrowserRenderBenchmarkPlan(sizes);
  const results: BrowserBenchmarkResult[] = [];

  for (const item of plan) {
    const input = createSyntheticKernelInput(item.size.width, item.size.height, item.size.width + item.size.height);
    const memory = estimateKernelMemoryRisk(item.size.width, item.size.height);
    const kernelCase = kernelCases.find((candidate) => candidate.kernelId === item.kernelId)!;

    if (item.backend === 'typescript') {
      const startedAt = performance.now();
      await runTypeScriptKernelById(item.kernelId, input, kernelCase.settings);
      results.push({
        ...item,
        elapsedMs: Math.max(0, performance.now() - startedAt),
        transferOverheadMs: 0,
        memoryRisk: memory.risk,
        fallbackUsed: false,
        warnings: []
      });
      continue;
    }

    const transferStart = performance.now();
    const result = await scheduler.schedule({
      requestId: transferStart,
      kernelId: item.kernelId,
      input,
      settings: kernelCase.settings,
      priority: 'preview',
      quality: 'full-preview'
    });
    results.push({
      ...item,
      elapsedMs: result.meta.elapsedMs,
      transferOverheadMs: Math.max(0, performance.now() - transferStart - result.meta.elapsedMs),
      memoryRisk: memory.risk,
      fallbackUsed: result.meta.fallbackUsed,
      warnings: result.meta.warnings
    });
  }

  scheduler.close();
  return results;
};

export const summarizeBrowserBenchmarkResults = (results: BrowserBenchmarkResult[]) => {
  const fastestBackendByKernel: Record<string, KernelBackend> = {};
  let workerWins = 0;
  let typescriptWins = 0;
  const grouped = new Map<string, BrowserBenchmarkResult[]>();

  for (const result of results) {
    const key = `${result.kernelId}:${result.size.label}`;
    grouped.set(key, [...(grouped.get(key) ?? []), result]);
  }

  for (const [key, group] of grouped) {
    const fastest = [...group].sort((a, b) => a.elapsedMs - b.elapsedMs)[0];
    fastestBackendByKernel[key] = fastest.backend;
    if (fastest.backend === 'worker') workerWins += 1;
    if (fastest.backend === 'typescript') typescriptWins += 1;
  }

  return {
    fastestBackendByKernel,
    workerWins,
    typescriptWins
  };
};
