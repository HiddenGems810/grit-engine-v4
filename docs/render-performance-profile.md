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

Default browser sizes:

- 1024px preview
- 1600px preview
- 4096px export

The browser benchmark hook is exposed only in development or when the app is opened with `?bench=1`.

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

## Public Beta Browser Benchmark Snapshot

Command profile:

- Built production app with `npm run build`.
- Prepared standalone assets with `npm run prepare:e2e`.
- Ran the benchmark hook at `http://127.0.0.1:3101/?bench=1` in Chromium, WebKit, and Firefox.

Representative timings:

| Browser | Size | Kernel | Main Thread TS | Worker TS | Transfer / Scheduling | Memory |
| --- | --- | --- | ---: | ---: | ---: | --- |
| Chromium | 1024px preview | film-emulsion | 125.20ms | 59.00ms | 1.70ms | low |
| Chromium | 1600px preview | material-noise | 63.70ms | 58.90ms | 3.30ms | low |
| Chromium | 4096px export | film-emulsion | 2025.80ms | 2095.10ms | 25.70ms | medium |
| WebKit | 1600px preview | film-emulsion | 316.00ms | 316.00ms | 3.00ms | low |
| WebKit | 4096px export | material-noise | 664.00ms | 652.00ms | 14.00ms | medium |
| Firefox | 1600px preview | error-diffusion | 126.00ms | 68.00ms | 7.00ms | low |
| Firefox | 1600px preview | material-noise | 102.00ms | 51.00ms | 3.00ms | low |
| Firefox | 4096px export | film-emulsion | 1497.00ms | 1244.00ms | 15.00ms | medium |
| Firefox | 4096px export | material-noise | 665.00ms | 327.00ms | 14.00ms | medium |

Chained material stack timings:

| Browser | Size | Main Thread TS | Worker Final Kernel | Transfer / Scheduling | Memory |
| --- | --- | ---: | ---: | ---: | --- |
| Chromium | 1024px preview | 229.80ms | 55.10ms | 202.70ms | low |
| Chromium | 1600px preview | 689.30ms | 130.30ms | 518.10ms | low |
| Chromium | 4096px export | 4228.30ms | 738.80ms | 3096.50ms | medium |
| WebKit | 1024px preview | 208.00ms | 35.00ms | 168.00ms | low |
| WebKit | 1600px preview | 501.00ms | 86.00ms | 420.00ms | low |
| WebKit | 4096px export | 3819.00ms | 552.00ms | 2772.00ms | medium |
| Firefox | 1024px preview | 152.00ms | 21.00ms | 117.00ms | low |
| Firefox | 1600px preview | 376.00ms | 48.00ms | 299.00ms | low |
| Firefox | 4096px export | 1888.00ms | 320.00ms | 1904.00ms | medium |

Interpretation:

- Worker execution is still the right public-beta default because it protects editor responsiveness even when raw elapsed time is similar.
- Chained stack transfer/scheduling cost is intentionally visible in the table; even when wall-clock totals are similar, the heavy work is no longer monopolizing the editor thread.
- Chromium and WebKit export-sized film/material kernels remain future WASM candidates, but only after a single-kernel proof beats Worker TypeScript with the same fallback behavior.
- Firefox shows the strongest Worker runtime gains for material noise and film emulsion.
- 4096px export is safe in the smoke path but remains medium memory risk.
