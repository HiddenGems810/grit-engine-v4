/**
 * Grit Engine v4 — Portrait Retouch Engine
 *
 * Pure canvas functions for the portrait retouch stack (PASS 0.5):
 * - Face slimming (ghost-free contour warp with erase-then-replace compositing)
 * - Skin smoothing (frequency-selective blur)
 * - Skin polish (gentle luminosity blur)
 * - Blemish removal (local-contrast healing)
 * - Beauty boost (contrast + saturation lift)
 * - Glow accent (radial skin highlights)
 * - Expression lift (subtle cheek luminosity — no bloom)
 * - Jaw definition (contour shadow line)
 * - Feature protection (restore detail on eyes/brows/mouth)
 *
 * All functions receive canvas, ctx, masks, and scalar parameters.
 * No React state. No side effects. Deterministic.
 *
 * IMPORTANT: All slider values arrive at their CONTROL LIMIT scale, NOT 0–100.
 * Control limits (from editor-config PORTRAIT_CONTROL_LIMITS):
 *   faceSlimming: 0–15     skinSmoothing: 0–24    skinPolish: 0–52
 *   blemishRemoval: 0–42   beautyBoost: 0–46      glowUp: 0–24
 *   expressionLift: 0–24   jawDefinition: 0–26    eyeBrightening: 0–28
 * Each function normalizes its input to a 0–1 intensity using these limits.
 */

import { clampNumber, smoothStep } from './math-utils';
import { createFaceMask } from './portrait-masks';
import type { PortraitMasks } from './portrait-masks';
import type { PortraitGuide } from '../editor-config';

// Re-export for convenience in page.tsx (single import)
export type { PortraitMasks };

/** Alias for the scaled portrait guide — same shape as PortraitGuide after coordinate transform */
export type ScaledPortraitGuide = PortraitGuide;

/** Parameters for the complete retouch pass */
export interface RetouchParams {
  skinSmoothing: number;
  glowUp: number;
  faceSlimming: number;
  blemishRemoval: number;
  expressionLift: number;
  beautyBoost: number;
  ageShift: number;
  eyeBrightening: number;
  jawDefinition: number;
  skinPolish: number;
  teethWhitening: number;
  makeupStrength: number;
}

// Control limit constants (mirror PORTRAIT_CONTROL_LIMITS from editor-config)
const LIMITS = {
  faceSlimming: 15,
  skinSmoothing: 24,
  skinPolish: 52,
  blemishRemoval: 42,
  beautyBoost: 46,
  glowUp: 24,
  expressionLift: 24,
  jawDefinition: 26,
  eyeBrightening: 28,
} as const;


/**
 * PASS 0.5a: Face Slimming — Ghost-Free Contour Warp
 *
 * Uses erase-then-replace compositing to eliminate the double-exposure ghosting
 * that occurs with naive alpha-blended warps. The face region is fully erased
 * from the original and replaced with the warped version.
 *
 * Intensity is controlled by WARP PULL, not blend alpha.
 * The face mask provides the feathered boundary transition.
 *
 * Input range: 0–15 (PORTRAIT_CONTROL_LIMITS.faceSlimming)
 */
