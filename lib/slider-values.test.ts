import { describe, expect, it } from 'vitest';
import { normalizePreciseSliderValue, sliderInputTextToValue } from '@/lib/slider-values';

describe('precise slider values', () => {
  it('clamps finite numeric values to the configured range and step', () => {
    expect(normalizePreciseSliderValue(148.6, { min: 0, max: 100, step: 1 })).toBe(100);
    expect(normalizePreciseSliderValue(-42, { min: 0, max: 100, step: 1 })).toBe(0);
    expect(normalizePreciseSliderValue(12.24, { min: 0, max: 100, step: 0.5 })).toBe(12);
    expect(normalizePreciseSliderValue(12.26, { min: 0, max: 100, step: 0.5 })).toBe(12.5);
  });

  it('keeps invalid typed values at the previous committed value', () => {
    expect(sliderInputTextToValue('', { min: 0, max: 100, step: 1, fallback: 42 })).toBe(42);
    expect(sliderInputTextToValue('-', { min: -100, max: 100, step: 1, fallback: 12 })).toBe(12);
    expect(sliderInputTextToValue('not-a-number', { min: 0, max: 100, step: 1, fallback: 18 })).toBe(18);
  });

  it('allows exact typed values across non-100 ranges', () => {
    expect(sliderInputTextToValue('-37', { min: -180, max: 180, step: 1, fallback: 0 })).toBe(-37);
    expect(sliderInputTextToValue('183', { min: -180, max: 180, step: 1, fallback: 0 })).toBe(180);
    expect(sliderInputTextToValue('62', { min: 0, max: 255, step: 1, fallback: 0 })).toBe(62);
  });
});
