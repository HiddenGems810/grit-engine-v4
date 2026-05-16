import { normalizeTextureId } from '@/lib/textures';
import type { FilmProfile, OpticalProfile, PaperSurface, PrintMode } from '@/lib/materials/material-types';

export type PresetFamily =
  | 'signature'
  | 'portrait'
  | 'film'
  | 'social'
  | 'cinematic'
  | 'product'
  | 'graphic'
  | 'experimental';

export type PresetTier = 'hero' | 'standard' | 'pro' | 'experimental';
export type PresetIntensity = 'subtle' | 'medium' | 'bold' | 'extreme';
export type PresetSubjectBias = 'portrait' | 'product' | 'food' | 'fashion' | 'night' | 'landscape' | 'graphic' | 'general';
export type PresetTone = 'clean' | 'warm' | 'cool' | 'soft' | 'dark' | 'film' | 'neon' | 'graphic' | 'mono' | 'experimental';

export interface Preset {
  id: string;
  name: string;
  category: string;
  family: PresetFamily;
  tier: PresetTier;
  intensity: PresetIntensity;
  subjectBias: PresetSubjectBias;
  previewTone: PresetTone;
  skinSafe: boolean;
  bestFor: string[];
  avoidFor: string[];
  oneClickScore: number;
  commercialScore: number;
  viralScore: number;
  description: string;
  usageTags: string[];
  safetyNotes?: string[];
  materialProfile?: string;
  materialStrength?: number;
  printProfile?: PrintMode;
  paperSurface?: PaperSurface;
  filmProfile?: FilmProfile;
  opticalProfile?: OpticalProfile;
  materialFaceProtection?: boolean;
  materialEdgeProtection?: boolean;
  inkBleed: number;
  shadowCrush: number;
  midtones?: number;
  highlights?: number;
  activeLUT?: string;
  grain: number;
  threshold: number;
  saturation: number;
  hueShift: number;
  halation: number;
  chromaOffset: number;
  monochrome: boolean;
  halftone: number;
  scanlines: number;
  vignette?: number;
  lightLeak?: number;
  lightLeakStyle?: string;
  gradientMap?: string;
  dustAndScratches?: number;
  sparkles?: number;
  camcorderOSD?: boolean;
  prismBlur?: number;
  skinSmoothing?: number;
  clarity?: number;
  glowUp?: number;
  faceSlimming?: number;
  blemishRemoval?: number;
  expressionLift?: number;
  beautyBoost?: number;
  ageShift?: number;
  eyeBrightening?: number;
  jawDefinition?: number;
  skinPolish?: number;
  teethWhitening?: number;
  makeupStrength?: number;
  colorKnockout?: 'none' | 'red' | 'green' | 'blue' | 'warm';
  textureType?: string;
  textureIntensity?: number;
  artifactRemoval?: number;
}

export const PRESET_FAMILY_LABELS: Record<PresetFamily, string> = {
  signature: 'FORMAT Signature',
  portrait: 'Portrait + Beauty',
  film: 'Film + Camera',
  social: 'Social + Creator',
  cinematic: 'Cinematic',
  product: 'Product + Brand',
  graphic: 'Graphic + Print',
  experimental: 'Experimental'
};

export const PRESET_CATEGORIES = [
  PRESET_FAMILY_LABELS.signature,
  PRESET_FAMILY_LABELS.portrait,
  PRESET_FAMILY_LABELS.film,
  PRESET_FAMILY_LABELS.social,
  PRESET_FAMILY_LABELS.cinematic,
  PRESET_FAMILY_LABELS.product,
  PRESET_FAMILY_LABELS.graphic,
  PRESET_FAMILY_LABELS.experimental
] as const;

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type PresetInput =
  Pick<Preset, 'id' | 'name' | 'family' | 'tier' | 'intensity' | 'subjectBias' | 'previewTone' | 'skinSafe' | 'bestFor' | 'avoidFor' | 'oneClickScore' | 'commercialScore' | 'viralScore' | 'description' | 'usageTags'>
  & Partial<Omit<Preset, 'id' | 'name' | 'family' | 'tier' | 'intensity' | 'subjectBias' | 'previewTone' | 'skinSafe' | 'bestFor' | 'avoidFor' | 'oneClickScore' | 'commercialScore' | 'viralScore' | 'description' | 'usageTags'>>;

