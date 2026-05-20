import { describe, expect, it } from 'vitest';
import { createNeutralSnapshot } from '@/lib/editor-config';
import { createRenderFingerprint, fnv1aHash, hashEngineSnapshot } from './render-fingerprint';

describe('render fingerprinting', () => {
  it('creates stable settings and output hashes for identical input', () => {
    const snapshot = { ...createNeutralSnapshot(), saturation: 108, materialProfile: 'fine-35mm-grain' };
    const output = new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]);
    const first = createRenderFingerprint({
      sourceDimensions: { width: 100, height: 80 },
      renderDimensions: { width: 50, height: 40 },
      snapshot,
      deterministicSeed: 123,
      outputData: output
    });
    const second = createRenderFingerprint({
      sourceDimensions: { width: 100, height: 80 },
      renderDimensions: { width: 50, height: 40 },
      snapshot,
      deterministicSeed: 123,
      outputData: new Uint8ClampedArray(output)
    });

    expect(first).toEqual(second);
    expect(first.settingsHash).toBe(hashEngineSnapshot(snapshot));
    expect(first.outputHash).toBe(fnv1aHash(output));
  });

  it('includes effect-relevant disposable flash fields in the settings hash', () => {
    const base = createNeutralSnapshot();
    const expandedFrame = {
      ...base,
      effectFamily: 'disposable-flash-film' as const,
      effectPreset: 'custom-disposable-flash',
      effectIntensity: 100,
      disposableFlashStrength: 80,
      disposableStampMode: 'custom' as const,
      disposableCustomDate: '2026-05-19',
      disposableFrameMode: 'expanded-print' as const
    };

    expect(hashEngineSnapshot(expandedFrame)).not.toBe(hashEngineSnapshot(base));
    expect(hashEngineSnapshot({
      ...expandedFrame,
      disposableFrameMode: 'in-frame'
    })).not.toBe(hashEngineSnapshot(expandedFrame));
  });
});
