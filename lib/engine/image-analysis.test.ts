import { describe, expect, it } from 'vitest';
import { adaptPresetToAestheticProfile, type ImageAestheticProfile } from '@/lib/engine/image-analysis';
import { PRESETS } from '@/lib/presets';

const profile = (overrides: Partial<ImageAestheticProfile>): ImageAestheticProfile => ({
  avgLuma: 120,
  minLuma: 20,
  maxLuma: 230,
  contrastRange: 180,
  avgSaturation: 0.28,
  colorTemperatureEstimate: 0,
  greenCastRisk: false,
  redCastRisk: false,
  highlightClipRisk: false,
  shadowClipRisk: false,
  lowContrastScene: false,
  highContrastScene: false,
  darkScene: false,
  brightScene: false,
  mutedScene: false,
  saturatedScene: false,
  skinRisk: false,
  noiseRisk: false,
  faceLikely: false,
  productLikely: false,
  dominantHueBuckets: {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    cyan: 0,
    blue: 0,
    magenta: 0
  },
  warmBias: false,
  coolBias: false,
  ...overrides
});

describe('preset aesthetic adaptation', () => {
  it('opens dark portraits instead of crushing face shadows', () => {
    const preset = PRESETS.find((candidate) => candidate.id === 'port-low-light-selfie-rescue')!;
    const adapted = adaptPresetToAestheticProfile(preset, profile({ darkScene: true, shadowClipRisk: true, skinRisk: true, faceLikely: true, avgLuma: 55 }));

    expect(adapted.shadowCrush).toBeLessThanOrEqual(16);
    expect(adapted.midtones).toBeGreaterThanOrEqual(14);
    expect(adapted.clarity).toBeLessThanOrEqual(20);
  });

  it('protects bright portraits from cheap glow and clipped highlights', () => {
    const preset = PRESETS.find((candidate) => candidate.id === 'sig-creator-glow')!;
    const adapted = adaptPresetToAestheticProfile(preset, profile({ brightScene: true, highlightClipRisk: true, skinRisk: true, faceLikely: true, avgLuma: 190 }));

    expect(adapted.highlights).toBeLessThanOrEqual(10);
    expect(adapted.halation).toBeLessThanOrEqual(10);
    expect(adapted.glowUp).toBeLessThanOrEqual(12);
  });

  it('does not blindly oversaturate muted skin-safe images beyond cap', () => {
    const preset = PRESETS.find((candidate) => candidate.id === 'sig-viral-clean')!;
    const adapted = adaptPresetToAestheticProfile(preset, profile({ mutedScene: true, skinRisk: true, faceLikely: true, avgSaturation: 0.1 }));

    expect(adapted.saturation).toBeLessThanOrEqual(122);
    expect(adapted.saturation).toBeGreaterThanOrEqual(88);
  });

  it('keeps product presets free from face-specific controls', () => {
    const preset = PRESETS.find((candidate) => candidate.id === 'prod-skincare-ad-glow')!;
    const adapted = adaptPresetToAestheticProfile(preset, profile({ productLikely: true }));

    expect(adapted.skinSmoothing).toBe(0);
    expect(adapted.beautyBoost).toBe(0);
    expect(adapted.skinPolish).toBe(0);
    expect(adapted.clarity).toBeGreaterThanOrEqual(18);
  });

  it('allows graphic presets to remain destructive when clearly labeled', () => {
    const preset = PRESETS.find((candidate) => candidate.id === 'gfx-zine-copy')!;
    const adapted = adaptPresetToAestheticProfile(preset, profile({ skinRisk: true, faceLikely: true, darkScene: true }));

    expect(adapted.threshold).toBeGreaterThanOrEqual(120);
    expect(adapted.intensity).toBe('extreme');
    expect(adapted.skinSafe).toBe(false);
  });
});
