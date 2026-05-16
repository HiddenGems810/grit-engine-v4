import type { Preset } from './presets';

export const CUSTOM_PRESET_CATEGORY = 'Custom Specifications';
export const CUSTOM_PRESET_STORAGE_KEY = 'format-system-04-custom-presets';

export type MenuKey = 'file' | 'edit' | 'help' | null;

export type EngineSnapshot = {
  monochrome: boolean;
  saturation: number;
  hueShift: number;
  shadowCrush: number;
  midtones: number;
  highlights: number;
  activeLUT: string;
  inkBleed: number;
  halation: number;
  chromaOffset: number;
  grain: number;
  threshold: number;
  halftone: number;
  scanlines: number;
  vignette: number;
  lightLeak: number;
  lightLeakStyle: string;
  gradientMap: string;
  dustAndScratches: number;
  sparkles: number;
  camcorderOSD: boolean;
  prismBlur: number;
  skinSmoothing: number;
  clarity: number;
  glowUp: number;
  faceSlimming: number;
  blemishRemoval: number;
  expressionLift: number;
  beautyBoost: number;
  ageShift: number;
  eyeBrightening: number;
  jawDefinition: number;
  skinPolish: number;
  teethWhitening: number;
  makeupStrength: number;
  artifactRemoval: number;
  colorKnockout: 'none' | 'red' | 'green' | 'blue' | 'warm';
  textureType: string;
  textureIntensity: number;
  activeCamera: string;
};

export type HistoryEntry = {
  id: number;
  label: string;
  detail: string;
  timestamp: string;
  snapshot: EngineSnapshot;
};

export type PortraitPoint = { x: number; y: number };

export type PortraitGuide = {
  bounds: { x: number; y: number; width: number; height: number };
  center: PortraitPoint;
  faceOval: PortraitPoint[];
  leftBrowContour: PortraitPoint[];
  rightBrowContour: PortraitPoint[];
  leftEyeContour: PortraitPoint[];
  rightEyeContour: PortraitPoint[];
  leftEye: PortraitPoint;
  rightEye: PortraitPoint;
  nose: PortraitPoint;
  mouthLeft: PortraitPoint;
  mouthRight: PortraitPoint;
  mouthCenter: PortraitPoint;
  mouthTop: PortraitPoint;
  mouthBottom: PortraitPoint;
  chin: PortraitPoint;
  forehead: PortraitPoint;
};

export type PortraitModelState = 'idle' | 'loading' | 'ready' | 'analyzing' | 'unavailable';

export type PortraitPreset = {
  id: string;
  name: string;
  values: Partial<Pick<EngineSnapshot, 'beautyBoost' | 'blemishRemoval' | 'faceSlimming' | 'expressionLift' | 'ageShift' | 'eyeBrightening' | 'jawDefinition' | 'skinPolish' | 'skinSmoothing' | 'glowUp' | 'teethWhitening' | 'makeupStrength' | 'clarity' | 'artifactRemoval'>>;
};

export type PortraitControlKey = 'skinSmoothing' | 'glowUp' | 'faceSlimming' | 'blemishRemoval' | 'expressionLift' | 'beautyBoost' | 'ageShift' | 'eyeBrightening' | 'jawDefinition' | 'skinPolish' | 'teethWhitening' | 'makeupStrength' | 'artifactRemoval';

export const PORTRAIT_PRESETS: PortraitPreset[] = [
  {
    id: 'editorial-model-clean',
    name: 'Editorial Model Clean',
    values: { beautyBoost: 26, blemishRemoval: 22, faceSlimming: 3, expressionLift: 6, ageShift: -2, eyeBrightening: 10, jawDefinition: 10, skinPolish: 20, skinSmoothing: 12, glowUp: 5, teethWhitening: 6, makeupStrength: 4, clarity: 10, artifactRemoval: 6 }
  },
  {
    id: 'luxury-beauty-reel',
    name: 'Luxury Beauty Reel',
    values: { beautyBoost: 38, blemishRemoval: 28, faceSlimming: 4, expressionLift: 10, ageShift: -4, eyeBrightening: 14, jawDefinition: 12, skinPolish: 28, skinSmoothing: 16, glowUp: 8, teethWhitening: 10, makeupStrength: 10, clarity: 12, artifactRemoval: 8 }
  },
  {
    id: 'mens-groomed-camera',
    name: "Men's Groomed Camera",
    values: { beautyBoost: 10, blemishRemoval: 16, faceSlimming: 0, expressionLift: 4, ageShift: 0, eyeBrightening: 6, jawDefinition: 18, skinPolish: 10, skinSmoothing: 6, glowUp: 0, teethWhitening: 4, makeupStrength: 0, clarity: 16, artifactRemoval: 8 }
  },
  {
    id: 'gym-selfie-sculpt',
    name: 'Gym Selfie Sculpt',
    values: { beautyBoost: 8, blemishRemoval: 14, faceSlimming: 4, expressionLift: 3, ageShift: 0, eyeBrightening: 4, jawDefinition: 20, skinPolish: 8, skinSmoothing: 4, glowUp: 0, teethWhitening: 2, makeupStrength: 0, clarity: 18, artifactRemoval: 10 }
  }
];

