import { describe, expect, it } from 'vitest';
import { CUSTOM_PRESET_CATEGORY, createNeutralSnapshot, buildPresetFromSnapshot } from '@/lib/editor-config';
import { createCustomPresetBundle, mergeCustomPresets, parseCustomPresetBundle, serializeCustomPresetBundle } from './custom-presets';

describe('custom preset schema', () => {
  it('exports and imports a versioned FORMAT preset bundle', () => {
    const preset = buildPresetFromSnapshot(createNeutralSnapshot(), 'Beta Custom');
    const raw = serializeCustomPresetBundle([preset]);
    const parsed = parseCustomPresetBundle(raw);

    expect(parsed.presets[0].name).toBe('Beta Custom');
    expect(parsed.warning).toBeNull();
    expect(createCustomPresetBundle([preset]).schemaVersion).toBe(2);
  });

  it('imports legacy arrays with a compatibility warning', () => {
    const preset = buildPresetFromSnapshot(createNeutralSnapshot(), 'Legacy Custom');
    const parsed = parseCustomPresetBundle(JSON.stringify([preset]));

    expect(parsed.presets).toHaveLength(1);
    expect(parsed.warning).toContain('legacy');
  });

  it('normalizes imported preset bundles into the visible custom specification category', () => {
    const preset = {
      ...buildPresetFromSnapshot(createNeutralSnapshot(), 'Imported Custom'),
      category: 'Custom Presets'
    };
    const raw = JSON.stringify({
      app: 'FORMAT',
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      presets: [preset]
    });

    const parsed = parseCustomPresetBundle(raw);

    expect(parsed.presets[0].category).toBe(CUSTOM_PRESET_CATEGORY);
  });

  it('merges incoming presets without duplicate id/name pairs', () => {
    const preset = buildPresetFromSnapshot(createNeutralSnapshot(), 'Merge Custom');
    expect(mergeCustomPresets([preset], [preset])).toHaveLength(1);
  });
});
