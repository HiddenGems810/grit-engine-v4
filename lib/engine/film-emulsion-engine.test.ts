import { describe, expect, it, vi } from 'vitest';
import { applyFilmEmulsionToImageData } from './film-emulsion-engine';

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

const seeded = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
};

const makeFlatImage = () => new ImageData(new Uint8ClampedArray([
  48, 42, 38, 255,
  96, 86, 78, 255,
  150, 138, 126, 255,
  230, 224, 216, 255
]), 4, 1);

describe('film emulsion engine', () => {
  it('is deterministic for the same seed and profile', () => {
    const first = applyFilmEmulsionToImageData(makeFlatImage(), 'fine-35mm', 35, seeded(1234), true);
    const second = applyFilmEmulsionToImageData(makeFlatImage(), 'fine-35mm', 35, seeded(1234), true);

    expect(Array.from(first.data)).toEqual(Array.from(second.data));
  });

  it('preserves dimensions and keeps portrait-safe grain bounded', () => {
    const output = applyFilmEmulsionToImageData(makeFlatImage(), 'pushed-35mm', 100, seeded(99), true);
    const original = makeFlatImage();
    const maxDelta = Array.from(output.data).reduce((delta, value, index) => (
      index % 4 === 3 ? delta : Math.max(delta, Math.abs(value - original.data[index]))
    ), 0);

    expect(output.width).toBe(4);
    expect(output.height).toBe(1);
    expect(maxDelta).toBeLessThanOrEqual(42);
  });
});
