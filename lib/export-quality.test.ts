import { describe, expect, it } from 'vitest';
import { computeAspectCrop, computeExportQualityInfo } from './export-quality';

describe('export quality accounting', () => {
  it('reports truthful dimensions and memory fallback state', () => {
    const info = computeExportQualityInfo({
      sourceDimensions: { width: 4000, height: 3000 },
      previewDimensions: { width: 1600, height: 1200 },
      baseExportDimensions: { width: 4000, height: 3000 },
      upscaleEnabled: true,
      upscaleScaleFactor: 3
    });

    expect(info.upscaledExportDimensions).toEqual({ width: 12000, height: 9000 });
    expect(info.memoryState).toBe('reduced');
    expect(info.fallbackReason).toBeTruthy();
  });

  it('calculates creator export crops without changing original ratio mode', () => {
    expect(computeAspectCrop(2000, 1000, 'original')).toEqual({ sx: 0, sy: 0, sw: 2000, sh: 1000, width: 2000, height: 1000 });
    expect(computeAspectCrop(2000, 1000, '1:1')).toEqual({ sx: 500, sy: 0, sw: 1000, sh: 1000, width: 1000, height: 1000 });
  });
});
