import type { Preset } from '@/lib/presets';
import { CUSTOM_PRESET_CATEGORY } from '@/lib/editor-config';

export const CUSTOM_PRESET_SCHEMA_VERSION = 2;

export type CustomPresetBundle = {
  app: 'FORMAT';
  schemaVersion: number;
  exportedAt: string;
  presets: Preset[];
};

export const createCustomPresetBundle = (presets: Preset[]): CustomPresetBundle => ({
  app: 'FORMAT',
  schemaVersion: CUSTOM_PRESET_SCHEMA_VERSION,
  exportedAt: new Date().toISOString(),
  presets
});

export const serializeCustomPresetBundle = (presets: Preset[]) => JSON.stringify(createCustomPresetBundle(presets), null, 2);

export const parseCustomPresetBundle = (raw: string): { presets: Preset[]; warning: string | null } => {
  const parsed = JSON.parse(raw) as unknown;
  const bundle = parsed as Partial<CustomPresetBundle> | Preset[];

  if (Array.isArray(bundle)) {
    return { presets: normalizeImportedCustomPresets(bundle as Preset[]), warning: 'Imported legacy custom preset array. It was upgraded to the current schema.' };
  }

  if (!bundle || bundle.app !== 'FORMAT' || !Array.isArray(bundle.presets)) {
    throw new Error('This is not a valid FORMAT preset bundle.');
  }

  if (typeof bundle.schemaVersion !== 'number') {
    throw new Error('Preset bundle is missing a schema version.');
  }

  if (bundle.schemaVersion > CUSTOM_PRESET_SCHEMA_VERSION) {
    throw new Error(`Preset bundle schema v${bundle.schemaVersion} is newer than this app supports.`);
  }

  const warning = bundle.schemaVersion < CUSTOM_PRESET_SCHEMA_VERSION
    ? `Imported older preset schema v${bundle.schemaVersion}; FORMAT upgraded it on import.`
    : null;

  return {
    presets: normalizeImportedCustomPresets(bundle.presets as Preset[]),
    warning
  };
};

export const mergeCustomPresets = (existing: Preset[], incoming: Preset[]) => {
  const seen = new Set<string>();
  return [...incoming, ...existing].filter((preset) => {
    const key = `${preset.id}:${preset.name.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const normalizeImportedCustomPresets = (presets: Preset[]) => presets.map((preset) => ({
  ...preset,
  category: CUSTOM_PRESET_CATEGORY
}));
