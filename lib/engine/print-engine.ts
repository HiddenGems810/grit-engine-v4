import type { DotShape, PrintSettings } from '@/lib/materials/material-types';

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const bayer8 = [
  0, 48, 12, 60, 3, 51, 15, 63,
  32, 16, 44, 28, 35, 19, 47, 31,
  8, 56, 4, 52, 11, 59, 7, 55,
  40, 24, 36, 20, 43, 27, 39, 23,
  2, 50, 14, 62, 1, 49, 13, 61,
  34, 18, 46, 30, 33, 17, 45, 29,
  10, 58, 6, 54, 9, 57, 5, 53,
  42, 26, 38, 22, 41, 25, 37, 21
].map((value) => (value + 0.5) / 64);

export const applyOrderedDitherToImageData = (imageData: ImageData, strength: number, bitDepth: number): ImageData => {
  const data = new Uint8ClampedArray(imageData.data);
  const levels = Math.max(2, 2 ** bitDepth);
  const amount = clamp(strength, 0, 100) / 100;
  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const i = (y * imageData.width + x) * 4;
      const threshold = bayer8[(y % 8) * 8 + (x % 8)] - 0.5;
      const source = luma(data[i], data[i + 1], data[i + 2]) / 255;
      const quantized = Math.round(clamp(source + threshold * amount * 0.55, 0, 1) * (levels - 1)) / (levels - 1);
      const v = Math.round(quantized * 255);
      data[i] = data[i] + (v - data[i]) * amount;
      data[i + 1] = data[i + 1] + (v - data[i + 1]) * amount;
      data[i + 2] = data[i + 2] + (v - data[i + 2]) * amount;
    }
  }
  return new ImageData(data, imageData.width, imageData.height);
};

export const applyErrorDiffusionToImageData = (imageData: ImageData, strength: number): ImageData => {
  const width = imageData.width;
  const height = imageData.height;
  const amount = clamp(strength, 0, 100) / 100;
  const gray = new Float32Array(width * height);
  const data = new Uint8ClampedArray(imageData.data);

  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    gray[i] = luma(data[offset], data[offset + 1], data[offset + 2]);
  }

  const distribute = (x: number, y: number, error: number, factor: number) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    gray[y * width + x] += error * factor;
  };

  for (let y = 0; y < height; y += 1) {
    const serpentine = y % 2 === 1;
    for (let step = 0; step < width; step += 1) {
      const x = serpentine ? width - 1 - step : step;
      const index = y * width + x;
      const oldValue = gray[index];
      const newValue = oldValue < 128 ? 0 : 255;
      const error = oldValue - newValue;
      gray[index] = newValue;

      const dir = serpentine ? -1 : 1;
      distribute(x + dir, y, error, 7 / 16);
      distribute(x - dir, y + 1, error, 3 / 16);
      distribute(x, y + 1, error, 5 / 16);
      distribute(x + dir, y + 1, error, 1 / 16);
    }
  }

  for (let i = 0; i < gray.length; i += 1) {
    const offset = i * 4;
    const v = clamp(gray[i], 0, 255);
    data[offset] = data[offset] + (v - data[offset]) * amount;
    data[offset + 1] = data[offset + 1] + (v - data[offset + 1]) * amount;
    data[offset + 2] = data[offset + 2] + (v - data[offset + 2]) * amount;
  }

  return new ImageData(data, width, height);
};

const drawDot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  shape: DotShape
) => {
  ctx.beginPath();
  if (shape === 'square') {
    ctx.rect(x - radius, y - radius, radius * 2, radius * 2);
  } else if (shape === 'diamond') {
    ctx.moveTo(x, y - radius);
    ctx.lineTo(x + radius, y);
    ctx.lineTo(x, y + radius);
    ctx.lineTo(x - radius, y);
    ctx.closePath();
  } else if (shape === 'line') {
    ctx.rect(x - radius * 1.5, y - radius * 0.35, radius * 3, Math.max(1, radius * 0.7));
  } else if (shape === 'elliptical') {
    ctx.ellipse(x, y, radius * 1.25, radius * 0.82, Math.PI * 0.18, 0, Math.PI * 2);
  } else {
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  }
  ctx.fill();
};

