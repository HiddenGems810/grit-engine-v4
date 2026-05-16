import { normalizeTextureId } from '@/lib/textures';

export interface Preset {
  id: string;
  name: string;
  category: string;
  description?: string;
  usageTags?: string[];
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
  textureType?: string; // Change to string to support 4k textures
  textureIntensity?: number;
  artifactRemoval?: number;
}

export const PRESET_CATEGORIES = [
  'Airbrush & Face Retouch',
  'Yulian Graphics (Viral)',
  'Camera Simulation',
  'Vintage Cameras (Pre-1980)',
  'Retro Tech (1980s)',
  'Digital Dawn (1990s)',
  'Y2K & Streetwear',
  'Print Halftone & Xerox',
  'Seasons & Nature',
  'Holidays & Events',
  'Viral & Social',
  'Influencer Portraits',
  'Food & Tabletop',
  'Bitmap & Dither',
  'Cinematic & Blockbuster',
  'Anime & Cel Shaded',
  'Gothic & Dark Academia',
  'Neon Future Core',
  'Glitchcore & Webcore',
  'Analog Horror / Found Footage',
  'Music Video (2000s)',
  'Dreamcore & Liminal Space'
] as const;

type PresetCategory = (typeof PRESET_CATEGORIES)[number];
const PRESET_CATEGORY_SET = new Set<string>(PRESET_CATEGORIES);