const basePreset = {
  inkBleed: 0,
  shadowCrush: 24,
  midtones: 8,
  highlights: 6,
  activeLUT: 'none',
  grain: 0,
  threshold: 0,
  saturation: 104,
  hueShift: 0,
  halation: 4,
  chromaOffset: 0,
  monochrome: false,
  halftone: 0,
  scanlines: 0,
  vignette: 8,
  lightLeak: 0,
  lightLeakStyle: 'amber',
  gradientMap: 'none',
  dustAndScratches: 0,
  sparkles: 0,
  camcorderOSD: false,
  prismBlur: 0,
  skinSmoothing: 0,
  clarity: 10,
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
  colorKnockout: 'none' as const,
  textureType: 'none',
  textureIntensity: 0,
  artifactRemoval: 0,
  materialProfile: 'none',
  materialStrength: 0,
  printProfile: 'none' as PrintMode,
  paperSurface: 'none' as PaperSurface,
  filmProfile: 'none' as FilmProfile,
  opticalProfile: 'none' as OpticalProfile
};

const p = (preset: PresetInput): Preset => ({
  ...basePreset,
  ...preset,
  category: preset.category ?? PRESET_FAMILY_LABELS[preset.family],
  textureType: normalizeTextureId(preset.textureType),
  oneClickScore: clampNumber(preset.oneClickScore, 0, 100),
  commercialScore: clampNumber(preset.commercialScore, 0, 100),
  viralScore: clampNumber(preset.viralScore, 0, 100),
  usageTags: Array.from(new Set([
    preset.tier === 'hero' ? 'hero' : null,
    preset.skinSafe ? 'skin-safe' : null,
    preset.family,
    preset.previewTone,
    preset.intensity,
    ...preset.usageTags
  ].filter(Boolean) as string[])).slice(0, 6)
});

const signature = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'signature',
  tier: 'hero',
  intensity: 'medium',
  subjectBias: 'general',
  previewTone: 'clean',
  skinSafe: true,
  bestFor: ['portraits', 'creator images', 'brand content'],
  avoidFor: ['intentionally destructive graphics'],
  oneClickScore: 92,
  commercialScore: 90,
  viralScore: 86,
  description: 'A finished, commercial first-click look with controlled contrast and believable color.',
  usageTags: ['commercial', 'one-click'],
  ...overrides
});

const portrait = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'portrait',
  tier: 'hero',
  intensity: 'medium',
  subjectBias: 'portrait',
  previewTone: 'clean',
  skinSafe: true,
  bestFor: ['portraits', 'selfies', 'headshots'],
  avoidFor: ['product-only scenes'],
  oneClickScore: 90,
  commercialScore: 88,
  viralScore: 82,
  description: 'Identity-safe portrait polish that lifts faces without waxy skin or color pollution.',
  usageTags: ['skin-safe', 'portrait'],
  ...overrides
});

const film = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'film',
  tier: 'standard',
  intensity: 'medium',
  subjectBias: 'general',
  previewTone: 'film',
  skinSafe: true,
  bestFor: ['lifestyle', 'travel', 'portraits'],
  avoidFor: ['exact product color matching'],
  oneClickScore: 84,
  commercialScore: 80,
  viralScore: 76,
  description: 'Modern film color with grain, rolloff, and halation without fake yellow overlays.',
  usageTags: ['film', 'analog'],
  grain: 18,
  halation: 10,
  vignette: 16,
  ...overrides
});

const social = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'social',
  tier: 'standard',
  intensity: 'medium',
  subjectBias: 'portrait',
  previewTone: 'clean',
  skinSafe: true,
  bestFor: ['profile photos', 'short-form content', 'thumbnails'],
  avoidFor: ['technical product color'],
  oneClickScore: 86,
  commercialScore: 78,
  viralScore: 90,
  description: 'Share-ready polish with clean skin, controlled pop, and modern creator color.',
  usageTags: ['viral', 'creator'],
  ...overrides
});

const cinematic = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'cinematic',
  tier: 'pro',
  intensity: 'medium',
  subjectBias: 'general',
  previewTone: 'dark',
  skinSafe: false,
  bestFor: ['moody portraits', 'night scenes', 'campaign stills'],
  avoidFor: ['passport-style headshots'],
  oneClickScore: 82,
  commercialScore: 86,
  viralScore: 74,
  description: 'Commercial mood grade with restrained color separation, rolloff, and atmosphere.',
  usageTags: ['cinematic', 'mood'],
  ...overrides
});

const product = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'product',
  tier: 'pro',
  intensity: 'medium',
  subjectBias: 'product',
  previewTone: 'clean',
  skinSafe: false,
  bestFor: ['products', 'food', 'brand content'],
  avoidFor: ['beauty retouching'],
  oneClickScore: 84,
  commercialScore: 92,
  viralScore: 72,
  description: 'Brand-safe product finishing with believable color, edge clarity, and clean whites.',
  usageTags: ['commercial', 'product'],
  skinSmoothing: 0,
  beautyBoost: 0,
  skinPolish: 0,
  clarity: 24,
  ...overrides
});

