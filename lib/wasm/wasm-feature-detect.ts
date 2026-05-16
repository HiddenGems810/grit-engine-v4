import type { KernelBackend } from '@/lib/engine/kernel-types';

export interface WasmFeatureSnapshot {
  wasmSupported: boolean;
  wasmSimdSupported: boolean;
  workerSupported: boolean;
  sharedArrayBufferSupported: boolean;
  crossOriginIsolated: boolean;
  reason?: string;
}

export interface DetectWasmFeatureEnvironment {
  wasm?: typeof WebAssembly;
  worker?: typeof Worker;
  sharedArrayBuffer?: typeof SharedArrayBuffer;
  crossOriginIsolated?: boolean;
}

export const detectWasmFeatures = (environment: DetectWasmFeatureEnvironment = {}): WasmFeatureSnapshot => {
  const hasWasmOverride = Object.prototype.hasOwnProperty.call(environment, 'wasm');
  const hasWorkerOverride = Object.prototype.hasOwnProperty.call(environment, 'worker');
  const hasSharedArrayBufferOverride = Object.prototype.hasOwnProperty.call(environment, 'sharedArrayBuffer');
  const wasm = hasWasmOverride ? environment.wasm : (typeof WebAssembly !== 'undefined' ? WebAssembly : undefined);
  const worker = hasWorkerOverride ? environment.worker : (typeof Worker !== 'undefined' ? Worker : undefined);
  const sharedArrayBuffer = hasSharedArrayBufferOverride
    ? environment.sharedArrayBuffer
    : (typeof SharedArrayBuffer !== 'undefined' ? SharedArrayBuffer : undefined);
  const crossOriginIsolatedValue = environment.crossOriginIsolated ?? (
    typeof globalThis !== 'undefined' && 'crossOriginIsolated' in globalThis
      ? Boolean(globalThis.crossOriginIsolated)
      : false
  );

  const reasons: string[] = [];
  if (!wasm) reasons.push('WebAssembly unavailable');
  if (!worker) reasons.push('Worker unavailable');

  return {
    wasmSupported: Boolean(wasm),
    wasmSimdSupported: false,
    workerSupported: Boolean(worker),
    sharedArrayBufferSupported: Boolean(sharedArrayBuffer),
    crossOriginIsolated: crossOriginIsolatedValue,
    reason: reasons.length > 0 ? reasons.join('; ') : undefined
  };
};

export const resolveKernelBackend = ({
  preferred,
  features
}: {
  preferred: KernelBackend;
  features: WasmFeatureSnapshot;
}): { backend: KernelBackend; fallbackUsed: boolean; warnings: string[] } => {
  if (preferred === 'wasm' && !features.wasmSupported) {
    return {
      backend: 'typescript',
      fallbackUsed: true,
      warnings: [features.reason ?? 'WASM unavailable']
    };
  }
  if (preferred === 'worker' && !features.workerSupported) {
    return {
      backend: 'typescript',
      fallbackUsed: true,
      warnings: [features.reason ?? 'Worker unavailable']
    };
  }
  if (preferred === 'webgpu') {
    return {
      backend: 'typescript',
      fallbackUsed: true,
      warnings: ['WebGPU kernels are not implemented']
    };
  }
  return {
    backend: preferred,
    fallbackUsed: false,
    warnings: []
  };
};
