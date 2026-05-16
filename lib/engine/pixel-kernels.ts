import { applyErrorDiffusionToImageData, applyOrderedDitherToImageData } from './print-engine';
import { applyFilmEmulsionToImageData } from './film-emulsion-engine';
import type { FilmProfile } from '@/lib/materials/material-types';
import type { KernelBackend, KernelExecutionResult, PixelKernel, PixelKernelInput, PixelKernelOutput } from './kernel-types';

type OrderedDitherKernelSettings = {
  strength: number;
  outputBitDepth: 1 | 2 | 4 | 8;
};

type ErrorDiffusionKernelSettings = {
  strength: number;
};

type FilmEmulsionKernelSettings = {
  profile: FilmProfile;
  strength: number;
  portraitSafe: boolean;
};

type MaterialNoiseKernelSettings = {
  materialId: string;
  strength: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const toImageData = (input: PixelKernelInput) => new ImageData(new Uint8ClampedArray(input.data), input.width, input.height);

const toOutput = (imageData: ImageData): PixelKernelOutput => ({
  width: imageData.width,
  height: imageData.height,
  data: new Uint8ClampedArray(imageData.data)
});

const runTimed = async <ISettings>(
  kernel: PixelKernel<ISettings>,
  input: PixelKernelInput,
  settings: ISettings,
  backend: KernelBackend,
  fallbackUsed = false,
  warnings: string[] = []
): Promise<KernelExecutionResult> => {
  const now = typeof performance !== 'undefined' ? () => performance.now() : () => Date.now();
  const start = now();
  const output = await kernel.run(input, settings);
  return {
    output,
    meta: {
      backend,
      elapsedMs: Math.max(0, now() - start),
      fallbackUsed,
      warnings
    }
  };
};

export const createSyntheticKernelInput = (width: number, height: number, seed: number): PixelKernelInput => {
  const rng = seeded(seed);
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const gradient = (x / Math.max(1, width - 1)) * 180 + (y / Math.max(1, height - 1)) * 60;
      const variation = (rng() - 0.5) * 26;
      data[index] = clamp(gradient + variation, 0, 255);
      data[index + 1] = clamp(gradient * 0.92 + variation * 0.7, 0, 255);
      data[index + 2] = clamp(gradient * 0.78 + 36 + variation * 0.5, 0, 255);
      data[index + 3] = 255;
    }
  }
  return { width, height, data, seed };
};

export const typescriptPixelKernels = {
  orderedDither: {
    id: 'ordered-dither',
    async run(input: PixelKernelInput, settings: OrderedDitherKernelSettings) {
      return toOutput(applyOrderedDitherToImageData(toImageData(input), settings.strength, settings.outputBitDepth));
    }
  } satisfies PixelKernel<OrderedDitherKernelSettings>,
  errorDiffusion: {
    id: 'error-diffusion',
    async run(input: PixelKernelInput, settings: ErrorDiffusionKernelSettings) {
      return toOutput(applyErrorDiffusionToImageData(toImageData(input), settings.strength));
    }
  } satisfies PixelKernel<ErrorDiffusionKernelSettings>,
  filmEmulsion: {
    id: 'film-emulsion',
    async run(input: PixelKernelInput, settings: FilmEmulsionKernelSettings) {
      return toOutput(applyFilmEmulsionToImageData(
        toImageData(input),
        settings.profile,
        settings.strength,
        seeded(input.seed),
        settings.portraitSafe
      ));
    }
  } satisfies PixelKernel<FilmEmulsionKernelSettings>,
  materialNoise: {
    id: 'material-noise',
    async run(input: PixelKernelInput, settings: MaterialNoiseKernelSettings) {
      const rng = seeded(input.seed);
      const strength = clamp(settings.strength, 0, 100) / 100;
      const data = new Uint8ClampedArray(input.width * input.height * 4);
      const isWoven = settings.materialId.includes('linen') || settings.materialId.includes('canvas');
      const isMetal = settings.materialId.includes('metal') || settings.materialId.includes('chrome');
      for (let y = 0; y < input.height; y += 1) {
        for (let x = 0; x < input.width; x += 1) {
          const index = (y * input.width + x) * 4;
          const fiber = (rng() - 0.5) * 46 * strength;
          const weave = isWoven ? (Math.sin(x / 2.7) + Math.cos(y / 3.1)) * 9 * strength : 0;
          const metal = isMetal ? Math.sin((x + y * 0.1) / 3.5) * 18 * strength : 0;
          const cloud = Math.sin((x + input.seed % 17) / 18) * Math.cos((y + input.seed % 23) / 23) * 10 * strength;
          const value = clamp(128 + fiber + weave + metal + cloud, 0, 255);
          data[index] = value;
          data[index + 1] = value;
          data[index + 2] = value;
          data[index + 3] = Math.round(255 * clamp(0.18 + strength * 0.35, 0, 0.55));
        }
      }
      return { width: input.width, height: input.height, data };
    }
  } satisfies PixelKernel<MaterialNoiseKernelSettings>
};

export const runPixelKernelWithMeta = runTimed;
