import { describe, expect, it, vi } from 'vitest';
import { createSyntheticKernelInput, runPixelKernelWithMeta, typescriptPixelKernels } from './pixel-kernels';

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

vi.stubGlobal('ImageData', TestImageData);

describe('typescript pixel kernels', () => {
  it('ordered dither preserves dimensions, alpha, and does not mutate input', async () => {
    const input = createSyntheticKernelInput(8, 8, 123);
    const original = new Uint8ClampedArray(input.data);
    const output = await typescriptPixelKernels.orderedDither.run(input, { strength: 80, outputBitDepth: 1 });

    expect(output.width).toBe(input.width);
    expect(output.height).toBe(input.height);
    expect(Array.from(input.data)).toEqual(Array.from(original));
    expect(Array.from(output.data).filter((_, index) => index % 4 === 3)).toEqual(Array(64).fill(255));
  });

  it('error diffusion and film emulsion are deterministic for the same seed', async () => {
    const input = createSyntheticKernelInput(8, 8, 777);
    const firstDither = await typescriptPixelKernels.errorDiffusion.run(input, { strength: 70 });
    const secondDither = await typescriptPixelKernels.errorDiffusion.run(input, { strength: 70 });
    const firstFilm = await typescriptPixelKernels.filmEmulsion.run(input, { profile: 'fine-35mm', strength: 42, portraitSafe: true });
    const secondFilm = await typescriptPixelKernels.filmEmulsion.run(input, { profile: 'fine-35mm', strength: 42, portraitSafe: true });

    expect(Array.from(firstDither.data)).toEqual(Array.from(secondDither.data));
    expect(Array.from(firstFilm.data)).toEqual(Array.from(secondFilm.data));
  });

  it('material noise generation preserves dimensions and clamps invalid strength', async () => {
    const input = createSyntheticKernelInput(12, 10, 42);
    const output = await typescriptPixelKernels.materialNoise.run(input, { materialId: 'cold-press-paper', strength: 999 });

    expect(output.width).toBe(12);
    expect(output.height).toBe(10);
    expect(output.data.length).toBe(12 * 10 * 4);
    expect(Array.from(output.data).every((value) => value >= 0 && value <= 255)).toBe(true);
  });

  it('wraps kernel execution with timing metadata and fallback warnings', async () => {
    const input = createSyntheticKernelInput(4, 4, 9);
    const result = await runPixelKernelWithMeta(
      typescriptPixelKernels.orderedDither,
      input,
      { strength: 50, outputBitDepth: 2 },
      'typescript'
    );

    expect(result.output.width).toBe(4);
    expect(result.meta.backend).toBe('typescript');
    expect(result.meta.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(result.meta.fallbackUsed).toBe(false);
    expect(result.meta.warnings).toEqual([]);
  });
});
