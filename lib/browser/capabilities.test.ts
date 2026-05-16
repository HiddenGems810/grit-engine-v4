import { describe, expect, it } from 'vitest';
import { validateCanvasCapability } from '@/lib/browser/capabilities';

describe('browser capability guards', () => {
  const capabilities = {
    maxCanvasSide: 8192,
    maxCanvasPixels: 8192 * 8192
  };

  it('accepts images inside the safe canvas budget', () => {
    expect(validateCanvasCapability(4096, 4096, capabilities)).toEqual({ ok: true, reason: null });
  });

  it('rejects images beyond the safe canvas side limit', () => {
    const result = validateCanvasCapability(9000, 2000, capabilities);

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/side limit/i);
  });
});
