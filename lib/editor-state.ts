import type { Preset } from '@/lib/presets';
import {
  clampPortraitControlValue,
  createNeutralSnapshot,
  type EngineSnapshot
} from '@/lib/editor-config';
import { normalizeTextureId } from '@/lib/textures';

export type EditorStateAction =
  | { type: 'apply-snapshot'; snapshot: EngineSnapshot }
  | { type: 'apply-preset'; preset: Preset }
  | { type: 'reset' };

export const normalizeEditorSnapshot = (snapshot: EngineSnapshot): EngineSnapshot => ({
  ...snapshot,
  skinSmoothing: clampPortraitControlValue('skinSmoothing', snapshot.skinSmoothing),
  glowUp: clampPortraitControlValue('glowUp', snapshot.glowUp),
  faceSlimming: clampPortraitControlValue('faceSlimming', snapshot.faceSlimming),
  blemishRemoval: clampPortraitControlValue('blemishRemoval', snapshot.blemishRemoval),
  expressionLift: clampPortraitControlValue('expressionLift', snapshot.expressionLift),
  beautyBoost: clampPortraitControlValue('beautyBoost', snapshot.beautyBoost),
  ageShift: clampPortraitControlValue('ageShift', snapshot.ageShift),
  eyeBrightening: clampPortraitControlValue('eyeBrightening', snapshot.eyeBrightening),
  jawDefinition: clampPortraitControlValue('jawDefinition', snapshot.jawDefinition),
  skinPolish: clampPortraitControlValue('skinPolish', snapshot.skinPolish),
  teethWhitening: clampPortraitControlValue('teethWhitening', snapshot.teethWhitening),
  makeupStrength: clampPortraitControlValue('makeupStrength', snapshot.makeupStrength),
  artifactRemoval: clampPortraitControlValue('artifactRemoval', snapshot.artifactRemoval),
  textureType: normalizeTextureId(snapshot.textureType),
  materialProfile: snapshot.materialProfile ?? 'none',
  materialStrength: Math.min(100, Math.max(0, snapshot.materialStrength ?? 0)),
  printProfile: snapshot.printProfile ?? 'none',
  paperSurface: snapshot.paperSurface ?? 'none',
  filmProfile: snapshot.filmProfile ?? 'none',
  opticalProfile: snapshot.opticalProfile ?? 'none',
  materialFaceProtection: snapshot.materialFaceProtection ?? true,
  materialEdgeProtection: snapshot.materialEdgeProtection ?? true
});

export const buildSnapshotFromPreset = (baseSnapshot: EngineSnapshot, preset: Preset): EngineSnapshot => normalizeEditorSnapshot({
  ...baseSnapshot,
  inkBleed: preset.inkBleed,
  shadowCrush: preset.shadowCrush,
  midtones: preset.midtones || 0,
  highlights: preset.highlights || 0,
  activeLUT: preset.activeLUT || 'none',
  grain: preset.grain,
  threshold: preset.threshold,
  saturation: preset.saturation || 100,
  hueShift: preset.hueShift || 0,
  halation: preset.halation || 0,
  chromaOffset: preset.chromaOffset || 0,
  monochrome: preset.monochrome || false,
  halftone: preset.halftone || 0,
  scanlines: preset.scanlines || 0,
  vignette: preset.vignette || 0,
  lightLeak: preset.lightLeak || 0,
  lightLeakStyle: preset.lightLeakStyle || 'amber',
  gradientMap: preset.gradientMap || 'none',
  dustAndScratches: preset.dustAndScratches || 0,
  sparkles: preset.sparkles || 0,
  camcorderOSD: preset.camcorderOSD || false,
  prismBlur: preset.prismBlur || 0,
  skinSmoothing: preset.skinSmoothing || 0,
  clarity: preset.clarity || 0,
  glowUp: preset.glowUp || 0,
  faceSlimming: preset.faceSlimming || 0,
  blemishRemoval: preset.blemishRemoval || 0,
  expressionLift: preset.expressionLift || 0,
  beautyBoost: preset.beautyBoost || 0,
  ageShift: preset.ageShift || 0,
  eyeBrightening: preset.eyeBrightening || 0,
  jawDefinition: preset.jawDefinition || 0,
  skinPolish: preset.skinPolish || 0,
  teethWhitening: preset.teethWhitening || 0,
  makeupStrength: preset.makeupStrength || 0,
  colorKnockout: preset.colorKnockout || 'none',
  textureType: normalizeTextureId(preset.textureType),
  textureIntensity: preset.textureIntensity || 50,
  materialProfile: preset.materialProfile || 'none',
  materialStrength: preset.materialStrength || 0,
  printProfile: preset.printProfile || 'none',
  paperSurface: preset.paperSurface || 'none',
  filmProfile: preset.filmProfile || 'none',
  opticalProfile: preset.opticalProfile || 'none',
  materialFaceProtection: preset.skinSafe || preset.subjectBias === 'portrait',
  materialEdgeProtection: preset.family === 'product' || preset.subjectBias === 'product',
  artifactRemoval: preset.artifactRemoval || 0,
  activeCamera: 'Custom Preset'
});

export const reduceEditorSnapshot = (
  state: EngineSnapshot,
  action: EditorStateAction
): EngineSnapshot => {
  switch (action.type) {
    case 'apply-snapshot':
      return normalizeEditorSnapshot(action.snapshot);
    case 'apply-preset':
      return buildSnapshotFromPreset(state, action.preset);
    case 'reset':
      return createNeutralSnapshot();
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
};