export const renderAMHalftone = (
  source: ImageData,
  settings: PrintSettings,
  options: { transparent?: boolean; inkStyle?: string } = {}
): HTMLCanvasElement => {
  const out = document.createElement('canvas');
  out.width = source.width;
  out.height = source.height;
  const ctx = out.getContext('2d')!;
  if (!options.transparent) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, out.width, out.height);
  }
  const spacing = clamp(settings.frequency, 4, 32);
  const angle = settings.angle * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  ctx.fillStyle = options.inkStyle ?? 'black';

  for (let y = 0; y < source.height; y += spacing) {
    for (let x = 0; x < source.width; x += spacing) {
      const sx = clamp(Math.round(x), 0, source.width - 1);
      const sy = clamp(Math.round(y), 0, source.height - 1);
      const offset = (sy * source.width + sx) * 4;
      const darkness = 1 - luma(source.data[offset], source.data[offset + 1], source.data[offset + 2]) / 255;
      const radius = spacing * 0.52 * Math.sqrt(clamp(darkness + settings.dotGain / 220, 0, 1));
      if (radius < 0.2) continue;
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      drawDot(ctx, rx * cos + ry * sin, -rx * sin + ry * cos, radius, settings.dotShape);
    }
  }
  return out;
};

const extractPrintChannel = (source: ImageData, channel: 'c' | 'm' | 'y' | 'k'): ImageData => {
  const data = new Uint8ClampedArray(source.data.length);
  for (let i = 0; i < source.data.length; i += 4) {
    const r = source.data[i] / 255;
    const g = source.data[i + 1] / 255;
    const b = source.data[i + 2] / 255;
    const k = 1 - Math.max(r, g, b);
    const denom = Math.max(0.0001, 1 - k);
    const c = (1 - r - k) / denom;
    const m = (1 - g - k) / denom;
    const y = (1 - b - k) / denom;
    const amount = channel === 'c' ? c : channel === 'm' ? m : channel === 'y' ? y : k;
    const value = Math.round((1 - clamp(amount, 0, 1)) * 255);
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = source.data[i + 3];
  }
  return new ImageData(data, source.width, source.height);
};

const applyCmykHalftone = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PrintSettings) => {
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const channels = [
    { key: 'c' as const, color: 'rgba(0,170,210,0.42)', angle: 15, dx: -settings.misregistration },
    { key: 'm' as const, color: 'rgba(220,0,120,0.38)', angle: 75, dx: settings.misregistration },
    { key: 'y' as const, color: 'rgba(245,205,0,0.32)', angle: 0, dx: 0 },
    { key: 'k' as const, color: 'rgba(0,0,0,0.50)', angle: 45, dx: 0 }
  ];
  ctx.save();
  ctx.fillStyle = settings.paperTooth > 0 ? 'rgba(246,242,232,0.45)' : 'white';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'multiply';
  channels.forEach((channel) => {
    const channelSource = extractPrintChannel(source, channel.key);
    const layer = renderAMHalftone(
      channelSource,
      { ...settings, angle: channel.angle, frequency: settings.frequency + 2 },
      { transparent: true, inkStyle: channel.color }
    );
    ctx.globalAlpha = clamp(settings.strength / 100, 0, 0.92);
    ctx.drawImage(layer, channel.dx, 0);
  });
  ctx.restore();
};

const applyRisograph = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PrintSettings) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const amount = clamp(settings.strength, 0, 100) / 100;
  const palettes: Record<string, [number, number, number][]> = {
    'pink-blue': [[238, 73, 145], [30, 95, 190], [30, 28, 24]],
    'green-black': [[46, 150, 92], [20, 20, 20], [230, 222, 190]],
    'orange-teal': [[236, 108, 50], [20, 145, 150], [30, 25, 20]]
  };
  const palette = palettes[settings.palette] ?? palettes['pink-blue'];
  for (let i = 0; i < data.length; i += 4) {
    const tone = luma(data[i], data[i + 1], data[i + 2]) / 255;
    const color = tone > 0.68 ? palette[0] : tone > 0.34 ? palette[1] : palette[2];
    data[i] = data[i] + (color[0] - data[i]) * amount;
    data[i + 1] = data[i + 1] + (color[1] - data[i + 1]) * amount;
    data[i + 2] = data[i + 2] + (color[2] - data[i + 2]) * amount;
  }
  ctx.putImageData(imageData, 0, 0);
  if (settings.misregistration > 0) {
    ctx.save();
    ctx.globalAlpha = amount * 0.18;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(canvas, settings.misregistration, 0);
    ctx.restore();
  }
};

