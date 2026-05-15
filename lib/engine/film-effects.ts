/**
 * Grit Engine v4 — Film Effects Engine
 *
 * Pure canvas functions for film-analog post-processing effects:
 * - Procedural noise/grain overlay
 * - Dust & scratches distress layer
 * - Lens vignette
 *
 * All effects are deterministic via seeded RNG and operate directly on ctx.
 */

type SeededRNG = () => number;

/**
 * PASS 5: Procedural Noise/Grain Engine
 * Generates a 128×128 noise tile and overlays it as a repeating pattern.
 */
export function renderGrain(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  grain: number,
  monochrome: boolean,
  rng: SeededRNG
): void {
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 128;
  patternCanvas.height = 128;
  const pCtx = patternCanvas.getContext('2d')!;
  const pData = pCtx.createImageData(128, 128);

  for (let i = 0; i < pData.data.length; i += 4) {
    const val = rng() * 255;
    pData.data[i] = val;
    pData.data[i + 1] = monochrome ? val : rng() * 255;
    pData.data[i + 2] = monochrome ? val : rng() * 255;
    pData.data[i + 3] = (grain / 100) * 255;
  }
  pCtx.putImageData(pData, 0, 0);

  ctx.globalCompositeOperation = 'overlay';
  const ptrn = ctx.createPattern(patternCanvas, 'repeat');
  if (ptrn) {
    ctx.fillStyle = ptrn;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  }
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * PASS 6: Lens Vignette
 * Renders a radial gradient darkening from center to edges.
 */
export function renderVignette(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  vignette: number
): void {
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;
  const radius = Math.max(cx, cy) * 1.5;
  const gradient = ctx.createRadialGradient(
    cx, cy, radius * (1 - vignette / 100),
    cx, cy, radius
  );
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalCompositeOperation = 'source-over';
}

/**
 * Dust & Scratches distress layer.
 * Renders procedural scratches and dust particles as a screen overlay.
 */
export function renderDustAndScratches(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  dustAndScratches: number,
  rng: SeededRNG
): void {
  const distressCanvas = document.createElement('canvas');
  distressCanvas.width = canvasWidth;
  distressCanvas.height = canvasHeight;
  const distressCtx = distressCanvas.getContext('2d')!;
  const strength = dustAndScratches / 100;
  distressCtx.strokeStyle = `rgba(255,255,255,${(0.03 + strength * 0.08).toFixed(3)})`;
  distressCtx.lineCap = 'round';

  const scratchCount = Math.max(8, Math.round(20 + dustAndScratches * 0.8));
  for (let index = 0; index < scratchCount; index += 1) {
    const x = rng() * canvasWidth;
    const y = rng() * canvasHeight;
    const length = canvasHeight * (0.04 + rng() * 0.14);
    distressCtx.lineWidth = 0.4 + rng() * 1.2;
    distressCtx.beginPath();
    distressCtx.moveTo(x, y);
    distressCtx.lineTo(x + (rng() - 0.5) * canvasWidth * 0.025, y + length);
    distressCtx.stroke();
  }

  const dustCount = Math.max(30, Math.round(80 + dustAndScratches * 3));
  for (let index = 0; index < dustCount; index += 1) {
    const radius = 0.4 + rng() * 1.8;
    const alpha = 0.02 + rng() * 0.12 * strength;
    distressCtx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
    distressCtx.beginPath();
    distressCtx.arc(rng() * canvasWidth, rng() * canvasHeight, radius, 0, Math.PI * 2);
    distressCtx.fill();
  }

  distressCtx.filter = `blur(${0.2 + strength * 0.8}px)`;
  distressCtx.drawImage(distressCanvas, 0, 0);
  distressCtx.filter = 'none';
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = Math.min(0.2, 0.06 + strength * 0.12);
  ctx.drawImage(distressCanvas, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
