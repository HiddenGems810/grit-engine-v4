export function applyGradientMap(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  gradientMap: string
): void {
  if (gradientMap === 'none') return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    const t = luma / 255;
    let r, g, b;

    if (gradientMap === 'thermal') {
      if (t < 0.25) { r = 0; g = 0; b = Math.floor(t * 4 * 255); }
      else if (t < 0.5) { r = Math.floor((t - 0.25) * 4 * 255); g = 0; b = Math.floor(255 - (t - 0.25) * 4 * 255); }
      else if (t < 0.75) { r = 255; g = Math.floor((t - 0.5) * 4 * 255); b = 0; }
      else { r = 255; g = 255; b = Math.floor((t - 0.75) * 4 * 255); }
    } else if (gradientMap === 'cyberpunk') {
      if (t < 0.33) { r = Math.floor((t * 3) * 128); g = 0; b = Math.floor((t * 3) * 255); }
      else if (t < 0.66) { r = Math.floor(128 + ((t - 0.33) * 3) * 127); g = 0; b = Math.floor(255 - ((t - 0.33) * 3) * 255); }
      else { r = Math.floor(255 - ((t - 0.66) * 3) * 255); g = Math.floor(((t - 0.66) * 3) * 255); b = Math.floor(128 + ((t - 0.66) * 3) * 127); }
    } else if (gradientMap === 'nightvision') {
      r = Math.floor(t * t * 200); g = Math.floor(t * 255); b = Math.floor(t * t * 150);
    } else if (gradientMap === 'xray') {
      r = Math.floor((1 - t) * 50); g = Math.floor((1 - t) * 200); b = Math.floor((1 - t) * 255);
    } else {
      r = data[i]; g = data[i+1]; b = data[i+2];
    }

    data[i] = r; data[i+1] = g; data[i+2] = b;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function applyThresholdBitmap(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  threshold: number
): void {
  if (threshold <= 0) return;

  const bayer4x4 = [
     0,  8,  2, 10,
    12,  4, 14,  6,
     3, 11,  1,  9,
    15,  7, 13,  5
  ];
  // Normalize bayer matrix to center around 0 for additive luma shifting
  const bayerNorm = bayer4x4.map(v => (v / 16 - 0.5) * 255); 

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const width = canvas.width;
  
  for (let i = 0; i < data.length; i += 4) {
    const px = (i / 4) % width;
    const py = Math.floor((i / 4) / width);
    // Map pixel coordinates to 4x4 matrix
    const b = bayerNorm[(py % 4) * 4 + (px % 4)];
    
    // Base Luma
    const luma = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    
    // Add bayer bias to luma, then check against threshold
    const ditherIntensity = Math.min(1.0, threshold / 128); // max dither at half slider
    const v = (luma + (b * ditherIntensity) >= (255 - threshold)) ? 255 : 0;
    
    data[i] = data[i + 1] = data[i + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
}

export function applyHalftone(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  halftone: number
): void {
  if (halftone <= 0) return;

  const htSize = Math.max(2, halftone); // Base dot size
  const ht = document.createElement('canvas');
  ht.width = htSize;
  ht.height = htSize;
  const hCtx = ht.getContext('2d')!;
  
  // Radial dot structure
  const grad = hCtx.createRadialGradient(htSize/2, htSize/2, 0, htSize/2, htSize/2, htSize/1.2);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(1, '#000');
  
  hCtx.fillStyle = grad;
  hCtx.fillRect(0, 0, htSize, htSize);

  ctx.globalCompositeOperation = 'overlay';
  const ptrn = ctx.createPattern(ht, 'repeat');
  if (ptrn) {
    ctx.fillStyle = ptrn;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.globalCompositeOperation = 'source-over';
}

export function applyChromaticAberration(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  chromaOffset: number,
  monochrome: boolean
): void {
  if (chromaOffset <= 0 || monochrome) return;

  const shiftX = Math.floor((chromaOffset / 100) * 15); // Max 15px shift
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const copyData = new Uint8ClampedArray(data); // Copy original state
  
  const width = canvas.width;
  const height = canvas.height;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Red channel shifted left
      const rx = Math.max(0, x - shiftX);
      const ri = (y * width + rx) * 4;
      data[i] = copyData[ri];
      
      // Blue channel shifted right
      const bx = Math.min(width - 1, x + shiftX);
      const bi = (y * width + bx) * 4;
      data[i + 2] = copyData[bi + 2];
    }
  }
  ctx.putImageData(imgData, 0, 0);
}

export function applyScanlines(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  scanlines: number
): void {
  if (scanlines <= 0) return;

  const sc = document.createElement('canvas');
  sc.width = 4;
  sc.height = 4;
  const sCtx = sc.getContext('2d')!;
  sCtx.fillStyle = `rgba(0,0,0,${scanlines / 100})`;
  sCtx.fillRect(0, 0, 4, 2); // 2px horizontal line
  
  const sPtrn = ctx.createPattern(sc, 'repeat');
  if (sPtrn) {
    ctx.fillStyle = sPtrn;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
