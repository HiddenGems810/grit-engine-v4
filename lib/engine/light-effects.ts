export function applyFilmHalation(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  halation: number,
  inkBleed: number,
  gradientMap: string,
  monochrome: boolean
): void {
  if (halation <= 0 || monochrome) return;

  const localBlurRadius = (inkBleed / 100) * 4;
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = halation / 100;
  
  // Intense glow. If gradient map exists, we don't apply the sepia/hue shift to the bloom since it messes up thermal colors
  ctx.filter = gradientMap !== 'none'
    ? `blur(${localBlurRadius + 15}px) saturate(200%)`
    : `blur(${localBlurRadius + 15}px) saturate(400%) contrast(180%) sepia(80%) hue-rotate(-20deg)`;

  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = canvas.width;
  bloomCanvas.height = canvas.height;
  bloomCanvas.getContext('2d')!.drawImage(canvas, 0, 0);

  ctx.drawImage(bloomCanvas, 0, 0);
  ctx.filter = 'none';
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}

export function applyLightLeaks(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  lightLeak: number,
  lightLeakStyle: string
): void {
  if (lightLeak <= 0) return;

  ctx.globalCompositeOperation = 'screen';
  const leakStrength = lightLeak / 100;
  
  const palette = {
    amber: ['255, 86, 14', '255, 182, 73', '255, 38, 0'],
    rose: ['255, 84, 124', '255, 190, 214', '255, 122, 170'],
    prism: ['114, 204, 255', '255, 122, 214', '255, 204, 92'],
    sunset: ['255, 130, 54', '255, 92, 92', '255, 208, 120'],
    frost: ['158, 214, 255', '230, 244, 255', '180, 220, 255']
  }[lightLeakStyle as 'amber' | 'rose' | 'prism' | 'sunset' | 'frost'] ?? ['255, 86, 14', '255, 182, 73', '255, 38, 0'];

  const radialA = ctx.createRadialGradient(
    canvas.width * 0.08, canvas.height * 0.18, 0, 
    canvas.width * 0.08, canvas.height * 0.18, canvas.width * 0.42
  );
  radialA.addColorStop(0, `rgba(${palette[0]}, ${(leakStrength * 0.95).toFixed(3)})`);
  radialA.addColorStop(0.35, `rgba(${palette[1]}, ${(leakStrength * 0.45).toFixed(3)})`);
  radialA.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radialA;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const radialB = ctx.createRadialGradient(
    canvas.width * 0.88, canvas.height * 0.82, 0, 
    canvas.width * 0.88, canvas.height * 0.82, canvas.width * 0.38
  );
  radialB.addColorStop(0, `rgba(${palette[2]}, ${(leakStrength * 0.7).toFixed(3)})`);
  radialB.addColorStop(0.4, `rgba(${palette[1]}, ${(leakStrength * 0.28).toFixed(3)})`);
  radialB.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = radialB;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (lightLeakStyle === 'prism') {
    const prismBand = ctx.createLinearGradient(0, canvas.height * 0.1, canvas.width, canvas.height * 0.7);
    prismBand.addColorStop(0, 'rgba(0,0,0,0)');
    prismBand.addColorStop(0.35, `rgba(${palette[0]}, ${(leakStrength * 0.18).toFixed(3)})`);
    prismBand.addColorStop(0.55, `rgba(${palette[1]}, ${(leakStrength * 0.22).toFixed(3)})`);
    prismBand.addColorStop(0.75, `rgba(${palette[2]}, ${(leakStrength * 0.16).toFixed(3)})`);
    prismBand.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = prismBand;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.globalCompositeOperation = 'source-over';
}

export function applyPrismEdgeBlur(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  prismBlur: number
): void {
  if (prismBlur <= 0) return;

  const pbCanvas = document.createElement('canvas');
  pbCanvas.width = canvas.width;
  pbCanvas.height = canvas.height;
  const pbCtx = pbCanvas.getContext('2d')!;
  
  // Blur the heavy edges
  pbCtx.filter = `blur(${prismBlur / 3}px) saturate(150%)`;
  pbCtx.drawImage(canvas, 0, 0);

  // Mask it via radial gradient
  const grad = pbCtx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.25, 
    canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) * 0.7
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,1)');
  
  pbCtx.globalCompositeOperation = 'destination-in';
  pbCtx.fillStyle = grad;
  pbCtx.fillRect(0, 0, pbCanvas.width, pbCanvas.height);

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.85;
  ctx.drawImage(pbCanvas, 0, 0);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}

type SeededRNG = () => number;

export function applyOpticalFinish(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  opticalProfile: string,
  strength: number,
  rng: SeededRNG,
  faceProtection: boolean
): void {
  if (opticalProfile === 'none' || strength <= 0) return;

  const amount = Math.min(1, strength / 100);
  const bloomCanvas = document.createElement('canvas');
  bloomCanvas.width = canvas.width;
  bloomCanvas.height = canvas.height;
  const bloomCtx = bloomCanvas.getContext('2d')!;
  bloomCtx.filter = `brightness(145%) contrast(170%) blur(${4 + amount * 18}px)`;
  bloomCtx.drawImage(canvas, 0, 0);

  ctx.save();
  if (opticalProfile === 'pro-mist' || opticalProfile === 'glass-diffusion' || opticalProfile === 'lens-bloom') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(faceProtection ? 0.18 : 0.32, amount * (opticalProfile === 'pro-mist' ? 0.30 : 0.22));
    ctx.drawImage(bloomCanvas, 0, 0);
  }

  if (opticalProfile === 'anamorphic-streak' || opticalProfile === 'edge-glow') {
    const y = canvas.height * (0.28 + rng() * 0.28);
    const gradient = ctx.createLinearGradient(0, y, canvas.width, y);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.48, `rgba(160,205,255,${(amount * 0.26).toFixed(3)})`);
    gradient.addColorStop(0.52, `rgba(255,220,170,${(amount * 0.18).toFixed(3)})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y - 8 - amount * 16, canvas.width, 16 + amount * 32);
  }

  if (opticalProfile === 'lens-dirt') {
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = Math.min(0.14, amount * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 40 * amount; i += 1) {
      ctx.beginPath();
      ctx.arc(rng() * canvas.width, rng() * canvas.height, 1 + rng() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (opticalProfile === 'film-burn') {
    ctx.globalCompositeOperation = 'screen';
    const burn = ctx.createRadialGradient(0, canvas.height * 0.2, 0, 0, canvas.height * 0.2, canvas.width * 0.55);
    burn.addColorStop(0, `rgba(255,94,24,${(amount * 0.8).toFixed(3)})`);
    burn.addColorStop(0.35, `rgba(255,196,92,${(amount * 0.24).toFixed(3)})`);
    burn.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = burn;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.restore();
}
