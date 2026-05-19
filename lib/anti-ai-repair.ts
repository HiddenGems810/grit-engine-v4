import {
  clampPortraitControlValue,
  createNeutralSnapshot,
  type EngineSnapshot
} from '@/lib/editor-config';
import { normalizeEditorSnapshot } from '@/lib/editor-state';
import { clampNumber } from '@/lib/engine/math-utils';

export type AntiAiRepairModeId = 'repair' | 'photographed';

export type AntiAiRepairControlKey =
  | 'plasticSkinReduction'
  | 'fakeSharpnessReduction'
  | 'textureRecovery'
  | 'naturalGrain'
  | 'lensImperfection'
  | 'highlightRealism'
  | 'backgroundMushCleanup'
  | 'faceIdentityProtection'
  | 'melanatedSkinPreservation';

export type AntiAiRepairSettings = Record<AntiAiRepairControlKey, number>;

export type AntiAiRepairProfile = {
  id: AntiAiRepairModeId;
  name: string;
  actionLabel: string;
  description: string;
  defaultSettings: AntiAiRepairSettings;
};

export const ANTI_AI_REPAIR_CONTROL_DEFINITIONS: Array<{
  key: AntiAiRepairControlKey;
  label: string;
  description: string;
}> = [
  { key: 'plasticSkinReduction', label: 'Plastic Skin', description: 'Restores believable skin texture without identity edits.' },
  { key: 'fakeSharpnessReduction', label: 'Fake Sharpness', description: 'Softens brittle synthetic halos and compression edges.' },
  { key: 'textureRecovery', label: 'Texture Recovery', description: 'Adds physical tooth and micro-contrast back into flat images.' },
  { key: 'naturalGrain', label: 'Natural Grain', description: 'Integrates fine photographic grain into shadows and mids.' },
  { key: 'lensImperfection', label: 'Lens Imperfection', description: 'Adds restrained optical softness, halation, and falloff.' },
  { key: 'highlightRealism', label: 'Highlight Realism', description: 'Controls clipped synthetic highlights and makes glow directional.' },
  { key: 'backgroundMushCleanup', label: 'Background Mush', description: 'Recovers broad detail without over-sharpening faces.' },
  { key: 'faceIdentityProtection', label: 'Identity Protect', description: 'Locks out face slimming and age-shift style changes.' },
  { key: 'melanatedSkinPreservation', label: 'Melanin Preserve', description: 'Protects skin density, warmth, and believable shadow color.' }
];

export const ANTI_AI_REPAIR_PROFILES: Record<AntiAiRepairModeId, AntiAiRepairProfile> = {
  repair: {
    id: 'repair',
    name: 'Anti-AI Slop Repair',
    actionLabel: 'Anti-AI Slop Repair',
    description: 'Reduces plastic skin, fake edge halos, flat texture, and synthetic lighting while protecting face identity.',
    defaultSettings: {
      plasticSkinReduction: 74,
      fakeSharpnessReduction: 68,
      textureRecovery: 62,
      naturalGrain: 58,
      lensImperfection: 42,
      highlightRealism: 60,
      backgroundMushCleanup: 54,
      faceIdentityProtection: 100,
      melanatedSkinPreservation: 100
    }
  },
  photographed: {
    id: 'photographed',
    name: 'Make It Look Photographed',
    actionLabel: 'Make It Look Photographed',
    description: 'A one-click camera finish: fine grain, halation, lens softness, realistic edges, and physical material response.',
    defaultSettings: {
      plasticSkinReduction: 48,
      fakeSharpnessReduction: 54,
      textureRecovery: 70,
      naturalGrain: 74,
      lensImperfection: 68,
      highlightRealism: 66,
      backgroundMushCleanup: 42,
      faceIdentityProtection: 100,
      melanatedSkinPreservation: 92
    }
  }
};

export const DEFAULT_ANTI_AI_REPAIR_SETTINGS = ANTI_AI_REPAIR_PROFILES.repair.defaultSettings;

export const clampAntiAiRepairSetting = (value: number) => (
  Math.round(clampNumber(Number.isFinite(value) ? value : 0, 0, 100))
);

