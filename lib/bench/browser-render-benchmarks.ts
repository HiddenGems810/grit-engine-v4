import { estimateKernelMemoryRisk } from './render-benchmarks';
import { createSyntheticKernelInput, runTypeScriptKernelById, type PixelKernelId } from '@/lib/engine/pixel-kernels';
import { createKernelWorkerClient } from '@/lib/engine/kernel-worker-client';
import { KernelScheduler } from '@/lib/engine/kernel-scheduler';
import type { KernelBackend } from '@/lib/engine/kernel-types';
import type { PixelKernelInput, PixelKernelOutput } from '@/lib/engine/kernel-types';
import { applyDisposableFlashFilm, createExpandedDisposablePrintCanvas } from '@/lib/effects/disposable-flash';
import { DISPOSABLE_FLASH_PRESETS } from '@/lib/effects/effect-registry';
import { applyMaterialFinishWithKernelScheduler } from '@/lib/materials/material-engine';
import { createSeededRandom } from '@/lib/engine/math-utils';

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

export type DisposableFlashBenchmarkCaseId =
  | 'disposable-flash-only'
  | 'disposable-flash-material-finish'
  | 'disposable-flash-anti-ai-repair'
  | 'disposable-flash-premium-preset';

export type DisposableFlashBenchmarkPlanItem = {
  caseId: DisposableFlashBenchmarkCaseId;
  size: BrowserBenchmarkSize;
};

export type DisposableFlashBenchmarkResult = DisposableFlashBenchmarkPlanItem & {
  elapsedMs: number;
  memoryRisk: 'low' | 'medium' | 'high';
  recommendation: 'stay-canvas2d' | 'split-canvas-worker' | 'worker-buffer-candidate';
};

const kernelCases = [
  { kernelId: 'ordered-dither' as const, settings: { strength: 80, outputBitDepth: 1 as const } },
  { kernelId: 'error-diffusion' as const, settings: { strength: 72 } },
  { kernelId: 'film-emulsion' as const, settings: { profile: 'fine-35mm' as const, strength: 42, portraitSafe: true } },
  { kernelId: 'material-noise' as const, settings: { materialId: 'cold-press-paper', strength: 48 } },
  { kernelId: 'material-stack' as const, settings: null }
];

const disposableFlashCases: DisposableFlashBenchmarkCaseId[] = [
  'disposable-flash-only',
  'disposable-flash-material-finish',
  'disposable-flash-anti-ai-repair',
  'disposable-flash-premium-preset'
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

export const buildDisposableFlashBenchmarkPlan = (
  sizes: BrowserBenchmarkSize[] = [
    { label: '1024px preview', width: 1024, height: 1024 },
    { label: '1600px preview', width: 1600, height: 1600 },
    { label: '4096px export', width: 4096, height: 4096 }
  ]
): DisposableFlashBenchmarkPlanItem[] => sizes.flatMap((size) => (
  disposableFlashCases.map((caseId) => ({ caseId, size }))
));

const createSyntheticCanvas = (width: number, height: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Canvas2D is unavailable for disposable flash benchmarks.');
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#121820');
  gradient.addColorStop(0.35, '#7b5246');
  gradient.addColorStop(0.68, '#d7a45f');
  gradient.addColorStop(1, '#f2e6ca');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(20,20,24,0.58)';
  ctx.fillRect(width * 0.18, height * 0.2, width * 0.36, height * 0.52);
  ctx.fillStyle = 'rgba(232,180,125,0.72)';
  ctx.beginPath();
  ctx.ellipse(width * 0.44, height * 0.38, width * 0.1, height * 0.14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(245,242,235,0.75)';
  ctx.fillRect(width * 0.62, height * 0.28, width * 0.2, height * 0.22);
  return { canvas, ctx };
};

const applyDisposableBenchmarkCase = async (
  item: DisposableFlashBenchmarkPlanItem,
  scheduler: KernelScheduler | null,
  requestId: number
) => {
  const { canvas, ctx } = createSyntheticCanvas(item.size.width, item.size.height);
  const preset = DISPOSABLE_FLASH_PRESETS.find((candidate) => candidate.id === 'dff-format-instant-flash') ?? DISPOSABLE_FLASH_PRESETS[0];
  if (!preset) throw new Error('Disposable Flash benchmark preset missing.');
  const seed = item.size.width ^ item.size.height ^ 0xd15f05ab;

  if (item.caseId === 'disposable-flash-anti-ai-repair') {
    ctx.save();
    ctx.filter = 'blur(0.42px) contrast(96%) saturate(104%)';
    ctx.globalAlpha = 0.42;
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }

  if (item.caseId === 'disposable-flash-premium-preset') {
    ctx.save();
    ctx.filter = 'contrast(112%) brightness(104%) saturate(112%)';
    ctx.drawImage(canvas, 0, 0);
    ctx.restore();
  }

  applyDisposableFlashFilm(ctx, canvas, preset.settings, seed, {
    x: item.size.width * 0.44,
    y: item.size.height * 0.38
  });

  if (item.caseId === 'disposable-flash-material-finish') {
    await applyMaterialFinishWithKernelScheduler(ctx, canvas, {
      materialProfile: 'cold-press-paper',
      materialStrength: 34,
      printProfile: 'none',
      paperSurface: 'matte-photo-paper',
      filmProfile: 'fine-35mm',
      opticalProfile: 'lens-bloom',
      faceProtection: true,
      edgeProtection: true
    }, createSeededRandom(seed ^ 0x4d47544d), {
      scheduler,
      requestId,
      seed: seed ^ 0x4d47544d,
      priority: item.size.width >= 2048 ? 'export' : 'preview',
      quality: item.size.width >= 2048 ? 'export' : 'full-preview'
    });
  }

  if (item.caseId === 'disposable-flash-premium-preset') {
    createExpandedDisposablePrintCanvas(canvas, {
      ...preset.settings,
      stampMode: 'seeded-retro',
      frameMode: 'expanded-print',
      dateStamp: true,
      printFrame: true
    }, seed);
  }
};

const recommendDisposableBackend = (elapsedMs: number, size: BrowserBenchmarkSize): DisposableFlashBenchmarkResult['recommendation'] => {
  if (size.width >= 4096 && elapsedMs > 300) return 'worker-buffer-candidate';
  if (size.width >= 1600 && elapsedMs > 80) return 'split-canvas-worker';
  if (elapsedMs > 120) return 'split-canvas-worker';
  return 'stay-canvas2d';
};

export const runDisposableFlashBrowserBenchmarks = async (
  sizes?: BrowserBenchmarkSize[]
): Promise<DisposableFlashBenchmarkResult[]> => {
  const workerClient = createKernelWorkerClient();
  const scheduler = new KernelScheduler(workerClient);
  const plan = buildDisposableFlashBenchmarkPlan(sizes);
  const results: DisposableFlashBenchmarkResult[] = [];

  for (let index = 0; index < plan.length; index += 1) {
    const item = plan[index];
    const memory = estimateKernelMemoryRisk(item.size.width, item.size.height);
    const startedAt = performance.now();
    await applyDisposableBenchmarkCase(item, scheduler, 9_000 + index);
    const elapsedMs = Math.max(0, performance.now() - startedAt);
    results.push({
      ...item,
      elapsedMs,
      memoryRisk: memory.risk,
      recommendation: recommendDisposableBackend(elapsedMs, item.size)
    });
  }

  scheduler.close();
  return results;
};

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
