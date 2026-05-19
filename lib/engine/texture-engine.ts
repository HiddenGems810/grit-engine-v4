/**
 * Grit Engine v4 - Texture Engine
 *
 * Procedural, deterministic, seamless surface tiles for the Surface
 * Specification pass. The visible dropdown options map to real render profiles
 * in texture-profiles.ts; no remote texture assets are required for export.
 */

import {
  getTextureRenderProfile,
  normalizeTextureProfileId,
  type TextureEffectType,
  type TextureRenderProfile
} from './texture-profiles';

type SeededRNG = () => number;

interface TextureTile {
  canvas: HTMLCanvasElement;
  blendMode: GlobalCompositeOperation;
  alpha: number;
  scale: number;
  effectType: TextureEffectType;
}

const clampByte = (value: number) => Math.max(0, Math.min(255, Math.round(value)));

const wave = (u: number, v: number, fx: number, fy: number, phase: number) => (
  Math.sin(Math.PI * 2 * (u * fx + v * fy) + phase)
);

const periodicNoise = (u: number, v: number, seedA: number, seedB: number) => (
  wave(u, v, 2, 3, seedA) * 0.38
  + wave(u, v, 5, -4, seedB) * 0.24
  + wave(u, v, -9, 7, seedA + seedB) * 0.16
  + wave(u, v, 17, 11, seedA * 0.7) * 0.08
);

function renderProfileValue(profile: TextureRenderProfile, u: number, v: number, seedA: number, seedB: number) {
  const n = periodicNoise(u, v, seedA, seedB);

  switch (profile.effectType) {
    case 'paper-tooth': {
      const fiber = Math.abs(wave(u, v, 38, 7, seedA)) * 0.22 + Math.abs(wave(u, v, -11, 41, seedB)) * 0.18;
      return { r: 242 + n * 18 - fiber * 24, g: 241 + n * 16 - fiber * 21, b: 236 + n * 14 - fiber * 18 };
    }
    case 'woven-fiber': {
      const warp = Math.pow(Math.abs(wave(u, v, 36, 0, seedA)), 0.42);
      const weft = Math.pow(Math.abs(wave(u, v, 0, 34, seedB)), 0.42);
      const weave = (warp + weft) * 0.5;
      return { r: 225 + n * 10 - weave * 34, g: 222 + n * 10 - weave * 31, b: 215 + n * 10 - weave * 27 };
    }
    case 'linen-weave': {
      const fineX = Math.abs(wave(u, v, 58, 1, seedA));
      const fineY = Math.abs(wave(u, v, 1, 52, seedB));
      const weave = fineX * 0.46 + fineY * 0.36;
      return { r: 237 + n * 9 - weave * 20, g: 232 + n * 8 - weave * 18, b: 221 + n * 8 - weave * 15 };
    }
    case 'mineral-depth': {
      const vein = Math.pow(Math.max(0, wave(u, v, 3, -2, seedA) + wave(u, v, 9, 6, seedB) * 0.5), 2);
      return { r: 212 + n * 22 - vein * 36, g: 208 + n * 20 - vein * 32, b: 201 + n * 18 - vein * 28 };
    }
    case 'directional-metal': {
      const brush = Math.abs(wave(u, v, 0, 86, seedA)) * 0.42 + Math.abs(wave(u, v, 0, 23, seedB)) * 0.26;
      const sheen = wave(u, v, 1, 0, seedA + 1.7) * 18;
      return { r: 184 + sheen + n * 8 + brush * 40, g: 184 + sheen + n * 8 + brush * 40, b: 180 + sheen + n * 8 + brush * 42 };
    }
    case 'distressed-wear': {
      const worn = Math.max(0, n + wave(u, v, 6, 5, seedB) * 0.32);
      const scratches = Math.pow(Math.abs(wave(u, v, 0, 64, seedA)), 9) * 0.9;
      return { r: 236 - worn * 62 - scratches * 58, g: 232 - worn * 58 - scratches * 50, b: 223 - worn * 50 - scratches * 42 };
    }
    case 'film-particulate': {
      const speck = Math.pow(Math.max(0, wave(u, v, 73, 37, seedA) + wave(u, v, -41, 89, seedB) * 0.8), 8);
      return { r: 250 - speck * 120 + n * 8, g: 250 - speck * 120 + n * 8, b: 248 - speck * 110 + n * 8 };
    }
    case 'leather-grain': {
      const pores = Math.abs(wave(u, v, 31, 19, seedA)) * Math.abs(wave(u, v, -23, 29, seedB));
      const pebble = Math.pow(pores, 0.45);
      return { r: 190 + n * 18 - pebble * 42, g: 178 + n * 16 - pebble * 36, b: 164 + n * 14 - pebble * 30 };
    }
    case 'glass-refraction': {
      const ripple = wave(u, v, 4, 7, seedA) * 18 + wave(u, v, -8, 5, seedB) * 10;
      const streak = Math.pow(Math.max(0, wave(u, v, 1, -1, seedA)), 5) * 55;
      return { r: 210 + ripple + streak, g: 224 + ripple + streak, b: 238 + ripple + streak };
    }
    case 'holographic-sheen': {
      const hueWave = (wave(u, v, 2, -2, seedA) + 1) * 0.5;
      return { r: 185 + hueWave * 70 + n * 8, g: 205 + Math.sin(hueWave * Math.PI) * 42 + n * 8, b: 242 - hueWave * 44 + n * 8 };
    }
    case 'plastic-gloss': {
      const band = Math.pow(Math.max(0, wave(u, v, 1, -2, seedA) + 0.2), 3) * 62;
      const wrinkle = Math.abs(wave(u, v, 9, 13, seedB)) * 14;
      return { r: 222 + band + n * 8 - wrinkle, g: 225 + band + n * 8 - wrinkle, b: 229 + band + n * 8 - wrinkle };
    }
    default:
      return { r: 255, g: 255, b: 255 };
  }
}

