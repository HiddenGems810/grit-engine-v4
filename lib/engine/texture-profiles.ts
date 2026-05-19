import { normalizeTextureId } from '@/lib/textures';

export type TextureEffectType =
  | 'paper-tooth'
  | 'woven-fiber'
  | 'linen-weave'
  | 'mineral-depth'
  | 'directional-metal'
  | 'distressed-wear'
  | 'film-particulate'
  | 'leather-grain'
  | 'glass-refraction'
  | 'holographic-sheen'
  | 'plastic-gloss'
  | 'placeholder';

export type TextureRenderProfile = {
  id: string;
  family: 'paper' | 'fabric' | 'mineral' | 'metal' | 'distress' | 'film' | 'surface';
  tileSize: number;
  seamless: boolean;
  visualScale: number;
  blendMode: GlobalCompositeOperation;
  alphaScale: number;
  effectType: TextureEffectType;
};

export const TEXTURE_RENDER_PROFILES: TextureRenderProfile[] = [
  { id: 'paper', family: 'paper', tileSize: 512, seamless: true, visualScale: 0.78, blendMode: 'multiply', alphaScale: 0.28, effectType: 'paper-tooth' },
  { id: 'canvas', family: 'fabric', tileSize: 512, seamless: true, visualScale: 1.08, blendMode: 'soft-light', alphaScale: 0.34, effectType: 'woven-fiber' },
  { id: 'linen', family: 'fabric', tileSize: 512, seamless: true, visualScale: 0.82, blendMode: 'soft-light', alphaScale: 0.26, effectType: 'linen-weave' },
  { id: 'stone', family: 'mineral', tileSize: 512, seamless: true, visualScale: 1.2, blendMode: 'overlay', alphaScale: 0.22, effectType: 'mineral-depth' },
  { id: 'metal', family: 'metal', tileSize: 512, seamless: true, visualScale: 0.72, blendMode: 'soft-light', alphaScale: 0.32, effectType: 'directional-metal' },
  { id: 'grunge', family: 'distress', tileSize: 512, seamless: true, visualScale: 1.35, blendMode: 'multiply', alphaScale: 0.30, effectType: 'distressed-wear' },
  { id: 'film_dust', family: 'film', tileSize: 512, seamless: true, visualScale: 0.62, blendMode: 'multiply', alphaScale: 0.20, effectType: 'film-particulate' },
  { id: 'leather_grain', family: 'surface', tileSize: 512, seamless: true, visualScale: 0.9, blendMode: 'soft-light', alphaScale: 0.32, effectType: 'leather-grain' },
  { id: 'glass_refraction', family: 'surface', tileSize: 512, seamless: true, visualScale: 0.95, blendMode: 'soft-light', alphaScale: 0.24, effectType: 'glass-refraction' },
  { id: 'holographic_foil', family: 'surface', tileSize: 512, seamless: true, visualScale: 0.88, blendMode: 'screen', alphaScale: 0.20, effectType: 'holographic-sheen' },
  { id: 'crushed_plastic', family: 'surface', tileSize: 512, seamless: true, visualScale: 1.05, blendMode: 'soft-light', alphaScale: 0.28, effectType: 'plastic-gloss' }
];

const PROFILE_MAP = new Map(TEXTURE_RENDER_PROFILES.map((profile) => [profile.id, profile]));

export const normalizeTextureProfileId = (textureId: string | null | undefined): string => (
  normalizeTextureId(textureId).replace(/^4k_/, '')
);

export const getTextureRenderProfile = (textureId: string | null | undefined): TextureRenderProfile | null => {
  const normalized = normalizeTextureProfileId(textureId);
  if (normalized === 'none') return null;
  return PROFILE_MAP.get(normalized) ?? null;
};

export const listTextureRenderProfiles = (): TextureRenderProfile[] => [...TEXTURE_RENDER_PROFILES];
