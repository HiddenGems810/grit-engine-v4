import {
  createNeutralSnapshot,
  type EngineSnapshot
} from '@/lib/editor-config';
import { buildSnapshotFromPreset, normalizeEditorSnapshot } from '@/lib/editor-state';
import { clampNumber } from '@/lib/engine/math-utils';
import { fnv1aHash } from '@/lib/engine/render-fingerprint';
import type { Preset } from '@/lib/presets';
import { PRESET_RECIPE_VERSION } from '@/lib/presets';

type NumericEngineKey = {
  [K in keyof EngineSnapshot]: EngineSnapshot[K] extends number ? K : never;
}[keyof EngineSnapshot];

type SwitchEngineKey =
  | 'activeLUT'
  | 'lightLeakStyle'
  | 'gradientMap'
  | 'colorKnockout'
  | 'textureType'
  | 'materialProfile'
  | 'printProfile'
  | 'paperSurface'
  | 'filmProfile'
  | 'opticalProfile';

type BooleanEngineKey =
  | 'monochrome'
  | 'camcorderOSD'
  | 'materialFaceProtection'
  | 'materialEdgeProtection';

const NUMERIC_KEYS: NumericEngineKey[] = [
  'saturation',
  'hueShift',
  'shadowCrush',
  'midtones',
  'highlights',
  'inkBleed',
  'halation',
  'chromaOffset',
  'grain',
  'threshold',
  'halftone',
  'scanlines',
  'vignette',
  'lightLeak',
  'dustAndScratches',
  'sparkles',
  'prismBlur',
  'skinSmoothing',
  'clarity',
  'glowUp',
  'faceSlimming',
  'blemishRemoval',
  'expressionLift',
  'beautyBoost',
  'ageShift',
  'eyeBrightening',
  'jawDefinition',
  'skinPolish',
  'teethWhitening',
  'makeupStrength',
  'artifactRemoval',
  'textureIntensity',
  'materialStrength'
];

const SWITCH_KEYS: SwitchEngineKey[] = [
  'activeLUT',
  'lightLeakStyle',
  'gradientMap',
  'colorKnockout',
  'textureType',
  'materialProfile',
  'printProfile',
  'paperSurface',
  'filmProfile',
  'opticalProfile'
];

const BOOLEAN_KEYS: BooleanEngineKey[] = [
  'monochrome',
  'camcorderOSD',
  'materialFaceProtection',
  'materialEdgeProtection'
];

const isPresetEffectKey = (key: keyof EngineSnapshot) => key !== 'activeCamera';

const roundBlend = (value: number) => Math.round(value * 100) / 100;

const setEngineField = <K extends keyof EngineSnapshot>(
  snapshot: EngineSnapshot,
  key: K,
  value: EngineSnapshot[K]
) => {
  snapshot[key] = value;
};

const getBlendBaseValue = (
  key: NumericEngineKey,
  base: EngineSnapshot,
  target: EngineSnapshot
) => {
  if (key === 'textureIntensity' && base.textureType === 'none' && target.textureType !== 'none') return 0;
  if (key === 'materialStrength' && base.materialProfile === 'none' && target.materialProfile !== 'none') return 0;
  return base[key];
};

const getSwitchThreshold = (key: keyof EngineSnapshot) => {
  if (key === 'gradientMap' || key === 'colorKnockout') return 40;
  if (key === 'textureType' || key === 'materialProfile' || key === 'paperSurface' || key === 'filmProfile' || key === 'opticalProfile') return 8;
  if (key === 'printProfile') return 8;
  return 15;
};

export const clampPresetIntensity = (intensity: number) => clampNumber(Number.isFinite(intensity) ? intensity : 0, 0, 100);

export const getPresetDefaultIntensity = (preset: Preset) => clampPresetIntensity(preset.defaultIntensity ?? 64);

export const getPresetSeedKey = (preset: Preset) => fnv1aHash([
  PRESET_RECIPE_VERSION,
  preset.recipeVersion,
  preset.id,
  preset.name,
  preset.family,
  preset.tier
].join('|'));

export const countPresetRecipeEffects = (preset: Preset) => {
  const neutral = createNeutralSnapshot();
  const target = buildSnapshotFromPreset(neutral, preset);
  return (Object.keys(target) as Array<keyof EngineSnapshot>)
    .filter(isPresetEffectKey)
    .filter((key) => target[key] !== neutral[key]).length;
};

export const hasMeaningfulPresetRecipe = (preset: Preset) => (
  preset.exposed === true
  && preset.recipeVersion === PRESET_RECIPE_VERSION
  && countPresetRecipeEffects(preset) >= 5
);

export const buildPresetRecipeSnapshot = (
  baseSnapshot: EngineSnapshot,
  preset: Preset,
  intensity: number
): EngineSnapshot => {
  const safeIntensity = clampPresetIntensity(intensity);
  if (safeIntensity <= 0) {
    return normalizeEditorSnapshot(baseSnapshot);
  }

  const blend = safeIntensity / 100;
  const base = normalizeEditorSnapshot(baseSnapshot);
  const target = buildSnapshotFromPreset(base, preset);
  const next: EngineSnapshot = {
    ...base,
    activeCamera: `Preset: ${preset.name}`
  };

  for (const key of NUMERIC_KEYS) {
    const from = getBlendBaseValue(key, base, target);
    const to = target[key];
    next[key] = roundBlend(from + ((to - from) * blend));
  }

  for (const key of SWITCH_KEYS) {
    setEngineField(next, key, safeIntensity >= getSwitchThreshold(key) ? target[key] : base[key]);
  }

  for (const key of BOOLEAN_KEYS) {
    const switchAt = key === 'monochrome' || key === 'camcorderOSD' ? 70 : 1;
    setEngineField(next, key, safeIntensity >= switchAt ? target[key] : base[key]);
  }

  return normalizeEditorSnapshot(next);
};

export const resetPresetRecipeSnapshot = (baseSnapshot: EngineSnapshot): EngineSnapshot => (
  normalizeEditorSnapshot(baseSnapshot)
);
