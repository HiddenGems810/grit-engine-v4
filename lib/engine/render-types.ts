/**
 * Grit Engine v4 — Render Pipeline Types
 *
 * Defines the input contract for the render pipeline.
 * Every field that renderCanvas reads from React state/refs is captured here
 * so the pipeline can eventually run in a Web Worker or off-thread.
 */

import type { EngineSnapshot, PortraitGuide, PortraitPoint } from '../editor-config';

/**
 * Complete input for a single render frame.
 * Combines the engine snapshot (parameter values) with runtime context
 * (image data, portrait guide, performance flags, canvas handles).
 */
export interface RenderInput {
  /** The engine parameter snapshot — all slider/toggle values. */
  params: EngineSnapshot;

  /** The source image to render. */
  sourceImage: HTMLImageElement;

  /** The off-screen render surface (created lazily). */
  renderSurface: HTMLCanvasElement;

  /** The on-screen preview canvas (for final blit). */
  previewCanvas: HTMLCanvasElement;

  /** Detected portrait guide, or null if no face detected. */
  portraitGuide: PortraitGuide | null;

  /** Whether a slider is currently being dragged (reduces render quality for responsiveness). */
  isSliderInteracting: boolean;

  /** Revision counter for the loaded image (changes when a new image is loaded). */
  imageReady: number;

  /** Reference to the histogram canvas element (may be null). */
  histogramCanvas: HTMLCanvasElement | null;
}

/**
 * Output from a render frame — side-effects that the caller must apply.
 * This keeps the render pipeline pure (no React state mutations inside).
 */
export interface RenderOutput {
  /** The rendered canvas (same reference as input renderSurface). */
  canvas: HTMLCanvasElement;

  /** Whether the frame was actually rendered (false if inputs were invalid). */
  rendered: boolean;
}
