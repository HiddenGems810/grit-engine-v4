import { describe, expect, it } from 'vitest';
import { PRESET_CATEGORIES, PRESETS, type PresetFamily, type PresetIntensity, type PresetSubjectBias, type PresetTier, type PresetTone } from '@/lib/presets';
import { isKnownTextureId, normalizeTextureId } from '@/lib/textures';

const families: PresetFamily[] = ['signature', 'portrait', 'film', 'social', 'cinematic', 'product', 'graphic', 'experimental'];
const tiers: PresetTier[] = ['hero', 'standard', 'pro', 'experimental'];
const intensities: PresetIntensity[] = ['subtle', 'medium', 'bold', 'extreme'];
const subjectBiases: PresetSubjectBias[] = ['portrait', 'product', 'food', 'fashion', 'night', 'landscape', 'graphic', 'general'];
const previewTones: PresetTone[] = ['clean', 'warm', 'cool', 'soft', 'dark', 'film', 'neon', 'graphic', 'mono', 'experimental'];

describe('premium preset library', () => {
  it('has stable ids, visible categories, and known local/procedural textures', () => {
    const ids = PRESETS.map((preset) => preset.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const badIds = ids.filter((id) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id));
    const visibleCategories = new Set<string>(PRESET_CATEGORIES);
    const invalid = PRESETS
      .filter((preset) => (
        !visibleCategories.has(preset.category)
        || !isKnownTextureId(normalizeTextureId(preset.textureType))
      ))
      .map((preset) => ({ id: preset.id, category: preset.category, textureType: preset.textureType }));

    expect(PRESETS.length).toBeGreaterThanOrEqual(72);
    expect(PRESETS.length).toBeLessThanOrEqual(96);
    expect(duplicateIds).toEqual([]);
    expect(badIds).toEqual([]);
    expect(invalid).toEqual([]);
  });

  it('ships complete taste metadata and valid scores', () => {
    const incomplete = PRESETS
      .filter((preset) => (
        !families.includes(preset.family)
        || !tiers.includes(preset.tier)
        || !intensities.includes(preset.intensity)
        || !subjectBiases.includes(preset.subjectBias)
        || !previewTones.includes(preset.previewTone)
        || typeof preset.skinSafe !== 'boolean'
        || preset.bestFor.length === 0
        || preset.avoidFor.length === 0
        || !preset.description
        || preset.usageTags.length === 0
        || preset.oneClickScore < 0
        || preset.oneClickScore > 100
        || preset.commercialScore < 0
        || preset.commercialScore > 100
        || preset.viralScore < 0
        || preset.viralScore > 100
      ))
      .map((preset) => preset.id);

    expect(incomplete).toEqual([]);
  });

  it('enforces hero, skin-safe, and extreme preset standards', () => {
    const weakHeroes = PRESETS.filter((preset) => preset.tier === 'hero' && preset.oneClickScore < 85).map((preset) => preset.id);
    const unsafeSkinSafe = PRESETS.filter((preset) => (
      preset.skinSafe
      && (
        preset.shadowCrush > 34
        || preset.saturation < 88
        || preset.saturation > 122
        || Math.abs(preset.hueShift) > 18
        || (preset.clarity ?? 0) > 22
        || (preset.skinSmoothing ?? 0) > 18
        || (preset.beautyBoost ?? 0) > 32
        || (preset.skinPolish ?? 0) > 30
        || (preset.faceSlimming ?? 0) > 4
        || (preset.ageShift ?? 0) < -4
        || (preset.ageShift ?? 0) > 2
      )
    )).map((preset) => preset.id);
    const mislabeledExtreme = PRESETS
      .filter((preset) => preset.family === 'experimental' && preset.intensity !== 'extreme')
      .map((preset) => preset.id);
    const defaultExtreme = PRESETS
      .filter((preset) => preset.family === 'experimental' && preset.tier === 'hero')
      .map((preset) => preset.id);

    expect(weakHeroes).toEqual([]);
    expect(unsafeSkinSafe).toEqual([]);
    expect(mislabeledExtreme).toEqual([]);
    expect(defaultExtreme).toEqual([]);
  });

  it('orders signature hero presets as the first-click experience', () => {
    const firstTwelve = PRESETS.slice(0, 12);

    expect(PRESET_CATEGORIES[0]).toBe('FORMAT Signature');
    expect(firstTwelve.every((preset) => preset.family === 'signature')).toBe(true);
    expect(firstTwelve.every((preset) => preset.tier === 'hero')).toBe(true);
    expect(firstTwelve.every((preset) => preset.oneClickScore >= 85)).toBe(true);
  });

  it('keeps preset names aligned with their visible effect settings', () => {
    const mismatchedNames = PRESETS
      .filter((preset) => {
        const name = preset.name.toLowerCase();
        const promisesMonochrome = /\b(b&w|monochrome|silver|gelatin)\b/.test(name);
        const promisesGraphicPrint = /\b(print|halftone|newsprint|litho|dither|bitmap|fax|screenprint|risograph|zine|poster|manga|xerox)\b/.test(name);
        const promisesLight = /\b(glow|bloom|shine|flash|glare|fireworks|candlelight|burnout|mist)\b/.test(name);
        const promisesDegradation = /\b(glitch|drift|lo-fi|cctv|vhs|camcorder|datamosh|grime|distressed|scuffed|dust|fade|damage|horror)\b/.test(name);

        return (
          (promisesMonochrome && !preset.monochrome && preset.saturation > 5)
          || (promisesGraphicPrint && preset.halftone <= 0 && preset.threshold < 120 && !preset.monochrome)
          || (promisesLight && (preset.halation <= 0 && (preset.lightLeak ?? 0) <= 0 && (preset.sparkles ?? 0) <= 0))
          || (promisesDegradation && preset.grain < 25 && preset.chromaOffset < 15 && (preset.dustAndScratches ?? 0) <= 0 && (preset.textureIntensity ?? 0) <= 0)
        );
      })
      .map((preset) => preset.name);

    expect(mismatchedNames).toEqual([]);
  });
});
