import { describe, expect, it } from 'vitest';
import { collectHighlightCandidates } from './sparkle-engine';

describe('sparkle highlight selection', () => {
  it('selects only true bright highlights instead of midtone or saturated areas', () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,
      230, 230, 230, 255,
      255, 40, 40, 255,
      248, 248, 245, 255
    ]);

    const candidates = collectHighlightCandidates(data, 4, 1, {
      thresholdLuma: 246,
      minNeutrality: 0.86,
      scale: 1,
      step: 1
    });

    expect(candidates.map((candidate) => candidate.x)).toEqual([0, 3]);
  });
});