const graphic = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'graphic',
  tier: 'standard',
  intensity: 'bold',
  subjectBias: 'graphic',
  previewTone: 'graphic',
  skinSafe: false,
  bestFor: ['posters', 'streetwear graphics', 'editorial layouts'],
  avoidFor: ['beauty portraits', 'identity-critical photos'],
  oneClickScore: 76,
  commercialScore: 70,
  viralScore: 82,
  description: 'Intentional print and graphic transformation with readable silhouettes.',
  usageTags: ['graphic', 'bold'],
  safetyNotes: ['Destructive look. Use after the clean preset families for portraits.'],
  ...overrides
});

const experimental = (id: string, name: string, overrides: Partial<PresetInput>): Preset => p({
  id,
  name,
  family: 'experimental',
  tier: 'experimental',
  intensity: 'extreme',
  subjectBias: 'general',
  previewTone: 'experimental',
  skinSafe: false,
  bestFor: ['album art', 'horror edits', 'glitch concepts'],
  avoidFor: ['client portraits', 'product color accuracy'],
  oneClickScore: 62,
  commercialScore: 45,
  viralScore: 86,
  description: 'Aggressive creative damage for intentional concept work, not safe default finishing.',
  usageTags: ['experimental', 'extreme'],
  safetyNotes: ['Extreme look. It may damage facial detail and color fidelity.'],
  ...overrides
});

