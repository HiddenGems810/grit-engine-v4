/**
 * Grit Engine v4 — Sparkle / Star Filter Engine
 *
 * Scans highlights in the current canvas and renders 4-point star diffraction
 * patterns on the brightest pixels. Fully deterministic via seeded RNG.
 */

type SeededRNG = () => number;

interface HighlightCandidate {
  x: number;
  y: number;
  luma: number;
}

/**
 * Render sparkle/star filter effects on the provided canvas context.
 * Scans the canvas for near-white highlights and draws 4-point diffraction stars.
 */
export function renderSparkles(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  sparkles: number,
  rng: SeededRNG
): void {
  const scaleDown = 0.5;
  const spCanvas = document.createElement('canvas');
  spCanvas.width = canvas.width * scaleDown;
  spCanvas.height = canvas.height * scaleDown;
  const spCtx = spCanvas.getContext('2d')!;
  spCtx.drawImage(canvas, 0, 0, spCanvas.width, spCanvas.height);
  const spData = spCtx.getImageData(0, 0, spCanvas.width, spCanvas.height).data;

  ctx.globalCompositeOperation = 'screen';
  const thresholdLuma = 248;
  const step = 2;

  // Collect all valid highlight candidates
  const candidates: HighlightCandidate[] = [];
  for (let i = 0; i < spData.length; i += 4 * step) {
    const luma = 0.2126 * spData[i] + 0.7152 * spData[i + 1] + 0.0722 * spData[i + 2];
    if (luma > thresholdLuma) {
      const px = ((i / 4) % spCanvas.width) / scaleDown;
      const py = Math.floor((i / 4) / spCanvas.width) / scaleDown;
      candidates.push({ x: px, y: py, luma });
    }
  }

  // Sort by brightest first
  candidates.sort((a, b) => b.luma - a.luma);

  const maxStars = Math.floor(10 + sparkles * 1.5);
  const drawnStars: { x: number; y: number }[] = [];

  for (const cand of candidates) {
    if (drawnStars.length >= maxStars) break;

    // Anti-clumping: skip if another star is within 30px
    let tooClose = false;
    for (const d of drawnStars) {
      if (Math.hypot(d.x - cand.x, d.y - cand.y) < 30) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    drawnStars.push(cand);

    const lumaScale = (cand.luma - thresholdLuma) / (255 - thresholdLuma);
    const size = 15 + lumaScale * 40 + sparkles / 1.5;

    ctx.save();
    ctx.translate(cand.x, cand.y);
    ctx.rotate(rng() * 0.2 - 0.1);

    // Primary cross blades with rainbow split
    const gradX = ctx.createLinearGradient(-size, 0, size, 0);
    gradX.addColorStop(0, 'rgba(255,100,100,0)');
    gradX.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    gradX.addColorStop(0.48, 'rgba(255,255,255,1)');
    gradX.addColorStop(0.52, 'rgba(255,255,255,1)');
    gradX.addColorStop(0.7, 'rgba(255,255,255,0.4)');
    gradX.addColorStop(1, 'rgba(100,200,255,0)');

    const gradY = ctx.createLinearGradient(0, -size, 0, size);
    gradY.addColorStop(0, 'rgba(100,255,100,0)');
    gradY.addColorStop(0.3, 'rgba(255,255,255,0.4)');
    gradY.addColorStop(0.48, 'rgba(255,255,255,1)');
    gradY.addColorStop(0.52, 'rgba(255,255,255,1)');
    gradY.addColorStop(0.7, 'rgba(255,255,255,0.4)');
    gradY.addColorStop(1, 'rgba(200,100,255,0)');

    ctx.fillStyle = gradX;
    ctx.fillRect(-size, -0.6, size * 2, 1.2);
    ctx.fillStyle = gradY;
    ctx.fillRect(-0.6, -size, 1.2, size * 2);

    // Secondary diagonal blades
    ctx.rotate(Math.PI / 4);
    const subSize = size * 0.3;
    const gradD1 = ctx.createLinearGradient(-subSize, 0, subSize, 0);
    gradD1.addColorStop(0, 'rgba(255,255,255,0)');
    gradD1.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    gradD1.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradD1;
    ctx.fillRect(-subSize, -0.5, subSize * 2, 1);

    const gradD2 = ctx.createLinearGradient(0, -subSize, 0, subSize);
    gradD2.addColorStop(0, 'rgba(255,255,255,0)');
    gradD2.addColorStop(0.5, 'rgba(255,255,255,0.6)');
    gradD2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradD2;
    ctx.fillRect(-0.5, -subSize, 1, subSize * 2);
    ctx.rotate(-Math.PI / 4);

    // Hard core glow
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.08, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Soft halo
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
    const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.25);
    haloGrad.addColorStop(0, 'rgba(255,255,255,1)');
    haloGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = haloGrad;
    ctx.fill();

    ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over';
}
