import { describe, expect, it } from 'vitest';
import { createNeutralSnapshot } from '@/lib/editor-config';
import {
  buildAntiAiRepairSnapshot,
  clampAntiAiRepairSetting,
  normalizeAntiAiRepairSettings
} from '@/lib/anti-ai-repair';

describe('anti-ai repair mode', () => {
  it('clamps repair controls into slider-safe values', () => {
    expect(clampAntiAiRepairSetting(-20)).toBe(0);
    expect(clampAntiAiRepairSetting(48.6)).toBe(49);
    expect(clampAntiAiRepairSetting(130)).toBe(100);
    expect(normalizeAntiAiRepairSettings({ naturalGrain: Number.NaN }).naturalGrain).toBeGreaterThan(0);
  });

  it('protects identity and believable skin while repairing synthetic output', () => {
    const base = {
      ...createNeutralSnapshot(),
      faceSlimming: 12,
      ageShift: -12,
      hueShift: 28,
      saturation: 140,
      shadowCrush: 88
    };
    const repaired = buildAntiAiRepairSnapshot(base, 'repair');

    expect(repaired.faceSlimming).toBe(0);
    expect(repaired.ageShift).toBe(0);
    expect(repaired.hueShift).toBe(0);
    expect(repaired.saturation).toBeLessThanOrEqual(112);
    expect(repaired.shadowCrush).toBeLessThanOrEqual(36);
    expect(repaired.materialFaceProtection).toBe(true);
    expect(repaired.materialEdgeProtection).toBe(true);
  });

  it('maps photographed mode into real physical render controls', () => {
    const photographed = buildAntiAiRepairSnapshot(createNeutralSnapshot(), 'photographed');

    expect(photographed.filmProfile).toBe('fine-35mm');
    expect(photographed.opticalProfile).toBe('pro-mist');
    expect(photographed.materialProfile).toBe('fine-35mm-grain');
    expect(photographed.grain).toBeGreaterThan(20);
    expect(photographed.halation).toBeGreaterThan(8);
    expect(photographed.textureType).toBe('4k_film_dust');
  });

  it('lets tuning controls change strength without changing mode identity', () => {
    const lowGrain = buildAntiAiRepairSnapshot(createNeutralSnapshot(), 'repair', {
      naturalGrain: 10,
      textureRecovery: 20
    });
    const highGrain = buildAntiAiRepairSnapshot(createNeutralSnapshot(), 'repair', {
      naturalGrain: 90,
      textureRecovery: 90
    });

    expect(highGrain.grain).toBeGreaterThan(lowGrain.grain);
    expect(highGrain.materialStrength).toBeGreaterThan(lowGrain.materialStrength);
    expect(highGrain.activeCamera).toBe(lowGrain.activeCamera);
  });
});