const RAW_PRESETS: Preset[] = [
  signature('sig-format-clean', 'FORMAT Clean', { shadowCrush: 20, midtones: 12, highlights: 8, saturation: 104, clarity: 12, skinSmoothing: 4, skinPolish: 8, blemishRemoval: 6, activeLUT: 'clean-luxe', oneClickScore: 96, commercialScore: 94, viralScore: 88, description: 'The default finished look: clean contrast, believable skin, and polished creator color.' }),
  signature('sig-creator-glow', 'Creator Glow', { shadowCrush: 18, midtones: 14, highlights: 10, saturation: 108, halation: 8, glowUp: 12, skinSmoothing: 8, beautyBoost: 16, skinPolish: 14, eyeBrightening: 8, previewTone: 'soft', viralScore: 94, materialProfile: 'fine-35mm-grain', materialStrength: 14, filmProfile: 'clean-analog', opticalProfile: 'lens-bloom' }),
  signature('sig-soft-luxury', 'Soft Luxury', { shadowCrush: 12, midtones: 16, highlights: 9, saturation: 100, clarity: 6, halation: 10, glowUp: 10, skinSmoothing: 10, skinPolish: 16, activeLUT: 'portra-soft', previewTone: 'soft', commercialScore: 92, materialProfile: 'matte-photo-paper', materialStrength: 16, paperSurface: 'matte-photo-paper', opticalProfile: 'glass-diffusion' }),
  signature('sig-editorial-flash', 'Editorial Flash', { shadowCrush: 30, midtones: 9, highlights: 13, saturation: 106, grain: 6, halation: 12, lightLeak: 10, skinSmoothing: 4, clarity: 16, activeLUT: 'clean-luxe', intensity: 'bold', subjectBias: 'fashion', bestFor: ['fashion', 'night portraits', 'campaign social'], materialProfile: 'fine-35mm-grain', materialStrength: 18, filmProfile: 'disposable-flash', opticalProfile: 'lens-bloom' }),
  signature('sig-commercial-polish', 'Commercial Polish', { shadowCrush: 16, midtones: 13, highlights: 11, saturation: 102, clarity: 18, skinPolish: 12, blemishRemoval: 10, artifactRemoval: 8, commercialScore: 96 }),
  signature('sig-viral-clean', 'Viral Clean', { shadowCrush: 22, midtones: 12, highlights: 9, saturation: 112, clarity: 14, glowUp: 8, skinSmoothing: 6, beautyBoost: 14, eyeBrightening: 10, viralScore: 96 }),
  signature('sig-warm-film-editorial', 'Warm Film Editorial', { shadowCrush: 26, midtones: 10, highlights: 8, saturation: 108, hueShift: 8, grain: 12, halation: 12, activeLUT: 'portra-soft', previewTone: 'warm', materialProfile: 'fine-35mm-grain', materialStrength: 22, filmProfile: 'fine-35mm', opticalProfile: 'pro-mist' }),
  signature('sig-night-out-flash', 'Night Out Flash', { shadowCrush: 28, midtones: 14, highlights: 14, saturation: 110, grain: 8, halation: 14, lightLeak: 12, lightLeakStyle: 'prism', subjectBias: 'night', bestFor: ['low-light selfies', 'night-out photos', 'flash portraits'] }),
  signature('sig-dark-prestige', 'Dark Prestige', { shadowCrush: 38, midtones: 8, highlights: 8, saturation: 88, clarity: 16, grain: 8, vignette: 26, activeLUT: 'mocha-editorial', previewTone: 'dark', intensity: 'bold', skinSafe: false }),
  signature('sig-product-gloss', 'Product Gloss', { subjectBias: 'product', skinSafe: false, shadowCrush: 24, midtones: 8, highlights: 16, saturation: 106, clarity: 30, halation: 6, bestFor: ['products', 'skincare', 'packaging'], commercialScore: 96, materialProfile: 'glass-reflection', materialStrength: 18, paperSurface: 'glass-reflection', opticalProfile: 'glass-diffusion' }),
  signature('sig-street-chrome', 'Street Chrome', { subjectBias: 'fashion', skinSafe: false, shadowCrush: 36, midtones: 7, highlights: 12, saturation: 92, clarity: 22, halation: 8, chromaOffset: 3, activeLUT: 'editorial-cool', previewTone: 'cool', viralScore: 90 }),
  signature('sig-cinema-bloom', 'Cinema Bloom', { shadowCrush: 30, midtones: 8, highlights: 10, saturation: 92, grain: 10, halation: 18, prismBlur: 2, activeLUT: 'teal-film', previewTone: 'film', intensity: 'bold', skinSafe: false }),

  portrait('port-studio-skin', 'Studio Skin', { shadowCrush: 10, midtones: 16, highlights: 10, saturation: 100, clarity: 8, skinSmoothing: 10, skinPolish: 20, blemishRemoval: 18, beautyBoost: 16, artifactRemoval: 8 }),
  portrait('port-skin-safe-glam', 'Skin-Safe Glam', { shadowCrush: 14, midtones: 15, highlights: 10, saturation: 104, halation: 6, skinSmoothing: 12, skinPolish: 22, beautyBoost: 24, makeupStrength: 10, eyeBrightening: 8 }),
  portrait('port-clean-headshot', 'Clean Headshot', { shadowCrush: 8, midtones: 14, highlights: 9, saturation: 96, clarity: 14, skinSmoothing: 5, blemishRemoval: 14, skinPolish: 12, jawDefinition: 8, commercialScore: 94 }),
  portrait('port-low-light-selfie-rescue', 'Low-Light Selfie Rescue', { shadowCrush: 4, midtones: 20, highlights: 8, saturation: 104, clarity: 8, grain: 4, skinSmoothing: 8, beautyBoost: 14, eyeBrightening: 12, artifactRemoval: 14, subjectBias: 'night' }),
  portrait('port-soft-glam', 'Soft Glam', { shadowCrush: 12, midtones: 17, highlights: 12, saturation: 102, clarity: 4, halation: 10, glowUp: 14, skinSmoothing: 14, beautyBoost: 26, skinPolish: 22, makeupStrength: 12, previewTone: 'soft' }),
  portrait('port-luxury-beauty', 'Luxury Beauty', { shadowCrush: 16, midtones: 15, highlights: 12, saturation: 100, clarity: 10, skinSmoothing: 12, skinPolish: 26, blemishRemoval: 20, beautyBoost: 28, eyeBrightening: 10, activeLUT: 'clean-luxe', commercialScore: 95 }),
  portrait('port-mens-groomed-editorial', 'Men\'s Groomed Editorial', { shadowCrush: 20, midtones: 12, highlights: 8, saturation: 96, clarity: 18, skinSmoothing: 4, skinPolish: 8, blemishRemoval: 10, jawDefinition: 18, beautyBoost: 8 }),
  portrait('port-natural-teeth-eyes', 'Natural Teeth + Eyes', { shadowCrush: 10, midtones: 13, highlights: 8, saturation: 98, clarity: 10, skinSmoothing: 3, skinPolish: 8, eyeBrightening: 14, teethWhitening: 12, beautyBoost: 8 }),
  portrait('port-makeup-preserve', 'Makeup Preserve', { shadowCrush: 14, midtones: 12, highlights: 9, saturation: 106, clarity: 12, skinSmoothing: 5, skinPolish: 10, blemishRemoval: 12, makeupStrength: 14, beautyBoost: 12, bestFor: ['makeup portraits', 'beauty reels', 'studio content'] }),
  portrait('port-creator-portrait-pro', 'Creator Portrait Pro', { shadowCrush: 16, midtones: 15, highlights: 11, saturation: 106, clarity: 14, skinSmoothing: 8, skinPolish: 18, blemishRemoval: 18, beautyBoost: 24, expressionLift: 8, eyeBrightening: 12, teethWhitening: 8, viralScore: 90 }),

  film('film-portra-warmth', 'Portra Warmth', { shadowCrush: 30, midtones: 8, highlights: 7, saturation: 106, hueShift: 7, grain: 16, halation: 10, activeLUT: 'portra-soft', oneClickScore: 88, materialProfile: 'fine-35mm-grain', materialStrength: 24, filmProfile: 'fine-35mm', opticalProfile: 'pro-mist' }),
  film('film-fuji-green-life', 'Fuji Green Life', { shadowCrush: 28, midtones: 7, highlights: 8, saturation: 108, hueShift: -8, grain: 14, halation: 8, activeLUT: 'lark', previewTone: 'cool' }),
  film('film-disposable-flash', 'Disposable Flash', { shadowCrush: 44, midtones: 7, highlights: 12, saturation: 116, grain: 28, halation: 16, lightLeak: 14, chromaOffset: 4, intensity: 'bold', materialProfile: 'pushed-35mm-grain', materialStrength: 34, filmProfile: 'disposable-flash', opticalProfile: 'lens-bloom' }),
  film('film-expired-soft', 'Expired Film Soft', { shadowCrush: 24, midtones: 12, highlights: 8, saturation: 88, hueShift: 10, grain: 26, halation: 12, dustAndScratches: 10, previewTone: 'soft' }),
  film('film-super8-warmth', 'Super 8 Warmth', { shadowCrush: 42, midtones: 6, highlights: 7, saturation: 104, hueShift: 12, grain: 34, halation: 18, vignette: 24, dustAndScratches: 18, skinSafe: false }),
  film('film-silver-gelatin', 'Silver Gelatin', { shadowCrush: 46, midtones: 2, highlights: 8, saturation: 0, monochrome: true, grain: 26, halation: 6, clarity: 16, previewTone: 'mono' }),
  film('film-polaroid-fade', 'Polaroid Fade', { shadowCrush: 22, midtones: 13, highlights: 9, saturation: 86, hueShift: 8, grain: 14, halation: 12, vignette: 18, textureType: 'paper', textureIntensity: 12, previewTone: 'soft' }),
  film('film-compact-digital-2004', 'Compact Digital 2004', { shadowCrush: 28, midtones: 8, highlights: 10, saturation: 104, grain: 8, halation: 2, clarity: 18, chromaOffset: 2 }),
  film('film-pro-mist', 'Pro Mist Film', { shadowCrush: 18, midtones: 14, highlights: 8, saturation: 96, grain: 10, halation: 20, prismBlur: 4, clarity: 2, previewTone: 'soft', oneClickScore: 88, materialProfile: 'fine-35mm-grain', materialStrength: 18, filmProfile: 'soft-pro-mist', opticalProfile: 'pro-mist' }),
  film('film-clean-analog', 'Clean Analog', { shadowCrush: 26, midtones: 9, highlights: 8, saturation: 102, grain: 10, halation: 8, clarity: 12, activeLUT: 'portra-soft', oneClickScore: 86 }),

  social('soc-viral-soft-pop', 'Viral Soft Pop', { shadowCrush: 18, midtones: 14, highlights: 12, saturation: 116, halation: 8, glowUp: 10, skinSmoothing: 7, beautyBoost: 16, viralScore: 95 }),
  social('soc-clean-tiktok-glow', 'Clean TikTok Glow', { shadowCrush: 14, midtones: 16, highlights: 12, saturation: 110, clarity: 10, skinPolish: 14, eyeBrightening: 12, beautyBoost: 18, viralScore: 96 }),
  social('soc-night-out-flash', 'Night Out Flash', { shadowCrush: 24, midtones: 16, highlights: 15, saturation: 112, grain: 8, halation: 14, lightLeak: 12, subjectBias: 'night' }),
  social('soc-star-filter-glam', 'Star Filter Glam', { shadowCrush: 16, midtones: 15, highlights: 13, saturation: 108, halation: 8, sparkles: 48, skinSmoothing: 10, beautyBoost: 22, makeupStrength: 8, previewTone: 'soft' }),
  social('soc-y2k-magazine', 'Y2K Magazine', { shadowCrush: 32, midtones: 8, highlights: 10, saturation: 118, grain: 10, halation: 8, chromaOffset: 4, activeLUT: 'clean-luxe', intensity: 'bold', skinSafe: false }),
  social('soc-chrome-street', 'Chrome Street', { shadowCrush: 36, midtones: 6, highlights: 12, saturation: 92, clarity: 20, chromaOffset: 3, activeLUT: 'editorial-cool', subjectBias: 'fashion', skinSafe: false }),
  social('soc-club-bathroom-flash', 'Club Bathroom Flash', { shadowCrush: 34, midtones: 13, highlights: 14, saturation: 108, grain: 12, halation: 18, lightLeak: 10, subjectBias: 'night', intensity: 'bold' }),
  social('soc-soft-influencer', 'Soft Influencer', { shadowCrush: 12, midtones: 16, highlights: 12, saturation: 104, clarity: 6, halation: 9, skinSmoothing: 12, skinPolish: 18, beautyBoost: 24, previewTone: 'soft' }),
  social('soc-profile-picture-polish', 'Profile Picture Polish', { shadowCrush: 12, midtones: 15, highlights: 11, saturation: 104, clarity: 14, skinSmoothing: 6, skinPolish: 16, blemishRemoval: 18, eyeBrightening: 12, teethWhitening: 8, commercialScore: 88 }),
  social('soc-music-video-blue', 'Music Video Blue', { shadowCrush: 38, midtones: 8, highlights: 10, saturation: 94, hueShift: -16, halation: 10, activeLUT: 'teal-film', previewTone: 'cool', skinSafe: false, intensity: 'bold' }),

  cinematic('cin-warm-noir', 'Warm Noir', { shadowCrush: 54, midtones: 2, highlights: 7, saturation: 82, hueShift: 10, grain: 12, halation: 8, vignette: 34, previewTone: 'warm' }),
  cinematic('cin-dark-luxury', 'Dark Luxury', { shadowCrush: 62, midtones: 0, highlights: 8, saturation: 76, clarity: 18, grain: 8, vignette: 36, activeLUT: 'mocha-editorial' }),
  cinematic('cin-teal-shadow-cinema', 'Teal Shadow Cinema', { shadowCrush: 52, midtones: 2, highlights: 7, saturation: 86, hueShift: -18, halation: 10, activeLUT: 'teal-film', previewTone: 'cool' }),
  cinematic('cin-soft-pro-mist', 'Soft Pro Mist', { shadowCrush: 24, midtones: 10, highlights: 8, saturation: 88, halation: 22, prismBlur: 5, clarity: 2, previewTone: 'soft', skinSafe: true }),
  cinematic('cin-prestige-drama', 'Prestige Drama', { shadowCrush: 68, midtones: -2, highlights: 8, saturation: 66, clarity: 24, grain: 10, vignette: 42, intensity: 'bold' }),
  cinematic('cin-neon-night', 'Neon Night', { shadowCrush: 46, midtones: 6, highlights: 10, saturation: 112, hueShift: -10, halation: 18, chromaOffset: 5, previewTone: 'neon', subjectBias: 'night' }),
  cinematic('cin-trailer-contrast', 'Trailer Contrast', { shadowCrush: 72, midtones: -4, highlights: 12, saturation: 78, clarity: 28, grain: 6, vignette: 32, intensity: 'bold' }),
  cinematic('cin-music-video-blue', 'Music Video Blue', { shadowCrush: 50, midtones: 4, highlights: 9, saturation: 82, hueShift: -24, halation: 12, activeLUT: 'teal-film', previewTone: 'cool' }),
  cinematic('cin-gold-hour-cinema', 'Gold Hour Cinema', { shadowCrush: 34, midtones: 8, highlights: 10, saturation: 104, hueShift: 16, halation: 18, grain: 8, previewTone: 'warm', skinSafe: true }),
  cinematic('cin-desaturated-crime', 'Desaturated Crime', { shadowCrush: 64, midtones: -2, highlights: 6, saturation: 58, clarity: 22, grain: 14, vignette: 40, previewTone: 'dark' }),

  product('prod-product-gloss', 'Product Gloss', { shadowCrush: 24, midtones: 8, highlights: 16, saturation: 106, clarity: 32, halation: 5, oneClickScore: 90, materialProfile: 'glass-reflection', materialStrength: 18, paperSurface: 'glossy-photo-paper', opticalProfile: 'glass-diffusion' }),
  product('prod-clean-ecommerce', 'Clean Ecommerce', { shadowCrush: 12, midtones: 10, highlights: 18, saturation: 100, clarity: 26, vignette: 0, activeLUT: 'clean-luxe', commercialScore: 96 }),
  product('prod-luxury-product-contrast', 'Luxury Product Contrast', { shadowCrush: 40, midtones: 4, highlights: 14, saturation: 98, clarity: 34, vignette: 18, activeLUT: 'mocha-editorial' }),
  product('prod-skincare-ad-glow', 'Skincare Ad Glow', { shadowCrush: 10, midtones: 12, highlights: 16, saturation: 104, clarity: 18, halation: 10, glowUp: 0, textureType: '4k_glass_refraction', textureIntensity: 8 }),
  product('prod-food-editorial-warmth', 'Food Editorial Warmth', { subjectBias: 'food', shadowCrush: 24, midtones: 9, highlights: 12, saturation: 118, hueShift: 6, clarity: 24, halation: 6, activeLUT: 'portra-soft' }),
  product('prod-sneaker-sharp', 'Sneaker Sharp', { subjectBias: 'fashion', shadowCrush: 30, midtones: 6, highlights: 16, saturation: 108, clarity: 34, textureType: 'none' }),
  product('prod-fashion-campaign', 'Fashion Campaign', { subjectBias: 'fashion', shadowCrush: 34, midtones: 8, highlights: 13, saturation: 98, clarity: 26, activeLUT: 'editorial-cool', commercialScore: 94 }),
  product('prod-glass-product', 'Glass Product', { shadowCrush: 18, midtones: 8, highlights: 18, saturation: 96, clarity: 30, halation: 8, textureType: '4k_glass_refraction', textureIntensity: 10 }),
  product('prod-warm-lifestyle-product', 'Warm Lifestyle Product', { shadowCrush: 22, midtones: 10, highlights: 14, saturation: 110, hueShift: 8, clarity: 22, halation: 8, activeLUT: 'portra-soft' }),
  product('prod-premium-white-studio', 'Premium White Studio', { shadowCrush: 8, midtones: 12, highlights: 18, saturation: 98, clarity: 24, vignette: 0, activeLUT: 'clean-luxe' }),

  graphic('gfx-magazine-halftone', 'Magazine Halftone', { threshold: 132, halftone: 7, shadowCrush: 74, saturation: 124, grain: 12, oneClickScore: 78, materialProfile: 'magazine-paper', materialStrength: 58, printProfile: 'cmyk-halftone', paperSurface: 'magazine-paper' }),
  graphic('gfx-refined-risograph', 'Refined Risograph', { threshold: 134, halftone: 6, shadowCrush: 62, saturation: 132, hueShift: 18, grain: 16, textureType: 'paper', textureIntensity: 18, materialProfile: 'risograph-ink', materialStrength: 66, printProfile: 'risograph', paperSurface: 'hot-press-paper' }),
  graphic('gfx-xerox-poster', 'Xerox Poster', { monochrome: true, threshold: 158, saturation: 0, shadowCrush: 92, grain: 34, scanlines: 8, previewTone: 'mono', materialProfile: 'toner-xerox', materialStrength: 72, printProfile: 'xerox', paperSurface: 'newsprint' }),
  graphic('gfx-streetwear-bitmap', 'Streetwear Bitmap', { monochrome: true, threshold: 150, halftone: 4, shadowCrush: 84, grain: 22, chromaOffset: 5, previewTone: 'mono', materialProfile: 'bitmap-dither', materialStrength: 74, printProfile: 'ordered-dither' }),
  graphic('gfx-editorial-newsprint', 'Editorial Newsprint', { threshold: 128, halftone: 9, shadowCrush: 72, saturation: 92, grain: 22, textureType: 'paper', textureIntensity: 20, materialProfile: 'newsprint', materialStrength: 54, printProfile: 'newsprint', paperSurface: 'newsprint' }),
  graphic('gfx-manga-tone', 'Manga Tone', { monochrome: true, threshold: 144, halftone: 12, shadowCrush: 78, clarity: 22, previewTone: 'mono' }),
  graphic('gfx-screenprint-texture', 'Screenprint Texture', { threshold: 140, halftone: 8, shadowCrush: 78, saturation: 112, grain: 24, textureType: 'grunge', textureIntensity: 22 }),
  graphic('gfx-high-contrast-art-print', 'High-Contrast Art Print', { monochrome: true, threshold: 136, shadowCrush: 96, clarity: 28, grain: 18, previewTone: 'mono', intensity: 'extreme' }),
  graphic('gfx-zine-copy', 'Zine Copy', { monochrome: true, threshold: 168, shadowCrush: 94, grain: 42, scanlines: 22, dustAndScratches: 30, previewTone: 'mono', intensity: 'extreme' }),
  graphic('gfx-poster-damage', 'Poster Damage', { threshold: 148, halftone: 5, shadowCrush: 88, saturation: 78, grain: 48, textureType: 'grunge', textureIntensity: 40, dustAndScratches: 34, intensity: 'extreme' }),

  experimental('exp-thermal-heatmap', 'Thermal Heatmap', { gradientMap: 'thermal', shadowCrush: 42, saturation: 170, hueShift: -90, halation: 10, chromaOffset: 8, subjectBias: 'graphic', materialProfile: 'thermal-print', materialStrength: 72 }),
  experimental('exp-found-footage', 'Found Footage', { shadowCrush: 82, saturation: 46, grain: 82, scanlines: 28, chromaOffset: 24, dustAndScratches: 56, camcorderOSD: true, previewTone: 'dark' }),
  experimental('exp-security-camera', 'Security Camera', { monochrome: true, saturation: 0, shadowCrush: 84, grain: 76, scanlines: 70, vignette: 62, camcorderOSD: true, previewTone: 'mono' }),
  experimental('exp-analog-horror', 'Analog Horror', { shadowCrush: 96, saturation: 44, grain: 90, scanlines: 46, chromaOffset: 36, vignette: 90, dustAndScratches: 64, previewTone: 'dark' }),
  experimental('exp-dreamcore-bloom', 'Dreamcore Bloom', { shadowCrush: 8, midtones: 16, highlights: 12, saturation: 118, hueShift: -8, halation: 28, prismBlur: 12, lightLeak: 28, previewTone: 'soft' }),
  experimental('exp-glitch-spill', 'Glitch Spill', { shadowCrush: 70, saturation: 145, hueShift: 60, grain: 58, chromaOffset: 90, scanlines: 35, prismBlur: 7 }),
  experimental('exp-deep-web-upload', 'Deep Web Upload', { shadowCrush: 92, saturation: 70, hueShift: 75, grain: 70, chromaOffset: 58, scanlines: 18, prismBlur: 4, vignette: 72, materialProfile: 'jpeg-compression', materialStrength: 64 }),
  experimental('exp-cctv-night', 'CCTV Night', { gradientMap: 'nightvision', monochrome: false, saturation: 100, shadowCrush: 76, grain: 86, scanlines: 68, vignette: 80, camcorderOSD: true, previewTone: 'experimental' }),
  experimental('exp-liminal-mall', 'Liminal Mall', { shadowCrush: 26, midtones: 10, highlights: 8, saturation: 78, hueShift: 18, grain: 40, halation: 18, prismBlur: 6, vignette: 28, previewTone: 'soft' }),
  experimental('exp-vhs-damage', 'VHS Damage', { shadowCrush: 68, saturation: 104, grain: 88, scanlines: 82, chromaOffset: 84, dustAndScratches: 46, camcorderOSD: true, materialProfile: 'crt-phosphor', materialStrength: 70 })
];

