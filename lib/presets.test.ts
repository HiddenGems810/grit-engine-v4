import { describe, expect, it } from 'vitest';
import { PRESET_CATEGORIES, PRESETS } from '@/lib/presets';
import { isKnownTextureId, normalizeTextureId } from '@/lib/textures';

describe('professional preset library', () => {
  it('uses only known local/procedural texture ids after normalization', () => {
    const invalidTextures = PRESETS
      .map((preset) => ({
        id: preset.id,
        name: preset.name,
        textureType: preset.textureType ?? 'none',
        normalized: normalizeTextureId(preset.textureType ?? 'none')
      }))
      .filter((preset) => preset.normalized !== 'none' && !isKnownTextureId(preset.normalized));

    expect(invalidTextures).toEqual([]);
  });

  it('exports release-ready preset metadata and canonical texture ids', () => {
    const incomplete = PRESETS
      .filter((preset) => (
        !preset.description
        || !preset.usageTags
        || preset.usageTags.length === 0
        || (preset.textureType !== undefined && preset.textureType !== 'none' && !isKnownTextureId(preset.textureType))
        || preset.textureType?.startsWith('4k_vintage')
        || preset.textureType?.startsWith('4k_grunge')
        || preset.textureType?.startsWith('4k_linen')
      ))
      .map((preset) => ({ id: preset.id, textureType: preset.textureType }));

    expect(incomplete).toEqual([]);
  });

  it('keeps professional presets inside sane finishing ranges', () => {
    const outliers = PRESETS.filter((preset) => (
      preset.shadowCrush < 0
      || preset.shadowCrush > 150
      || preset.saturation < 0
      || preset.saturation > 300
      || preset.grain < 0
      || preset.grain > 100
      || preset.halftone < 0
      || preset.halftone > 25
      || (preset.textureIntensity ?? 0) < 0
      || (preset.textureIntensity ?? 0) > 100
    )).map((preset) => preset.id);

    expect(outliers).toEqual([]);
  });

  it('keeps every shipped preset mapped to a visible category', () => {
    const visibleCategories = new Set<string>(PRESET_CATEGORIES);
    const unknownCategories = PRESETS
      .filter((preset) => !visibleCategories.has(preset.category))
      .map((preset) => ({ id: preset.id, category: preset.category }));

    expect(unknownCategories).toEqual([]);
  });

  it('keeps renamed categories on their intended tone policies', () => {
    const neonHero = PRESETS.find((preset) => preset.id === 'cpn1');
    const musicVideoPortrait = PRESETS.find((preset) => preset.id === 'mv1');

    expect(neonHero?.category).toBe('Neon Future Core');
    expect(neonHero?.shadowCrush).toBeGreaterThanOrEqual(90);
    expect(musicVideoPortrait?.category).toBe('Music Video (2000s)');
    expect(musicVideoPortrait?.shadowCrush).toBeLessThanOrEqual(34);
    expect(musicVideoPortrait?.usageTags).toContain('portrait-safe');
  });

  it('keeps preset names aligned with their visible effect settings', () => {
    const mismatchedNames = PRESETS
      .filter((preset) => {
        const name = preset.name.toLowerCase();
        const promisesMonochrome = /\b(b&w|monochrome|1-bit)\b/.test(name);
        const promisesGraphicPrint = /\b(print|halftone|dots|newsprint|litho|dither|bitmap|fax|screenprint|risograph|stamp)\b/.test(name);
        const promisesLight = /\b(glow|bloom|shine|flash|glare|fireworks|candlelight|burnout)\b/.test(name)
          || (/\blaser\b/.test(name) && !/\bprint\b/.test(name));
        const promisesDegradation = /\b(glitch|drift|lo-fi|cctv|vhs|camcorder|datamosh|grime|distressed|scuffed|dust|fade)\b/.test(name);

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

  it('ships intentional preset and category names without weak generic, sloppy, or borrowed labels', () => {
    const duplicateNames = PRESETS
      .map((preset) => preset.name)
      .filter((name, index, names) => names.indexOf(name) !== index);
    const disallowedLabelPattern = /\b(Trend|Old|Glamour Portrait|Cyberpunk 2077|Blade Runner|Matrix|Oppenheimer|Dune|A24|Ghibli|Evangelion|Ghost in the Shell|Edgerunners|Night City|Slender|Backrooms|MTV|TRL|Atari|Game Boy|Sony|Nokia|Off-White|Trash Cam)\b|tracking error|expired/i;
    const weakLabels = [
      ...PRESETS.map((preset) => preset.name),
      ...PRESET_CATEGORIES
    ].filter((label) => disallowedLabelPattern.test(label));

    expect(duplicateNames).toEqual([]);
    expect(weakLabels).toEqual([]);
  });
});
