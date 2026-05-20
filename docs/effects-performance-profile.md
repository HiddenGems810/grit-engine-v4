# Effects Performance Profile

This document records the public-beta profiling plan for FORMAT Premium Effects. Numbers must be refreshed from real browser runs before release notes claim performance wins.

## Disposable Flash Matrix

Sizes:

- 1024px preview
- 1600px preview
- 4096px export

Cases:

- Disposable Flash only
- Disposable Flash + Material Finish
- Disposable Flash + Anti-AI Repair
- Disposable Flash + Premium Preset Recipe

Browsers:

- Chromium
- Firefox
- WebKit where stable on the local runner

The browser hook is exposed only in development or `?bench=1` production runs:

```js
await window.__FORMAT_DISPOSABLE_FLASH_BENCHMARKS__()
```

## Current Architecture Decision

Disposable Flash remains Canvas2D for this branch. The effect combines Canvas presentation passes that are not good Worker candidates yet:

- radial flash gradients
- procedural light leak gradients
- print-frame drawing
- date-stamp text
- final expanded-print compositing

Worker candidates are isolated to future buffer paths:

- tone/grain pixel pass
- cyan shadow contamination
- chromatic fringing
- dust/scratch raster plan generation
- possible buffer-based dust/scratch compositing

Recommendation before native/WASM work: split Canvas2D presentation from buffer kernels only if browser timings cross these thresholds:

- preview at 1600px repeatedly exceeds 80ms during interaction
- export at 4096px exceeds 300ms for Disposable Flash only
- chained Disposable Flash + Material Finish causes visible UI blocking after debounce
- transfer overhead is lower than saved kernel runtime

## Latest Local Browser Run

Command:

```bash
node .tmp/visual-qa/disposable-flash/run-browser-benchmarks.mjs
```

These are single-run browser measurements from the standalone production build on the local Windows runner. Because each case ran once, `Avg/Single ms` and `Max ms` are identical. Treat the values as decision-grade direction, not a statistically smoothed benchmark suite.

| Browser | Case | Size | Avg/Single ms | Max ms | Memory Risk | Recommendation |
| --- | --- | --- | ---: | ---: | --- | --- |
| Chromium | disposable-flash-only | 1024px preview | 197.3 | 197.3 | low | split-canvas-worker |
| Chromium | disposable-flash-material-finish | 1024px preview | 319.0 | 319.0 | low | split-canvas-worker |
| Chromium | disposable-flash-anti-ai-repair | 1024px preview | 212.5 | 212.5 | low | split-canvas-worker |
| Chromium | disposable-flash-premium-preset | 1024px preview | 244.5 | 244.5 | low | split-canvas-worker |
| Chromium | disposable-flash-only | 1600px preview | 511.3 | 511.3 | low | split-canvas-worker |
| Chromium | disposable-flash-material-finish | 1600px preview | 924.7 | 924.7 | low | split-canvas-worker |
| Chromium | disposable-flash-anti-ai-repair | 1600px preview | 513.7 | 513.7 | low | split-canvas-worker |
| Chromium | disposable-flash-premium-preset | 1600px preview | 531.4 | 531.4 | low | split-canvas-worker |
| Chromium | disposable-flash-only | 4096px export | 3603.4 | 3603.4 | medium | worker-buffer-candidate |
| Chromium | disposable-flash-material-finish | 4096px export | 5984.4 | 5984.4 | medium | worker-buffer-candidate |
| Chromium | disposable-flash-anti-ai-repair | 4096px export | 3243.3 | 3243.3 | medium | worker-buffer-candidate |
| Chromium | disposable-flash-premium-preset | 4096px export | 3856.6 | 3856.6 | medium | worker-buffer-candidate |
| Firefox | disposable-flash-only | 1024px preview | 248.0 | 248.0 | low | split-canvas-worker |
| Firefox | disposable-flash-material-finish | 1024px preview | 416.0 | 416.0 | low | split-canvas-worker |
| Firefox | disposable-flash-anti-ai-repair | 1024px preview | 310.0 | 310.0 | low | split-canvas-worker |
| Firefox | disposable-flash-premium-preset | 1024px preview | 280.0 | 280.0 | low | split-canvas-worker |
| Firefox | disposable-flash-only | 1600px preview | 607.0 | 607.0 | low | split-canvas-worker |
| Firefox | disposable-flash-material-finish | 1600px preview | 935.0 | 935.0 | low | split-canvas-worker |
| Firefox | disposable-flash-anti-ai-repair | 1600px preview | 760.0 | 760.0 | low | split-canvas-worker |
| Firefox | disposable-flash-premium-preset | 1600px preview | 633.0 | 633.0 | low | split-canvas-worker |
| Firefox | disposable-flash-only | 4096px export | 3927.0 | 3927.0 | medium | worker-buffer-candidate |
| Firefox | disposable-flash-material-finish | 4096px export | 5858.0 | 5858.0 | medium | worker-buffer-candidate |
| Firefox | disposable-flash-anti-ai-repair | 4096px export | 4984.0 | 4984.0 | medium | worker-buffer-candidate |
| Firefox | disposable-flash-premium-preset | 4096px export | 4095.0 | 4095.0 | medium | worker-buffer-candidate |
| WebKit | disposable-flash-only | 1024px preview | 238.0 | 238.0 | low | split-canvas-worker |
| WebKit | disposable-flash-material-finish | 1024px preview | 414.0 | 414.0 | low | split-canvas-worker |
| WebKit | disposable-flash-anti-ai-repair | 1024px preview | 466.0 | 466.0 | low | split-canvas-worker |
| WebKit | disposable-flash-premium-preset | 1024px preview | 246.0 | 246.0 | low | split-canvas-worker |
| WebKit | disposable-flash-only | 1600px preview | 545.0 | 545.0 | low | split-canvas-worker |
| WebKit | disposable-flash-material-finish | 1600px preview | 878.0 | 878.0 | low | split-canvas-worker |
| WebKit | disposable-flash-anti-ai-repair | 1600px preview | 534.0 | 534.0 | low | split-canvas-worker |
| WebKit | disposable-flash-premium-preset | 1600px preview | 519.0 | 519.0 | low | split-canvas-worker |
| WebKit | disposable-flash-only | 4096px export | 3279.0 | 3279.0 | medium | worker-buffer-candidate |
| WebKit | disposable-flash-material-finish | 4096px export | 5775.0 | 5775.0 | medium | worker-buffer-candidate |
| WebKit | disposable-flash-anti-ai-repair | 4096px export | 3478.0 | 3478.0 | medium | worker-buffer-candidate |
| WebKit | disposable-flash-premium-preset | 4096px export | 3417.0 | 3417.0 | medium | worker-buffer-candidate |

## Decision

The full-quality Disposable Flash pixel work is a Worker-buffer candidate for export and settled previews. This branch keeps Canvas2D as the source of truth, adds a fast-preview drag path that skips the heaviest grain/fringing/dust passes while the user is actively moving sliders, and documents the next split point instead of prematurely moving text/gradient/frame presentation into Worker code.