const RAW_PRESETS: Preset[] = [
  // --- AIRBRUSH & FACE RETOUCH ---
  { id: 'ab1', name: 'Airbrush Glow Up', category: 'Airbrush & Face Retouch', inkBleed: 0, shadowCrush: 20, midtones: 10, highlights: 6, grain: 0, threshold: 0, saturation: 110, hueShift: 0, halation: 5, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, skinSmoothing: 22, glowUp: 18, clarity: 12 },
  { id: 'ab2', name: 'Perfect Smile Target', category: 'Airbrush & Face Retouch', inkBleed: 0, shadowCrush: 10, midtones: 4, highlights: 3, grain: 0, threshold: 0, saturation: 96, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, skinSmoothing: 1, beautyBoost: 2, teethWhitening: 16, clarity: 4 },
  { id: 'ab3', name: 'Makeup Pop & Blush', category: 'Airbrush & Face Retouch', inkBleed: 0, shadowCrush: 24, midtones: 10, highlights: 6, grain: 5, threshold: 0, saturation: 105, hueShift: 0, halation: 2, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, skinSmoothing: 18, makeupStrength: 18, glowUp: 12 },
  { id: 'ab4', name: 'Hyper-Realistic Studio', category: 'Airbrush & Face Retouch', inkBleed: 0, shadowCrush: 34, midtones: 14, highlights: 10, grain: 5, threshold: 0, saturation: 100, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, clarity: 42, skinSmoothing: 5, glowUp: 10 },

  // --- YULIAN GRAPHICS (VIRAL) ---
  { id: 'yg1', name: 'Halftone Print (Magenta)', category: 'Yulian Graphics (Viral)', inkBleed: 0, shadowCrush: 90, grain: 30, threshold: 0, saturation: 160, hueShift: 0, halation: 20, chromaOffset: 25, monochrome: false, halftone: 4, scanlines: 0, textureType: '4k_vintage_paper', textureIntensity: 60, sparkles: 0 },
  { id: 'yg2', name: 'Scuffed B&W Glitch', category: 'Yulian Graphics (Viral)', inkBleed: 5, shadowCrush: 120, grain: 50, threshold: 0, saturation: 0, hueShift: 0, halation: 15, chromaOffset: 40, monochrome: true, halftone: 0, scanlines: 0, textureType: '4k_grunge_wall', textureIntensity: 80, prismBlur: 10, clarity: 50 },
  { id: 'yg3', name: 'Y2K Thermal Cyber', category: 'Yulian Graphics (Viral)', inkBleed: 2, shadowCrush: 80, grain: 20, threshold: 0, saturation: 140, hueShift: 40, halation: 35, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 10, gradientMap: 'cyberpunk', sparkles: 40, textureType: '4k_crushed_plastic', textureIntensity: 30 },
  { id: 'yg4', name: '00s Flash Burn Cam', category: 'Yulian Graphics (Viral)', inkBleed: 0, shadowCrush: 60, grain: 15, threshold: 0, saturation: 120, hueShift: 10, halation: 10, chromaOffset: 8, monochrome: false, halftone: 0, scanlines: 0, textureType: 'none', textureIntensity: 0, clarity: 30, skinSmoothing: 20, glowUp: 10 },
  { id: 'yg5', name: 'Star-Crossed Glow', category: 'Yulian Graphics (Viral)', inkBleed: 0, shadowCrush: 70, grain: 10, threshold: 0, saturation: 110, hueShift: 0, halation: 15, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, textureType: 'none', textureIntensity: 0, clarity: 40, skinSmoothing: 5, sparkles: 60, teethWhitening: 20 },

  // --- CAMERA SIMULATION ---
  { id: 'c1', name: '1970s Kodachrome', category: 'Camera Simulation', inkBleed: 1, shadowCrush: 60, grain: 35, threshold: 0, saturation: 120, hueShift: 15, halation: 7, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 40, textureType: 'paper', textureIntensity: 40 },
  { id: 'c2', name: '1980s VHS Camcorder', category: 'Camera Simulation', inkBleed: 3, shadowCrush: 80, grain: 60, threshold: 0, saturation: 110, hueShift: -5, halation: 14, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 30, vignette: 50 },
  { id: 'c3', name: '1990s Disposable', category: 'Camera Simulation', inkBleed: 2, shadowCrush: 100, grain: 45, threshold: 0, saturation: 140, hueShift: 5, halation: 10, chromaOffset: 8, monochrome: false, halftone: 0, scanlines: 0, vignette: 70, lightLeak: 40, dustAndScratches: 25 },
  { id: 'c4', name: '2000s Early Digital', category: 'Camera Simulation', inkBleed: 2, shadowCrush: 40, grain: 15, threshold: 0, saturation: 80, hueShift: 0, halation: 0, chromaOffset: 2, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, skinSmoothing: 10 },

  // --- VINTAGE CAMERAS (Pre-1980) ---
  { id: 'v1', name: '1890 Daguerreotype', category: 'Vintage Cameras (Pre-1980)', inkBleed: 2, shadowCrush: 60, grain: 90, threshold: 0, saturation: 0, hueShift: 0, halation: 15, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0 },
  { id: 'v2', name: '1900s Box Brownie', category: 'Vintage Cameras (Pre-1980)', inkBleed: 3, shadowCrush: 50, grain: 75, threshold: 0, saturation: 20, hueShift: 25, halation: 7, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v3', name: '1935 Kodachrome I', category: 'Vintage Cameras (Pre-1980)', inkBleed: 2, shadowCrush: 85, grain: 30, threshold: 0, saturation: 160, hueShift: -10, halation: 10, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v4', name: '1950s Leica Monochrome', category: 'Vintage Cameras (Pre-1980)', inkBleed: 1, shadowCrush: 70, grain: 45, threshold: 0, saturation: 0, hueShift: 0, halation: 5, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0 },
  { id: 'v5', name: '1965 Super 8mm Film', category: 'Vintage Cameras (Pre-1980)', inkBleed: 1, shadowCrush: 65, grain: 80, threshold: 0, saturation: 110, hueShift: 15, halation: 15, chromaOffset: 12, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v6', name: '1970 35mm Point & Shoot', category: 'Vintage Cameras (Pre-1980)', inkBleed: 4, shadowCrush: 40, grain: 55, threshold: 0, saturation: 90, hueShift: -5, halation: 10, chromaOffset: 8, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v7', name: '1973 Instamatic Flash', category: 'Vintage Cameras (Pre-1980)', inkBleed: 3, shadowCrush: 95, grain: 40, threshold: 0, saturation: 130, hueShift: -15, halation: 21, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v8', name: '1976 Polaroid SX-70', category: 'Vintage Cameras (Pre-1980)', inkBleed: 2, shadowCrush: 30, grain: 25, threshold: 0, saturation: 85, hueShift: 20, halation: 19, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v9', name: '1978 Slide Film Fade', category: 'Vintage Cameras (Pre-1980)', inkBleed: 1, shadowCrush: 45, grain: 65, threshold: 0, saturation: 140, hueShift: -35, halation: 12, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'v10', name: 'Silver Gelatin Archive', category: 'Vintage Cameras (Pre-1980)', inkBleed: 4, shadowCrush: 85, grain: 60, threshold: 0, saturation: 0, hueShift: 0, halation: 8, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0 },

  // --- RETRO TECH (1980s) ---
  { id: 'r1', name: '1982 Arcade CRT', category: 'Retro Tech (1980s)', inkBleed: 1, shadowCrush: 80, grain: 50, threshold: 0, saturation: 200, hueShift: 40, halation: 14, chromaOffset: 30, monochrome: false, halftone: 0, scanlines: 100 },
  { id: 'r2', name: '1984 Macintosh 1-Bit', category: 'Retro Tech (1980s)', inkBleed: 0, shadowCrush: 100, grain: 0, threshold: 128, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 6, scanlines: 0 },
  { id: 'r3', name: '1985 Camcorder Tape Fade', category: 'Retro Tech (1980s)', inkBleed: 1, shadowCrush: 50, grain: 60, threshold: 0, saturation: 70, hueShift: -25, halation: 10, chromaOffset: 25, monochrome: false, halftone: 0, scanlines: 40 },
  { id: 'r4', name: '1986 VHS Chroma Spill', category: 'Retro Tech (1980s)', inkBleed: 2, shadowCrush: 45, grain: 80, threshold: 0, saturation: 180, hueShift: 15, halation: 21, chromaOffset: 65, monochrome: false, halftone: 0, scanlines: 75 },
  { id: 'r5', name: '1987 Amiga Graphics', category: 'Retro Tech (1980s)', inkBleed: 0, shadowCrush: 90, grain: 10, threshold: 160, saturation: 150, hueShift: -80, halation: 0, chromaOffset: 15, monochrome: false, halftone: 4, scanlines: 20 },
  { id: 'r6', name: '1988 CCTV Security', category: 'Retro Tech (1980s)', inkBleed: 3, shadowCrush: 80, grain: 90, threshold: 0, saturation: 0, hueShift: 0, halation: 7, chromaOffset: 10, monochrome: true, halftone: 0, scanlines: 85 },
  { id: 'r7', name: '1989 First Digital Camera', category: 'Retro Tech (1980s)', inkBleed: 1, shadowCrush: 100, grain: 55, threshold: 128, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 12, scanlines: 0 },
  { id: 'r8', name: 'Synthwave Neon Laser', category: 'Retro Tech (1980s)', inkBleed: 2, shadowCrush: 100, grain: 30, threshold: 0, saturation: 250, hueShift: 110, halation: 31, chromaOffset: 40, monochrome: false, halftone: 0, scanlines: 60 },
  { id: 'r9', name: 'Analog Tape Drift', category: 'Retro Tech (1980s)', inkBleed: 2, shadowCrush: 70, grain: 100, threshold: 0, saturation: 110, hueShift: -60, halation: 10, chromaOffset: 80, monochrome: false, halftone: 0, scanlines: 90 },
  { id: 'r10', name: 'Microcassette Lo-Fi', category: 'Retro Tech (1980s)', inkBleed: 3, shadowCrush: 60, grain: 85, threshold: 0, saturation: 50, hueShift: 20, halation: 10, chromaOffset: 30, monochrome: false, halftone: 0, scanlines: 50 },

  // --- DIGITAL DAWN (1990s) ---
  { id: 'd1', name: '1992 Disposable Camera', category: 'Digital Dawn (1990s)', inkBleed: 3, shadowCrush: 90, grain: 65, threshold: 0, saturation: 160, hueShift: 5, halation: 28, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'd2', name: '1995 Early Web JPEG', category: 'Digital Dawn (1990s)', inkBleed: 2, shadowCrush: 50, grain: 40, threshold: 0, saturation: 130, hueShift: -10, halation: 0, chromaOffset: 25, monochrome: false, halftone: 4, scanlines: 0 },
  { id: 'd3', name: '1996 MiniDV Camcorder', category: 'Digital Dawn (1990s)', inkBleed: 2, shadowCrush: 85, grain: 45, threshold: 0, saturation: 110, hueShift: -5, halation: 8, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 30 },
  { id: 'd4', name: '1998 Pocket Pixel Camera', category: 'Digital Dawn (1990s)', inkBleed: 0, shadowCrush: 100, grain: 0, threshold: 128, saturation: 100, hueShift: 90, halation: 0, chromaOffset: 0, monochrome: true, halftone: 5, scanlines: 10 },
  { id: 'd5', name: '1999 Floppy Disk Digital', category: 'Digital Dawn (1990s)', inkBleed: 4, shadowCrush: 60, grain: 80, threshold: 0, saturation: 90, hueShift: 15, halation: 10, chromaOffset: 45, monochrome: false, halftone: 2, scanlines: 0 },
  { id: 'd6', name: 'Early Camera Phone Bloom', category: 'Digital Dawn (1990s)', inkBleed: 1, shadowCrush: 80, grain: 90, threshold: 0, saturation: 140, hueShift: 20, halation: 15, chromaOffset: 20, monochrome: false, halftone: 3, scanlines: 0 },
  { id: 'd7', name: 'Dial-Up Glitch', category: 'Digital Dawn (1990s)', inkBleed: 2, shadowCrush: 100, grain: 100, threshold: 0, saturation: 200, hueShift: 140, halation: 35, chromaOffset: 95, monochrome: false, halftone: 0, scanlines: 60 },
  { id: 'd8', name: 'Green Code Cinema', category: 'Digital Dawn (1990s)', inkBleed: 2, shadowCrush: 85, grain: 50, threshold: 0, saturation: 120, hueShift: 55, halation: 7, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'd9', name: 'CRT Monitor Glare', category: 'Digital Dawn (1990s)', inkBleed: 4, shadowCrush: 40, grain: 20, threshold: 0, saturation: 150, hueShift: -10, halation: 28, chromaOffset: 35, monochrome: false, halftone: 0, scanlines: 80 },
  { id: 'd10', name: 'Y2K Midnight Flash', category: 'Digital Dawn (1990s)', inkBleed: 1, shadowCrush: 95, grain: 35, threshold: 0, saturation: 180, hueShift: 0, halation: 31, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 0 },

  // --- Y2K & STREETWEAR ---
  { id: 'y1', name: 'Phonk Glitch Heavy', category: 'Y2K & Streetwear', inkBleed: 4, shadowCrush: 90, grain: 75, threshold: 0, saturation: 120, hueShift: -30, halation: 21, chromaOffset: 85, monochrome: false, halftone: 0, scanlines: 15 },
  { id: 'y2', name: 'Street Chrome Monochrome', category: 'Y2K & Streetwear', inkBleed: 0, shadowCrush: 95, grain: 40, threshold: 0, saturation: 0, hueShift: 0, halation: 15, chromaOffset: 100, monochrome: true, halftone: 0, scanlines: 0 },
  { id: 'y3', name: 'Gallery Stamp Monochrome', category: 'Y2K & Streetwear', inkBleed: 2, shadowCrush: 90, grain: 60, threshold: 140, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0 },
  { id: 'y4', name: 'Hypebeast Flash', category: 'Y2K & Streetwear', inkBleed: 0, shadowCrush: 70, grain: 30, threshold: 0, saturation: 120, hueShift: 0, halation: 8, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'y5', name: 'Thermal Camo', category: 'Y2K & Streetwear', inkBleed: 3, shadowCrush: 40, grain: 50, threshold: 0, saturation: 300, hueShift: -160, halation: 14, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 20 },
  { id: 'y6', name: 'Y2K Acid Wrap', category: 'Y2K & Streetwear', inkBleed: 2, shadowCrush: 50, grain: 80, threshold: 0, saturation: 250, hueShift: 135, halation: 28, chromaOffset: 65, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'y7', name: 'Goth Typography', category: 'Y2K & Streetwear', inkBleed: 1, shadowCrush: 100, grain: 65, threshold: 160, saturation: 0, hueShift: 0, halation: 7, chromaOffset: 80, monochrome: true, halftone: 0, scanlines: 0 },
  { id: 'y8', name: 'Tokyo Neon Bleed', category: 'Y2K & Streetwear', inkBleed: 1, shadowCrush: 85, grain: 45, threshold: 0, saturation: 220, hueShift: -40, halation: 35, chromaOffset: 45, monochrome: false, halftone: 0, scanlines: 0 },
  { id: 'y9', name: 'Barcode Scanner', category: 'Y2K & Streetwear', inkBleed: 0, shadowCrush: 95, grain: 15, threshold: 180, saturation: 0, hueShift: 0, halation: 10, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 100 },
  { id: 'y10', name: '00s Digital Glitch', category: 'Y2K & Streetwear', inkBleed: 2, shadowCrush: 55, grain: 90, threshold: 0, saturation: 160, hueShift: 65, halation: 0, chromaOffset: 95, monochrome: false, halftone: 0, scanlines: 20 },

  // --- PRINT, HALFTONE & XEROX ---
  { id: 'p1', name: '1960s Offset Print', category: 'Print Halftone & Xerox', inkBleed: 4, shadowCrush: 80, grain: 20, threshold: 135, saturation: 140, hueShift: -15, halation: 0, chromaOffset: 15, monochrome: false, halftone: 6, scanlines: 0 },
  { id: 'p2', name: 'Xerox Error (Heavy)', category: 'Print Halftone & Xerox', inkBleed: 4, shadowCrush: 100, grain: 95, threshold: 160, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 10 },
  { id: 'p3', name: 'CMYK Newspaper', category: 'Print Halftone & Xerox', inkBleed: 2, shadowCrush: 60, grain: 30, threshold: 128, saturation: 110, hueShift: -5, halation: 0, chromaOffset: 25, monochrome: false, halftone: 8, scanlines: 0 },
  { id: 'p4', name: 'Risograph Pink/Blue', category: 'Print Halftone & Xerox', inkBleed: 1, shadowCrush: 70, grain: 45, threshold: 140, saturation: 140, hueShift: 85, halation: 0, chromaOffset: 35, monochrome: false, halftone: 5, scanlines: 0 },
  { id: 'p5', name: 'High-Speed Laser Print', category: 'Print Halftone & Xerox', inkBleed: 1, shadowCrush: 95, grain: 10, threshold: 128, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 3, scanlines: 0 },
  { id: 'p6', name: 'Sticker Slap Halftone', category: 'Print Halftone & Xerox', inkBleed: 0, shadowCrush: 90, grain: 15, threshold: 150, saturation: 180, hueShift: 15, halation: 0, chromaOffset: 15, monochrome: false, halftone: 12, scanlines: 0 },
  { id: 'p7', name: 'Low Ink Cartridge', category: 'Print Halftone & Xerox', inkBleed: 2, shadowCrush: 30, grain: 80, threshold: 0, saturation: 50, hueShift: 60, halation: 0, chromaOffset: 45, monochrome: false, halftone: 2, scanlines: 80 },
  { id: 'p8', name: 'Comic Book Dots (Pop)', category: 'Print Halftone & Xerox', inkBleed: 0, shadowCrush: 75, grain: 0, threshold: 128, saturation: 200, hueShift: 0, halation: 0, chromaOffset: 5, monochrome: false, halftone: 15, scanlines: 0 },
  { id: 'p9', name: 'Fax Machine Render', category: 'Print Halftone & Xerox', inkBleed: 2, shadowCrush: 100, grain: 65, threshold: 180, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 100 },
  { id: 'p10', name: 'Screenprint Degrade', category: 'Print Halftone & Xerox', inkBleed: 3, shadowCrush: 90, grain: 50, threshold: 145, saturation: 110, hueShift: -30, halation: 0, chromaOffset: 10, monochrome: false, halftone: 10, scanlines: 0 },

  // --- SEASONS & NATURE ---
  { id: 's1', name: 'Autumn Leaves Glow', category: 'Seasons & Nature', inkBleed: 2, shadowCrush: 70, grain: 15, threshold: 0, saturation: 140, hueShift: 15, halation: 10, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 20 },
  { id: 's2', name: 'Winter Frostbite', category: 'Seasons & Nature', inkBleed: 1, shadowCrush: 40, grain: 25, threshold: 0, saturation: 60, hueShift: -35, halation: 10, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10 },
  { id: 's3', name: 'Spring Cherry Bloom', category: 'Seasons & Nature', inkBleed: 4, shadowCrush: 30, grain: 10, threshold: 0, saturation: 130, hueShift: 55, halation: 8, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 15 },
  { id: 's4', name: 'Summer Heatwave', category: 'Seasons & Nature', inkBleed: 3, shadowCrush: 85, grain: 35, threshold: 0, saturation: 160, hueShift: 10, halation: 21, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 40 },
  { id: 's5', name: 'Deep Forest Moss', category: 'Seasons & Nature', inkBleed: 1, shadowCrush: 95, grain: 40, threshold: 0, saturation: 110, hueShift: -75, halation: 15, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 50 },

  // --- HOLIDAYS & EVENTS ---
  { id: 'h1', name: 'Halloween Terror', category: 'Holidays & Events', inkBleed: 2, shadowCrush: 120, grain: 80, threshold: 0, saturation: 80, hueShift: -110, halation: 10, chromaOffset: 45, monochrome: false, halftone: 0, scanlines: 0, vignette: 80 },
  { id: 'h2', name: 'Christmas Morning', category: 'Holidays & Events', inkBleed: 2, shadowCrush: 50, grain: 10, threshold: 0, saturation: 120, hueShift: -5, halation: 15, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 20 },
  { id: 'h3', name: 'Valentine Crush', category: 'Holidays & Events', inkBleed: 1, shadowCrush: 70, grain: 30, threshold: 0, saturation: 150, hueShift: 75, halation: 22, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 30 },
  { id: 'h4', name: 'New Year Fireworks', category: 'Holidays & Events', inkBleed: 2, shadowCrush: 100, grain: 60, threshold: 0, saturation: 180, hueShift: 0, halation: 31, chromaOffset: 25, monochrome: false, halftone: 0, scanlines: 0, vignette: 90 },

  // --- VIRAL & SOCIAL ---
  { id: 'vi1', name: 'Aura Heatmap Oracle', category: 'Viral & Social', inkBleed: 1, shadowCrush: 40, grain: 15, threshold: 0, saturation: 160, hueShift: 0, halation: 28, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 0, vignette: 20, gradientMap: 'thermal' },
  { id: 'vi2', name: 'Sin City (Red Splash)', category: 'Viral & Social', inkBleed: 2, shadowCrush: 110, grain: 30, threshold: 0, saturation: 150, hueShift: 0, halation: 14, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 65, colorKnockout: 'red' },
  { id: 'vi3', name: 'Glamour Skin Glow', category: 'Viral & Social', inkBleed: 0, shadowCrush: 30, grain: 5, threshold: 0, saturation: 90, hueShift: 5, halation: 8, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, skinSmoothing: 16, colorKnockout: 'warm' },
  { id: 'vi4', name: 'Neon Alley Cyber Grade', category: 'Viral & Social', inkBleed: 2, shadowCrush: 95, grain: 45, threshold: 0, saturation: 100, hueShift: 0, halation: 22, chromaOffset: 25, monochrome: false, halftone: 0, scanlines: 10, vignette: 65, gradientMap: 'cyberpunk' },
  { id: 'vi5', name: 'Film Burnout', category: 'Viral & Social', inkBleed: 2, shadowCrush: 80, grain: 50, threshold: 0, saturation: 130, hueShift: -10, halation: 8, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 50, lightLeak: 85, dustAndScratches: 40 },
  { id: 'vi6', name: 'CCTV Night Vision', category: 'Viral & Social', inkBleed: 3, shadowCrush: 85, grain: 90, threshold: 0, saturation: 100, hueShift: 0, halation: 17, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 60, vignette: 80, gradientMap: 'nightvision' },
  { id: 'vi7', name: 'Angelic Dreamcore', category: 'Viral & Social', inkBleed: 2, shadowCrush: 20, grain: 15, threshold: 0, saturation: 110, hueShift: 45, halation: 35, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, lightLeak: 30, sparkles: 80, prismBlur: 15 },
  { id: 'vi8', name: 'Y2K Sparkle Cam', category: 'Viral & Social', inkBleed: 2, shadowCrush: 60, grain: 30, threshold: 0, saturation: 140, hueShift: 0, halation: 10, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 15, vignette: 15, sparkles: 100 },
  { id: 'vi9', name: 'Grunge Canvas', category: 'Viral & Social', inkBleed: 3, shadowCrush: 65, grain: 20, threshold: 0, saturation: 70, hueShift: -15, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 40, textureType: 'grunge', textureIntensity: 75 },

  // --- INFLUENCER PORTRAITS ---
  { id: 'ip1', name: 'Editorial Model Clean', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 22, midtones: 10, highlights: 6, grain: 3, threshold: 0, saturation: 106, hueShift: 1, halation: 4, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 8, skinSmoothing: 12, skinPolish: 20, blemishRemoval: 22, beautyBoost: 26, eyeBrightening: 10, jawDefinition: 10, expressionLift: 6, faceSlimming: 3, teethWhitening: 6, clarity: 12, artifactRemoval: 6, activeLUT: 'clean-luxe' },
  { id: 'ip2', name: 'Men\'s Groomed Camera', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 28, midtones: 8, highlights: 5, grain: 6, threshold: 0, saturation: 98, hueShift: -2, halation: 1, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, skinSmoothing: 6, skinPolish: 10, blemishRemoval: 16, beautyBoost: 10, eyeBrightening: 6, jawDefinition: 18, expressionLift: 4, faceSlimming: 0, teethWhitening: 4, clarity: 18, artifactRemoval: 8 },
  { id: 'ip3', name: 'Luxury Beauty Reel', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 22, grain: 0, threshold: 0, saturation: 112, hueShift: 3, halation: 6, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 6, skinSmoothing: 16, skinPolish: 28, blemishRemoval: 28, beautyBoost: 38, eyeBrightening: 14, jawDefinition: 12, expressionLift: 10, faceSlimming: 4, teethWhitening: 10, makeupStrength: 10, clarity: 14, artifactRemoval: 8, activeLUT: 'clean-luxe' },
  { id: 'ip4', name: 'Gym Selfie Sculpt', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 32, midtones: 8, highlights: 5, grain: 8, threshold: 0, saturation: 102, hueShift: -3, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 16, skinSmoothing: 4, skinPolish: 8, blemishRemoval: 14, beautyBoost: 8, eyeBrightening: 4, jawDefinition: 20, expressionLift: 3, faceSlimming: 4, teethWhitening: 2, clarity: 20, artifactRemoval: 10 },
  { id: 'ip5', name: 'Soft Lifestyle Creator', category: 'Influencer Portraits', inkBleed: 1, shadowCrush: 20, grain: 5, threshold: 0, saturation: 112, hueShift: 8, halation: 10, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 8, skinSmoothing: 20, blemishRemoval: 28, beautyBoost: 32, eyeBrightening: 18, jawDefinition: 10, expressionLift: 20, faceSlimming: 4, teethWhitening: 8, clarity: 12 },
  { id: 'ip6', name: 'Luxury Couple Campaign', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 30, grain: 4, threshold: 0, saturation: 106, hueShift: 3, halation: 7, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, skinSmoothing: 16, skinPolish: 24, blemishRemoval: 24, beautyBoost: 28, eyeBrightening: 16, jawDefinition: 14, expressionLift: 12, faceSlimming: 5, teethWhitening: 8, clarity: 18, lightLeak: 16, lightLeakStyle: 'rose' },
  { id: 'ip8', name: 'High-End Skin Finish', category: 'Influencer Portraits', inkBleed: 0, shadowCrush: 22, grain: 0, threshold: 0, saturation: 108, hueShift: 2, halation: 4, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 4, skinSmoothing: 18, skinPolish: 42, blemishRemoval: 32, beautyBoost: 24, eyeBrightening: 12, jawDefinition: 10, expressionLift: 8, teethWhitening: 8, clarity: 12, activeLUT: 'clean-luxe' },
  { id: 'ip7', name: 'Streetwear Creator Pop', category: 'Influencer Portraits', inkBleed: 1, shadowCrush: 32, midtones: 8, highlights: 6, grain: 18, threshold: 0, saturation: 118, hueShift: -6, halation: 6, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0, vignette: 22, skinSmoothing: 10, blemishRemoval: 18, beautyBoost: 14, eyeBrightening: 10, jawDefinition: 24, expressionLift: 6, faceSlimming: 4, clarity: 22, activeLUT: 'editorial-cool' },

  // --- FOOD & TABLETOP ---
  { id: 'ft1', name: 'Editorial Plate Portrait', category: 'Food & Tabletop', inkBleed: 0, shadowCrush: 26, grain: 3, threshold: 0, saturation: 118, hueShift: 4, halation: 6, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, clarity: 18, textureType: '4k_vintage_paper', textureIntensity: 12 },
  { id: 'ft2', name: 'Luxury Dessert Campaign', category: 'Food & Tabletop', inkBleed: 0, shadowCrush: 22, grain: 2, threshold: 0, saturation: 126, hueShift: 6, halation: 12, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 8, clarity: 20, lightLeak: 6 },
  { id: 'ft3', name: 'Restaurant Hero Shot', category: 'Food & Tabletop', inkBleed: 0, shadowCrush: 38, grain: 4, threshold: 0, saturation: 122, hueShift: -2, halation: 4, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 16, clarity: 28 },
  { id: 'ft4', name: 'Clean Cafe Menu', category: 'Food & Tabletop', inkBleed: 0, shadowCrush: 16, grain: 0, threshold: 0, saturation: 108, hueShift: 2, halation: 3, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 4, clarity: 16 },
  { id: 'ft5', name: 'Glossy Beverage Hero', category: 'Food & Tabletop', inkBleed: 0, shadowCrush: 24, grain: 1, threshold: 0, saturation: 124, hueShift: -4, halation: 14, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 6, clarity: 24, lightLeak: 12, lightLeakStyle: 'prism', activeLUT: 'clean-luxe' },
  { id: 'ft6', name: 'Warm Kitchen Editorial', category: 'Food & Tabletop', inkBleed: 1, shadowCrush: 32, grain: 6, threshold: 0, saturation: 116, hueShift: 8, halation: 8, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, clarity: 22, textureType: '4k_linen_tablecloth', textureIntensity: 22, lightLeak: 10, lightLeakStyle: 'sunset', activeLUT: 'portra-soft' },


  // --- BITMAP & DITHER ---
  { id: 'b1', name: 'Console Bitmap 2600', category: 'Bitmap & Dither', inkBleed: 0, shadowCrush: 80, grain: 0, threshold: 128, saturation: 150, hueShift: -40, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 20, vignette: 0 },
  { id: 'b2', name: 'High-Contrast Litho', category: 'Bitmap & Dither', inkBleed: 0, shadowCrush: 120, grain: 25, threshold: 150, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0, vignette: 0 },
  { id: 'b3', name: 'Dithered Glitch', category: 'Bitmap & Dither', inkBleed: 0, shadowCrush: 90, grain: 10, threshold: 140, saturation: 180, hueShift: 60, halation: 0, chromaOffset: 50, monochrome: false, halftone: 0, scanlines: 0, vignette: 0 },
  { id: 'b4', name: '1-Bit Newsprint', category: 'Bitmap & Dither', inkBleed: 2, shadowCrush: 100, grain: 50, threshold: 128, saturation: 0, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: true, halftone: 8, scanlines: 0, vignette: 10 },

  // --- CINEMATIC & BLOCKBUSTER ---
  { id: 'cb1', name: 'Amber Neon Noir', category: 'Cinematic & Blockbuster', inkBleed: 0, shadowCrush: 80, grain: 25, threshold: 0, saturation: 140, hueShift: 10, halation: 12, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 40, textureType: 'none', textureIntensity: 0 },
  { id: 'cb2', name: 'Green Code Wash', category: 'Cinematic & Blockbuster', inkBleed: 2, shadowCrush: 70, grain: 30, threshold: 0, saturation: 90, hueShift: 55, halation: 15, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 30 },
  { id: 'cb3', name: 'Monochrome Firestorm', category: 'Cinematic & Blockbuster', inkBleed: 1, shadowCrush: 90, grain: 40, threshold: 0, saturation: 0, hueShift: 0, halation: 10, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 0, vignette: 60, textureType: 'none', textureIntensity: 0 },
  { id: 'cb4', name: 'Desert Heat Epic', category: 'Cinematic & Blockbuster', inkBleed: 0, shadowCrush: 50, grain: 20, threshold: 0, saturation: 120, hueShift: -10, halation: 15, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 20 },
  { id: 'cb5', name: 'Cyber Neon Rain', category: 'Cinematic & Blockbuster', inkBleed: 1, shadowCrush: 100, grain: 35, threshold: 0, saturation: 180, hueShift: -25, halation: 28, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 0, vignette: 80, prismBlur: 2 },
  { id: 'cb6', name: 'Arthouse Matte Film', category: 'Cinematic & Blockbuster', inkBleed: 3, shadowCrush: 60, grain: 60, threshold: 0, saturation: 85, hueShift: 5, halation: 10, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 50, skinSmoothing: 4 },

  // --- ANIME & CEL SHADED ---
  { id: 'an1', name: '90s Anime Retro', category: 'Anime & Cel Shaded', inkBleed: 2, shadowCrush: 40, grain: 15, threshold: 0, saturation: 130, hueShift: 5, halation: 21, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 10, vignette: 10 },
  { id: 'an2', name: 'Hand-Painted Dreamscape', category: 'Anime & Cel Shaded', inkBleed: 4, shadowCrush: 20, grain: 10, threshold: 0, saturation: 150, hueShift: 20, halation: 12, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10 },
  { id: 'an3', name: 'Cel Shaded Edge', category: 'Anime & Cel Shaded', inkBleed: 2, shadowCrush: 120, grain: 0, threshold: 0, saturation: 200, hueShift: 0, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 0, skinSmoothing: 20 },
  { id: 'an4', name: 'Ghost Circuit Shell', category: 'Anime & Cel Shaded', inkBleed: 1, shadowCrush: 85, grain: 30, threshold: 0, saturation: 90, hueShift: 40, halation: 8, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 20, vignette: 40, gradientMap: 'cyberpunk' },
  { id: 'an5', name: 'Neon Genesis Amber', category: 'Anime & Cel Shaded', inkBleed: 2, shadowCrush: 70, grain: 20, threshold: 0, saturation: 140, hueShift: -30, halation: 24, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 30 },

  // --- GOTHIC & DARK ACADEMIA ---
  { id: 'gd1', name: 'Vampire Gothic', category: 'Gothic & Dark Academia', inkBleed: 1, shadowCrush: 110, grain: 40, threshold: 0, saturation: 60, hueShift: 0, halation: 15, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 80, skinSmoothing: 10, colorKnockout: 'red' },
  { id: 'gd2', name: 'Library Dust Archive', category: 'Gothic & Dark Academia', inkBleed: 2, shadowCrush: 60, grain: 30, threshold: 0, saturation: 70, hueShift: 15, halation: 10, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 60, textureType: 'paper', textureIntensity: 50 },
  { id: 'gd3', name: 'Rainy London 1890', category: 'Gothic & Dark Academia', inkBleed: 2, shadowCrush: 85, grain: 55, threshold: 0, saturation: 30, hueShift: 50, halation: 5, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 90 },
  { id: 'gd4', name: 'Candlelight Study', category: 'Gothic & Dark Academia', inkBleed: 3, shadowCrush: 90, grain: 45, threshold: 0, saturation: 110, hueShift: -25, halation: 29, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 75, skinSmoothing: 4 },
  { id: 'gd5', name: 'Dark Academia Mood', category: 'Gothic & Dark Academia', inkBleed: 1, shadowCrush: 80, grain: 35, threshold: 0, saturation: 80, hueShift: 10, halation: 7, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 65, textureType: 'canvas', textureIntensity: 30 },

  // --- NEON FUTURE CORE ---
  { id: 'cpn1', name: 'Neon District Overdrive', category: 'Neon Future Core', inkBleed: 2, shadowCrush: 95, grain: 40, threshold: 0, saturation: 160, hueShift: -10, halation: 31, chromaOffset: 30, monochrome: false, halftone: 0, scanlines: 10, vignette: 50, lightLeak: 20, prismBlur: 3 },
  { id: 'cpn2', name: 'Neon Runner Speed', category: 'Neon Future Core', inkBleed: 3, shadowCrush: 80, grain: 25, threshold: 0, saturation: 200, hueShift: 30, halation: 21, chromaOffset: 80, monochrome: false, halftone: 0, scanlines: 0, vignette: 40, prismBlur: 11 },
  { id: 'cpn3', name: 'Chrome Metal Noir', category: 'Neon Future Core', inkBleed: 2, shadowCrush: 110, grain: 50, threshold: 0, saturation: 40, hueShift: 0, halation: 14, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 5, vignette: 70 },
  { id: 'cpn4', name: 'Hologram Signal Break', category: 'Neon Future Core', inkBleed: 2, shadowCrush: 60, grain: 80, threshold: 0, saturation: 140, hueShift: 120, halation: 35, chromaOffset: 60, monochrome: false, halftone: 0, scanlines: 40, vignette: 20, prismBlur: 7 },
  { id: 'cpn5', name: 'Neural Memory Bloom', category: 'Neon Future Core', inkBleed: 1, shadowCrush: 40, grain: 20, threshold: 0, saturation: 90, hueShift: -40, halation: 35, chromaOffset: 20, monochrome: false, halftone: 0, scanlines: 0, vignette: 50, prismBlur: 15, skinSmoothing: 10 },

  // --- GLITCHCORE & WEBCORE ---
  { id: 'gl1', name: 'Dial-Up Error 404', category: 'Glitchcore & Webcore', inkBleed: 5, shadowCrush: 70, grain: 60, threshold: 0, saturation: 180, hueShift: 45, halation: 8, chromaOffset: 100, monochrome: false, halftone: 0, scanlines: 25, vignette: 10 },
  { id: 'gl2', name: 'Windows 95 Screen', category: 'Glitchcore & Webcore', inkBleed: 1, shadowCrush: 40, grain: 10, threshold: 0, saturation: 120, hueShift: 0, halation: 0, chromaOffset: 10, monochrome: false, halftone: 5, scanlines: 100, vignette: 20 },
  { id: 'gl3', name: 'Datamosh Melt', category: 'Glitchcore & Webcore', inkBleed: 25, shadowCrush: 100, grain: 40, threshold: 0, saturation: 200, hueShift: 140, halation: 17, chromaOffset: 80, monochrome: false, halftone: 0, scanlines: 50, vignette: 50, prismBlur: 5 },
  { id: 'gl4', name: 'Web 1.0 Dither', category: 'Glitchcore & Webcore', inkBleed: 0, shadowCrush: 80, grain: 0, threshold: 140, saturation: 150, hueShift: 20, halation: 0, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 0 },
  { id: 'gl5', name: 'Shattered CRT', category: 'Glitchcore & Webcore', inkBleed: 3, shadowCrush: 90, grain: 80, threshold: 0, saturation: 140, hueShift: -25, halation: 24, chromaOffset: 90, monochrome: false, halftone: 0, scanlines: 80, vignette: 60, prismBlur: 10 },

  // --- ANALOG HORROR / FOUND FOOTAGE ---
  { id: 'ah1', name: 'Tall Shadow Forest', category: 'Analog Horror / Found Footage', inkBleed: 3, shadowCrush: 110, grain: 95, threshold: 0, saturation: 20, hueShift: 50, halation: 10, chromaOffset: 15, monochrome: false, halftone: 0, scanlines: 10, vignette: 90, dustAndScratches: 60 },
  { id: 'ah2', name: 'Cursed VHS Tape', category: 'Analog Horror / Found Footage', inkBleed: 6, shadowCrush: 85, grain: 100, threshold: 0, saturation: 40, hueShift: -10, halation: 14, chromaOffset: 65, monochrome: false, halftone: 0, scanlines: 45, vignette: 100, dustAndScratches: 80, camcorderOSD: true },
  { id: 'ah3', name: 'Security Camera 4', category: 'Analog Horror / Found Footage', inkBleed: 1, shadowCrush: 120, grain: 80, threshold: 0, saturation: 0, hueShift: 0, halation: 10, chromaOffset: 0, monochrome: true, halftone: 0, scanlines: 60, vignette: 80, camcorderOSD: true },
  { id: 'ah4', name: 'Deep Web Upload', category: 'Analog Horror / Found Footage', inkBleed: 15, shadowCrush: 150, grain: 70, threshold: 0, saturation: 80, hueShift: 80, halation: 7, chromaOffset: 45, monochrome: false, halftone: 0, scanlines: 15, vignette: 75, prismBlur: 2 },
  { id: 'ah5', name: 'Yellow Hallway Liminal', category: 'Analog Horror / Found Footage', inkBleed: 2, shadowCrush: 60, grain: 65, threshold: 0, saturation: 110, hueShift: 35, halation: 17, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 5, vignette: 30, gradientMap: 'thermal' },

  // --- MUSIC VIDEO (2000s) ---
  { id: 'mv1', name: '2004 Rap Video Flash', category: 'Music Video (2000s)', inkBleed: 1, shadowCrush: 90, grain: 15, threshold: 0, saturation: 150, hueShift: -5, halation: 15, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 20, skinSmoothing: 16 },
  { id: 'mv2', name: 'Pop Punk Fish-Eye', category: 'Music Video (2000s)', inkBleed: 2, shadowCrush: 80, grain: 40, threshold: 0, saturation: 180, hueShift: 15, halation: 7, chromaOffset: 25, monochrome: false, halftone: 0, scanlines: 0, vignette: 70 },
  { id: 'mv3', name: 'Teen Pop Studio Shine', category: 'Music Video (2000s)', inkBleed: 0, shadowCrush: 40, grain: 10, threshold: 0, saturation: 120, hueShift: 0, halation: 28, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, skinSmoothing: 20, sparkles: 30 },
  { id: 'mv4', name: 'Nu-Metal Grime', category: 'Music Video (2000s)', inkBleed: 4, shadowCrush: 120, grain: 60, threshold: 0, saturation: 50, hueShift: 45, halation: 15, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0, vignette: 60, textureType: 'grunge', textureIntensity: 40 },
  { id: 'mv5', name: 'Indie Sleaze Flash', category: 'Music Video (2000s)', inkBleed: 2, shadowCrush: 110, grain: 50, threshold: 0, saturation: 140, hueShift: 0, halation: 17, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 80 },

  // --- DREAMCORE & LIMINAL SPACE ---
  { id: 'dc1', name: 'Fever Dream', category: 'Dreamcore & Liminal Space', inkBleed: 10, shadowCrush: 10, grain: 20, threshold: 0, saturation: 180, hueShift: -60, halation: 35, chromaOffset: 40, monochrome: false, halftone: 0, scanlines: 0, vignette: 20, prismBlur: 15 },
  { id: 'dc2', name: 'Empty Mall Pool', category: 'Dreamcore & Liminal Space', inkBleed: 2, shadowCrush: 30, grain: 45, threshold: 0, saturation: 80, hueShift: 25, halation: 21, chromaOffset: 10, monochrome: false, halftone: 0, scanlines: 0, vignette: 10, prismBlur: 5 },
  { id: 'dc3', name: 'Childhood Nostalgia', category: 'Dreamcore & Liminal Space', inkBleed: 3, shadowCrush: 20, grain: 30, threshold: 0, saturation: 110, hueShift: 5, halation: 31, chromaOffset: 5, monochrome: false, halftone: 0, scanlines: 0, vignette: 50, lightLeak: 45 },
  { id: 'dc4', name: 'Weirdcore Eyes', category: 'Dreamcore & Liminal Space', inkBleed: 1, shadowCrush: 100, grain: 80, threshold: 0, saturation: 200, hueShift: 170, halation: 7, chromaOffset: 100, monochrome: false, halftone: 0, scanlines: 10, vignette: 80 },
  { id: 'dc5', name: 'Soft Liminality', category: 'Dreamcore & Liminal Space', inkBleed: 7, shadowCrush: 0, grain: 10, threshold: 0, saturation: 60, hueShift: -10, halation: 35, chromaOffset: 0, monochrome: false, halftone: 0, scanlines: 0, vignette: 0, prismBlur: 20 }
];

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type TonePolicy = 'portrait-premium' | 'product-clean' | 'cinematic-grade' | 'graphic-impact' | 'grit-texture';

