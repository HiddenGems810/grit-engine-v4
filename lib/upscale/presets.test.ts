import { describe, expect, it } from 'vitest';
import { applyUpscaleTuningPreset, DEFAULT_UPSCALE_SETTINGS, resolveUpscaleSettings } from '@/lib/upscale/presets';

describe('upscale settings', () => {
  it('applies tuning presets without changing enablement or scale', () => {
    const settings = { ...DEFAULT_UPSCALE_SETTINGS, enabled: true, scaleFactor: 3 };
    const tuned = applyUpscaleTuningPreset(settings, 'portrait-clean');

    expect(tuned.enabled).toBe(true);
    expect(tuned.scaleFactor).toBe(3);
    expect(tuned.modePreset).toBe('natural');
    expect(tuned.contentProfile).toBe('portrait');
  });

  it('clamps output settings to stable browser bounds', () => {
    const resolved = resolveUpscaleSettings(4000, 3000, {
      ...DEFAULT_UPSCALE_SETTINGS,
      enabled: true,
      scaleFactor: 4,
      detailRecovery: 150,
      edgeProtection: -10,
      antiHalo: 120
    });

    expect(Math.max(resolved.outputWidth, resolved.outputHeight)).toBeLessThanOrEqual(6144);
    expect(resolved.detailRecovery).toBe(100);
    expect(resolved.edgeProtection).toBe(0);
    expect(resolved.antiHalo).toBe(100);
  });
});
