export type KernelBackend = 'typescript' | 'worker' | 'wasm' | 'webgpu';

export interface PixelKernelInput {
  width: number;
  height: number;
  data: Uint8ClampedArray;
  seed: number;
}

export interface PixelKernelOutput {
  width: number;
  height: number;
  data: Uint8ClampedArray;
}

export interface KernelExecutionMeta {
  backend: KernelBackend;
  elapsedMs: number;
  fallbackUsed: boolean;
  warnings: string[];
}

export interface PixelKernel<ISettings> {
  id: string;
  run(input: PixelKernelInput, settings: ISettings): Promise<PixelKernelOutput>;
}

export interface KernelExecutionResult {
  output: PixelKernelOutput;
  meta: KernelExecutionMeta;
}
