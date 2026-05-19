import type { DisposableFlashSettings, FormatEffectFamily, FormatEffectPreset } from '@/lib/effects/effect-types';

export const EFFECT_FAMILIES: FormatEffectFamily[] = [
  {
    id: 'disposable-flash-film',
    name: 'Disposable Flash Film',
    description: 'Harsh direct flash, cyan shadows, warm leaks, plastic lens softness, grain, scratches, and print-frame options.',
    enabled: true,
    source: 'procedural-local',
    tags: ['flash', 'film', 'nightlife']
  },
  {
    id: 'instant-print-frame',
    name: 'Instant Polaroid / Print Frame',
    description: 'Faded instant-print color, lifted blacks, paper frame, captions, and warm chemical softness.',
    enabled: false,
    source: 'procedural-local',
    tags: ['instant', 'paper', 'frame']
  },
  {
    id: 'risograph-grain',
    name: 'Risograph Grain',
    description: 'Limited ink palettes, misregistration, paper tooth, and grainy ink overprint behavior.',
    enabled: false,
    source: 'procedural-local',
    tags: ['riso', 'print', 'ink']
  },
  {
    id: 'halftone-grunge',
    name: 'Halftone Grunge',
    description: 'Printable dot screens with rough paper, ink spread, and posterized tone behavior.',
    enabled: false,
    source: 'procedural-local',
    tags: ['halftone', 'poster', 'print']
  },
  {
    id: 'broken-copier-xerox',
    name: 'Broken Copier / Xerox',
    description: 'Crushed copy contrast, toner noise, streaks, scan bands, and paper defects.',
    enabled: false,
    source: 'procedural-local',
    tags: ['xerox', 'toner', 'copy']
  },
  {
    id: 'reeded-ribbed-glass',
    name: 'Reeded / Ribbed Glass',
    description: 'Vertical glass displacement, refraction bands, blur, and tactile lens distortion.',
    enabled: false,
    source: 'procedural-local',
    tags: ['glass', 'refraction', 'ribbed']
  },
  {
    id: 'lens-prism',
    name: 'Lens & Prism',
    description: 'Rainbow refraction, spectral smear, glass flare, and edge splitting.',
    enabled: false,
    source: 'procedural-local',
    tags: ['prism', 'flare', 'lens']
  },
  {
    id: 'crt-vhs-camcorder',
    name: 'CRT / VHS / Camcorder',
    description: 'Scanlines, chroma bleed, tracking noise, timestamp and OSD presentation.',
    enabled: false,
    source: 'procedural-local',
    tags: ['vhs', 'crt', 'camcorder']
  },
  {
    id: 'aged-grainy-photo',
    name: 'Aged Grainy Photo',
    description: 'Faded color, dust, scratches, uneven exposure, and old print texture.',
    enabled: false,
    source: 'procedural-local',
    tags: ['aged', 'grain', 'print']
  },
  {
    id: 'glitch-acid-distortion',
    name: 'Glitch / Acid Distortion',
    description: 'Displacement bands, RGB split, liquid smear, and warped pixel motion.',
    enabled: false,
    source: 'procedural-local',
    tags: ['glitch', 'acid', 'distortion']
  },
  {
    id: 'chrome-liquid-metal',
    name: 'Chrome / Liquid Metal Finish',
    description: 'Reflective highlight maps, liquid specular distortion, and premium metal sheen.',
    enabled: false,
    source: 'procedural-local',
    tags: ['chrome', 'metal', 'specular']
  },
  {
    id: 'debossed-letterpress',
    name: 'Debossed / Letterpress / Paper Press',
    description: 'Luminance-derived relief shading for pressed-paper and debossed photo finishes.',
    enabled: false,
    source: 'procedural-local',
    tags: ['letterpress', 'paper', 'relief']
  }
];

const settings = (overrides: Partial<DisposableFlashSettings>): DisposableFlashSettings => ({
  flashStrength: 0,
  flashFalloff: 0,
  warmLightLeak: 0,
  redEdgeBurn: 0,
  cyanShadowCast: 0,
  filmGrain: 0,
  dustAndScratches: 0,
  plasticLensSoftness: 0,
  chromaticFringing: 0,
  vignette: 0,
  dateStamp: false,
  printFrame: false,
  ...overrides
});

