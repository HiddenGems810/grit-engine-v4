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
export type DisposableStampMode = 'off' | 'today' | 'seeded-retro' | 'custom';
export type DisposableStampFormat = 'MM_DD_YY' | 'DD_MM_YY' | 'YYYY_MM_DD';
export type DisposableStampColor = 'orange' | 'red' | 'white';
export type DisposableStampPosition = 'bottom-left' | 'bottom-right';
export type DisposableFrameMode = 'off' | 'in-frame' | 'expanded-print';

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
  stampMode: DisposableStampMode;
  stampFormat: DisposableStampFormat;
  stampColor: DisposableStampColor;
  stampPosition: DisposableStampPosition;
  customDate: string;
  frameMode: DisposableFrameMode;
};

export type BaseFormatEffectPreset = {
  id: string;
  name: string;
  family: FormatEffectFamilyId;
  description: string;
  defaultIntensity: number;
  recipeVersion: 'format-effect-recipe-v1';
  enabled: boolean;
  tags: string[];
};

export type DisposableFlashEffectPreset = BaseFormatEffectPreset & {
  kind: 'disposable-flash';
  family: 'disposable-flash-film';
  settings: DisposableFlashSettings;
};

export type RisographEffectPreset = BaseFormatEffectPreset & {
  kind: 'risograph';
  family: 'risograph-grain';
  settings: Record<string, never>;
};

export type XeroxEffectPreset = BaseFormatEffectPreset & {
  kind: 'xerox';
  family: 'broken-copier-xerox';
  settings: Record<string, never>;
};

export type PrismEffectPreset = BaseFormatEffectPreset & {
  kind: 'prism';
  family: 'lens-prism';
  settings: Record<string, never>;
};

export type ReededGlassEffectPreset = BaseFormatEffectPreset & {
  kind: 'reeded-glass';
  family: 'reeded-ribbed-glass';
  settings: Record<string, never>;
};

export type ChromeEffectPreset = BaseFormatEffectPreset & {
  kind: 'chrome';
  family: 'chrome-liquid-metal';
  settings: Record<string, never>;
};

export type FormatEffectPreset =
  | DisposableFlashEffectPreset
  | RisographEffectPreset
  | XeroxEffectPreset
  | PrismEffectPreset
  | ReededGlassEffectPreset
  | ChromeEffectPreset;
