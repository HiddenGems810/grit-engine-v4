import { describe, expect, it } from 'vitest';
import {
  DISPOSABLE_FLASH_PRESETS,
  EFFECT_FAMILIES,
  EFFECT_PRESETS,
  getEffectFamily,
  getEffectPreset
} from '@/lib/effects/effect-registry';
import { createNeutralDisposableFlashSettings } from '@/lib/effects/disposable-flash';

describe('FORMAT effects registry', () => {
  it('defines the curated effects taxonomy without remote assets', () => {
    const familyIds = EFFECT_FAMILIES.map((family) => family.id);
    const duplicateIds = familyIds.filter((id, index) => familyIds.indexOf(id) !== index);

    expect(familyIds).toEqual([
      'disposable-flash-film',
      'instant-print-frame',
      'risograph-grain',
      'halftone-grunge',
      'broken-copier-xerox',
      'reeded-ribbed-glass',
      'lens-prism',
      'crt-vhs-camcorder',
      'aged-grainy-photo',
      'glitch-acid-distortion',
      'chrome-liquid-metal',
      'debossed-letterpress'
    ]);
    expect(duplicateIds).toEqual([]);
    expect(EFFECT_FAMILIES.every((family) => family.source === 'procedural-local')).toBe(true);
    expect(getEffectFamily('disposable-flash-film')?.enabled).toBe(true);
  });

  it('ships six production disposable flash presets with meaningful recipes', () => {
    const presetIds = DISPOSABLE_FLASH_PRESETS.map((preset) => preset.id);
    const neutral = createNeutralDisposableFlashSettings();

    expect(DISPOSABLE_FLASH_PRESETS).toHaveLength(6);
    expect(new Set(presetIds).size).toBe(presetIds.length);
    for (const preset of DISPOSABLE_FLASH_PRESETS) {
      expect(preset.family).toBe('disposable-flash-film');
      expect(preset.kind).toBe('disposable-flash');
      expect(preset.enabled).toBe(true);
      expect(preset.defaultIntensity).toBeGreaterThanOrEqual(45);
      expect(preset.defaultIntensity).toBeLessThanOrEqual(86);
      expect(preset.recipeVersion).toBe('format-effect-recipe-v1');
      expect(preset.description.length).toBeGreaterThan(20);
      expect(preset.tags.length).toBeGreaterThanOrEqual(3);

      const changed = Object.entries(preset.settings)
        .filter(([key, value]) => neutral[key as keyof typeof neutral] !== value);
      expect(changed.length).toBeGreaterThanOrEqual(6);
      expect(getEffectPreset(preset.id)?.id).toBe(preset.id);
    }
  });

  it('uses discriminated effect preset types and keeps disabled future families non-interactive', () => {
    const disposable = EFFECT_PRESETS.filter((preset) => preset.kind === 'disposable-flash');
    const exposedFuture = EFFECT_PRESETS.filter((preset) => preset.kind !== 'disposable-flash' && preset.enabled);
    const disabledFamiliesWithNoPreset = EFFECT_FAMILIES
      .filter((family) => !family.enabled)
      .filter((family) => !EFFECT_PRESETS.some((preset) => preset.family === family.id && preset.enabled))
      .map((family) => family.id);

    expect(disposable).toHaveLength(6);
    expect(exposedFuture).toEqual([]);
    expect(disabledFamiliesWithNoPreset.length).toBeGreaterThan(0);
  });
});