function drawTextureCanvas(rng: SeededRNG, profile: TextureRenderProfile): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = profile.tileSize;
  canvas.height = profile.tileSize;
  const ctx = canvas.getContext('2d')!;
  const image = ctx.createImageData(canvas.width, canvas.height);
  const seedA = rng() * Math.PI * 2;
  const seedB = rng() * Math.PI * 2;

  for (let y = 0; y < canvas.height; y += 1) {
    for (let x = 0; x < canvas.width; x += 1) {
      const value = renderProfileValue(profile, x / canvas.width, y / canvas.height, seedA, seedB);
      const offset = (y * canvas.width + x) * 4;
      image.data[offset] = clampByte(value.r);
      image.data[offset + 1] = clampByte(value.g);
      image.data[offset + 2] = clampByte(value.b);
      image.data[offset + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function generateTextureTile(
  textureType: string,
  textureIntensity: number,
  rng: SeededRNG
): TextureTile {
  const normalizedTexture = normalizeTextureProfileId(textureType);
  const profile = getTextureRenderProfile(textureType);
  const canvas = profile ? drawTextureCanvas(rng, profile) : document.createElement('canvas');
  if (!profile) {
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  return {
    canvas,
    blendMode: profile?.blendMode ?? 'multiply',
    alpha: normalizedTexture === 'none' ? 0 : Math.min(0.42, Math.max(0, textureIntensity / 100) * (profile?.alphaScale ?? 0.22)),
    scale: profile?.visualScale ?? 1,
    effectType: profile?.effectType ?? 'placeholder'
  };
}

export function applyTextureTile(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tile: TextureTile
): void {
  if (tile.alpha <= 0) return;
  const pattern = ctx.createPattern(tile.canvas, 'repeat');
  if (!pattern) return;
  if ('setTransform' in pattern && typeof DOMMatrix !== 'undefined') {
    pattern.setTransform(new DOMMatrix().scale(tile.scale, tile.scale));
  }

  ctx.globalCompositeOperation = tile.blendMode;
  ctx.globalAlpha = tile.alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
