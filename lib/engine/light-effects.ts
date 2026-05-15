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
