export type TextureAsset = {
  id: string;
  label: string;
  localPreviewPath: string | null;
};

export const TEXTURE_ASSETS: TextureAsset[] = [
  { id: 'paper', label: 'Pressed Paper', localPreviewPath: '/textures/pressed-paper.svg' },
  { id: 'canvas', label: 'Woven Canvas', localPreviewPath: '/textures/woven-canvas.svg' },
  { id: 'linen', label: 'Fine Linen', localPreviewPath: '/textures/fine-linen.svg' },
  { id: 'stone', label: 'Stone Composite', localPreviewPath: '/textures/stone-composite.svg' },
  { id: 'metal', label: 'Brushed Metal', localPreviewPath: '/textures/brushed-metal.svg' },
  { id: 'grunge', label: 'Distressed Surface', localPreviewPath: '/textures/distressed-surface.svg' },
  { id: '4k_film_dust', label: 'Film Dust Microtexture', localPreviewPath: '/textures/film-dust.svg' },
  { id: '4k_leather_grain', label: 'Leather Grain', localPreviewPath: '/textures/leather-grain.svg' },
  { id: '4k_glass_refraction', label: 'Glass Refraction', localPreviewPath: '/textures/glass-refraction.svg' },
  { id: '4k_holographic_foil', label: 'Holographic Sheen', localPreviewPath: '/textures/holographic-sheen.svg' },
  { id: '4k_crushed_plastic', label: 'Plastic Reflection', localPreviewPath: '/textures/plastic-reflection.svg' }
];

const TEXTURE_ALIAS_MAP: Record<string, string> = {
  none: 'none',
  vintage_paper: 'paper',
  '4k_vintage_paper': 'paper',
  grunge_wall: 'grunge',
  '4k_grunge_wall': 'grunge',
  linen_tablecloth: 'linen',
  '4k_linen_tablecloth': 'linen',
  brushed_metal: 'metal',
  '4k_brushed_metal': 'metal',
  stone_surface: 'stone',
  '4k_stone_surface': 'stone',
  film_dust: '4k_film_dust',
  leather_grain: '4k_leather_grain',
  glass_refraction: '4k_glass_refraction',
  holographic_foil: '4k_holographic_foil',
  crushed_plastic: '4k_crushed_plastic'
};

const TEXTURE_ASSET_MAP = new Map(TEXTURE_ASSETS.map((texture) => [texture.id, texture]));

export const normalizeTextureId = (textureId: string | null | undefined): string => {
  if (!textureId || textureId === 'none') {
    return 'none';
  }

  return TEXTURE_ALIAS_MAP[textureId] ?? textureId;
};

export const getTextureAsset = (textureId: string | null | undefined): TextureAsset | null => {
  const normalizedTextureId = normalizeTextureId(textureId);
  if (normalizedTextureId === 'none') {
    return null;
  }

  return TEXTURE_ASSET_MAP.get(normalizedTextureId) ?? null;
};

export const isKnownTextureId = (textureId: string | null | undefined): boolean => {
  const normalizedTextureId = normalizeTextureId(textureId);
  return normalizedTextureId === 'none' || TEXTURE_ASSET_MAP.has(normalizedTextureId);
};
