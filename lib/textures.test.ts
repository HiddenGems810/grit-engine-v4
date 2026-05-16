import { existsSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  TEXTURE_ASSETS,
  getTextureAsset,
  isKnownTextureId,
  normalizeTextureId
} from '@/lib/textures';

describe('texture registry', () => {
  it('resolves legacy and 4k texture ids to local texture ids', () => {
    expect(normalizeTextureId('4k_vintage_paper')).toBe('paper');
    expect(normalizeTextureId('4k_grunge_wall')).toBe('grunge');
    expect(normalizeTextureId('4k_linen_tablecloth')).toBe('linen');
    expect(normalizeTextureId('none')).toBe('none');
  });

  it('keeps every texture preview backed by a local public asset', () => {
    for (const texture of TEXTURE_ASSETS) {
      expect(isKnownTextureId(texture.id)).toBe(true);
      expect(getTextureAsset(texture.id)).toEqual(texture);

      if (texture.localPreviewPath) {
        const assetPath = path.join(process.cwd(), 'public', texture.localPreviewPath);
        expect(existsSync(assetPath), `${texture.id} missing ${texture.localPreviewPath}`).toBe(true);
      }
    }
  });
});
