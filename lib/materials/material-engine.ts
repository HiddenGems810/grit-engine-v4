import { getMaterialPreset } from './material-registry';
import type { MaterialFinishSettings, PaperSurface } from './material-types';
import { applyFilmEmulsion } from '@/lib/engine/film-emulsion-engine';
import { applyOpticalFinish } from '@/lib/engine/light-effects';
import { applyPrintEngine } from '@/lib/engine/print-engine';

type SeededRNG = () => number;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toCanvasBlendMode = (blendMode: string): GlobalCompositeOperation => {
  if (blendMode === 'grain-merge' || blendMode === 'mask-only' || blendMode === 'displacement') return 'soft-light';
  return blendMode as GlobalCompositeOperation;
};

const surfaceToMaterialId = (surface: PaperSurface) => {
  if (surface === 'none') return 'none';
  if (surface === 'linen-fiber') return 'linen-fiber';
  if (surface === 'canvas-tooth') return 'canvas-tooth';
  if (surface === 'brushed-metal') return 'brushed-metal';
  if (surface === 'glass-reflection' || surface === 'glossy-acrylic' || surface === 'subtle-chrome' || surface === 'ceramic-gloss') return 'glass-reflection';
  if (surface === 'newsprint') return 'newsprint';
  if (surface === 'magazine-paper' || surface === 'coated-poster-paper') return 'magazine-paper';
  if (surface === 'glossy-photo-paper') return 'glossy-photo-paper';
  if (surface === 'matte-photo-paper') return 'matte-photo-paper';
  if (surface === 'hot-press-paper') return 'hot-press-paper';
  return 'cold-press-paper';
};

export const createMaterialNoiseTile = (
  materialId: string,
  strength: number,
  rng: SeededRNG
): HTMLCanvasElement => {
  const tile = document.createElement('canvas');
  tile.width = 256;
  tile.height = 256;
  const ctx = tile.getContext('2d')!;
  const data = ctx.createImageData(256, 256);
  const material = getMaterialPreset(materialId);
  const normalizedStrength = clamp(strength, 0, 100) / 100;

  for (let y = 0; y < 256; y += 1) {
    for (let x = 0; x < 256; x += 1) {
      const i = (y * 256 + x) * 4;
      const fiber = (rng() - 0.5) * 46 * normalizedStrength;
      const weave = (
        material.tags.includes('linen') || material.tags.includes('canvas')
          ? (Math.sin(x / 2.7) + Math.cos(y / 3.1)) * 9 * normalizedStrength
          : 0
      );
      const metal = material.tags.includes('metal') ? Math.sin((x + y * 0.1) / 3.5) * 18 * normalizedStrength : 0;
      const paperCloud = Math.sin((x + rng() * 12) / 18) * Math.cos((y + rng() * 12) / 23) * 10 * normalizedStrength;
      const value = clamp(128 + fiber + weave + metal + paperCloud, 0, 255);
      data.data[i] = value;
      data.data[i + 1] = value;
      data.data[i + 2] = value;
      data.data[i + 3] = Math.round(255 * clamp(0.18 + normalizedStrength * 0.35, 0, 0.55));
    }
  }

  ctx.putImageData(data, 0, 0);
  return tile;
};

export const applyMaterialSurface = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  materialId: string,
  strength: number,
  rng: SeededRNG
): void => {
  const material = getMaterialPreset(materialId);
  if (material.id === 'none' || strength <= 0) return;

  const safeStrength = clamp(strength, 0, material.maxSafeStrength);
  const tile = createMaterialNoiseTile(material.id, safeStrength, rng);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;

  ctx.save();
  ctx.globalCompositeOperation = toCanvasBlendMode(material.blendMode);
  ctx.globalAlpha = clamp(safeStrength / 100, 0, 0.42);
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
};

export const applyMaterialFinish = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  settings: MaterialFinishSettings,
  rng: SeededRNG
): void => {
  const material = getMaterialPreset(settings.materialProfile);
  const safeStrength = clamp(settings.materialStrength, 0, material.maxSafeStrength);
  const surfaceMaterial = surfaceToMaterialId(settings.paperSurface);

  applyFilmEmulsion(ctx, canvas, settings.filmProfile, safeStrength, rng, settings.faceProtection);
  applyPrintEngine(ctx, canvas, {
    mode: settings.printProfile,
    strength: safeStrength,
    frequency: settings.printProfile === 'cmyk-halftone' ? 12 : 9,
    angle: 45,
    dotShape: settings.printProfile === 'manga-tone' ? 'round' : 'elliptical',
    dotGain: settings.printProfile === 'xerox' ? 42 : 18,
    inkSpread: settings.printProfile === 'risograph' ? 34 : 16,
    paperTooth: settings.paperSurface === 'none' ? 0 : 22,
    misregistration: settings.printProfile === 'risograph' || settings.printProfile === 'cmyk-halftone' ? 3 : 0,
    palette: settings.printProfile === 'risograph' ? 'pink-blue' : 'standard',
    faceProtection: settings.faceProtection,
    edgeProtection: settings.edgeProtection,
    preserveMidtones: true,
    outputBitDepth: settings.printProfile === 'ordered-dither' ? 1 : 4,
    ditherAlgorithm: settings.printProfile === 'error-diffusion' ? 'floyd-steinberg' : 'bayer8'
  });
  applyMaterialSurface(ctx, canvas.width, canvas.height, material.id, safeStrength, rng);
  applyMaterialSurface(ctx, canvas.width, canvas.height, surfaceMaterial, safeStrength * 0.7, rng);
  applyOpticalFinish(ctx, canvas, settings.opticalProfile, safeStrength, rng, settings.faceProtection);
};
