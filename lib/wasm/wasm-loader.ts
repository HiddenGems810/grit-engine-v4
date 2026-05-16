import { detectWasmFeatures, resolveKernelBackend } from './wasm-feature-detect';

export interface WasmKernelLoadResult {
  available: boolean;
  fallbackBackend: 'typescript' | 'worker';
  warnings: string[];
}

export const loadFormatWasmKernels = async (): Promise<WasmKernelLoadResult> => {
  const features = detectWasmFeatures();
  const resolved = resolveKernelBackend({ preferred: 'wasm', features });

  return {
    available: false,
    fallbackBackend: resolved.backend === 'worker' ? 'worker' : 'typescript',
    warnings: resolved.warnings.length > 0 ? resolved.warnings : ['FORMAT WASM kernels are not bundled yet']
  };
};
