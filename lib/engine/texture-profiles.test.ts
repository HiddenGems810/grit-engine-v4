import { describe, expect, it } from 'vitest';
import { TEXTURE_ASSETS } from '@/lib/textures';
import { getTextureRenderProfile, listTextureRenderProfiles } from './texture-profiles';

describe('texture render profiles', () => {
  it('backs every visible texture option with a seamless high-resolution procedural profile', () => {
    for (const texture of TEXTURE_ASSETS) {
      const profile = getTextureRenderProfile(texture.id);

      expect(profile, `${texture.id} has no render profile`).toBeTruthy();
      expect(profile?.tileSize, `${texture.id} tile is too small`).toBeGreaterThanOrEqual(512);
      expect(profile?.seamless, `${texture.id} must tile seamlessly`).toBe(true);
      expect(profile?.visualScale, `${texture.id} needs density scaling`).toBeGreaterThan(0);
      expect(profile?.effectType, `${texture.id} must declare its physical effect`).not.toBe('placeholder');
    }
  });

  it('keeps texture profiles distinct enough to avoid duplicate placeholder surfaces', () => {
    const signatures = new Set(listTextureRenderProfiles().map((profile) => [
      profile.id,
      profile.family,
      profile.blendMode,
      profile.visualScale,
      profile.effectType
    ].join(':')));

    expect(signatures.size).toBe(listTextureRenderProfiles().length);
  });
});
