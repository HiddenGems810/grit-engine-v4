export type BenchmarkRecommendation = 'stay-typescript' | 'move-to-worker' | 'wasm-candidate' | 'webgpu-candidate' | 'defer';

export interface BenchmarkSize {
  label: string;
  width: number;
  height: number;
}

export interface KernelBenchmarkResult {
  kernelId: string;
  sizeLabel: string;
  width: number;
  height: number;
  averageMs: number;
  maxMs: number;
  estimatedBytes: number;
  memoryRisk: 'low' | 'medium' | 'high';
  blocksUi: boolean;
  workerCandidate: boolean;
  wasmCandidate: boolean;
  recommendation: BenchmarkRecommendation;
}

export const average = (values: number[]) => (
  values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
);

export const estimatePixelBytes = (width: number, height: number, buffers = 3) => width * height * 4 * buffers;

export const recommendBackend = (averageMs: number, maxMs: number, width: number): BenchmarkRecommendation => {
  if (maxMs > 300 && width >= 4096) return 'wasm-candidate';
  if (maxMs > 120 && width >= 2048) return 'wasm-candidate';
  if (averageMs > 32 && width >= 1600) return 'move-to-worker';
  if (maxMs > 16 && width <= 1600) return 'move-to-worker';
  return 'stay-typescript';
};