const CATEGORY_PROFILES: Record<PresetCategory, {
  tonePolicy: TonePolicy;
  shadowCap: number;
  saturationCap: number;
  clarityCap: number;
  defaultMidtones: number;
  defaultHighlights: number;
}> = {
  'Airbrush & Face Retouch': {
    tonePolicy: 'portrait-premium',
    shadowCap: 36,
    saturationCap: 118,
    clarityCap: 28,
    defaultMidtones: 10,
    defaultHighlights: 6
  },
  'Influencer Portraits': {
    tonePolicy: 'portrait-premium',
    shadowCap: 38,
    saturationCap: 122,
    clarityCap: 28,
    defaultMidtones: 10,
    defaultHighlights: 6
  },
  'Food & Tabletop': {
    tonePolicy: 'product-clean',
    shadowCap: 40,
    saturationCap: 128,
    clarityCap: 28,
    defaultMidtones: 8,
    defaultHighlights: 6
  },
  'Cinematic & Blockbuster': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 82,
    saturationCap: 160,
    clarityCap: 42,
    defaultMidtones: 4,
    defaultHighlights: 3
  },
  'Viral & Social': {
    tonePolicy: 'graphic-impact',
    shadowCap: 78,
    saturationCap: 168,
    clarityCap: 38,
    defaultMidtones: 5,
    defaultHighlights: 4
  },
  'Print Halftone & Xerox': {
    tonePolicy: 'graphic-impact',
    shadowCap: 86,
    saturationCap: 170,
    clarityCap: 40,
    defaultMidtones: 3,
    defaultHighlights: 2
  },
  'Bitmap & Dither': {
    tonePolicy: 'graphic-impact',
    shadowCap: 92,
    saturationCap: 180,
    clarityCap: 40,
    defaultMidtones: 0,
    defaultHighlights: 0
  },
  'Yulian Graphics (Viral)': {
    tonePolicy: 'graphic-impact',
    shadowCap: 88,
    saturationCap: 178,
    clarityCap: 44,
    defaultMidtones: 3,
    defaultHighlights: 3
  },
  'Camera Simulation': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 78,
    saturationCap: 142,
    clarityCap: 34,
    defaultMidtones: 4,
    defaultHighlights: 3
  },
  'Vintage Cameras (Pre-1980)': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 86,
    saturationCap: 150,
    clarityCap: 34,
    defaultMidtones: 3,
    defaultHighlights: 2
  },
  'Retro Tech (1980s)': {
    tonePolicy: 'graphic-impact',
    shadowCap: 92,
    saturationCap: 210,
    clarityCap: 38,
    defaultMidtones: 0,
    defaultHighlights: 2
  },
  'Digital Dawn (1990s)': {
    tonePolicy: 'graphic-impact',
    shadowCap: 92,
    saturationCap: 190,
    clarityCap: 38,
    defaultMidtones: 2,
    defaultHighlights: 2
  },
  'Y2K & Streetwear': {
    tonePolicy: 'graphic-impact',
    shadowCap: 90,
    saturationCap: 200,
    clarityCap: 42,
    defaultMidtones: 2,
    defaultHighlights: 3
  },
  'Seasons & Nature': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 78,
    saturationCap: 155,
    clarityCap: 36,
    defaultMidtones: 5,
    defaultHighlights: 4
  },
  'Holidays & Events': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 86,
    saturationCap: 170,
    clarityCap: 36,
    defaultMidtones: 4,
    defaultHighlights: 4
  },
  'Analog Horror / Found Footage': {
    tonePolicy: 'grit-texture',
    shadowCap: 110,
    saturationCap: 115,
    clarityCap: 42,
    defaultMidtones: 0,
    defaultHighlights: 0
  },
  'Anime & Cel Shaded': {
    tonePolicy: 'graphic-impact',
    shadowCap: 88,
    saturationCap: 190,
    clarityCap: 38,
    defaultMidtones: 5,
    defaultHighlights: 4
  },
  'Gothic & Dark Academia': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 92,
    saturationCap: 118,
    clarityCap: 36,
    defaultMidtones: 0,
    defaultHighlights: 2
  },
  'Neon Future Core': {
    tonePolicy: 'graphic-impact',
    shadowCap: 96,
    saturationCap: 188,
    clarityCap: 42,
    defaultMidtones: 1,
    defaultHighlights: 4
  },
  'Glitchcore & Webcore': {
    tonePolicy: 'graphic-impact',
    shadowCap: 100,
    saturationCap: 190,
    clarityCap: 42,
    defaultMidtones: 0,
    defaultHighlights: 2
  },
  'Music Video (2000s)': {
    tonePolicy: 'portrait-premium',
    shadowCap: 62,
    saturationCap: 145,
    clarityCap: 34,
    defaultMidtones: 7,
    defaultHighlights: 5
  },
  'Dreamcore & Liminal Space': {
    tonePolicy: 'cinematic-grade',
    shadowCap: 72,
    saturationCap: 175,
    clarityCap: 28,
    defaultMidtones: 8,
    defaultHighlights: 7
  }
};