export const PORTRAIT_CONTROL_LIMITS: Record<PortraitControlKey, { min: number; max: number }> = {
  skinSmoothing: { min: 0, max: 24 },
  glowUp: { min: 0, max: 24 },
  faceSlimming: { min: 0, max: 15 },
  blemishRemoval: { min: 0, max: 42 },
  expressionLift: { min: 0, max: 24 },
  beautyBoost: { min: 0, max: 46 },
  ageShift: { min: -20, max: 20 },
  eyeBrightening: { min: 0, max: 28 },
  jawDefinition: { min: 0, max: 26 },
  skinPolish: { min: 0, max: 52 },
  teethWhitening: { min: 0, max: 24 },
  makeupStrength: { min: 0, max: 22 },
  artifactRemoval: { min: 0, max: 20 }
};

export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  'Airbrush & Face Retouch': 'Portrait Finish',
  'Yulian Graphics (Viral)': 'Graphic Viral',
  'Camera Simulation': 'Camera Sim',
  'Vintage Cameras (Pre-1980)': 'Vintage Cameras',
  'Retro Tech (1980s)': 'Retro Tech',
  'Digital Dawn (1990s)': 'Digital Dawn',
  'Y2K & Streetwear': 'Y2K Street',
  'Print Halftone & Xerox': 'Print Halftone',
  'Seasons & Nature': 'Seasons',
  'Holidays & Events': 'Events',
  'Viral & Social': 'Social Viral',
  'Influencer Portraits': 'Influencer',
  'Food & Tabletop': 'Food Tabletop',
  'Bitmap & Dither': 'Bitmap',
  'Cinematic & Blockbuster': 'Cinematic',
  'Anime & Cel Shaded': 'Cel Shaded',
  'Gothic & Dark Academia': 'Dark Academia',
  'Cyberpunk 2077 Core': 'Cyberpunk',
  'Glitchcore & Webcore': 'Webcore',
  'Analog Horror / Found Footage': 'Found Footage',
  'Music Video (2000s MTV)': 'Music Video',
  'Dreamcore & Liminal Space': 'Dreamcore'
};

export const PARAM_LABELS: Record<keyof EngineSnapshot, string> = {
  monochrome: 'Monochrome Mode',
  saturation: 'Saturation Pipeline',
  hueShift: 'Color Phase',
  shadowCrush: 'Black Point',
  midtones: 'Midtone Curve',
  highlights: 'White Point',
  activeLUT: 'LUT Specification',
  inkBleed: 'Lens Blur Radius',
  halation: 'Film Halation',
  chromaOffset: 'Chromatic Shift',
  grain: 'Film Grain Overlay',
  threshold: 'Lithograph Bitmap',
  halftone: 'Printer Halftone Dots',
  scanlines: 'CRT Scanlines',
  vignette: 'Lens Vignette',
  lightLeak: 'Light Leak',
  lightLeakStyle: 'Leak Signature',
  gradientMap: 'Gradient Map',
  dustAndScratches: 'Surface Distress',
  sparkles: 'Star Filter',
  camcorderOSD: 'Camcorder OSD',
  prismBlur: 'Prism Blur',
  skinSmoothing: 'Surface Softening',
  clarity: 'Clarity',
  glowUp: 'Glow Up',
  faceSlimming: 'Face Slimming',
  blemishRemoval: 'Blemish Removal',
  expressionLift: 'Expression Lift',
  beautyBoost: 'Beauty Boost',
  ageShift: 'Age Shift',
  eyeBrightening: 'Eye Brightening',
  jawDefinition: 'Jaw Definition',
  skinPolish: 'Skin Polish',
  teethWhitening: 'Teeth Whitening',
  makeupStrength: 'Makeup Pop',
  artifactRemoval: 'Artifact Removal',
  colorKnockout: 'Selective Color',
  textureType: 'Texture Surface',
  textureIntensity: 'Texture Intensity',
  activeCamera: 'Capture Profile'
};

