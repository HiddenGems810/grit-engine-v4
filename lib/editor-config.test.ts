import { describe, expect, it } from 'vitest';
import {
  PORTRAIT_CONTROL_DEFINITIONS,
  clampPortraitControlValue,
  clampSliderValue
} from '@/lib/editor-config';

describe('editor clamps', () => {
  it('clamps generic sliders to the 0-100 range', () => {
    expect(clampSliderValue(-20)).toBe(0);
    expect(clampSliderValue(120)).toBe(100);
    expect(clampSliderValue(Number.NaN)).toBe(0);
  });

  it('clamps portrait controls to their control-specific limits', () => {
    expect(clampPortraitControlValue('ageShift', -30)).toBe(-20);
    expect(clampPortraitControlValue('ageShift', 30)).toBe(20);
    expect(clampPortraitControlValue('beautyBoost', 90)).toBe(46);
    expect(clampPortraitControlValue('eyeDetail', 90)).toBe(30);
    expect(clampPortraitControlValue('beautyBoost', Number.NaN)).toBe(0);
  });

  it('places eye detail directly before eye brightening in compact portrait controls', () => {
    const keys = PORTRAIT_CONTROL_DEFINITIONS.map((control) => control.key);

    expect(keys.indexOf('eyeDetail')).toBeGreaterThan(-1);
    expect(keys.indexOf('eyeDetail')).toBe(keys.indexOf('eyeBrightening') - 1);
  });
});
