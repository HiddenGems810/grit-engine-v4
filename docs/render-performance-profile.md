# FORMAT Render Performance Profile

## Current Architecture

FORMAT now has a pure pixel-kernel boundary for the best native candidates:

- Ordered dither
- Error diffusion dither
- Film emulsion grain
- Material noise synthesis

These kernels accept `Uint8ClampedArray` input and return new buffers without mutating source data. That makes them suitable for TypeScript, Worker, future WASM, or future WebGPU implementations.

Canvas-bound effects remain in Canvas2D for now:

- AM halftone dot drawing
- CMYK halftone compositing
- Risograph overprint compositing
- Xerox paper/copy pass
- Optical bloom and diffusion
- Full material finish orchestration

Those should not be ported to C++ directly until a buffer-based raster equivalent exists.

## Benchmark Harness

The lightweight benchmark harness lives in:

- `lib/bench/benchmark-utils.ts`
- `lib/bench/render-benchmarks.ts`

It records:

- average runtime
- max runtime
- memory risk estimate
- UI blocking risk
- Worker candidacy
- WASM candidacy
- backend recommendation

Default sizes:

- 512px preview
- 1024px preview
- 1600px preview
- 2048px export

4096px export should be profiled manually on capable hardware only because it can create avoidable local memory pressure.

## Initial Diagnosis

No C++/WASM binary is added in this phase. The superior immediate architecture is:

1. Keep TypeScript as the reference kernel implementation.
2. Use the benchmark harness to identify measured bottlenecks.
3. Workerize kernels before native code when UI blocking is the primary issue.
4. Add a single lazy-loaded WASM proof only if a kernel crosses the documented threshold.

## Local Benchmark Snapshot

Command run on this workstation:

`$env:FORMAT_BENCHMARK_PROFILE='1'; npm run test -- lib/bench/render-benchmarks.profile.test.ts --reporter verbose`

Results:

| Size | Kernel | Average | Max | Memory | Recommendation |
| --- | --- | ---: | ---: | --- | --- |
| 512px preview | ordered-dither | 10.05ms | 10.44ms | low | stay-typescript |
| 512px preview | error-diffusion | 14.68ms | 15.78ms | low | stay-typescript |
| 512px preview | film-emulsion | 27.92ms | 31.86ms | low | move-to-worker |
| 512px preview | material-noise | 16.65ms | 17.07ms | low | move-to-worker |
| 1024px preview | ordered-dither | 28.47ms | 37.76ms | low | move-to-worker |
| 1024px preview | error-diffusion | 33.21ms | 33.29ms | low | move-to-worker |
| 1024px preview | film-emulsion | 114.41ms | 114.73ms | low | move-to-worker |
| 1024px preview | material-noise | 53.37ms | 55.89ms | low | move-to-worker |
| 1600px preview | ordered-dither | 71.72ms | 90.89ms | low | move-to-worker |
| 1600px preview | error-diffusion | 70.97ms | 75.23ms | low | move-to-worker |
| 1600px preview | film-emulsion | 287.47ms | 294.90ms | low | move-to-worker |
| 1600px preview | material-noise | 134.27ms | 134.99ms | low | move-to-worker |

Interpretation: the data proves the pure kernels should be Worker-ready before they are preview-critical at larger sizes. It does not yet prove C++/WASM is superior, because Worker timing and browser runtime timing have not been measured. The next acceleration step is Worker execution with cancellation/transferable buffers, then a WASM proof only if Worker timing still misses the thresholds.

## Benchmark Interpretation

- `stay-typescript`: keep current implementation.
- `move-to-worker`: avoid UI blocking before adding native code.
- `wasm-candidate`: consider one focused WASM proof with TypeScript fallback.
- `webgpu-candidate`: defer until a GPU-friendly buffer pipeline exists.
- `defer`: do not invest yet.

## Native Code Policy

C++ is allowed only for pure deterministic render kernels. It must not own UI, presets, product logic, metadata, import/export flow, storage, or privacy behavior.

The first C++ candidate, if justified later, should be ordered dither. It has deterministic output, simple memory access, and clear TypeScript differential tests.

## Browser Worker Benchmark Snapshot

After adding the Worker runtime, Chromium profiling through the development app produced:

| Size | Kernel | Main Thread TS | Worker TS | Transfer / Scheduling | Result |
| --- | --- | ---: | ---: | ---: | --- |
| 256px browser preview | ordered-dither | 4.90ms | 4.70ms | 12.10ms | Equivalent after Worker warmup |
| 256px browser preview | error-diffusion | 7.80ms | 7.40ms | 0.70ms | Worker slightly faster |
| 256px browser preview | film-emulsion | 8.50ms | 6.50ms | 0.40ms | Worker faster |
| 256px browser preview | material-noise | 3.30ms | 3.80ms | 0.40ms | Equivalent |
| 512px browser preview | ordered-dither | 12.30ms | 12.50ms | 0.60ms | Equivalent |
| 512px browser preview | error-diffusion | 12.10ms | 12.70ms | 0.50ms | Equivalent |
| 512px browser preview | film-emulsion | 31.30ms | 16.30ms | 0.50ms | Worker materially better |
| 512px browser preview | material-noise | 13.10ms | 8.50ms | 0.70ms | Worker better |

Interpretation: Worker isolation is already valuable for the film emulsion and material noise kernels. C++/WASM is still not justified because the Worker path removes main-thread blocking without introducing native build complexity.