export function applyFaceSlimming(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  guide: ScaledPortraitGuide,
  faceSlimming: number,
  faceMaskCanvas: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, faceSlimming / LIMITS.faceSlimming);

  // Snapshot the current canvas state
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = canvas.width;
  sourceCanvas.height = canvas.height;
  const sourceCtx = sourceCanvas.getContext('2d')!;
  sourceCtx.drawImage(canvas, 0, 0);

  // Create the warped full image (starts as a copy of source)
  const slimCanvas = document.createElement('canvas');
  slimCanvas.width = canvas.width;
  slimCanvas.height = canvas.height;
  const slimCtx = slimCanvas.getContext('2d')!;
  slimCtx.drawImage(sourceCanvas, 0, 0);

  const top = Math.max(0, Math.floor(guide.forehead.y));
  const bottom = Math.min(canvas.height, Math.ceil(guide.chin.y));
  const baseCenterWidth = guide.bounds.width * 0.82;
  // Warp pull controls the visible effect — increased strength for responsiveness
  // Boosted from 1.15 to 1.35 and pull from 0.14 to 0.18 for "Kim K" levels of efficacy
  const effectStrength = Math.pow(intensity, 1.0) * 1.35;

  for (let y = top; y < bottom; y += 1) {
    const normalizedY = (y - top) / Math.max(1, bottom - top);
    const contourFocus = Math.sin(normalizedY * Math.PI);
    const jawFocus = Math.max(0, (normalizedY - 0.18) / 0.82);
    const influence = Math.pow(contourFocus, 1.25) * (0.30 + jawFocus * 0.70);
    const pull = effectStrength * influence * guide.bounds.width * 0.18;
    const srcCenterWidth = Math.min(canvas.width, baseCenterWidth + pull);
    const srcCenterX = clampNumber(guide.center.x - srcCenterWidth / 2, 0, Math.max(0, canvas.width - srcCenterWidth));
    const destCenterX = clampNumber(guide.center.x - baseCenterWidth / 2, 0, Math.max(0, canvas.width - baseCenterWidth));
    const leftDestWidth = destCenterX;
    const rightDestWidth = canvas.width - (destCenterX + baseCenterWidth);
    const leftSrcWidth = srcCenterX;
    const rightSrcWidth = canvas.width - (srcCenterX + srcCenterWidth);

    slimCtx.drawImage(sourceCanvas, 0, y, leftSrcWidth, 1, 0, y, leftDestWidth, 1);
    slimCtx.drawImage(sourceCanvas, srcCenterX, y, srcCenterWidth, 1, destCenterX, y, baseCenterWidth, 1);
    slimCtx.drawImage(sourceCanvas, srcCenterX + srcCenterWidth, y, rightSrcWidth, 1, destCenterX + baseCenterWidth, y, rightDestWidth, 1);
  }

  // --- Ghost-free full-row replacement ---
  // We no longer mask the slimmed result. Since the warp is zero at the top and bottom
  // boundaries (influence=0), and the entire row is warped, drawing the slimCanvas
  // directly over the ctx eliminates both ghosting of the original jawline
  // and the dark grey line artifacts caused by alpha-clipping.
  ctx.globalAlpha = 1.0;
  ctx.drawImage(slimCanvas, 0, 0);
}

/**
 * PASS 0.5b: Skin Smoothing
 * Frequency-selective blur masked to skin regions.
 *
 * Input range: 0–24 (PORTRAIT_CONTROL_LIMITS.skinSmoothing)
 */
export function applySkinSmoothing(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  portraitSmooth: number,
  smoothMask: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, portraitSmooth / LIMITS.skinSmoothing);
  const smoothCanvas = document.createElement('canvas');
  smoothCanvas.width = canvas.width;
  smoothCanvas.height = canvas.height;
  const smoothCtx = smoothCanvas.getContext('2d')!;
  // Blur radius scales with intensity: 0.55px at min → ~3.2px at max
  smoothCtx.filter = `blur(${0.55 + intensity * 2.6}px) contrast(${100 - intensity * 2}%) brightness(100%) saturate(100%)`;
  smoothCtx.drawImage(canvas, 0, 0);
  if (smoothMask) {
    smoothCtx.globalCompositeOperation = 'destination-in';
    smoothCtx.drawImage(smoothMask, 0, 0);
    smoothCtx.globalCompositeOperation = 'source-over';
  }
  // Alpha: up to 45% at max — clearly visible smoothing
  ctx.globalAlpha = Math.min(0.45, intensity * 0.45);
  ctx.drawImage(smoothCanvas, 0, 0);
  ctx.globalAlpha = 1;
}

/**
 * PASS 0.5c: Skin Polish
 * Gentle luminosity blur with skin mask for porcelain-smooth skin.
 *
 * Input range: 0–52 (PORTRAIT_CONTROL_LIMITS.skinPolish)
 */
