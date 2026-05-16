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

  it('ships intentional preset and category names without weak generic, sloppy, or borrowed labels', () => {
    const duplicateNames = PRESETS
      .map((preset) => preset.name)
      .filter((name, index, names) => names.indexOf(name) !== index);
    const disallowedLabelPattern = /\b(Trend|Old|Glamour Portrait|Cyberpunk 2077|Blade Runner|Matrix|Oppenheimer|Dune|A24|Ghibli|Evangelion|Ghost in the Shell|Edgerunners|Slender|Backrooms|MTV|TRL|Atari|Game Boy|Sony|Nokia|Off-White|Trash Cam)\b|tracking error|expired/;
    const weakLabels = [
      ...PRESETS.map((preset) => preset.name),
      ...PRESET_CATEGORIES
    ].filter((label) => disallowedLabelPattern.test(label));

    expect(duplicateNames).toEqual([]);
    expect(weakLabels).toEqual([]);
  });
});