export const clampSliderValue = (value: number) => Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));

export const FACE_OVAL_INDICES = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109];
export const LEFT_BROW_CONTOUR_INDICES = [70, 63, 105, 66, 107, 55, 65, 52, 53, 46];
export const RIGHT_BROW_CONTOUR_INDICES = [336, 296, 334, 293, 300, 285, 295, 282, 283, 276];
export const LEFT_EYE_CONTOUR_INDICES = [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7];
export const RIGHT_EYE_CONTOUR_INDICES = [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249];

const midpoint = (a: PortraitPoint, b: PortraitPoint): PortraitPoint => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2
});

export const drawSmoothClosedPath = (ctx: CanvasRenderingContext2D, points: PortraitPoint[]) => {
  if (points.length < 2) return;

  const firstMid = midpoint(points[0], points[1]);
  ctx.beginPath();
  ctx.moveTo(firstMid.x, firstMid.y);

  for (let i = 1; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const nextMid = midpoint(current, next);
    ctx.quadraticCurveTo(current.x, current.y, nextMid.x, nextMid.y);
  }

  const closingMid = midpoint(points[0], points[1]);
  ctx.quadraticCurveTo(points[0].x, points[0].y, closingMid.x, closingMid.y);
  ctx.closePath();
};

export { smoothStep } from './engine/math-utils';

export const scalePointsFromCenter = (
  points: PortraitPoint[],
  center: PortraitPoint,
  scaleX: number,
  scaleY: number,
  offsetY = 0
) => points.map((point) => ({
  x: center.x + (point.x - center.x) * scaleX,
  y: center.y + (point.y - center.y) * scaleY + offsetY
}));

export const createNeutralSnapshot = (): EngineSnapshot => ({
  monochrome: false,
  saturation: 100,
  hueShift: 0,
  shadowCrush: 0,
  midtones: 0,
  highlights: 0,
  activeLUT: 'none',
  inkBleed: 0,
  halation: 0,
  chromaOffset: 0,
  grain: 0,
  threshold: 0,
  halftone: 0,
  scanlines: 0,
  vignette: 0,
  lightLeak: 0,
  lightLeakStyle: 'amber',
  gradientMap: 'none',
  dustAndScratches: 0,
  sparkles: 0,
  camcorderOSD: false,
  prismBlur: 0,
  skinSmoothing: 0,
  clarity: 0,
  glowUp: 0,
  faceSlimming: 0,
  blemishRemoval: 0,
  expressionLift: 0,
  beautyBoost: 0,
  ageShift: 0,
  eyeBrightening: 0,
  jawDefinition: 0,
  skinPolish: 0,
  teethWhitening: 0,
  makeupStrength: 0,
  artifactRemoval: 0,
  colorKnockout: 'none',
  textureType: 'none',
  textureIntensity: 50,
  activeCamera: 'Standard Matrix'
});

export type PortraitControlDefinition = {
  key: PortraitControlKey;
  label: string;
  accentClass: string;
  borderClass?: string;
};

export const PORTRAIT_CONTROL_DEFINITIONS: PortraitControlDefinition[] = [
  { key: 'skinPolish', label: 'Skin Polish', accentClass: 'text-[#e8d4aa]' },
  { key: 'beautyBoost', label: 'Beauty Boost', accentClass: 'text-[#e8d4aa]', borderClass: 'border-[#5a4823]' },
  { key: 'glowUp', label: 'Glow Accent', accentClass: 'text-[#ffccff]' },
  { key: 'blemishRemoval', label: 'Blemish Removal', accentClass: 'text-[#cfc6b7]' },
  { key: 'faceSlimming', label: 'Face Slimming', accentClass: 'text-[#cfc6b7]' },
  { key: 'expressionLift', label: 'Expression Lift', accentClass: 'text-[#cfc6b7]' },
  { key: 'ageShift', label: 'Age Shift', accentClass: 'text-[#cfc6b7]' },
  { key: 'eyeBrightening', label: 'Eye Brightening', accentClass: 'text-[#cfc6b7]' },
  { key: 'jawDefinition', label: 'Jaw Definition', accentClass: 'text-[#cfc6b7]' },
  { key: 'teethWhitening', label: 'Teeth Whitening', accentClass: 'text-white' },
  { key: 'makeupStrength', label: 'Makeup Pop', accentClass: 'text-[#ff99bb]' }
];