export function applySkinPolish(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  skinPolish: number,
  polishMask: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, skinPolish / LIMITS.skinPolish);
  const polishCanvas = document.createElement('canvas');
  polishCanvas.width = canvas.width;
  polishCanvas.height = canvas.height;
  const polishCtx = polishCanvas.getContext('2d')!;
  polishCtx.filter = `blur(${0.55 + intensity * 2.0}px) contrast(${100 - intensity * 1.5}%) brightness(${100 + intensity * 0.8}%) saturate(100%)`;
  polishCtx.drawImage(canvas, 0, 0);
  if (polishMask) {
    polishCtx.globalCompositeOperation = 'destination-in';
    polishCtx.drawImage(polishMask, 0, 0);
    polishCtx.globalCompositeOperation = 'source-over';
  }
  // Alpha: up to 32% at max — noticeable porcelain finish
  ctx.globalAlpha = 0.04 + intensity * 0.28;
  ctx.globalCompositeOperation = 'source-over';
  ctx.drawImage(polishCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5d: Blemish Removal
 * Local-contrast healing: detects high-contrast spots in skin zones
 * and blends them toward the smooth neighborhood.
 *
 * Input range: 0–42 (PORTRAIT_CONTROL_LIMITS.blemishRemoval)
 */
export function applyBlemishRemoval(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  blemishRemoval: number,
  skinMaskCanvas: HTMLCanvasElement | null,
  skinMaskAlpha: Uint8ClampedArray | null
): void {
  const intensity = Math.min(1, blemishRemoval / LIMITS.blemishRemoval);
  const cleanupCanvas = document.createElement('canvas');
  cleanupCanvas.width = canvas.width;
  cleanupCanvas.height = canvas.height;
  const cleanupCtx = cleanupCanvas.getContext('2d')!;
  cleanupCtx.filter = `blur(${0.8 + intensity * 2.5}px) saturate(100%)`;
  cleanupCtx.drawImage(canvas, 0, 0);
  if (skinMaskCanvas) {
    cleanupCtx.globalCompositeOperation = 'destination-in';
    cleanupCtx.drawImage(skinMaskCanvas, 0, 0);
    cleanupCtx.globalCompositeOperation = 'source-over';
  }
  const cleanupData = cleanupCtx.getImageData(0, 0, canvas.width, canvas.height);
  const cleanupPixels = cleanupData.data;
  const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const currentPixels = currentData.data;
  for (let i = 0; i < currentPixels.length; i += 4) {
    const skinStrength = skinMaskAlpha ? skinMaskAlpha[i + 3] / 255 : 0;
    if (skinStrength < 0.04) continue;
    const currentLuma = 0.2126 * currentPixels[i] + 0.7152 * currentPixels[i + 1] + 0.0722 * currentPixels[i + 2];
    const smoothLuma = 0.2126 * cleanupPixels[i] + 0.7152 * cleanupPixels[i + 1] + 0.0722 * cleanupPixels[i + 2];
    const localContrast = Math.abs(currentLuma - smoothLuma);
    const chromaSpread = Math.max(currentPixels[i], currentPixels[i + 1], currentPixels[i + 2]) - Math.min(currentPixels[i], currentPixels[i + 1], currentPixels[i + 2]);
    const blemishCandidate = smoothStep(9, 28, localContrast) * (1 - smoothStep(42, 96, chromaSpread));
    // Up to 55% blend at max — clearly heals blemishes
    const blend = Math.min(0.55, intensity * 0.55) * blemishCandidate * skinStrength;
    if (blend <= 0.002) continue;
    currentPixels[i] += (cleanupPixels[i] - currentPixels[i]) * blend;
    currentPixels[i + 1] += (cleanupPixels[i + 1] - currentPixels[i + 1]) * blend;
    currentPixels[i + 2] += (cleanupPixels[i + 2] - currentPixels[i + 2]) * blend;
  }
  ctx.putImageData(currentData, 0, 0);
}

/**
 * PASS 0.5e: Beauty Boost (canvas-level soft-light contrast lift)
 *
 * Input range: 0–46 (PORTRAIT_CONTROL_LIMITS.beautyBoost)
 */
export function applyBeautyBoostCanvas(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  beautyBoost: number,
  beautyMask: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, beautyBoost / LIMITS.beautyBoost);
  const beautyCanvas = document.createElement('canvas');
  beautyCanvas.width = canvas.width;
  beautyCanvas.height = canvas.height;
  const beautyCtx = beautyCanvas.getContext('2d')!;
  beautyCtx.filter = `contrast(${100 + intensity * 8}%) brightness(${100 + intensity * 3}%) saturate(${100 + intensity * 4}%)`;
  beautyCtx.drawImage(canvas, 0, 0);
  if (beautyMask) {
    beautyCtx.globalCompositeOperation = 'destination-in';
    beautyCtx.drawImage(beautyMask, 0, 0);
    beautyCtx.globalCompositeOperation = 'source-over';
  }
  ctx.globalCompositeOperation = 'soft-light';
  // Up to 38% at max — visible glamour lift
  ctx.globalAlpha = Math.min(0.38, intensity * 0.38);
  ctx.drawImage(beautyCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5f: Glow Accent
 * Three-point radial glow on forehead and cheeks.
 *
 * Input range: 0–24 (PORTRAIT_CONTROL_LIMITS.glowUp)
 */
export function applyGlowAccent(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  guide: ScaledPortraitGuide,
  glowUp: number,
  skinMaskCanvas: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, glowUp / LIMITS.glowUp);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = canvas.width;
  glowCanvas.height = canvas.height;
  const glowCtx = glowCanvas.getContext('2d')!;
  const glowPoints = [
    { x: guide.center.x, y: guide.forehead.y + guide.bounds.height * 0.24, radius: guide.bounds.width * 0.22 },
    { x: guide.center.x - guide.bounds.width * 0.16, y: guide.nose.y + guide.bounds.height * 0.08, radius: guide.bounds.width * 0.16 },
    { x: guide.center.x + guide.bounds.width * 0.16, y: guide.nose.y + guide.bounds.height * 0.08, radius: guide.bounds.width * 0.16 }
  ];
  glowPoints.forEach((point) => {
    const glow = glowCtx.createRadialGradient(point.x, point.y, point.radius * 0.12, point.x, point.y, point.radius);
    glow.addColorStop(0, `rgba(255, 224, 205, ${(intensity * 0.35).toFixed(3)})`);
    glow.addColorStop(0.65, `rgba(255, 214, 192, ${(intensity * 0.18).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    glowCtx.fillStyle = glow;
    glowCtx.beginPath();
    glowCtx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    glowCtx.fill();
  });
  if (skinMaskCanvas) {
    glowCtx.globalCompositeOperation = 'destination-in';
    glowCtx.drawImage(skinMaskCanvas, 0, 0);
    glowCtx.globalCompositeOperation = 'source-over';
  }
  ctx.globalCompositeOperation = 'screen';
  // Up to 35% at max — visible skin glow
  ctx.globalAlpha = Math.min(0.35, intensity * 0.35);
  ctx.drawImage(glowCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5g: Expression Lift — Subtle Cheek Luminosity
 *
 * Redesigned to eliminate the visible bloom/halo around the mouth.
 * Instead of large warm-colored radial gradients, this now uses:
 * - Much tighter radii focused on cheekbone highlights, not mouth area
 * - Neutral skin-adjacent tones instead of warm orange
 * - soft-light blend mode instead of screen (avoids bright halo)
 * - Very low gradient stop opacities with no sharp falloff
 *
 * The result: a subtle lift in cheekbone luminosity that mimics
 * professional contouring without any visible bloom or color cast.
 *
 * Input range: 0–24 (PORTRAIT_CONTROL_LIMITS.expressionLift)
 */
export function applyExpressionLift(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  guide: ScaledPortraitGuide,
  expressionLift: number,
  faceInnerMaskCanvas: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, expressionLift / LIMITS.expressionLift);
  const liftCanvas = document.createElement('canvas');
  liftCanvas.width = canvas.width;
  liftCanvas.height = canvas.height;
  const liftCtx = liftCanvas.getContext('2d')!;

  // Cheekbone highlight points — outer cheeks at mid-face height.
  // Wider radius (0.28) for clear visibility, centered at cheekbone ridge.
  const cheekY = guide.nose.y - guide.bounds.height * 0.05;
  const cheekSpreadX = guide.bounds.width * 0.28;
  const cheekRadius = guide.bounds.width * 0.22; // wider radius — actually covers the cheek

  const cheekPoints = [
    { x: guide.center.x - cheekSpreadX, y: cheekY },
    { x: guide.center.x + cheekSpreadX, y: cheekY }
  ];

  cheekPoints.forEach((point) => {
    const glow = liftCtx.createRadialGradient(
      point.x, point.y, 0,
      point.x, point.y, cheekRadius
    );
    // More opaque center so it's actually visible
    glow.addColorStop(0, `rgba(255, 242, 230, ${(intensity * 0.55).toFixed(3)})`);
    glow.addColorStop(0.45, `rgba(252, 238, 222, ${(intensity * 0.28).toFixed(3)})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    liftCtx.fillStyle = glow;
    liftCtx.beginPath();
    liftCtx.arc(point.x, point.y, cheekRadius, 0, Math.PI * 2);
    liftCtx.fill();
  });

  // Do NOT clip to faceInnerMaskCanvas — it cuts off cheek area which lives near the face edge.
  // Instead use the full face oval mask if available, or draw unmasked (cheek gradients are
  // constrained by their own radius so background bleed is minimal).
  if (faceInnerMaskCanvas) {
    // Only apply a light clip — don't require full inner face coverage
    liftCtx.globalAlpha = 0.85;
    liftCtx.globalCompositeOperation = 'destination-in';
    liftCtx.drawImage(faceInnerMaskCanvas, 0, 0);
    liftCtx.globalCompositeOperation = 'source-over';
    liftCtx.globalAlpha = 1;
  }

  // overlay mode gives a stronger lift than soft-light while staying natural
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = Math.min(0.65, 0.15 + intensity * 0.50);
  ctx.drawImage(liftCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5h: Jaw Definition
 * Subtle contour shadow along the jawline.
 *
 * Input range: 0–26 (PORTRAIT_CONTROL_LIMITS.jawDefinition)
 */
export function applyJawDefinition(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  guide: ScaledPortraitGuide,
  jawDefinition: number
): void {
  const intensity = Math.min(1, jawDefinition / LIMITS.jawDefinition);
  const jawCanvas = document.createElement('canvas');
  jawCanvas.width = canvas.width;
  jawCanvas.height = canvas.height;
  const jawCtx = jawCanvas.getContext('2d')!;

  const lineW = Math.max(3, guide.bounds.width * 0.024);
  const blurR = Math.max(5, guide.bounds.width * 0.022);
  jawCtx.lineCap = 'round';
  jawCtx.filter = `blur(${blurR}px)`;

  // Jaw Definition: two diagonal strokes tracing the actual jaw bone.
  // The jaw bone runs from the ear/jaw-corner (outer face edge, ~15% above chin)
  // curving inward to the lateral chin sides.
  //
  // We do NOT use mouthLeft.y — that's at lip level (too low, lands on beard/mouth).
  // Correct jaw corner Y: chin.y minus ~18% of face height  (ear-lobe level laterally).
  // Correct jaw corner X: outer face edge (bounds.x for left, bounds.x+width for right).
  //
  // Each stroke: jaw corner → lateral chin (center ± 14% width, chin.y)
  const jawCornerY   = guide.chin.y - guide.bounds.height * 0.18;
  const jawCornerLX  = guide.bounds.x + guide.bounds.width * 0.04;  // outer left
  const jawCornerRX  = guide.bounds.x + guide.bounds.width * 0.96;  // outer right
  const jawChinY     = guide.chin.y - guide.bounds.height * 0.01;
  const jawChinLX    = guide.center.x - guide.bounds.width * 0.14;
  const jawChinRX    = guide.center.x + guide.bounds.width * 0.14;
  // quadratic control: midpoint pulled slightly outward for a natural jaw curve
  const jawCtrlLX = guide.center.x - guide.bounds.width * 0.32;
  const jawCtrlRX = guide.center.x + guide.bounds.width * 0.32;
  const jawCtrlY  = (jawCornerY + jawChinY) / 2 + guide.bounds.height * 0.01;

  // Primary definition stroke
  jawCtx.lineWidth = lineW;
  jawCtx.strokeStyle = `rgba(28, 18, 8, ${(intensity * 0.62).toFixed(3)})`;
  jawCtx.beginPath();
  jawCtx.moveTo(jawCornerLX, jawCornerY);
  jawCtx.quadraticCurveTo(jawCtrlLX, jawCtrlY, jawChinLX, jawChinY);
  jawCtx.stroke();
  jawCtx.beginPath();
  jawCtx.moveTo(jawCornerRX, jawCornerY);
  jawCtx.quadraticCurveTo(jawCtrlRX, jawCtrlY, jawChinRX, jawChinY);
  jawCtx.stroke();

  // Wider feathered pass for soft depth
  jawCtx.lineWidth = lineW * 2.4;
  jawCtx.strokeStyle = `rgba(18, 10, 4, ${(intensity * 0.24).toFixed(3)})`;
  jawCtx.beginPath();
  jawCtx.moveTo(jawCornerLX, jawCornerY);
  jawCtx.quadraticCurveTo(jawCtrlLX, jawCtrlY, jawChinLX, jawChinY);
  jawCtx.stroke();
  jawCtx.beginPath();
  jawCtx.moveTo(jawCornerRX, jawCornerY);
  jawCtx.quadraticCurveTo(jawCtrlRX, jawCtrlY, jawChinRX, jawChinY);
  jawCtx.stroke();

  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = Math.min(0.82, 0.22 + intensity * 0.60);
  ctx.drawImage(jawCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5i: Eye Brightening
 * High-frequency luminosity boost for eyes.
 */
export function applyEyeBrightening(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  eyeBrightening: number,
  eyeMaskCanvas: HTMLCanvasElement | null
): void {
  const intensity = Math.min(1, eyeBrightening / LIMITS.eyeBrightening);
  if (intensity <= 0 || !eyeMaskCanvas) return;

  const eyeCanvas = document.createElement('canvas');
  eyeCanvas.width = canvas.width;
  eyeCanvas.height = canvas.height;
  const eyeCtx = eyeCanvas.getContext('2d')!;

  // Strong brightness + clarity lift on the eye area
  eyeCtx.filter = `brightness(${100 + intensity * 28}%) contrast(${100 + intensity * 16}%) saturate(${100 + intensity * 14}%)`;
  eyeCtx.drawImage(canvas, 0, 0);

  // Clip to eye mask (now correctly sized to iris/sclera, not eyelids)
  eyeCtx.globalCompositeOperation = 'destination-in';
  eyeCtx.drawImage(eyeMaskCanvas, 0, 0);
  eyeCtx.globalCompositeOperation = 'source-over';

  // Raise the base alpha floor so brightening is visible at mid-range slider values
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = Math.min(0.70, 0.22 + intensity * 0.48);
  ctx.drawImage(eyeCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 0.5z: Feature Protection
 * Restores original detail to eyes, brows, and mouth after smoothing passes.
 */
export function applyFeatureProtection(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  protectedDetailSource: HTMLCanvasElement,
  featureProtectMaskCanvas: HTMLCanvasElement,
  portraitSmooth: number,
  skinPolish: number
): void {
  const smoothIntensity = Math.min(1, portraitSmooth / LIMITS.skinSmoothing);
  const polishIntensity = Math.min(1, skinPolish / LIMITS.skinPolish);
  const detailCanvas = document.createElement('canvas');
  detailCanvas.width = canvas.width;
  detailCanvas.height = canvas.height;
  const detailCtx = detailCanvas.getContext('2d');
  if (detailCtx) {
    detailCtx.drawImage(protectedDetailSource, 0, 0);
    detailCtx.globalCompositeOperation = 'destination-in';
    detailCtx.drawImage(featureProtectMaskCanvas, 0, 0);
    detailCtx.globalCompositeOperation = 'source-over';
    // Protection scales with how much smoothing/polish was applied
    ctx.globalAlpha = Math.min(0.85, 0.44 + smoothIntensity * 0.22 + polishIntensity * 0.15);
    ctx.drawImage(detailCanvas, 0, 0);
    ctx.globalAlpha = 1;
  }
}
