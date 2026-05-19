import { describe, expect, it } from 'vitest';
import { createNeutralSnapshot } from '@/lib/editor-config';
import { buildSnapshotFromPreset, normalizeEditorSnapshot, reduceEditorSnapshot } from '@/lib/editor-state';
import type { Preset } from '@/lib/presets';

const preset: Preset = {
  id: 'test-preset',
  name: 'Test Preset',
  category: 'Test',
  family: 'signature',
  tier: 'standard',
  intensity: 'medium',
  subjectBias: 'portrait',
  previewTone: 'clean',
  skinSafe: true,
  bestFor: ['tests'],
  avoidFor: ['production'],
  defaultIntensity: 64,
  compatibleImageTypes: ['portrait', 'general'],
  recipeVersion: 'format-preset-recipe-v1',
  exposed: true,
  oneClickScore: 60,
  commercialScore: 60,
  viralScore: 60,
  description: 'Test preset',
  usageTags: ['test'],
  inkBleed: 4,
  shadowCrush: 12,
  midtones: 8,
  highlights: 18,
  activeLUT: 'clean-luxe',
  grain: 22,
  threshold: 0,
  saturation: 118,
  hueShift: -4,
  halation: 6,
  chromaOffset: 2,
  monochrome: false,
  halftone: 0,
  scanlines: 0,
  vignette: 12,
  lightLeak: 0,
  lightLeakStyle: 'amber',
  gradientMap: 'none',
  dustAndScratches: 0,
  sparkles: 4,
  camcorderOSD: false,
  prismBlur: 0,
  skinSmoothing: 999,
  clarity: 10,
  glowUp: 5,
  faceSlimming: 3,
  blemishRemoval: 999,
  expressionLift: 7,
  beautyBoost: 999,
  ageShift: -999,
  eyeBrightening: 10,
  jawDefinition: 12,
  skinPolish: 15,
  teethWhitening: 8,
  makeupStrength: 5,
  colorKnockout: 'none',
  textureType: 'none',
  textureIntensity: 50,
  artifactRemoval: 999
};

describe('editor snapshot reducer', () => {
  it('normalizes portrait controls when applying snapshots', () => {
    const snapshot = normalizeEditorSnapshot({
      ...createNeutralSnapshot(),
      beautyBoost: 999,
      ageShift: -999,
      artifactRemoval: 999
    });

    expect(snapshot.beautyBoost).toBe(46);
    expect(snapshot.ageShift).toBe(-20);
    expect(snapshot.artifactRemoval).toBe(20);
  });

  it('builds a normalized snapshot from a preset without dropping existing base-only fields', () => {
    const base = { ...createNeutralSnapshot(), activeCamera: 'Standard Matrix' };
    const snapshot = buildSnapshotFromPreset(base, preset);

    expect(snapshot.activeCamera).toBe('Custom Preset');
    expect(snapshot.activeLUT).toBe('clean-luxe');
    expect(snapshot.skinSmoothing).toBe(24);
    expect(snapshot.blemishRemoval).toBe(42);
  });

  it('normalizes legacy preset texture ids before they reach editor state', () => {
    const snapshot = buildSnapshotFromPreset(createNeutralSnapshot(), {
      ...preset,
      textureType: '4k_linen_tablecloth'
    });

    expect(snapshot.textureType).toBe('linen');
  });

  it('reduces reset and apply-preset actions predictably', () => {
    const edited = { ...createNeutralSnapshot(), grain: 80 };
    const applied = reduceEditorSnapshot(edited, { type: 'apply-preset', preset });
    const reset = reduceEditorSnapshot(applied, { type: 'reset' });

    expect(applied.grain).toBe(22);
    expect(reset).toEqual(createNeutralSnapshot());
  });
});