const finiteOrDefault = (value: number | undefined, fallback: number) => (
  Number.isFinite(value) ? value as number : fallback
);

export const normalizeAntiAiRepairSettings = (
  settings: Partial<AntiAiRepairSettings> = DEFAULT_ANTI_AI_REPAIR_SETTINGS
): AntiAiRepairSettings => {
  const defaults = DEFAULT_ANTI_AI_REPAIR_SETTINGS;
  return {
    plasticSkinReduction: clampAntiAiRepairSetting(finiteOrDefault(settings.plasticSkinReduction, defaults.plasticSkinReduction)),
    fakeSharpnessReduction: clampAntiAiRepairSetting(finiteOrDefault(settings.fakeSharpnessReduction, defaults.fakeSharpnessReduction)),
    textureRecovery: clampAntiAiRepairSetting(finiteOrDefault(settings.textureRecovery, defaults.textureRecovery)),
    naturalGrain: clampAntiAiRepairSetting(finiteOrDefault(settings.naturalGrain, defaults.naturalGrain)),
    lensImperfection: clampAntiAiRepairSetting(finiteOrDefault(settings.lensImperfection, defaults.lensImperfection)),
    highlightRealism: clampAntiAiRepairSetting(finiteOrDefault(settings.highlightRealism, defaults.highlightRealism)),
    backgroundMushCleanup: clampAntiAiRepairSetting(finiteOrDefault(settings.backgroundMushCleanup, defaults.backgroundMushCleanup)),
    faceIdentityProtection: clampAntiAiRepairSetting(finiteOrDefault(settings.faceIdentityProtection, defaults.faceIdentityProtection)),
    melanatedSkinPreservation: clampAntiAiRepairSetting(finiteOrDefault(settings.melanatedSkinPreservation, defaults.melanatedSkinPreservation))
  };
};

export const getAntiAiRepairProfile = (mode: AntiAiRepairModeId) => ANTI_AI_REPAIR_PROFILES[mode];

const scaled = (value: number, multiplier: number, offset = 0) => offset + (value * multiplier);

