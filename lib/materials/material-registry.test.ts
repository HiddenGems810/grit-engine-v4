import { describe, expect, it } from 'vitest';
import { MATERIAL_PRESETS } from './material-registry';
import type { MaterialBlendMode, MaterialFamily, MaterialSafety } from './material-types';

const families: MaterialFamily[] = ['paper', 'print', 'film', 'digital', 'surface', 'graphic'];
const blendModes: MaterialBlendMode[] = ['overlay', 'soft-light', 'multiply', 'screen', 'color-burn', 'luminosity', 'grain-merge', 'displacement', 'mask-only'];
const safetyLevels: MaterialSafety[] = ['portrait-safe', 'commercial-safe', 'graphic-bold', 'experimental'];

describe('material registry', () => {
  it('ships unique local/procedural material ids with valid metadata', () => {
    const ids = MATERIAL_PRESETS.map((material) => material.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    const invalid = MATERIAL_PRESETS
      .filter((material) => (
        !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(material.id)
        || !material.name
        || !families.includes(material.family)
        || !safetyLevels.includes(material.safety)
        || !blendModes.includes(material.blendMode)
        || material.defaultStrength < 0
        || material.defaultStrength > 100
        || material.maxSafeStrength < 0
        || material.maxSafeStrength > 100
        || material.bestFor.length === 0
        || material.tags.length === 0
      ))
      .map((material) => material.id);

    expect(duplicateIds).toEqual([]);
    expect(invalid).toEqual([]);
  });

  it('does not depend on remote URLs for core materials', () => {
    const serialized = JSON.stringify(MATERIAL_PRESETS);

    expect(serialized).not.toContain('http://');
    expect(serialized).not.toContain('https://');
    expect(serialized).not.toContain('unsplash');
  });

  it('keeps portrait-safe material strengths conservative and experimental materials out of default safety', () => {
    const unsafePortraitMaterials = MATERIAL_PRESETS
      .filter((material) => material.safety === 'portrait-safe' && (material.maxSafeStrength > 40 || material.affectsSkin))
      .map((material) => material.id);
    const experimentalDefaultMaterials = MATERIAL_PRESETS
      .filter((material) => material.safety === 'experimental' && material.defaultStrength < 50)
      .map((material) => material.id);

    expect(unsafePortraitMaterials).toEqual([]);
    expect(experimentalDefaultMaterials).toEqual([]);
  });
});