const PROFESSIONAL_BASELINE = {
  tonePolicy: 'cinematic-grade' as TonePolicy,
  shadowCap: 84,
  saturationCap: 170,
  clarityCap: 40,
  defaultMidtones: 4,
  defaultHighlights: 3
};

const isPresetCategory = (category: string): category is PresetCategory => PRESET_CATEGORY_SET.has(category);

const isThresholdDrivenPreset = (preset: Preset) => preset.threshold >= 120 || preset.monochrome;

const hasPortraitSubjectBias = (preset: Preset) => (
  preset.category === 'Airbrush & Face Retouch'
  || preset.category === 'Influencer Portraits'
  || preset.category === 'Music Video (2000s)'
  || preset.skinSmoothing !== undefined
  || preset.blemishRemoval !== undefined
  || preset.beautyBoost !== undefined
  || preset.skinPolish !== undefined
  || preset.eyeBrightening !== undefined
  || preset.jawDefinition !== undefined
  || preset.teethWhitening !== undefined
  || preset.makeupStrength !== undefined
);

const getNameTokens = (preset: Preset) => preset.name.toLowerCase();

const nameHasAny = (preset: Preset, tokens: string[]) => {
  const haystack = getNameTokens(preset);
  return tokens.some((token) => haystack.includes(token));
};

