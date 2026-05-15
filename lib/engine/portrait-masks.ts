/**
 * Grit Engine v4 — Portrait Mask Builder
 *
 * Creates the composite mask system used by the portrait retouch stack.
 * Each mask is a grayscale canvas where white = full effect, black = no effect.
 * All functions are stateless and operate on raw canvas + portrait guide data.
 */

import type { PortraitGuide, PortraitPoint } from '../editor-config';
import { drawSmoothClosedPath, scalePointsFromCenter } from '../editor-config';

/** All generated portrait masks for a single render frame. */
export interface PortraitMasks {
  faceMaskCanvas: HTMLCanvasElement | null;
  faceInnerMaskCanvas: HTMLCanvasElement | null;
  eyeMaskCanvas: HTMLCanvasElement | null;
  browMaskCanvas: HTMLCanvasElement | null;
  mouthMaskCanvas: HTMLCanvasElement | null;
  skinMaskCanvas: HTMLCanvasElement | null;
  featureProtectMaskCanvas: HTMLCanvasElement | null;
  portraitBlendMaskCanvas: HTMLCanvasElement | null;
  // Pre-read alpha channels for per-pixel operations
  faceMaskAlpha: Uint8ClampedArray | null;
  faceInnerMaskAlpha: Uint8ClampedArray | null;
  eyeMaskAlpha: Uint8ClampedArray | null;
  skinMaskAlpha: Uint8ClampedArray | null;
  mouthMaskAlpha: Uint8ClampedArray | null;
  portraitBlendMaskAlpha: Uint8ClampedArray | null;
}

function createFeatureMaskCanvas(
  width: number,
  height: number,
  scaledGuide: PortraitGuide,
  points: PortraitPoint[],
  options?: { blur?: number; scaleX?: number; scaleY?: number; offsetY?: number }
): HTMLCanvasElement | null {
  if (points.length < 3) return null;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return null;

  const { blur = 18, scaleX = 1, scaleY = 1, offsetY = 0 } = options ?? {};
  const scaledPoints = scalePointsFromCenter(points, scaledGuide.center, scaleX, scaleY, offsetY);
  maskCtx.filter = `blur(${blur}px)`;
  maskCtx.fillStyle = '#ffffff';
  drawSmoothClosedPath(maskCtx, scaledPoints);
  maskCtx.fill();
  maskCtx.filter = 'none';
  return maskCanvas;
}

function createFaceMaskCanvas(
  width: number,
  height: number,
  scaledGuide: PortraitGuide,
  feather: number,
  heightMultiplier = 1.08,
  widthMultiplier = 1.03
): HTMLCanvasElement | null {
  return createFeatureMaskCanvas(width, height, scaledGuide, scaledGuide.faceOval, {
    blur: feather,
    scaleX: widthMultiplier,
    scaleY: heightMultiplier,
    offsetY: scaledGuide.bounds.height * 0.015,
  });
}

function createEllipseMaskCanvas(
  width: number,
  height: number,
  center: PortraitPoint,
  radiusX: number,
  radiusY: number,
  blur: number,
  angle = 0
): HTMLCanvasElement | null {
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = width;
  maskCanvas.height = height;
  const maskCtx = maskCanvas.getContext('2d');
  if (!maskCtx) return null;

  maskCtx.filter = `blur(${blur}px)`;
  maskCtx.fillStyle = '#ffffff';
  maskCtx.beginPath();
  maskCtx.ellipse(center.x, center.y, radiusX, radiusY, angle, 0, Math.PI * 2);
  maskCtx.fill();
  maskCtx.filter = 'none';
  return maskCanvas;
}

function readMaskAlpha(maskCanvas: HTMLCanvasElement | null, w: number, h: number): Uint8ClampedArray | null {
  return maskCanvas?.getContext('2d')?.getImageData(0, 0, w, h).data ?? null;
}

function combinePairMasks(
  width: number,
  height: number,
  scaledGuide: PortraitGuide,
  leftContour: PortraitPoint[],
  rightContour: PortraitPoint[],
  blur: number,
  scaleX: number,
  scaleY: number,
  offsetY: number
): HTMLCanvasElement | null {
  const combined = document.createElement('canvas');
  combined.width = width;
  combined.height = height;
  const combinedCtx = combined.getContext('2d');
  if (!combinedCtx) return null;
  const leftMask = createFeatureMaskCanvas(width, height, scaledGuide, leftContour, { blur, scaleX, scaleY, offsetY });
  const rightMask = createFeatureMaskCanvas(width, height, scaledGuide, rightContour, { blur, scaleX, scaleY, offsetY });
  if (leftMask) combinedCtx.drawImage(leftMask, 0, 0);
  if (rightMask) combinedCtx.drawImage(rightMask, 0, 0);
  return combined;
}

