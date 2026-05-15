/**
 * Grit Engine v4 — Math Utilities
 *
 * Pure, stateless math helpers used across the render pipeline.
 * Extracted from page.tsx to allow sharing between render passes,
 * web workers, and test harnesses.
 */

/** Clamp a number between min and max (inclusive). */
export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Create a deterministic PRNG from a seed.
 * Uses a simple LCG (Linear Congruential Generator).
 * Returns a function that produces floats in [0, 1).
 */
export const createSeededRandom = (seed: number): (() => number) => {
  let current = seed >>> 0;
  return () => {
    current = (current * 1664525 + 1013904223) >>> 0;
    return current / 0x100000000;
  };
};

/**
 * Build a deterministic seed from a set of numeric values.
 * Uses FNV-1a hash variant to produce stable, collision-resistant seeds.
 */
export const buildDeterministicSeed = (...values: number[]): number => {
  let seed = 2166136261;
  for (const value of values) {
    seed ^= Math.round(value * 1000);
    seed = Math.imul(seed, 16777619);
  }
  return seed >>> 0;
};