export const buildAntiAiRepairSnapshot = (
  baseSnapshot: EngineSnapshot = createNeutralSnapshot(),
  mode: AntiAiRepairModeId,
  settings: Partial<AntiAiRepairSettings> = getAntiAiRepairProfile(mode).defaultSettings
): EngineSnapshot => {
  const safe = normalizeAntiAiRepairSettings(settings);
  const photographed = mode === 'photographed';
  const identityProtection = safe.faceIdentityProtection >= 50;
  const melaninProtection = safe.melanatedSkinPreservation >= 50;
  const protectedShadowCrush = melaninProtection ? 24 : 32;
  const targetShadowCrush = photographed
    ? protectedShadowCrush + scaled(safe.lensImperfection, 0.10) + scaled(safe.highlightRealism, 0.05)
    : protectedShadowCrush + scaled(safe.highlightRealism, 0.08) + scaled(safe.backgroundMushCleanup, 0.05);

  const next: EngineSnapshot = {
    ...baseSnapshot,
    monochrome: false,
    saturation: clampNumber(98 + scaled(safe.textureRecovery, 0.03) + scaled(safe.melanatedSkinPreservation, 0.04) - scaled(safe.fakeSharpnessReduction, 0.015), 90, 112),
    hueShift: 0,
    shadowCrush: Math.round(clampNumber(targetShadowCrush, 18, photographed ? 42 : 36)),
    midtones: Math.round(clampNumber(5 + scaled(safe.textureRecovery, 0.04) + scaled(safe.highlightRealism, 0.05), 4, 14)),
    highlights: Math.round(clampNumber(4 + scaled(safe.highlightRealism, 0.11), 4, 14)),
    activeLUT: photographed ? 'portra-soft' : 'clean-luxe',
    inkBleed: Math.round(clampNumber(2 + scaled(safe.fakeSharpnessReduction, 0.08) + scaled(safe.lensImperfection, 0.09), 0, photographed ? 14 : 11)),
    halation: Math.round(clampNumber(2 + scaled(safe.highlightRealism, 0.08) + scaled(safe.lensImperfection, photographed ? 0.08 : 0.04), 0, 14)),
    chromaOffset: photographed ? 1 : 0,
    grain: Math.round(clampNumber(4 + scaled(safe.naturalGrain, photographed ? 0.27 : 0.22) + scaled(safe.textureRecovery, 0.07), 0, photographed ? 34 : 28)),
    threshold: 0,
    halftone: 0,
    scanlines: 0,
    vignette: Math.round(clampNumber(scaled(safe.lensImperfection, photographed ? 0.14 : 0.08), 0, photographed ? 14 : 9)),
    lightLeak: 0,
    lightLeakStyle: 'amber',
    gradientMap: 'none',
    dustAndScratches: 0,
    sparkles: 0,
    camcorderOSD: false,
    prismBlur: Math.round(clampNumber(scaled(safe.fakeSharpnessReduction, 0.025), 0, 2)),
    skinSmoothing: clampPortraitControlValue('skinSmoothing', Math.round(clampNumber(scaled(safe.plasticSkinReduction, 0.10), 0, 12))),
    clarity: Math.round(clampNumber(
      6 + scaled(safe.textureRecovery, 0.12) + scaled(safe.backgroundMushCleanup, 0.08) - scaled(safe.fakeSharpnessReduction, 0.08),
      2,
      photographed ? 18 : 14
    )),
    glowUp: clampPortraitControlValue('glowUp', Math.round(clampNumber(scaled(safe.highlightRealism, 0.05), 0, 6))),
    faceSlimming: identityProtection ? 0 : clampPortraitControlValue('faceSlimming', 2),
    blemishRemoval: clampPortraitControlValue('blemishRemoval', Math.round(clampNumber(8 + scaled(safe.plasticSkinReduction, 0.14), 0, 22))),
    expressionLift: identityProtection ? 0 : clampPortraitControlValue('expressionLift', 3),
    beautyBoost: clampPortraitControlValue('beautyBoost', Math.round(clampNumber(8 + scaled(safe.plasticSkinReduction, 0.05), 0, 16))),
    ageShift: identityProtection ? 0 : clampPortraitControlValue('ageShift', -1),
    eyeBrightening: clampPortraitControlValue('eyeBrightening', Math.round(clampNumber(3 + scaled(safe.highlightRealism, 0.05), 0, 8))),
    jawDefinition: clampPortraitControlValue('jawDefinition', Math.round(clampNumber(4 + scaled(safe.backgroundMushCleanup, 0.07), 0, 10))),
    skinPolish: clampPortraitControlValue('skinPolish', Math.round(clampNumber(6 + scaled(safe.plasticSkinReduction, 0.15) + scaled(safe.melanatedSkinPreservation, 0.03), 0, 22))),
    teethWhitening: clampPortraitControlValue('teethWhitening', Math.round(clampNumber(scaled(safe.highlightRealism, 0.04), 0, 6))),
    makeupStrength: clampPortraitControlValue('makeupStrength', 0),
    artifactRemoval: clampPortraitControlValue('artifactRemoval', Math.round(clampNumber(
      6 + scaled(safe.fakeSharpnessReduction, 0.18) + scaled(safe.plasticSkinReduction, 0.06) + scaled(safe.backgroundMushCleanup, 0.06),
      0,
      24
    ))),
    colorKnockout: 'none',
    textureType: photographed ? '4k_film_dust' : 'none',
    textureIntensity: photographed ? Math.round(clampNumber(12 + scaled(safe.naturalGrain, 0.12), 0, 24)) : 0,
    materialProfile: photographed ? 'fine-35mm-grain' : 'matte-photo-paper',
    materialStrength: Math.round(clampNumber(8 + scaled(safe.textureRecovery, 0.22) + scaled(safe.naturalGrain, 0.08), 0, photographed ? 32 : 28)),
    printProfile: 'none',
    paperSurface: 'matte-photo-paper',
    filmProfile: 'fine-35mm',
    opticalProfile: photographed ? 'pro-mist' : 'glass-diffusion',
    materialFaceProtection: true,
    materialEdgeProtection: true,
    activeCamera: getAntiAiRepairProfile(mode).name
  };

  return normalizeEditorSnapshot(next);
};