const applyNameIntent = (
  preset: Preset,
  values: {
    shadowCrush: number;
    saturation: number;
    clarity: number | undefined;
    midtones: number;
    highlights: number;
  },
  thresholdDriven: boolean
) => {
  const next = { ...values };

  if (nameHasAny(preset, ['clean', 'editorial', 'luxury', 'lifestyle', 'campaign', 'beauty', 'model', 'studio', 'hero'])) {
    next.shadowCrush = clampNumber(next.shadowCrush - 6, 0, 100);
    next.midtones = clampNumber(next.midtones + 2, -20, 24);
    next.highlights = clampNumber(next.highlights + 1, 0, 18);
    if (next.clarity !== undefined) {
      next.clarity = clampNumber(next.clarity - 4, 0, 42);
    }
  }

  if (nameHasAny(preset, ['soft', 'dream', 'dreamscape', 'angelic', 'glow', 'bloom', 'liminality'])) {
    next.shadowCrush = clampNumber(next.shadowCrush - 8, 0, 100);
    next.midtones = clampNumber(next.midtones + 3, -20, 24);
    next.highlights = clampNumber(next.highlights + 2, 0, 18);
    if (next.clarity !== undefined) {
      next.clarity = clampNumber(next.clarity - 6, 0, 42);
    }
  }

  if (nameHasAny(preset, ['flash', 'shine', 'chrome', 'metal', 'laser', 'glare'])) {
    next.highlights = clampNumber(next.highlights + 3, 0, 18);
    next.midtones = clampNumber(next.midtones + 1, -20, 24);
  }

  if (nameHasAny(preset, ['warm', 'autumn', 'sunset', 'gold', 'kodachrome', 'candlelight'])) {
    next.saturation = clampNumber(next.saturation, preset.monochrome ? 0 : 90, preset.monochrome ? 100 : 132);
    next.shadowCrush = clampNumber(next.shadowCrush - 4, 0, 100);
    next.midtones = clampNumber(next.midtones + 1, -20, 24);
  }

  if (nameHasAny(preset, ['cold', 'frost', 'winter', 'night', 'cctv', 'security'])) {
    next.saturation = clampNumber(next.saturation, preset.monochrome ? 0 : 40, preset.monochrome ? 100 : 120);
    next.highlights = clampNumber(next.highlights + 1, 0, 18);
  }

  if (nameHasAny(preset, ['print', 'newsprint', 'halftone', 'xerox', 'fax', 'screenprint', 'risograph', 'comic', 'dither', 'bitmap', '1-bit'])) {
    next.midtones = thresholdDriven ? next.midtones : clampNumber(next.midtones, -4, 10);
    next.highlights = thresholdDriven ? next.highlights : clampNumber(next.highlights, 0, 8);
    if (next.clarity !== undefined) {
      next.clarity = clampNumber(next.clarity, 0, 34);
    }
  }

  if (nameHasAny(preset, ['glitch', 'error', 'datamosh', 'web', 'crt', 'vhs', 'camcorder', 'tape drift', 'lo-fi', 'found footage', 'horror'])) {
    if (!thresholdDriven) {
      next.shadowCrush = clampNumber(next.shadowCrush + 4, 0, 110);
    }
    if (next.clarity !== undefined) {
      next.clarity = clampNumber(next.clarity + 2, 0, 42);
    }
  }

  if (nameHasAny(preset, ['cyber', 'neon', 'hologram', 'neural', 'tokyo', 'thermal'])) {
    next.saturation = clampNumber(next.saturation, preset.monochrome ? 0 : 95, preset.monochrome ? 100 : 175);
    next.highlights = clampNumber(next.highlights + 1, 0, 18);
  }

  if (nameHasAny(preset, ['portrait', 'smile', 'airbrush', 'makeup', 'skin', 'groomed'])) {
    next.shadowCrush = clampNumber(next.shadowCrush - 3, 0, 100);
    next.midtones = clampNumber(next.midtones + 1, -20, 24);
    if (next.clarity !== undefined) {
      next.clarity = clampNumber(next.clarity - 2, 0, 42);
    }
  }

  return next;
};