const applyXerox = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, settings: PrintSettings) => {
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const amount = clamp(settings.strength, 0, 100) / 100;
  for (let y = 0; y < canvas.height; y += 1) {
    const band = Math.sin(y / 9) * 12 * amount;
    for (let x = 0; x < canvas.width; x += 1) {
      const i = (y * canvas.width + x) * 4;
      const v = luma(data[i], data[i + 1], data[i + 2]) + band;
      const crush = v > 132 - settings.dotGain * 0.35 ? 245 : 18;
      const speckle = ((x * 17 + y * 31) % 97) < settings.inkSpread * 0.4 ? -55 : 0;
      const out = clamp(crush + speckle, 0, 255);
      data[i] = data[i] + (out - data[i]) * amount;
      data[i + 1] = data[i + 1] + (out - data[i + 1]) * amount;
      data[i + 2] = data[i + 2] + (out - data[i + 2]) * amount;
    }
  }
  ctx.putImageData(imageData, 0, 0);
};

export const normalizePrintSettings = (settings: Partial<PrintSettings>): PrintSettings => ({
  mode: settings.mode ?? 'none',
  strength: clamp(settings.strength ?? 0, 0, 100),
  frequency: clamp(settings.frequency ?? 10, 3, 40),
  angle: clamp(settings.angle ?? 45, -90, 90),
  dotShape: settings.dotShape ?? 'round',
  dotGain: clamp(settings.dotGain ?? 0, 0, 100),
  inkSpread: clamp(settings.inkSpread ?? 0, 0, 100),
  paperTooth: clamp(settings.paperTooth ?? 0, 0, 100),
  misregistration: clamp(settings.misregistration ?? 0, 0, 12),
  palette: settings.palette ?? 'standard',
  faceProtection: settings.faceProtection ?? true,
  edgeProtection: settings.edgeProtection ?? true,
  preserveMidtones: settings.preserveMidtones ?? true,
  outputBitDepth: settings.outputBitDepth ?? 4,
  ditherAlgorithm: settings.ditherAlgorithm ?? 'bayer8'
});

export const applyPrintEngine = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settingsInput: Partial<PrintSettings>
): void => {
  const settings = normalizePrintSettings(settingsInput);
  if (settings.mode === 'none' || settings.strength <= 0) return;
  if (settings.mode === 'ordered-dither') {
    ctx.putImageData(applyOrderedDitherToImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), settings.strength, settings.outputBitDepth), 0, 0);
    return;
  }
  if (settings.mode === 'error-diffusion') {
    ctx.putImageData(applyErrorDiffusionToImageData(ctx.getImageData(0, 0, canvas.width, canvas.height), settings.strength), 0, 0);
    return;
  }
  if (settings.mode === 'cmyk-halftone' || settings.mode === 'newsprint') {
    applyCmykHalftone(ctx, canvas, settings);
    return;
  }
  if (settings.mode === 'risograph') {
    applyRisograph(ctx, canvas, settings);
    return;
  }
  if (settings.mode === 'xerox') {
    applyXerox(ctx, canvas, settings);
    return;
  }
  if (settings.mode === 'manga-tone') {
    const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const layer = renderAMHalftone(source, { ...settings, dotShape: 'round', frequency: settings.frequency + 2 });
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = clamp(settings.strength / 100, 0, 0.75);
    ctx.drawImage(layer, 0, 0);
    ctx.restore();
    return;
  }
  const source = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const layer = renderAMHalftone(source, settings);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = clamp(settings.strength / 100, 0, 0.82);
  ctx.drawImage(layer, 0, 0);
  ctx.restore();
};
