import type { FilmProfile } from '@/lib/materials/material-types';

type SeededRNG = () => number;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

const profileSettings: Record<FilmProfile, { lumaGrain: number; chromaGrain: number; clump: number; softness: number; dust: number; safeAlpha: number }> = {
  none: { lumaGrain: 0, chromaGrain: 0, clump: 0, softness: 0, dust: 0, safeAlpha: 0 },
  'fine-35mm': { lumaGrain: 0.42, chromaGrain: 0.10, clump: 0.16, softness: 0.08, dust: 0.02, safeAlpha: 0.28 },
  'pushed-35mm': { lumaGrain: 0.72, chromaGrain: 0.18, clump: 0.32, softness: 0.12, dust: 0.05, safeAlpha: 0.42 },
  'expired-film': { lumaGrain: 0.62, chromaGrain: 0.24, clump: 0.38, softness: 0.18, dust: 0.12, safeAlpha: 0.46 },
  'super-8': { lumaGrain: 0.82, chromaGrain: 0.20, clump: 0.52, softness: 0.24, dust: 0.16, safeAlpha: 0.52 },
  'disposable-flash': { lumaGrain: 0.55, chromaGrain: 0.16, clump: 0.24, softness: 0.08, dust: 0.06, safeAlpha: 0.38 },
  'cine-still': { lumaGrain: 0.40, chromaGrain: 0.12, clump: 0.18, softness: 0.10, dust: 0.02, safeAlpha: 0.34 },
  'soft-pro-mist': { lumaGrain: 0.24, chromaGrain: 0.06, clump: 0.12, softness: 0.34, dust: 0.01, safeAlpha: 0.26 },
  'clean-analog': { lumaGrain: 0.26, chromaGrain: 0.06, clump: 0.10, softness: 0.08, dust: 0.01, safeAlpha: 0.22 },
  'silver-gelatin': { lumaGrain: 0.62, chromaGrain: 0, clump: 0.30, softness: 0.08, dust: 0.06, safeAlpha: 0.40 },
  'high-iso-phone-night': { lumaGrain: 0.46, chromaGrain: 0.28, clump: 0.22, softness: 0.02, dust: 0, safeAlpha: 0.32 }
};

export const applyFilmEmulsionToImageData = (
  imageData: ImageData,
  profile: FilmProfile,
  strength: number,
  rng: SeededRNG,
  portraitSafe: boolean
): ImageData => {
  const settings = profileSettings[profile] ?? profileSettings.none;
  if (profile === 'none' || strength <= 0) return imageData;

  const data = new Uint8ClampedArray(imageData.data);
  const amount = clamp(strength / 100, 0, portraitSafe ? settings.safeAlpha : 0.72);
  for (let i = 0; i < data.length; i += 4) {
    const lum = luma(data[i], data[i + 1], data[i + 2]);
    const shadowResponse = 1 - Math.pow(lum / 255, 1.8);
    const midResponse = 1 - Math.abs(lum - 128) / 128;
    const grainResponse = clamp(shadowResponse * 0.7 + midResponse * 0.45, 0, 1);
    const clump = (rng() + rng() + rng()) / 3 - 0.5;
    const fine = rng() - 0.5;
    const lumaNoise = (fine * 18 * settings.lumaGrain + clump * 30 * settings.clump) * amount * grainResponse;
    const chromaNoise = settings.chromaGrain * amount * grainResponse * 18;

    data[i] = clamp(data[i] + lumaNoise + (rng() - 0.5) * chromaNoise, 0, 255);
    data[i + 1] = clamp(data[i + 1] + lumaNoise + (rng() - 0.5) * chromaNoise, 0, 255);
    data[i + 2] = clamp(data[i + 2] + lumaNoise + (rng() - 0.5) * chromaNoise, 0, 255);
  }

  return new ImageData(data, imageData.width, imageData.height);
};

export const applyFilmEmulsion = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  profile: FilmProfile,
  strength: number,
  rng: SeededRNG,
  portraitSafe: boolean
): void => {
  if (profile === 'none' || strength <= 0) return;
  const settings = profileSettings[profile] ?? profileSettings.none;

  if (settings.softness > 0) {
    const softCanvas = document.createElement('canvas');
    softCanvas.width = canvas.width;
    softCanvas.height = canvas.height;
    const softCtx = softCanvas.getContext('2d')!;
    softCtx.filter = `blur(${Math.max(0.4, settings.softness * strength * 0.08)}px)`;
    softCtx.drawImage(canvas, 0, 0);
    ctx.save();
    ctx.globalAlpha = clamp(settings.softness * strength / 100, 0, portraitSafe ? 0.14 : 0.28);
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(softCanvas, 0, 0);
    ctx.restore();
  }

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  ctx.putImageData(applyFilmEmulsionToImageData(imageData, profile, strength, rng, portraitSafe), 0, 0);

  if (settings.dust > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = clamp(settings.dust * strength / 100, 0, portraitSafe ? 0.05 : 0.16);
    ctx.fillStyle = 'white';
    const count = Math.round(settings.dust * strength * 18);
    for (let i = 0; i < count; i += 1) {
      ctx.fillRect(rng() * canvas.width, rng() * canvas.height, 0.5 + rng() * 1.4, 0.5 + rng() * 1.4);
    }
    ctx.restore();
  }
};