const buildPresetDescription = (preset: Preset) => {
  if (nameHasAny(preset, ['clean', 'editorial', 'luxury', 'campaign', 'model', 'beauty'])) {
    return 'Commercial-grade polish with controlled contrast, healthier midtones, and cleaner finishing behavior.';
  }
  if (nameHasAny(preset, ['glow', 'dream', 'angelic', 'soft', 'bloom'])) {
    return 'Luminous styling with softer lows, lifted mids, and gentler highlight handling.';
  }
  if (nameHasAny(preset, ['print', 'halftone', 'xerox', 'fax', 'screenprint', 'risograph', 'comic', 'dither', 'bitmap'])) {
    return 'Graphic reproduction styling tuned for flatter tonal grouping, ink character, and shape-first rendering.';
  }
  if (nameHasAny(preset, ['glitch', 'crt', 'vhs', 'camcorder', 'tape drift', 'datamosh', 'error', 'horror'])) {
    return 'Deliberate degradation with stronger texture, artifact flavor, and mood-driven contrast.';
  }
  if (nameHasAny(preset, ['cyber', 'neon', 'hologram', 'neural', 'thermal', 'tokyo'])) {
    return 'Synthetic color styling aimed at chroma energy, futuristic light, and harder visual separation.';
  }
  if (nameHasAny(preset, ['kodachrome', 'polaroid', 'film', 'instamatic', 'leica', 'daguerreotype'])) {
    return 'Era-inspired camera emulation with moderated contrast, period texture, and stylized color bias.';
  }
  return 'Balanced stylization tuned to keep the preset identity readable without overwhelming the source image.';
};

