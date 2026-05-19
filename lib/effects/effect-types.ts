export type FormatEffectFamilyId =
  | 'disposable-flash-film'
  | 'instant-print-frame'
  | 'risograph-grain'
  | 'halftone-grunge'
  | 'broken-copier-xerox'
  | 'reeded-ribbed-glass'
  | 'lens-prism'
  | 'crt-vhs-camcorder'
  | 'aged-grainy-photo'
  | 'glitch-acid-distortion'
  | 'chrome-liquid-metal'
  | 'debossed-letterpress';

export type FormatEffectFamilySelection = FormatEffectFamilyId | 'none';
export type FormatEffectSource = 'procedural-local';

export type FormatEffectFamily = {
  id: FormatEffectFamilyId;
  name: string;
  description: string;
  enabled: boolean;
  source: FormatEffectSource;
  tags: string[];
};

export type DisposableFlashSettings = {
  flashStrength: number;
  flashFalloff: number;
  warmLightLeak: number;
  redEdgeBurn: number;
  cyanShadowCast: number;
  filmGrain: number;
  dustAndScratches: number;
  plasticLensSoftness: number;
  chromaticFringing: number;
  vignette: number;
  dateStamp: boolean;
  printFrame: boolean;
};

export type FormatEffectPreset = {
  id: string;
  name: string;
  family: FormatEffectFamilyId;
  description: string;
  defaultIntensity: number;
  recipeVersion: 'format-effect-recipe-v1';
  enabled: boolean;
  tags: string[];
  settings: DisposableFlashSettings;
};
