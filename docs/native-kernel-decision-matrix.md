# FORMAT Native Kernel Decision Matrix

## Decision

C++/WASM is deferred for now.

FORMAT should stay Next.js, React, and TypeScript first. Native code belongs only behind pure deterministic pixel-kernel interfaces after measurements prove a kernel crosses the acceleration threshold.

The local Node/Vitest profile shows larger preview kernels cross UI-blocking thresholds, but that is a Worker decision first, not an immediate C++ decision. C++/WASM still needs a Worker-vs-TypeScript browser benchmark before it earns build complexity.

## Acceleration Threshold

Only add a C++/WASM proof when at least one kernel exceeds:

- More than 32ms on a 1600px preview
- More than 120ms on a 2048px export
- More than 300ms on a 4096px export
- Visible UI blocking during repeated slider interaction
- Memory churn that harms export stability

## Candidate Matrix

| Kernel | Runtime Cost | Memory Cost | Algorithm Stability | SIMD Benefit | Thread Benefit | Complexity Cost | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Ordered dither | Low to medium | Low | High | Medium | Medium | Low | move-to-worker first; first WASM proof only if Worker misses threshold |
| Film emulsion grain | Medium | Low | High | High | High | Medium | move-to-worker first; strongest later WASM candidate |
| Error diffusion | Medium to high | Medium | High | Low to medium because errors propagate | Medium by tile strategy only | Medium | move-to-worker first |
| CMYK separation | Medium | Medium | High | High | High | Medium | wasm-candidate if export cost crosses threshold |
| Material noise synthesis | Low to medium | Low | Medium | Medium | High | Low | move-to-worker at large previews |
| AM halftone rasterization | High at export sizes | Medium | Medium | Medium | Medium | High while Canvas-bound | defer until buffer rasterizer exists |
| CMYK halftone | High at export sizes | High | Medium | Medium | Medium | High while Canvas-bound | defer until buffer rasterizer exists |
| Risograph / Xerox | Medium | Medium | Medium | Medium | Medium | Medium | move-to-worker first |

## Why Not C++ Yet

- No benchmark has proven native code beats the TypeScript path enough to justify build, deployment, and fallback cost.
- Current hot kernels can be isolated and workerized without changing product architecture.
- Browser pthreads would require SharedArrayBuffer and cross-origin isolation headers, adding deployment constraints FORMAT does not currently need.
- Canvas-based halftone/CMYK drawing cannot be ported cleanly until a buffer rasterizer exists.

## Future Native Path

1. Keep TypeScript as the reference implementation.
2. Move hot kernels to Workers if UI blocking appears.
3. Add a single lazy-loaded WASM proof only for a measured bottleneck.
4. Prefer ordered dither as the first proof because it is deterministic and easy to compare.
5. Consider Rust for new memory-safe kernels; use C++ when integrating existing C/C++ image-processing code or Emscripten/SIMD-specific work.
6. Consider WebGPU later for massively parallel effects after browser support and product demand justify it.
