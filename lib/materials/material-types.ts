export type MaterialFamily = 'paper' | 'print' | 'film' | 'digital' | 'surface' | 'graphic';
export type MaterialBlendMode = 'overlay' | 'soft-light' | 'multiply' | 'screen' | 'color-burn' | 'luminosity' | 'grain-merge' | 'displacement' | 'mask-only';
export type MaterialSafety = 'portrait-safe' | 'commercial-safe' | 'graphic-bold' | 'experimental';

export interface MaterialPreset {
  id: string;
  name: string;
  family: MaterialFamily;
  description: string;
  safety: MaterialSafety;
  defaultStrength: number;
  maxSafeStrength: number;
  blendMode: MaterialBlendMode;
  affectsLuma: boolean;
  affectsChroma: boolean;
  affectsEdges: boolean;
  affectsSkin: boolean;
  supportsPortraitProtection: boolean;
  bestFor: string[];
  avoidFor: string[];
  tags: string[];
}

export type PrintMode = 'none' | 'am-halftone' | 'cmyk-halftone' | 'risograph' | 'xerox' | 'ordered-dither' | 'error-diffusion' | 'manga-tone' | 'newsprint';
export type DotShape = 'round' | 'elliptical' | 'square' | 'diamond' | 'line';
export type DitherAlgorithm = 'bayer4' | 'bayer8' | 'floyd-steinberg' | 'atkinson';

export interface PrintSettings {
  mode: PrintMode;
  strength: number;
  frequency: number;
  angle: number;
  dotShape: DotShape;
  dotGain: number;
  inkSpread: number;
  paperTooth: number;
  misregistration: number;
  palette: string;
  faceProtection: boolean;
  edgeProtection: boolean;
  preserveMidtones: boolean;
  outputBitDepth: 1 | 2 | 4 | 8;
  ditherAlgorithm?: DitherAlgorithm;
}

export type FilmProfile = 'none' | 'fine-35mm' | 'pushed-35mm' | 'expired-film' | 'super-8' | 'disposable-flash' | 'cine-still' | 'soft-pro-mist' | 'clean-analog' | 'silver-gelatin' | 'high-iso-phone-night';
export type OpticalProfile = 'none' | 'lens-bloom' | 'pro-mist' | 'glass-diffusion' | 'anamorphic-streak' | 'lens-dirt' | 'film-burn' | 'edge-glow';
export type PaperSurface = 'none' | 'cold-press-paper' | 'hot-press-paper' | 'newsprint' | 'magazine-paper' | 'matte-photo-paper' | 'glossy-photo-paper' | 'archival-cotton-paper' | 'kraft-paper' | 'coated-poster-paper' | 'linen-fiber' | 'canvas-tooth' | 'brushed-metal' | 'glossy-acrylic' | 'glass-reflection' | 'subtle-chrome' | 'leather-grain' | 'ceramic-gloss' | 'stone-matte-backdrop';

export interface MaterialFinishSettings {
  materialProfile: string;
  materialStrength: number;
  printProfile: PrintMode;
  paperSurface: PaperSurface;
  filmProfile: FilmProfile;
  opticalProfile: OpticalProfile;
  faceProtection: boolean;
  edgeProtection: boolean;
}
