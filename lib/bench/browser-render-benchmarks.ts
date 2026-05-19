import { estimateKernelMemoryRisk } from './render-benchmarks';
import { createSyntheticKernelInput, runTypeScriptKernelById, type PixelKernelId } from '@/lib/engine/pixel-kernels';
import { createKernelWorkerClient } from '@/lib/engine/kernel-worker-client';
import { KernelScheduler } from '@/lib/engine/kernel-scheduler';
import type { KernelBackend } from '@/lib/engine/kernel-types';
import type { PixelKernelInput, PixelKernelOutput } from '@/lib/engine/kernel-types';

export type BrowserBenchmarkSize = {
  label: string;
  width: number;
  height: number;
};

export type BrowserBenchmarkPlanItem = {
  backend: Extract<KernelBackend, 'typescript' | 'worker'>;
  kernelId: PixelKernelId | 'material-stack';
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
  { kernelId: 'material-noise' as const, settings: { materialId: 'cold-press-paper', strength: 48 } },
  { kernelId: 'material-stack' as const, settings: null }
];

const outputToInput = (output: PixelKernelOutput, seed: number): PixelKernelInput => ({
  width: output.width,
  height: output.height,
  data: output.data,
  seed
});

const runTypeScriptMaterialStack = async (input: ReturnType<typeof createSyntheticKernelInput>) => {
  const filmOutput = await runTypeScriptKernelById('film-emulsion', input, { profile: 'fine-35mm', strength: 42, portraitSafe: true });
  const materialOutput = await runTypeScriptKernelById('material-noise', outputToInput(filmOutput, input.seed + 1), { materialId: 'cold-press-paper', strength: 48 });
  return runTypeScriptKernelById('ordered-dither', outputToInput(materialOutput, input.seed + 2), { strength: 28, outputBitDepth: 2 });
};

const runTypeScriptBenchmarkCase = async (kernelId: BrowserBenchmarkPlanItem['kernelId'], input: PixelKernelInput) => {
  switch (kernelId) {
    case 'ordered-dither':
      return runTypeScriptKernelById('ordered-dither', input, { strength: 80, outputBitDepth: 1 });
    case 'error-diffusion':
      return runTypeScriptKernelById('error-diffusion', input, { strength: 72 });
    case 'film-emulsion':
      return runTypeScriptKernelById('film-emulsion', input, { profile: 'fine-35mm', strength: 42, portraitSafe: true });
    case 'material-noise':
      return runTypeScriptKernelById('material-noise', input, { materialId: 'cold-press-paper', strength: 48 });
    case 'material-stack':
      return runTypeScriptMaterialStack(input);
  }
};

const scheduleWorkerBenchmarkCase = async (
  scheduler: KernelScheduler,
  item: BrowserBenchmarkPlanItem,
  input: PixelKernelInput,
  requestId: number
) => {
  switch (item.kernelId) {
    case 'ordered-dither':
      return scheduler.schedule({
        requestId,
        kernelId: 'ordered-dither',
        input,
        settings: { strength: 80, outputBitDepth: 1 },
        priority: 'preview',
        quality: 'full-preview'
      });
    case 'error-diffusion':
      return scheduler.schedule({
        requestId,
        kernelId: 'error-diffusion',
        input,
        settings: { strength: 72 },
        priority: 'preview',
        quality: 'full-preview'
      });
    case 'film-emulsion':
      return scheduler.schedule({
        requestId,
        kernelId: 'film-emulsion',
        input,
        settings: { profile: 'fine-35mm', strength: 42, portraitSafe: true },
        priority: 'preview',
        quality: 'full-preview'
      });
    case 'material-noise':
      return scheduler.schedule({
        requestId,
        kernelId: 'material-noise',
        input,
        settings: { materialId: 'cold-press-paper', strength: 48 },
        priority: 'preview',
        quality: 'full-preview'
      });
    case 'material-stack': {
      const film = await scheduler.schedule({
        requestId,
        kernelId: 'film-emulsion',
        input,
        settings: { profile: 'fine-35mm', strength: 42, portraitSafe: true },
        priority: 'preview',
        quality: 'full-preview'
      });
      const material = await scheduler.schedule({
        requestId: requestId + 1,
        kernelId: 'material-noise',
        input: outputToInput(film.output, input.seed + 1),
        settings: { materialId: 'cold-press-paper', strength: 48 },
        priority: 'preview',
        quality: 'full-preview'
      });
      return scheduler.schedule({
        requestId: requestId + 2,
        kernelId: 'ordered-dither',
        input: outputToInput(material.output, input.seed + 2),
        settings: { strength: 28, outputBitDepth: 2 },
        priority: 'preview',
        quality: 'full-preview'
      });
    }
  }
};

export const buildBrowserRenderBenchmarkPlan = (
  sizes: BrowserBenchmarkSize[] = [
    { label: '512px preview', width: 512, height: 512 },
    { label: '1024px preview', width: 1024, height: 1024 },
    { label: '1600px preview', width: 1600, height: 1600 },
    { label: '4096px export', width: 4096, height: 4096 }
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

    if (item.backend === 'typescript') {
      const startedAt = performance.now();
      await runTypeScriptBenchmarkCase(item.kernelId, input);
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
    const result = await scheduleWorkerBenchmarkCase(scheduler, item, input, transferStart);
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
