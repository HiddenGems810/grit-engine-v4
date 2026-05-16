import { describe, expect, it } from 'vitest';
import { detectWasmFeatures, resolveKernelBackend } from './wasm-feature-detect';

describe('wasm feature detection', () => {
  it('returns unavailable cleanly during SSR or non-browser execution', () => {
    const features = detectWasmFeatures({ wasm: undefined, worker: undefined });

    expect(features.wasmSupported).toBe(false);
    expect(features.workerSupported).toBe(false);
    expect(features.reason).toContain('WebAssembly unavailable');
  });

  it('falls back to TypeScript when wasm is missing', () => {
    const backend = resolveKernelBackend({
      preferred: 'wasm',
      features: {
        wasmSupported: false,
        wasmSimdSupported: false,
        workerSupported: true,
        sharedArrayBufferSupported: false,
        crossOriginIsolated: false,
        reason: 'missing wasm'
      }
    });

    expect(backend.backend).toBe('typescript');
    expect(backend.fallbackUsed).toBe(true);
    expect(backend.warnings).toContain('missing wasm');
  });
});