export const clampPortraitControlValue = (key: PortraitControlKey, value: number) => {
  const limits = PORTRAIT_CONTROL_LIMITS[key];
  const safeValue = Number.isFinite(value) ? value : 0;
  return Math.min(limits.max, Math.max(limits.min, safeValue));
};

export const buildPortraitPresetValues = (preset: PortraitPreset) => ({
  beautyBoost: clampPortraitControlValue('beautyBoost', preset.values.beautyBoost ?? 0),
  blemishRemoval: clampPortraitControlValue('blemishRemoval', preset.values.blemishRemoval ?? 0),
  faceSlimming: clampPortraitControlValue('faceSlimming', preset.values.faceSlimming ?? 0),
  expressionLift: clampPortraitControlValue('expressionLift', preset.values.expressionLift ?? 0),
  ageShift: clampPortraitControlValue('ageShift', preset.values.ageShift ?? 0),
  eyeBrightening: clampPortraitControlValue('eyeBrightening', preset.values.eyeBrightening ?? 0),
  jawDefinition: clampPortraitControlValue('jawDefinition', preset.values.jawDefinition ?? 0),
  skinPolish: clampPortraitControlValue('skinPolish', preset.values.skinPolish ?? 0),
  skinSmoothing: clampPortraitControlValue('skinSmoothing', preset.values.skinSmoothing ?? 0),
  glowUp: clampPortraitControlValue('glowUp', preset.values.glowUp ?? 0),
  teethWhitening: clampPortraitControlValue('teethWhitening', preset.values.teethWhitening ?? 0),
  makeupStrength: clampPortraitControlValue('makeupStrength', preset.values.makeupStrength ?? 0),
  clarity: preset.values.clarity ?? 0,
  artifactRemoval: clampPortraitControlValue('artifactRemoval', preset.values.artifactRemoval ?? 0)
});

export const buildPresetFromSnapshot = (snapshot: EngineSnapshot, name: string): Preset => ({
  id: `custom-${Date.now()}`,
  name,
  category: CUSTOM_PRESET_CATEGORY,
  inkBleed: snapshot.inkBleed,
  shadowCrush: snapshot.shadowCrush,
  midtones: snapshot.midtones,
  highlights: snapshot.highlights,
  activeLUT: snapshot.activeLUT,
  grain: snapshot.grain,
  threshold: snapshot.threshold,
  saturation: snapshot.saturation,
  hueShift: snapshot.hueShift,
  halation: snapshot.halation,
  chromaOffset: snapshot.chromaOffset,
  monochrome: snapshot.monochrome,
  halftone: snapshot.halftone,
  scanlines: snapshot.scanlines,
  vignette: snapshot.vignette,
  lightLeak: snapshot.lightLeak,
  lightLeakStyle: snapshot.lightLeakStyle,
  gradientMap: snapshot.gradientMap,
  dustAndScratches: snapshot.dustAndScratches,
  sparkles: snapshot.sparkles,
  camcorderOSD: snapshot.camcorderOSD,
  prismBlur: snapshot.prismBlur,
  skinSmoothing: snapshot.skinSmoothing,
  clarity: snapshot.clarity,
  glowUp: snapshot.glowUp,
  faceSlimming: snapshot.faceSlimming,
  blemishRemoval: snapshot.blemishRemoval,
  expressionLift: snapshot.expressionLift,
  beautyBoost: snapshot.beautyBoost,
  ageShift: snapshot.ageShift,
  eyeBrightening: snapshot.eyeBrightening,
  jawDefinition: snapshot.jawDefinition,
  skinPolish: snapshot.skinPolish,
  teethWhitening: snapshot.teethWhitening,
  makeupStrength: snapshot.makeupStrength,
  colorKnockout: snapshot.colorKnockout,
  textureType: snapshot.textureType,
  textureIntensity: snapshot.textureIntensity,
  artifactRemoval: snapshot.artifactRemoval
});
