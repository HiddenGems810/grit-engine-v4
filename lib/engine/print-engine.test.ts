import { describe, expect, it, vi } from 'vitest';
import { applyErrorDiffusionToImageData, applyOrderedDitherToImageData, normalizePrintSettings } from './print-engine';

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

const makeGradientImage = () => new ImageData(new Uint8ClampedArray([
  16, 16, 16, 255,
  96, 96, 96, 255,
  172, 172, 172, 255,
  240, 240, 240, 255
]), 4, 1);

describe('print engine pure transforms', () => {
  it('ordered dither preserves dimensions and responds to luminance', () => {
    const output = applyOrderedDitherToImageData(makeGradientImage(), 100, 1);
    const values = [output.data[0], output.data[4], output.data[8], output.data[12]];

    expect(output.width).toBe(4);
    expect(output.height).toBe(1);
    expect(new Set(values).size).toBeGreaterThan(1);
    expect(values[0]).toBeLessThanOrEqual(values[3]);
  });

  it('error diffusion preserves dimensions and produces valid channel values', () => {
    const output = applyErrorDiffusionToImageData(makeGradientImage(), 75);

    expect(output.width).toBe(4);
    expect(output.height).toBe(1);
    expect(Array.from(output.data).every((value) => value >= 0 && value <= 255)).toBe(true);
  });

  it('clamps invalid print settings safely', () => {
    const settings = normalizePrintSettings({
      mode: 'am-halftone',
      strength: 999,
      frequency: -10,
      angle: 999,
      dotGain: 999,
      inkSpread: -5,
      paperTooth: 999,
      misregistration: 99,
      outputBitDepth: 1
    });

    expect(settings.strength).toBe(100);
    expect(settings.frequency).toBe(3);
    expect(settings.angle).toBe(90);
    expect(settings.dotGain).toBe(100);
    expect(settings.inkSpread).toBe(0);
    expect(settings.paperTooth).toBe(100);
    expect(settings.misregistration).toBe(12);
  });
});
