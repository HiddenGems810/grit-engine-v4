/**
 * Grit Engine v4 — Engine Module Barrel Export
 *
 * Central export point for all engine subsystems.
 */

export { clampNumber, createSeededRandom, buildDeterministicSeed, smoothStep } from './math-utils';
export { sampleImageProfile, sampleImageAestheticProfile, adaptPresetToImage, adaptPresetToAestheticProfile, computeAutoTone } from './image-analysis';
export type { ImageProfile, ImageAestheticProfile, AutoToneResult } from './image-analysis';
export { buildPortraitGuide, scalePortraitGuide } from './portrait-guide';
export { getCameraProfile, CAMERA_IDS } from './camera-profiles';
export type { CameraProfile, CameraId } from './camera-profiles';
export { HistoryManager } from './history';
export { buildPortraitMasks, createFaceMask } from './portrait-masks';
export type { PortraitMasks } from './portrait-masks';
export { drawCanvasToPreview } from './canvas-utils';
export { generateTextureTile, applyTextureTile } from './texture-engine';
export { renderSparkles } from './sparkle-engine';
export { renderGrain, renderVignette, renderDustAndScratches } from './film-effects';
export { applyFilmEmulsion, applyFilmEmulsionToImageData } from './film-emulsion-engine';
export { applyPrintEngine, applyOrderedDitherToImageData, applyErrorDiffusionToImageData, normalizePrintSettings } from './print-engine';
export {
  applyFaceSlimming, applySkinSmoothing, applySkinPolish, applyBlemishRemoval,
  applyBeautyBoostCanvas, applyGlowAccent, applyExpressionLift, applyJawDefinition,
  applyEyeBrightening, applyFeatureProtection
} from './portrait-retouch';
export type { ScaledPortraitGuide, RetouchParams } from './portrait-retouch';