const buildPresetUsageTags = (preset: Preset) => {
  const tags = new Set<string>();

  if (hasPortraitSubjectBias(preset)) tags.add('portrait-safe');
  if (nameHasAny(preset, ['clean', 'editorial', 'luxury', 'campaign', 'hero'])) tags.add('commercial');
  if (nameHasAny(preset, ['soft', 'glow', 'dream', 'angelic'])) tags.add('soft-light');
  if (nameHasAny(preset, ['print', 'halftone', 'xerox', 'fax', 'screenprint', 'dither', 'bitmap'])) tags.add('graphic');
  if (nameHasAny(preset, ['glitch', 'crt', 'vhs', 'camcorder', 'tape drift', 'error', 'horror'])) tags.add('texture-heavy');
  if (nameHasAny(preset, ['night', 'midnight', 'cctv', 'security', 'gothic'])) tags.add('dark-scene');
  if (nameHasAny(preset, ['cyber', 'neon', 'hologram', 'neural', 'thermal', 'tokyo'])) tags.add('color-bold');
  if (preset.threshold >= 120 || preset.monochrome) tags.add('extreme');

  if (tags.size === 0) tags.add('balanced');
  return Array.from(tags).slice(0, 3);
};

const applyTonePolicy = (
  preset: Preset,
  baseValues: {
    shadowCrush: number;
    saturation: number;
    clarity: number | undefined;
    midtones: number;
    highlights: number;
  },
  profile: typeof PROFESSIONAL_BASELINE,
  thresholdDriven: boolean
) => {
  if (thresholdDriven) {
    return baseValues;
  }

  switch (profile.tonePolicy) {
    case 'portrait-premium':
      return {
        shadowCrush: clampNumber(baseValues.shadowCrush, 0, Math.min(profile.shadowCap, 34)),
        saturation: clampNumber(baseValues.saturation, 88, Math.min(profile.saturationCap, 120)),
        clarity: baseValues.clarity === undefined ? undefined : clampNumber(baseValues.clarity, 0, Math.min(profile.clarityCap, 24)),
        midtones: clampNumber(Math.max(baseValues.midtones, 9 + Math.round(baseValues.shadowCrush * 0.05)), 6, 22),
        highlights: clampNumber(Math.max(baseValues.highlights, 5 + Math.round(baseValues.shadowCrush * 0.03)), 3, 16)
      };
    case 'product-clean':
      return {
        shadowCrush: clampNumber(baseValues.shadowCrush, 0, profile.shadowCap),
        saturation: clampNumber(baseValues.saturation, 92, Math.min(profile.saturationCap, 132)),
        clarity: baseValues.clarity === undefined ? undefined : clampNumber(baseValues.clarity, 0, Math.min(profile.clarityCap, 26)),
        midtones: clampNumber(Math.max(baseValues.midtones, 6), 4, 18),
        highlights: clampNumber(Math.max(baseValues.highlights, 4), 2, 14)
      };
    case 'cinematic-grade':
      return {
        shadowCrush: clampNumber(baseValues.shadowCrush, 0, profile.shadowCap),
        saturation: clampNumber(baseValues.saturation, 55, profile.saturationCap),
        clarity: baseValues.clarity === undefined ? undefined : clampNumber(baseValues.clarity, 0, profile.clarityCap),
        midtones: clampNumber(baseValues.midtones, -4, 16),
        highlights: clampNumber(baseValues.highlights, 0, 12)
      };
    case 'graphic-impact':
      return {
        shadowCrush: clampNumber(baseValues.shadowCrush, 0, profile.shadowCap),
        saturation: clampNumber(baseValues.saturation, preset.monochrome ? 0 : 70, profile.saturationCap),
        clarity: baseValues.clarity === undefined ? undefined : clampNumber(baseValues.clarity, 0, profile.clarityCap),
        midtones: clampNumber(baseValues.midtones, -8, 16),
        highlights: clampNumber(baseValues.highlights, 0, 12)
      };
    case 'grit-texture':
      return {
        shadowCrush: clampNumber(baseValues.shadowCrush, 0, profile.shadowCap),
        saturation: clampNumber(baseValues.saturation, 0, profile.saturationCap),
        clarity: baseValues.clarity === undefined ? undefined : clampNumber(baseValues.clarity, 0, profile.clarityCap),
        midtones: clampNumber(baseValues.midtones, -10, 12),
        highlights: clampNumber(baseValues.highlights, 0, 10)
      };
  }
};

