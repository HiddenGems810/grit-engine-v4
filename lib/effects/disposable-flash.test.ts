import { describe, expect, it } from 'vitest';
import {
  buildDisposableFlashRenderPlan,
  buildExpandedPrintFrameMetrics,
  createNeutralDisposableFlashSettings,
  formatDisposableDateStamp,
  mixDisposableFlashSettings,
  normalizeDisposableFlashSettings,
  resolveDisposableDateStamp
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
      printFrame: true,
      stampMode: 'bad-mode',
      stampFormat: 'bad-format',
      stampColor: 'purple',
      stampPosition: 'middle',
      customDate: 'not-a-date',
      frameMode: 'poster'
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
      printFrame: true,
      stampMode: 'seeded-retro',
      stampFormat: 'MM_DD_YY',
      stampColor: 'orange',
      stampPosition: 'bottom-left',
      customDate: '',
      frameMode: 'in-frame'
    });
  });

  it('upgrades legacy date stamp and print frame booleans into explicit modes', () => {
    const legacy = normalizeDisposableFlashSettings({
      dateStamp: true,
      printFrame: true
    });

    expect(legacy.stampMode).toBe('seeded-retro');
    expect(legacy.frameMode).toBe('in-frame');
    expect(legacy.dateStamp).toBe(true);
    expect(legacy.printFrame).toBe(true);
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

  it('formats date stamps and derives seeded-retro dates deterministically', () => {
    const settings = normalizeDisposableFlashSettings({
      dateStamp: true,
      stampMode: 'seeded-retro',
      stampFormat: 'DD_MM_YY',
      stampColor: 'red',
      stampPosition: 'bottom-right'
    });
    const first = resolveDisposableDateStamp(settings, 424242);
    const second = resolveDisposableDateStamp(settings, 424242);
    const different = resolveDisposableDateStamp(settings, 424243);

    expect(first).toEqual(second);
    expect(first).not.toEqual(different);
    expect(formatDisposableDateStamp(new Date(Date.UTC(2024, 0, 9)), 'MM_DD_YY')).toBe('01 09 24');
    expect(formatDisposableDateStamp(new Date(Date.UTC(2024, 0, 9)), 'DD_MM_YY')).toBe('09 01 24');
    expect(formatDisposableDateStamp(new Date(Date.UTC(2024, 0, 9)), 'YYYY_MM_DD')).toBe('2024 01 09');
  });

  it('normalizes invalid custom dates and computes expanded print dimensions', () => {
    const fallback = normalizeDisposableFlashSettings({
      dateStamp: true,
      stampMode: 'custom',
      customDate: 'not-real',
      printFrame: true,
      frameMode: 'expanded-print'
    });
    const custom = normalizeDisposableFlashSettings({
      stampMode: 'custom',
      customDate: '2026-05-19',
      frameMode: 'expanded-print'
    });
    const metrics = buildExpandedPrintFrameMetrics(1200, 900);

    expect(fallback.stampMode).toBe('seeded-retro');
    expect(custom.stampMode).toBe('custom');
    expect(resolveDisposableDateStamp(custom, 1)).toBe('05 19 26');
    expect(metrics.width).toBeGreaterThan(1200);
    expect(metrics.height).toBeGreaterThan(900);
    expect(metrics.imageX).toBeGreaterThan(0);
    expect(metrics.imageY).toBeGreaterThan(0);
  });
});
