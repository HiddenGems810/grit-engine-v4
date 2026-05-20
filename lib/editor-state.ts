import type { Preset } from '@/lib/presets';
import {
  clampPortraitControlValue,
  createNeutralSnapshot,
  type EngineSnapshot
} from '@/lib/editor-config';
import { normalizeTextureId } from '@/lib/textures';
import type { FormatEffectFamilySelection } from '@/lib/effects/effect-types';
import { normalizeDisposableFlashSettings } from '@/lib/effects/disposable-flash';

const clampPercent = (value: number | undefined) => Math.min(100, Math.max(0, Number.isFinite(value) ? value ?? 0 : 0));

const normalizeEffectFamily = (value: EngineSnapshot['effectFamily'] | undefined): FormatEffectFamilySelection => {
  if (
    value === 'disposable-flash-film'
    || value === 'instant-print-frame'
    || value === 'risograph-grain'
    || value === 'halftone-grunge'
    || value === 'broken-copier-xerox'
    || value === 'reeded-ribbed-glass'
    || value === 'lens-prism'
    || value === 'crt-vhs-camcorder'
    || value === 'aged-grainy-photo'
    || value === 'glitch-acid-distortion'
    || value === 'chrome-liquid-metal'
    || value === 'debossed-letterpress'
  ) {
    return value;
  }
  return 'none';
};

export type EditorStateAction =
  | { type: 'apply-snapshot'; snapshot: EngineSnapshot }
  | { type: 'apply-preset'; preset: Preset }
  | { type: 'reset' };

export const normalizeEditorSnapshot = (snapshot: EngineSnapshot): EngineSnapshot => {
  const disposable = normalizeDisposableFlashSettings({
    flashStrength: snapshot.disposableFlashStrength,
    flashFalloff: snapshot.disposableFlashFalloff,
    warmLightLeak: snapshot.disposableWarmLightLeak,
    redEdgeBurn: snapshot.disposableRedEdgeBurn,
    cyanShadowCast: snapshot.disposableCyanShadowCast,
    filmGrain: snapshot.disposableFilmGrain,
    dustAndScratches: snapshot.disposableDustAndScratches,
    plasticLensSoftness: snapshot.disposablePlasticLensSoftness,
    chromaticFringing: snapshot.disposableChromaticFringing,
    vignette: snapshot.disposableVignette,
    dateStamp: snapshot.disposableDateStamp,
    printFrame: snapshot.disposablePrintFrame,
    stampMode: snapshot.disposableStampMode,
    stampFormat: snapshot.disposableStampFormat,
    stampColor: snapshot.disposableStampColor,
    stampPosition: snapshot.disposableStampPosition,
    customDate: snapshot.disposableCustomDate,
    frameMode: snapshot.disposableFrameMode
  });

  return {
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
    materialEdgeProtection: snapshot.materialEdgeProtection ?? true,
    effectFamily: normalizeEffectFamily(snapshot.effectFamily),
    effectPreset: snapshot.effectPreset ?? 'none',
    effectIntensity: clampPercent(snapshot.effectIntensity),
    disposableFlashStrength: disposable.flashStrength,
    disposableFlashFalloff: disposable.flashFalloff,
    disposableWarmLightLeak: disposable.warmLightLeak,
    disposableRedEdgeBurn: disposable.redEdgeBurn,
    disposableCyanShadowCast: disposable.cyanShadowCast,
    disposableFilmGrain: disposable.filmGrain,
    disposableDustAndScratches: disposable.dustAndScratches,
    disposablePlasticLensSoftness: disposable.plasticLensSoftness,
    disposableChromaticFringing: disposable.chromaticFringing,
    disposableVignette: disposable.vignette,
    disposableDateStamp: disposable.dateStamp,
    disposablePrintFrame: disposable.printFrame,
    disposableStampMode: disposable.stampMode,
    disposableStampFormat: disposable.stampFormat,
    disposableStampColor: disposable.stampColor,
    disposableStampPosition: disposable.stampPosition,
    disposableCustomDate: disposable.customDate,
    disposableFrameMode: disposable.frameMode
  };
};

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
  effectFamily: preset.effectFamily || 'none',
  effectPreset: preset.effectPreset || 'none',
  effectIntensity: preset.effectIntensity || 0,
  disposableFlashStrength: preset.disposableFlashStrength || 0,
  disposableFlashFalloff: preset.disposableFlashFalloff || 0,
  disposableWarmLightLeak: preset.disposableWarmLightLeak || 0,
  disposableRedEdgeBurn: preset.disposableRedEdgeBurn || 0,
  disposableCyanShadowCast: preset.disposableCyanShadowCast || 0,
  disposableFilmGrain: preset.disposableFilmGrain || 0,
  disposableDustAndScratches: preset.disposableDustAndScratches || 0,
  disposablePlasticLensSoftness: preset.disposablePlasticLensSoftness || 0,
  disposableChromaticFringing: preset.disposableChromaticFringing || 0,
  disposableVignette: preset.disposableVignette || 0,
  disposableDateStamp: preset.disposableDateStamp || false,
  disposablePrintFrame: preset.disposablePrintFrame || false,
  disposableStampMode: preset.disposableStampMode || 'off',
  disposableStampFormat: preset.disposableStampFormat || 'MM_DD_YY',
  disposableStampColor: preset.disposableStampColor || 'orange',
  disposableStampPosition: preset.disposableStampPosition || 'bottom-left',
  disposableCustomDate: preset.disposableCustomDate || '',
  disposableFrameMode: preset.disposableFrameMode || 'off',
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