/**
 * Eye-specific mask that scales each eye contour around its OWN centroid.
 *
 * The generic combinePairMasks uses scaledGuide.center (face center) as the
 * scale origin. At scaleX < 1, this pushes the left eye right and the right
 * eye left — both drifting toward the nose bridge instead of staying on the
 * actual eye. This function computes each eye's centroid independently so
 * the shrunk contour stays centered on each pupil.
 */
function createEyePairMaskCanvas(
  width: number,
  height: number,
  leftContour: PortraitPoint[],
  rightContour: PortraitPoint[],
  scaleX: number,
  scaleY: number,
  blur: number
): HTMLCanvasElement | null {
  if (leftContour.length < 3 || rightContour.length < 3) return null;

  const centroid = (pts: PortraitPoint[]): PortraitPoint => ({
    x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
    y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
  });

  const drawEye = (ctx: CanvasRenderingContext2D, contour: PortraitPoint[], cx: PortraitPoint) => {
    // Scale each point around this eye's own centroid
    const scaled = contour.map(p => ({
      x: cx.x + (p.x - cx.x) * scaleX,
      y: cx.y + (p.y - cx.y) * scaleY,
    }));
    ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = '#ffffff';
    drawSmoothClosedPath(ctx, scaled);
    ctx.fill();
    ctx.filter = 'none';
  };

  const combined = document.createElement('canvas');
  combined.width = width;
  combined.height = height;
  const ctx = combined.getContext('2d');
  if (!ctx) return null;

  drawEye(ctx, leftContour, centroid(leftContour));
  drawEye(ctx, rightContour, centroid(rightContour));
  return combined;
}

/**
 * Create a single face-shaped mask canvas. Exported for use by specific passes
 * (e.g. jaw definition) that need a custom face mask configuration.
 */
export function createFaceMask(
  width: number,
  height: number,
  scaledGuide: PortraitGuide,
  feather: number,
  heightMultiplier = 1.08,
  widthMultiplier = 1.03
): HTMLCanvasElement | null {
  return createFaceMaskCanvas(width, height, scaledGuide, feather, heightMultiplier, widthMultiplier);
}

/**
 * Build the full set of portrait masks for a render frame.
 * Returns null if no portrait guide is available.
 */
