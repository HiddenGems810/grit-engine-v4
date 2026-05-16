import { describe, expect, it } from 'vitest';
import { smoothStep } from '@/lib/engine/math-utils';

describe('smoothStep', () => {
  it('returns stable endpoints and avoids NaN when edges match', () => {
    expect(smoothStep(0, 10, -5)).toBe(0);
    expect(smoothStep(0, 10, 15)).toBe(1);
    expect(Number.isNaN(smoothStep(1, 1, 1))).toBe(false);
  });
});
