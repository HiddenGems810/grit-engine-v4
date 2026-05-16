/**
 * Grit Engine v4 — Texture Engine
 *
 * Generates procedural texture tiles for the physical texture overlay pass.
 * All textures are rendered to a 256×256 canvas and tiled via createPattern.
 * The engine is fully deterministic (seeded RNG).
 */

import { normalizeTextureId } from '@/lib/textures';

type SeededRNG = () => number;

interface TextureTile {
  canvas: HTMLCanvasElement;
  blendMode: GlobalCompositeOperation;
  alpha: number;
}

function drawCanvas(rng: SeededRNG, normalizedTexture: string): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d')!;

  switch (normalizedTexture) {
    case 'canvas': {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#eaeaea';
      for (let i = 0; i < 256; i += 4) {
        ctx.fillRect(i, 0, 1, 256);
        ctx.fillRect(0, i, 256, 1);
      }
      break;
    }
    case 'paper':
    case 'vintage_paper': {
      ctx.fillStyle = '#f6f6f6';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = `rgba(0,0,0,${rng() * 0.06})`;
        ctx.fillRect(rng() * 256, rng() * 256, 1, 1);
      }
      break;
    }
    case 'film_dust': {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1200; i++) {
        ctx.fillStyle = `rgba(0,0,0,${rng() * 0.18})`;
        ctx.beginPath();
        ctx.arc(rng() * 256, rng() * 256, rng() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'grunge':
    case 'grunge_wall': {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = `rgba(0,0,0,${rng() * 0.25})`;
        const s = rng() * 25;
        ctx.fillRect(rng() * 256, rng() * 256, s, s);
      }
      break;
    }
    case 'metal':
    case 'brushed_metal': {
      const metalGrad = ctx.createLinearGradient(0, 0, 256, 256);
      metalGrad.addColorStop(0, '#f5f5f5');
      metalGrad.addColorStop(0.5, '#9b9b9b');
      metalGrad.addColorStop(1, '#d7d7d7');
      ctx.fillStyle = metalGrad;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 180; i++) {
        ctx.fillStyle = `rgba(255,255,255,${rng() * 0.08})`;
        ctx.fillRect(rng() * 256, 0, 1, 256);
      }
      break;
    }
    case 'linen':
    case 'linen_tablecloth': {
      ctx.fillStyle = '#f4efe6';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 256; i += 6) {
        ctx.fillStyle = 'rgba(120,102,78,0.08)';
        ctx.fillRect(i, 0, 1, 256);
        ctx.fillRect(0, i, 256, 1);
      }
      break;
    }
    case 'stone':
    case 'stone_surface': {
      ctx.fillStyle = '#d5d0c9';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(90,90,90,${rng() * 0.12})`;
        ctx.beginPath();
        ctx.arc(rng() * 256, rng() * 256, rng() * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'leather_grain': {
      ctx.fillStyle = '#d8d1c8';
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 1800; i++) {
        ctx.fillStyle = `rgba(88,72,58,${rng() * 0.08})`;
        ctx.beginPath();
        ctx.ellipse(rng() * 256, rng() * 256, rng() * 2.6, rng() * 1.4, rng() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'glass_refraction':
    case 'holographic_foil':
    case 'crushed_plastic': {
      const gloss = ctx.createLinearGradient(0, 0, 256, 256);
      gloss.addColorStop(0, 'rgba(255,255,255,0.85)');
      gloss.addColorStop(0.5, 'rgba(190,205,220,0.2)');
      gloss.addColorStop(1, 'rgba(255,255,255,0.75)');
      ctx.fillStyle = '#efefef';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = gloss;
      ctx.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 20; i++) {
        ctx.strokeStyle = `rgba(255,255,255,${0.05 + rng() * 0.07})`;
        ctx.lineWidth = 1 + rng() * 2;
        ctx.beginPath();
        ctx.moveTo(rng() * 256, 0);
        ctx.lineTo(rng() * 256, 256);
        ctx.stroke();
      }
      break;
    }
    default: {
      // Fallback: simple white tile
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, 256, 256);
      break;
    }
  }

  return c;
}

const GLOSSY_TEXTURES = new Set(['glass_refraction', 'holographic_foil', 'crushed_plastic']);

/**
 * Generate a texture tile and return blend parameters.
 * The caller is responsible for creating the pattern and blitting it.
 */
export function generateTextureTile(
  textureType: string,
  textureIntensity: number,
  rng: SeededRNG
): TextureTile {
  const normalizedTexture = normalizeTextureId(textureType).replace(/^4k_/, '');
  const tileCanvas = drawCanvas(rng, normalizedTexture);
  const glossy = GLOSSY_TEXTURES.has(normalizedTexture);
  return {
    canvas: tileCanvas,
    blendMode: glossy ? 'soft-light' : 'multiply',
    alpha: glossy
      ? (textureIntensity / 100) * 0.28
      : (textureIntensity / 100) * 0.22,
  };
}

/**
 * Blit a texture tile onto a target context as a repeating pattern overlay.
 */
export function applyTextureTile(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  tile: TextureTile
): void {
  const pattern = ctx.createPattern(tile.canvas, 'repeat');
  if (!pattern) return;
  ctx.globalCompositeOperation = tile.blendMode;
  ctx.globalAlpha = tile.alpha;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalAlpha = 1.0;
  ctx.globalCompositeOperation = 'source-over';
}
