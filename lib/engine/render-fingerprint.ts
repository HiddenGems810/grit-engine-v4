import type { EngineSnapshot } from '@/lib/editor-config';

export const FORMAT_ENGINE_VERSION = 'format-render-0.4.0-worker-material';

export type RenderFingerprintInput = {
  sourceDimensions: { width: number; height: number };
  renderDimensions: { width: number; height: number };
  snapshot: EngineSnapshot;
  deterministicSeed: number;
  outputData?: Uint8ClampedArray;
};

export type RenderFingerprint = {
  engineVersion: string;
  sourceDimensions: { width: number; height: number };
  renderDimensions: { width: number; height: number };
  settingsHash: string;
  deterministicSeed: number;
  outputHash?: string;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(',')}}`;
};

export const fnv1aHash = (input: string | Uint8ClampedArray): string => {
  let hash = 0x811c9dc5;
  if (typeof input === 'string') {
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  } else {
    for (let i = 0; i < input.length; i += 1) {
      hash ^= input[i];
      hash = Math.imul(hash, 0x01000193) >>> 0;
    }
  }
  return hash.toString(16).padStart(8, '0');
};

export const hashEngineSnapshot = (snapshot: EngineSnapshot) => fnv1aHash(stableStringify(snapshot));

export const createRenderFingerprint = ({
  sourceDimensions,
  renderDimensions,
  snapshot,
  deterministicSeed,
  outputData
}: RenderFingerprintInput): RenderFingerprint => ({
  engineVersion: FORMAT_ENGINE_VERSION,
  sourceDimensions,
  renderDimensions,
  settingsHash: hashEngineSnapshot(snapshot),
  deterministicSeed,
  outputHash: outputData ? fnv1aHash(outputData) : undefined
});