const normalizePresetForProfessionalOutput = (preset: Preset): Preset => {
  const profile = isPresetCategory(preset.category) ? CATEGORY_PROFILES[preset.category] : PROFESSIONAL_BASELINE;
  const thresholdDriven = isThresholdDrivenPreset(preset);
  const shadowCap = thresholdDriven ? Math.max(profile.shadowCap, 92) : profile.shadowCap;
  const shadowCrush = clampNumber(preset.shadowCrush, 0, shadowCap);
  const saturationCap = thresholdDriven ? profile.saturationCap : Math.max(96, profile.saturationCap - Math.max(0, shadowCrush - 70) * 0.35);
  const saturation = clampNumber(preset.saturation, preset.monochrome ? 0 : 40, preset.monochrome ? 100 : saturationCap);
  const clarity = preset.clarity === undefined ? undefined : clampNumber(preset.clarity, 0, profile.clarityCap);

  const needsToneRecovery = !thresholdDriven && shadowCrush >= Math.max(30, profile.shadowCap - 10);
  const recoveryStrength = needsToneRecovery ? shadowCrush - Math.max(20, profile.shadowCap * 0.45) : 0;
  const midtones = thresholdDriven
    ? (preset.midtones ?? 0)
    : clampNumber(preset.midtones ?? Math.round(profile.defaultMidtones + recoveryStrength * 0.22), -20, 24);
  const highlights = thresholdDriven
    ? (preset.highlights ?? 0)
    : clampNumber(preset.highlights ?? Math.round(profile.defaultHighlights + recoveryStrength * 0.14), 0, 18);

  const portraitBiased = hasPortraitSubjectBias(preset) && !thresholdDriven;
  const portraitSafetyAdjusted = portraitBiased
    ? {
        shadowCrush: clampNumber(shadowCrush - 4, 0, shadowCap),
        saturation: clampNumber(saturation, 90, Math.min(profile.saturationCap, 120)),
        clarity: clarity === undefined ? undefined : clampNumber(clarity, 0, Math.min(profile.clarityCap, 24)),
        midtones: clampNumber(Math.max(midtones, 10), -20, 24),
        highlights: clampNumber(Math.max(highlights, 6), 0, 18)
      }
    : {
        shadowCrush,
        saturation,
        clarity,
        midtones,
        highlights
      };

  const tonePolicyValues = applyTonePolicy(preset, portraitSafetyAdjusted, profile, thresholdDriven);
  const nameIntentValues = applyNameIntent(preset, tonePolicyValues, thresholdDriven);

  return {
    ...preset,
    description: buildPresetDescription(preset),
    usageTags: buildPresetUsageTags(preset),
    textureType: normalizeTextureId(preset.textureType),
    shadowCrush: nameIntentValues.shadowCrush,
    midtones: nameIntentValues.midtones,
    highlights: nameIntentValues.highlights,
    saturation: nameIntentValues.saturation,
    clarity: nameIntentValues.clarity
  };
};

export const PRESETS: Preset[] = RAW_PRESETS.map(normalizePresetForProfessionalOutput);