export function buildPortraitMasks(
  canvasWidth: number,
  canvasHeight: number,
  scaledGuide: PortraitGuide | null,
  effectiveBeautyBoost: number,
  effectiveSkinPolish: number
): PortraitMasks {
  const empty: PortraitMasks = {
    faceMaskCanvas: null, faceInnerMaskCanvas: null, eyeMaskCanvas: null,
    browMaskCanvas: null, mouthMaskCanvas: null, skinMaskCanvas: null,
    featureProtectMaskCanvas: null, portraitBlendMaskCanvas: null,
    faceMaskAlpha: null, faceInnerMaskAlpha: null, eyeMaskAlpha: null,
    skinMaskAlpha: null, mouthMaskAlpha: null, portraitBlendMaskAlpha: null,
  };

  if (!scaledGuide) return empty;

  const w = canvasWidth;
  const h = canvasHeight;

  const faceMaskCanvas = createFaceMaskCanvas(
    w, h, scaledGuide,
    24 + effectiveBeautyBoost * 0.06 + effectiveSkinPolish * 0.05,
    1.1, 1.05
  );

  const faceInnerMaskCanvas = createFeatureMaskCanvas(w, h, scaledGuide, scaledGuide.faceOval, {
    blur: 18 + effectiveBeautyBoost * 0.05,
    scaleX: 0.958,
    scaleY: 0.98,
    offsetY: scaledGuide.bounds.height * 0.018,
  });

  const neckBlendMaskCanvas = createEllipseMaskCanvas(
    w, h,
    { x: scaledGuide.center.x, y: scaledGuide.chin.y + scaledGuide.bounds.height * 0.14 },
    scaledGuide.bounds.width * 0.42,
    scaledGuide.bounds.height * 0.2,
    28
  );

  // Eye mask: uses createEyePairMaskCanvas which scales each eye around its OWN centroid.
  // scaleX=0.82 (slight horizontal inset to avoid lid corners),
  // scaleY=0.72 (taller compression to avoid upper/lower lash lines).
  // blur=3px: tight feather so the mask edge is clean on the actual eyeball.
  const eyeMaskCanvas = createEyePairMaskCanvas(
    w, h,
    scaledGuide.leftEyeContour, scaledGuide.rightEyeContour,
    0.82, 0.72, 3
  );

  const browMaskCanvas = combinePairMasks(
    w, h, scaledGuide,
    scaledGuide.leftBrowContour, scaledGuide.rightBrowContour,
    4, 1.12, 1.35, -scaledGuide.bounds.height * 0.008
  );

  // Mouth mask — when lips are closed mouthBottom ≈ mouthTop so radiusY collapses to near-zero.
  // Use a robust minimum of 9% face height so Teeth Whitening always has coverage.
  const mouthWidth = Math.max(16, Math.abs(scaledGuide.mouthRight.x - scaledGuide.mouthLeft.x) * 0.46);
  const mouthHeight = Math.max(
    scaledGuide.bounds.height * 0.09,
    Math.abs(scaledGuide.mouthBottom.y - scaledGuide.mouthTop.y) * 2.6 + scaledGuide.bounds.height * 0.028
  );
  const mouthMaskCanvas = createEllipseMaskCanvas(
    w, h,
    scaledGuide.mouthCenter,
    mouthWidth,
    mouthHeight,
    5,
    Math.atan2(scaledGuide.mouthRight.y - scaledGuide.mouthLeft.y, scaledGuide.mouthRight.x - scaledGuide.mouthLeft.x)
  );

  // Skin mask = face inner minus eyes, brows, mouth
  const skinMaskCanvas = faceInnerMaskCanvas
    ? (() => {
        const skinMask = document.createElement('canvas');
        skinMask.width = w;
        skinMask.height = h;
        const skinCtx = skinMask.getContext('2d');
        if (!skinCtx) return null;
        skinCtx.drawImage(faceInnerMaskCanvas, 0, 0);
        skinCtx.globalCompositeOperation = 'destination-out';
        if (eyeMaskCanvas) skinCtx.drawImage(eyeMaskCanvas, 0, 0);
        if (browMaskCanvas) skinCtx.drawImage(browMaskCanvas, 0, 0);
        if (mouthMaskCanvas) skinCtx.drawImage(mouthMaskCanvas, 0, 0);
        skinCtx.globalCompositeOperation = 'source-over';
        return skinMask;
      })()
    : null;

  // Feature protect mask = eyes + brows + partial mouth
  const featureProtectMaskCanvas = (() => {
    const protectMask = document.createElement('canvas');
    protectMask.width = w;
    protectMask.height = h;
    const protectCtx = protectMask.getContext('2d');
    if (!protectCtx) return null;
    if (eyeMaskCanvas) protectCtx.drawImage(eyeMaskCanvas, 0, 0);
    if (browMaskCanvas) protectCtx.drawImage(browMaskCanvas, 0, 0);
    if (mouthMaskCanvas) {
      protectCtx.globalAlpha = 0.68;
      protectCtx.drawImage(mouthMaskCanvas, 0, 0);
      protectCtx.globalAlpha = 1;
    }
    return protectMask;
  })();

  // Portrait blend mask = face + soft neck
  const portraitBlendMaskCanvas = faceMaskCanvas
    ? (() => {
        const blendMask = document.createElement('canvas');
        blendMask.width = w;
        blendMask.height = h;
        const blendCtx = blendMask.getContext('2d');
        if (!blendCtx) return null;
        blendCtx.globalAlpha = 1;
        blendCtx.drawImage(faceMaskCanvas, 0, 0);
        if (neckBlendMaskCanvas) {
          blendCtx.globalAlpha = 0.22;
          blendCtx.drawImage(neckBlendMaskCanvas, 0, 0);
          blendCtx.globalAlpha = 1;
        }
        return blendMask;
      })()
    : neckBlendMaskCanvas;

  return {
    faceMaskCanvas,
    faceInnerMaskCanvas,
    eyeMaskCanvas,
    browMaskCanvas,
    mouthMaskCanvas,
    skinMaskCanvas,
    featureProtectMaskCanvas,
    portraitBlendMaskCanvas,
    faceMaskAlpha: readMaskAlpha(faceMaskCanvas, w, h),
    faceInnerMaskAlpha: readMaskAlpha(faceInnerMaskCanvas, w, h),
    eyeMaskAlpha: readMaskAlpha(eyeMaskCanvas, w, h),
    skinMaskAlpha: readMaskAlpha(skinMaskCanvas, w, h),
    mouthMaskAlpha: readMaskAlpha(mouthMaskCanvas, w, h),
    portraitBlendMaskAlpha: readMaskAlpha(portraitBlendMaskCanvas, w, h),
  };
}
