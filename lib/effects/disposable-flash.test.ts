import { describe, expect, it } from 'vitest';
import {
  buildDisposableFlashRenderPlan,
  createNeutralDisposableFlashSettings,
  mixDisposableFlashSettings,
  normalizeDisposableFlashSettings
} from '@/lib/effects/disposable-flash';
import { DISPOSABLE_FLASH_PRESETS } from '@/lib/effects/effect-registry';

describe('disposable flash film effect', () => {
  it('normalizes and clamps unsafe settings', () => {
    expect(normalizeDisposableFlashSettings({
      flashStrength: 400,
      flashFalloff: -40,
      warmLightLeak: Number.NaN,
      redEdgeBurn: 110,
      cyanShadowCast: 120,
      filmGrain: -1,
      dustAndScratches: 101,
      plasticLensSoftness: 200,
      chromaticFringing: 500,
      vignette: 140,
      dateStamp: true,
      printFrame: true
    })).toEqual({
      flashStrength: 100,
      flashFalloff: 0,
      warmLightLeak: 0,
      redEdgeBurn: 100,
      cyanShadowCast: 100,
      filmGrain: 0,
      dustAndScratches: 100,
      plasticLensSoftness: 100,
      chromaticFringing: 100,
      vignette: 100,
      dateStamp: true,
      printFrame: true
    });
  });

  it('blends preset intensity without changing deterministic pattern identity', () => {
    const preset = DISPOSABLE_FLASH_PRESETS[0];
    const neutral = createNeutralDisposableFlashSettings();
    const at0 = mixDisposableFlashSettings(neutral, preset.settings, 0);
    const at50 = mixDisposableFlashSettings(neutral, preset.settings, 50);
    const at100 = mixDisposableFlashSettings(neutral, preset.settings, 100);

    expect(at0).toEqual(neutral);
    expect(at50.flashStrength).toBeGreaterThan(at0.flashStrength);
    expect(at50.flashStrength).toBeLessThan(at100.flashStrength);
    expect(at50.dateStamp).toBe(false);
    expect(at100.dateStamp).toBe(preset.settings.dateStamp);

    const planA = buildDisposableFlashRenderPlan(1200, 900, at50, 12345, { x: 620, y: 410 });
    const planB = buildDisposableFlashRenderPlan(1200, 900, at50, 12345, { x: 620, y: 410 });
    const planC = buildDisposableFlashRenderPlan(1200, 900, at100, 12345, { x: 620, y: 410 });

    expect(planA).toEqual(planB);
    expect(planA.seed).toBe(planC.seed);
    expect(planA.leaks.length).toBe(planC.leaks.length);
  });

  it('creates render plans that respond to dimensions and preserve bounds', () => {
    const settings = DISPOSABLE_FLASH_PRESETS.find((preset) => preset.id === 'dff-red-leak-party')!.settings;
    const plan = buildDisposableFlashRenderPlan(1600, 1000, settings, 98765);

    expect(plan.width).toBe(1600);
    expect(plan.height).toBe(1000);
    expect(plan.flashCenter.x).toBeGreaterThanOrEqual(0);
    expect(plan.flashCenter.x).toBeLessThanOrEqual(1600);
    expect(plan.flashCenter.y).toBeGreaterThanOrEqual(0);
    expect(plan.flashCenter.y).toBeLessThanOrEqual(1000);
    expect(plan.leaks.length).toBeGreaterThanOrEqual(3);
    expect(plan.scratches.length).toBeGreaterThan(20);
    expect(plan.dust.length).toBeGreaterThan(60);
    expect(plan.frame.borderPx).toBeGreaterThan(0);
  });
});
