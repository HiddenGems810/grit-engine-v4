# FORMAT Worker Render Runtime

## Summary

FORMAT now routes pure heavy pixel kernels through a Worker-capable runtime with TypeScript fallback. The runtime is used by the real material finish preview/export path for:

- Ordered dither
- Error diffusion
- Film emulsion grain
- Material noise tile synthesis

The app still keeps React, presets, UI state, import/export, privacy, and render orchestration in TypeScript.

## Runtime Files

- `lib/engine/kernel-worker.ts`: Worker entrypoint.
- `lib/engine/kernel-worker-client.ts`: Worker lifecycle, transferable-buffer messaging, timeout handling, and TypeScript fallback.
- `lib/engine/kernel-scheduler.ts`: request IDs, stale preview suppression, preview cancellation, export priority.
- `lib/engine/pixel-kernels.ts`: TypeScript reference kernels.
- `lib/materials/material-engine.ts`: Worker-backed material finish integration.

## Scheduling Policy

- Preview jobs use request IDs and are stale-checked before committing.
- New preview jobs supersede older preview jobs.
- Export jobs abort active preview work and run with export priority.
- Fast preview jobs are lightly debounced to avoid queue growth while sliders move.
- Worker errors, Worker absence, and Worker timeouts fall back to TypeScript.
- Worker output is committed only if the render request is still current.
- Worker fallback can be forced for QA with `?disableWorkers=1` or `localStorage.setItem('format-disable-workers', '1')`.

## Buffer Ownership

Worker jobs transfer the input `Uint8ClampedArray` buffer to avoid a second copy on the Worker boundary. The client keeps a fallback clone before transfer so a Worker crash can still produce a TypeScript result.

Input mutation policy:

- Worker path may detach transferred input buffers.
- Caller must treat submitted kernel input as consumed.
- TypeScript fallback/reference kernels do not mutate caller input.

## Browser Benchmark Snapshot

Measured in Chromium through the development app at `http://localhost:3001/`:

| Size | Kernel | Main Thread TS | Worker TS | Transfer / Scheduling Overhead | Result |
| --- | --- | ---: | ---: | ---: | --- |
| 256px | ordered dither | 4.90ms | 4.70ms | 12.10ms | Equivalent after Worker warmup |
| 256px | error diffusion | 7.80ms | 7.40ms | 0.70ms | Worker slightly faster |
| 256px | film emulsion | 8.50ms | 6.50ms | 0.40ms | Worker faster |
| 256px | material noise | 3.30ms | 3.80ms | 0.40ms | Equivalent |
| 512px | ordered dither | 12.30ms | 12.50ms | 0.60ms | Equivalent |
| 512px | error diffusion | 12.10ms | 12.70ms | 0.50ms | Equivalent |
| 512px | film emulsion | 31.30ms | 16.30ms | 0.50ms | Worker materially better |
| 512px | material noise | 13.10ms | 8.50ms | 0.70ms | Worker better |

Interpretation: Worker isolation is justified for film emulsion and material noise at realistic preview sizes. Ordered dither and error diffusion are close at 512px, but Worker execution still protects UI responsiveness when the image is larger or chained inside the material stack.

The public beta benchmark hook now profiles 1024px preview, 1600px preview, 4096px export, and a chained material stack case. See `docs/render-performance-profile.md` for the latest Chromium/WebKit/Firefox measurements.

## Halftone Rasterizer Plan

AM halftone and CMYK halftone are still Canvas2D-bound. They should not move to Worker/WASM until FORMAT has a buffer rasterizer:

1. Implement an RGBA buffer AM dot rasterizer for round, elliptical, square, diamond, and line dots.
2. Add CMYK channel extraction as a pure buffer kernel.
3. Rasterize each CMYK screen into separate buffers using screen angles.
4. Add misregistration and ink opacity in buffer space.
5. Compare buffer output against the existing Canvas2D output with tolerance tests.
6. Only then evaluate Worker/WASM/WebGPU acceleration.

## Native Code Position

C++/WASM remains deferred. Worker profiling now exists, and the next native decision should compare Worker TypeScript against a single WASM proof only after the Worker path misses preview/export targets.
