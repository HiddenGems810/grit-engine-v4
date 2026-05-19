import { describe, expect, it } from 'vitest';
import { PORTRAIT_CONTROL_DEFINITIONS, PORTRAIT_CONTROL_SUPPORT } from './editor-config';

describe('portrait control support metadata', () => {
  it('declares real render support and requirements for every compact portrait control', () => {
    for (const control of PORTRAIT_CONTROL_DEFINITIONS) {
      const support = PORTRAIT_CONTROL_SUPPORT[control.key];

      expect(support, `${control.key} missing support metadata`).toBeTruthy();
      expect(support.supported, `${control.key} must not appear functional unless supported`).toBe(true);
      expect(support.requiresFaceGuide, `${control.key} must be face-gated`).toBe(true);
      expect(support.renderPasses.length, `${control.key} needs a real render pass mapping`).toBeGreaterThan(0);
    }
  });
});
