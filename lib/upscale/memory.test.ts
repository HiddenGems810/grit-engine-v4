import { describe, expect, it } from 'vitest';
import { estimateUpscaleMemoryBytes, validateUpscaleMemoryBudget } from '@/lib/upscale/memory';

describe('upscale memory estimation', () => {
  it('estimates larger memory use as scale increases', () => {
    const base = estimateUpscaleMemoryBytes({ width: 1000, height: 800, scaleFactor: 1 });
    const enlarged = estimateUpscaleMemoryBytes({ width: 1000, height: 800, scaleFactor: 2 });

    expect(enlarged).toBeGreaterThan(base);
  });

  it('blocks requests beyond the configured memory budget', () => {
    const result = validateUpscaleMemoryBudget({
      width: 8000,
      height: 8000,
      scaleFactor: 4,
      limitBytes: 256 * 1024 * 1024
    });

    expect(result.ok).toBe(false);
    expect(result.reason).toMatch(/memory/i);
  });
});
