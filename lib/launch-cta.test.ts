import { describe, expect, it } from 'vitest';
import { resolveFormatLaunchCta } from './launch-cta';

describe('FORMAT launch CTA resolver', () => {
  it('prioritizes a payment URL over beta and support fallbacks', () => {
    expect(resolveFormatLaunchCta({
      paymentUrl: 'https://pay.example/format',
      betaUrl: 'https://beta.example/format',
      supportEmail: 'hello@example.com'
    })).toEqual({
      href: 'https://pay.example/format',
      label: 'Get FORMAT Pro',
      external: true
    });
  });

  it('uses the beta URL when no payment URL is configured', () => {
    expect(resolveFormatLaunchCta({
      betaUrl: 'https://beta.example/format'
    })).toEqual({
      href: 'https://beta.example/format',
      label: 'Join Paid Beta',
      external: true
    });
  });

  it('falls back to a support email without inventing payment behavior', () => {
    expect(resolveFormatLaunchCta({
      supportEmail: 'hello@example.com'
    })).toEqual({
      href: 'mailto:hello@example.com?subject=FORMAT%20Paid%20Beta%20Access',
      label: 'Join Paid Beta',
      external: false
    });
  });

  it('returns null when launch access has not been configured', () => {
    expect(resolveFormatLaunchCta({})).toBeNull();
  });
});