const applySkinSafetyLimits = (preset: Preset): Preset => {
  if (!preset.skinSafe) return preset;

  return {
    ...preset,
    shadowCrush: clampNumber(preset.shadowCrush, 0, 34),
    saturation: clampNumber(preset.saturation, 88, 122),
    hueShift: clampNumber(preset.hueShift, -18, 18),
    clarity: clampNumber(preset.clarity ?? 0, 0, 22),
    skinSmoothing: clampNumber(preset.skinSmoothing ?? 0, 0, 18),
    beautyBoost: clampNumber(preset.beautyBoost ?? 0, 0, 32),
    skinPolish: clampNumber(preset.skinPolish ?? 0, 0, 30),
    faceSlimming: clampNumber(preset.faceSlimming ?? 0, 0, 4),
    ageShift: clampNumber(preset.ageShift ?? 0, -4, 2),
    chromaOffset: clampNumber(preset.chromaOffset, 0, 8),
    gradientMap: preset.gradientMap === 'none' ? 'none' : preset.gradientMap
  };
};

const normalizePreset = (preset: Preset): Preset => {
  const normalized = applySkinSafetyLimits({
    ...preset,
    category: PRESET_FAMILY_LABELS[preset.family],
    textureType: normalizeTextureId(preset.textureType),
    safetyNotes: preset.safetyNotes ?? (preset.skinSafe ? ['Identity-safe: protects skin tone and facial structure.'] : undefined)
  });

  return {
    ...normalized,
    oneClickScore: clampNumber(normalized.oneClickScore, 0, 100),
    commercialScore: clampNumber(normalized.commercialScore, 0, 100),
    viralScore: clampNumber(normalized.viralScore, 0, 100)
  };
};

export const PRESETS: Preset[] = RAW_PRESETS
  .map(normalizePreset)
  .sort((a, b) => (
    (b.tier === 'hero' ? 1 : 0) - (a.tier === 'hero' ? 1 : 0)
    || b.oneClickScore - a.oneClickScore
    || b.commercialScore - a.commercialScore
    || b.viralScore - a.viralScore
  ));
