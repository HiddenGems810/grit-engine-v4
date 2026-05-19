import { describe, expect, it } from 'vitest';
import { createNeutralSnapshot } from '@/lib/editor-config';
import {
  buildPresetRecipeSnapshot,
  countPresetRecipeEffects,
  getPresetDefaultIntensity,
  getPresetSeedKey,
  hasMeaningfulPresetRecipe,
  resetPresetRecipeSnapshot
} from '@/lib/preset-engine';
import { PRESETS } from '@/lib/presets';

const signaturePreset = PRESETS.find((preset) => preset.id === 'sig-creator-glow')!;
const filmPreset = PRESETS.find((preset) => preset.id === 'film-disposable-flash')!;
const disposableFlashPreset = PRESETS.find((preset) => preset.id === 'film-format-instant-flash')!;
const graphicPreset = PRESETS.find((preset) => preset.id === 'gfx-magazine-halftone')!;

describe('premium preset recipe engine', () => {
  it('exposes only complete presets with real multi-effect recipes', () => {
    const incomplete = PRESETS
      .filter((preset) => (
        preset.exposed !== true
        || !preset.recipeVersion
        || preset.defaultIntensity < 0
        || preset.defaultIntensity > 100
        || preset.compatibleImageTypes.length === 0
        || !hasMeaningfulPresetRecipe(preset)
        || countPresetRecipeEffects(preset) < 5
      ))
      .map((preset) => preset.id);

    expect(incomplete).toEqual([]);
  });

  it('blends preset strength predictably without changing the preset seed key', () => {
    const base = createNeutralSnapshot();
    const at0 = buildPresetRecipeSnapshot(base, signaturePreset, 0);
    const at25 = buildPresetRecipeSnapshot(base, signaturePreset, 25);
    const at50 = buildPresetRecipeSnapshot(base, signaturePreset, 50);
    const at75 = buildPresetRecipeSnapshot(base, signaturePreset, 75);
    const at100 = buildPresetRecipeSnapshot(base, signaturePreset, 100);

    expect(at0).toEqual(base);
    expect(at25.saturation).toBeGreaterThan(base.saturation);
    expect(at25.saturation).toBeLessThan(at50.saturation);
    expect(at50.saturation).toBeLessThan(at75.saturation);
    expect(at75.saturation).toBeLessThan(at100.saturation);
    expect(at100.activeLUT).toBe(signaturePreset.activeLUT);
    expect(getPresetSeedKey(signaturePreset)).toBe(getPresetSeedKey(signaturePreset));
    expect(getPresetDefaultIntensity(signaturePreset)).toBe(signaturePreset.defaultIntensity);
  });

  it('keeps film and graphic material choices stable while scaling strength', () => {
    const base = createNeutralSnapshot();
    const subtleFilm = buildPresetRecipeSnapshot(base, filmPreset, 25);
    const fullFilm = buildPresetRecipeSnapshot(base, filmPreset, 100);
    const subtleGraphic = buildPresetRecipeSnapshot(base, graphicPreset, 25);
    const fullGraphic = buildPresetRecipeSnapshot(base, graphicPreset, 100);

    expect(subtleFilm.filmProfile).toBe(fullFilm.filmProfile);
    expect(subtleFilm.grain).toBeLessThan(fullFilm.grain);
    expect(subtleFilm.halation).toBeLessThan(fullFilm.halation);
    expect(subtleGraphic.printProfile).toBe(fullGraphic.printProfile);
    expect(subtleGraphic.materialProfile).toBe(fullGraphic.materialProfile);
    expect(subtleGraphic.halftone).toBeLessThan(fullGraphic.halftone);
  });

  it('can clear an active preset back to the captured pre-preset base snapshot', () => {
    const prePresetManualState = {
      ...createNeutralSnapshot(),
      saturation: 112,
      clarity: 18,
      textureType: 'linen',
      textureIntensity: 22
    };
    const applied = buildPresetRecipeSnapshot(prePresetManualState, signaturePreset, 75);
    const cleared = resetPresetRecipeSnapshot(prePresetManualState);

    expect(applied).not.toEqual(prePresetManualState);
    expect(cleared).toEqual(prePresetManualState);
  });

  it('does not randomize recipe identity when intensity changes', () => {
    const key = getPresetSeedKey(filmPreset);
    for (const intensity of [0, 25, 50, 75, 100]) {
      buildPresetRecipeSnapshot(createNeutralSnapshot(), filmPreset, intensity);
      expect(getPresetSeedKey(filmPreset)).toBe(key);
    }
  });

  it('blends FORMAT-native disposable flash settings through the preset engine', () => {
    const base = createNeutralSnapshot();
    const disabled = buildPresetRecipeSnapshot(base, disposableFlashPreset, 0);
    const balanced = buildPresetRecipeSnapshot(base, disposableFlashPreset, 50);
    const full = buildPresetRecipeSnapshot(base, disposableFlashPreset, 100);

    expect(disabled).toEqual(base);
    expect(balanced.effectFamily).toBe('disposable-flash-film');
    expect(balanced.effectPreset).toBe(disposableFlashPreset.effectPreset);
    expect(balanced.disposableFlashStrength).toBeGreaterThan(base.disposableFlashStrength);
    expect(balanced.disposableFlashStrength).toBeLessThan(full.disposableFlashStrength);
    expect(balanced.disposableCyanShadowCast).toBeLessThan(full.disposableCyanShadowCast);
    expect(full.disposableFilmGrain).toBeGreaterThan(0);
  });
});
