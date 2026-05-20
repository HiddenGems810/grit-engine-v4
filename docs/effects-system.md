# FORMAT Effects System

FORMAT effects are local, deterministic render recipes. They are not remote texture hotlinks, copied overlays, Photoshop mockups, or asset-pack drops. Each shipped effect family must map to preview and export rendering through the same snapshot-backed pipeline used by presets, history, custom preset save/export, and render fingerprinting.

## Shipped Family

### Disposable Flash Film

The first premium effects expansion recreates the disposable-camera flash language procedurally:

- hard direct flash centered on the tracked face when available, otherwise image center
- lifted black point and crunchy flash contrast
- cyan/green shadow contamination
- warm amber/orange/red procedural light leaks
- luma-aware film grain and color noise
- deterministic dust, scratches, hairline marks, and scan defects
- plastic lens softness
- mild chromatic fringing
- vignette and edge falloff
- configurable date stamp
- in-frame or expanded-print frame modes

Render order inside the FORMAT preview/export stack:

1. Base image normalization and existing tone controls
2. Portrait-aware corrections
3. Color pipeline and LUT behavior
4. Existing halation, leaks, and prism passes
5. Disposable Flash Film pass
6. Print/bitmap/halftone passes
7. Material finish and export-safe finalization

The disposable pass is seeded from the render fingerprint inputs plus effect values. Same source image, same dimensions, and same settings produce the same procedural leak, dust, scratch, grain, stamp, and frame behavior.

## Disposable Flash Controls

Numeric controls:

- Flash Strength
- Flash Falloff
- Warm Light Leak
- Red Edge Burn
- Cyan Shadow Cast
- Film Grain
- Dust & Scratches
- Plastic Lens Softness
- Chromatic Fringing
- Vignette

Date stamp controls:

- `stampMode`: `off`, `today`, `seeded-retro`, or `custom`
- `stampFormat`: `MM_DD_YY`, `DD_MM_YY`, or `YYYY_MM_DD`
- `stampColor`: `orange`, `red`, or `white`
- `stampPosition`: `bottom-left` or `bottom-right`
- `customDate`: ISO `YYYY-MM-DD` date when custom mode is active

Frame controls:

- `off`: no frame
- `in-frame`: draws a border inside the current render bounds
- `expanded-print`: creates a larger physical-print canvas and places the finished photo inside the paper border

Legacy custom presets that only stored `dateStamp: true` or `printFrame: true` are upgraded to `seeded-retro` and `in-frame` during normalization. Invalid custom dates safely fall back to seeded-retro behavior.

## Effect Families Registry

The registry currently defines the full curated FORMAT effects taxonomy:

- Disposable Flash Film
- Instant Polaroid / Print Frame
- Risograph Grain
- Halftone Grunge
- Broken Copier / Xerox
- Reeded / Ribbed Glass
- Lens & Prism
- CRT / VHS / Camcorder
- Aged Grainy Photo
- Glitch / Acid Distortion
- Chrome / Liquid Metal Finish
- Debossed / Letterpress / Paper Press

Only Disposable Flash Film is enabled in the UI until each remaining family has a real renderer. Planned families are listed in the registry for architecture and naming stability, but disabled in the selector so users do not see fake controls.

Effect presets use a discriminated union:

- `DisposableFlashEffectPreset`
- `RisographEffectPreset`
- `XeroxEffectPreset`
- `PrismEffectPreset`
- `ReededGlassEffectPreset`
- `ChromeEffectPreset`

Only the disposable preset kind currently has shipped settings and an enabled renderer. Placeholder types are architecture only; they must not become visible controls until a real renderer, tests, and visual QA exist.

## One-Click Presets

The first six production presets are:

- FORMAT Instant Flash
- Nightlife Memory Flash
- Red Leak Party Frame
- Cyan Shadow Cheap Flash
- Instant Border Date Flash
- Soft Plastic Lens Flash

Each preset includes a recipe with flash, falloff, light leak, cyan shadows, grain, scratches, lens softness, chromatic fringing, and vignette values. Preset intensity blends values from neutral to the stored recipe without changing the deterministic pattern identity.

## Implementation Notes

- Core metadata: `lib/effects/effect-types.ts`
- Effect registry and preset recipes: `lib/effects/effect-registry.ts`
- Procedural disposable renderer: `lib/effects/disposable-flash.ts`
- UI controls: `components/effects-panel.tsx`
- Snapshot/preset integration: `lib/editor-config.ts`, `lib/editor-state.ts`, `lib/preset-engine.ts`, `lib/presets.ts`

Worker architecture remains intact. The current disposable flash renderer is Canvas2D-bound because it uses gradient, text, and presentation passes. It does not block or replace the worker-backed material kernels. Future buffer-based kernels, such as grain and scratch rasterization, can move into the existing worker scheduler if profiling shows a real bottleneck.

## QA Protocol

Disposable Flash Film release QA should include dark nightlife portraits, daylight portraits, melanated skin, pale skin, AI-generated portrait sources, product/object photos, low-resolution images, and large 4096px sources. For each shipped disposable preset, inspect before output plus 25, 50, 75, and 100 intensity renders.

Pass criteria:

- faces are not blown out
- melanated skin keeps warmth and density
- pale skin avoids harsh clipping
- cyan shadows are stylized but not dead or muddy
- warm leaks feel directional and photographic
- dust/scratches read as analog defects, not uniform noise
- chromatic fringing is visible near edges without becoming a gimmick
- date stamp and print frame look intentional
- preview and export use the same effect logic
- expanded-print dimensions are truthfully reported in Export Quality

## Worker Candidate Rules

Keep Canvas2D for gradients, frame drawing, date stamp text, and final presentation compositing. If browser profiling shows a real bottleneck, split only pure pixel or raster-plan work into workers first:

- tone/grain pixel pass
- cyan shadow contamination
- chromatic fringing
- dust/scratch raster plan generation
- buffer-based dust/scratch compositing

Do not move the full effect renderer to Worker, WASM, or WebGPU until profiling proves the added complexity is justified.