export const DISPOSABLE_FLASH_PRESETS: FormatEffectPreset[] = [
  {
    id: 'dff-format-instant-flash',
    name: 'FORMAT Instant Flash',
    family: 'disposable-flash-film',
    description: 'A balanced one-click cheap-camera finish: hard center flash, cyan shadows, fine grain, and controlled edge falloff.',
    defaultIntensity: 72,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['hero', 'flash', 'skin-aware', 'nightlife'],
    settings: settings({
      flashStrength: 70,
      flashFalloff: 42,
      warmLightLeak: 22,
      redEdgeBurn: 12,
      cyanShadowCast: 38,
      filmGrain: 46,
      dustAndScratches: 28,
      plasticLensSoftness: 34,
      chromaticFringing: 18,
      vignette: 32
    })
  },
  {
    id: 'dff-nightlife-memory',
    name: 'Nightlife Memory Flash',
    family: 'disposable-flash-film',
    description: 'Candid party-photo flash with lifted blacks, higher grain, modest warm leaks, and imperfect analog grit.',
    defaultIntensity: 78,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['party', 'flash', 'grain', 'candid'],
    settings: settings({
      flashStrength: 82,
      flashFalloff: 58,
      warmLightLeak: 36,
      redEdgeBurn: 22,
      cyanShadowCast: 44,
      filmGrain: 62,
      dustAndScratches: 40,
      plasticLensSoftness: 42,
      chromaticFringing: 22,
      vignette: 46,
      dateStamp: true
    })
  },
  {
    id: 'dff-red-leak-party',
    name: 'Red Leak Party Frame',
    family: 'disposable-flash-film',
    description: 'A stronger red-orange edge-burn look with warm leak pressure, dusty scan defects, and disposable flash punch.',
    defaultIntensity: 76,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['red-leak', 'burn', 'flash', 'poster'],
    settings: settings({
      flashStrength: 68,
      flashFalloff: 50,
      warmLightLeak: 58,
      redEdgeBurn: 68,
      cyanShadowCast: 30,
      filmGrain: 54,
      dustAndScratches: 48,
      plasticLensSoftness: 30,
      chromaticFringing: 26,
      vignette: 42
    })
  },
  {
    id: 'dff-cyan-shadow-party',
    name: 'Cyan Shadow Cheap Flash',
    family: 'disposable-flash-film',
    description: 'Cool contaminated shadows, crunchy flash contrast, soft plastic optics, and believable color noise.',
    defaultIntensity: 70,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['cyan', 'shadow', 'flash', 'street'],
    settings: settings({
      flashStrength: 72,
      flashFalloff: 46,
      warmLightLeak: 16,
      redEdgeBurn: 8,
      cyanShadowCast: 66,
      filmGrain: 50,
      dustAndScratches: 24,
      plasticLensSoftness: 38,
      chromaticFringing: 28,
      vignette: 36
    })
  },
  {
    id: 'dff-print-border-date',
    name: 'Instant Border Date Flash',
    family: 'disposable-flash-film',
    description: 'Disposable flash rendered as a printed memory with in-frame paper border, date stamp, grain, and soft optics.',
    defaultIntensity: 74,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['border', 'date', 'instant', 'flash'],
    settings: settings({
      flashStrength: 64,
      flashFalloff: 54,
      warmLightLeak: 28,
      redEdgeBurn: 18,
      cyanShadowCast: 34,
      filmGrain: 42,
      dustAndScratches: 36,
      plasticLensSoftness: 46,
      chromaticFringing: 14,
      vignette: 24,
      dateStamp: true,
      printFrame: true
    })
  },
  {
    id: 'dff-soft-plastic-lens',
    name: 'Soft Plastic Lens Flash',
    family: 'disposable-flash-film',
    description: 'A gentler flash-film finish with more lens softness, lower damage, and warm memory color for portraits.',
    defaultIntensity: 64,
    recipeVersion: 'format-effect-recipe-v1',
    enabled: true,
    tags: ['soft', 'portrait', 'lens', 'flash'],
    settings: settings({
      flashStrength: 56,
      flashFalloff: 62,
      warmLightLeak: 18,
      redEdgeBurn: 10,
      cyanShadowCast: 24,
      filmGrain: 34,
      dustAndScratches: 18,
      plasticLensSoftness: 62,
      chromaticFringing: 10,
      vignette: 22
    })
  }
];

export const EFFECT_PRESETS: FormatEffectPreset[] = [
  ...DISPOSABLE_FLASH_PRESETS
];

export const getEffectFamily = (id: string | null | undefined) => (
  EFFECT_FAMILIES.find((family) => family.id === id) ?? null
);

export const getEffectPreset = (id: string | null | undefined) => (
  EFFECT_PRESETS.find((preset) => preset.id === id) ?? null
);

export const getEffectPresetsForFamily = (familyId: string | null | undefined) => (
  EFFECT_PRESETS.filter((preset) => preset.family === familyId && preset.enabled)
);
