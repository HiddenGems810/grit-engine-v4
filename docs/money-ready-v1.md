# FORMAT Money-Ready V1

FORMAT V1 is scoped to a focused, monetizable product path:

1. A creator understands the product quickly.
2. They import a JPG, PNG, or WebP locally in the browser.
3. They apply premium presets, Anti-AI Slop Repair, Disposable Flash Film, portrait finishing, or material finishes.
4. They export JPEG or PNG output with truthful quality and dimension reporting.
5. They click a configured paid-beta, purchase, waitlist, or support CTA.

## Positioning

FORMAT is the anti-AI-slop finishing engine for creator visuals. It is not a generic photo editor. The product is built around local-first finishing, procedural premium effects, portrait-safe retouching, material/print realism, and export-ready creator workflows.

## Monetization Surface

The landing panel uses public build-time environment variables:

- `NEXT_PUBLIC_FORMAT_PAYMENT_URL`
- `NEXT_PUBLIC_FORMAT_BETA_URL`
- `NEXT_PUBLIC_FORMAT_SUPPORT_EMAIL`

Priority order is payment URL, beta URL, then support email as a `mailto:` fallback. If none are configured, the app shows a configuration notice instead of a fake checkout.

No payment credentials, server-side purchase state, auth, or remote storage are implemented in this repo.

## Trust Copy Requirements

The V1 surface must communicate:

- Normal editing and export stay in-browser.
- Premium effects are procedural/local render passes, not copied remote overlays.
- Disposable Flash Film is deterministic for the same source, settings, and seed.
- Future effect families stay hidden until their renderers, tests, and QA ship.
- Browser canvas memory can limit very large exports, and FORMAT reports fallbacks honestly.

## V1 QA Gate

Run before declaring paid-beta readiness:

```bash
npm run lint
npm run build
npm run test
npm run test:e2e
```

Manual smoke:

- Import JPG, PNG, and WebP.
- Apply FORMAT Instant Flash.
- Apply Anti-AI Slop Repair.
- Apply a Signature premium preset and change intensity.
- Export JPEG and PNG.
- Repeat export with `?disableWorkers=1`.
- Save, reload, restore, and export a custom preset.
- Verify the launch CTA points to the configured payment, beta, or support destination.

## Known V1 Boundaries

- FORMAT is ready for paid beta only when the CTA destination is configured in the deployment environment.
- Large 4096px Disposable Flash exports are credible but still expensive; Worker buffer kernels are the next performance refactor.
- Mobile is an import/review fallback, not the full creative-tool control surface.
