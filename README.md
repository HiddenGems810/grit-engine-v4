# FORMAT by TAGDesigns

FORMAT is the anti-AI-slop finishing engine for creator visuals: premium browser-native effects, local-first editing, portrait-safe retouching, material/print finishes, and export-ready image treatments without Photoshop or cloud-uploading your work.

## What it does

- Applies commercial-style preset stacks for portraits, lifestyle, print, cinematic, and social content
- Supports portrait finishing controls for skin, eyes, jaw, age, makeup, and polish
- Includes optional upscale preview/export controls for higher-resolution output
- Includes a Premium Effects Lab with original procedural Disposable Flash Film rendering
- Stores custom presets locally in the browser
- Keeps imported images in-browser during normal editing and export

## Money-ready V1 scope

V1 is focused on one paid-beta path: a user lands on FORMAT, understands the product in seconds, imports an image, applies premium presets/effects or Anti-AI Slop Repair, exports a high-quality result, and follows a configured purchase or paid-beta CTA.

The public entry surface now includes:

- A direct `Start Editing` import CTA.
- A paid access CTA driven by `NEXT_PUBLIC_FORMAT_PAYMENT_URL`, `NEXT_PUBLIC_FORMAT_BETA_URL`, or `NEXT_PUBLIC_FORMAT_SUPPORT_EMAIL`.
- Trust copy explaining local-first editing, procedural effects, truthful export reporting, and browser limitations.

FORMAT does not implement payment processing inside this repo. Configure the CTA to point at the live checkout, paid-beta, waitlist, or support flow before launch.

## Launch CTA environment variables

Only `NEXT_PUBLIC_` variables are used because the landing CTA renders in the browser. These are public build-time values, not secrets.

```txt
NEXT_PUBLIC_FORMAT_PAYMENT_URL=https://example.com/checkout
NEXT_PUBLIC_FORMAT_BETA_URL=https://example.com/paid-beta
NEXT_PUBLIC_FORMAT_SUPPORT_EMAIL=hello@example.com
```

Priority order: payment URL, beta URL, support email `mailto:` fallback. If none are configured, FORMAT shows a launch configuration notice instead of pretending payment exists.

## Run locally

1. Install dependencies with `npm install`
2. Start the app with `npm run dev -- --port 3001`
3. Open `http://localhost:3001`

## Available scripts

- `npm run dev` - run the local development server using the Webpack compiler path
- `npm run build` - create a production build
- `npm run start` - run the production build locally
- `npm run lint` - run ESLint
- `npm run test` - run Vitest unit coverage
- `npm run test:e2e` - rebuild and run Playwright smoke coverage against the standalone server
- `npm run prepare:e2e` - copy `public` and `.next/static` into the standalone output before E2E
- `npm run start:e2e` - run `.next/standalone/server.js` on `127.0.0.1:3101` for Playwright

## Release checklist

Run these before tagging or deploying:

1. `npm run lint`
2. `npm run build`
3. `npm run test`
4. `npm run test:e2e`

Manual QA:

- Import JPG, PNG, and WebP sources under the 50 MB and 8192px-per-side limits.
- Confirm export buttons are disabled before import and enabled after import.
- Render PNG and JPG outputs with upscale disabled and enabled.
- Test one portrait image with face controls and one non-face image with portrait fallback.
- Apply Anti-AI Slop Repair, FORMAT Instant Flash, and at least one Signature premium preset.
- Verify the launch CTA points to the configured payment/beta/support destination.
- Verify preset search, custom preset save/delete, history undo/redo, and reset stack.
- Check desktop, tablet-width, and mobile fallback layouts.
- Confirm no browser console errors appear during import, slider movement, upscale preview, or export.

## Release posture

- Desktop and tablet are the primary editing surfaces.
- Mobile is an import/review fallback, not the complete control surface.
- Accepted upload formats are JPG, PNG, and WebP, capped at 50 MB and 8192px per side.
- Next.js 16 is used with the Webpack compiler path because the TensorFlow/MediaPipe face landmark stack is not currently compatible with Turbopack static export analysis.
- Textures are approved local/procedural assets. Do not reintroduce remote texture loading for export-critical rendering.

## Preset Philosophy

FORMAT presets are adaptive finishing stacks. The Signature family is designed for one-click creator use, with commercial contrast, believable color, and restrained retouching as the default experience. Portrait-safe presets prioritize identity, melanated skin preservation, facial structure, eyes, hair, brows, beards, tattoos, and believable skin texture. Graphic and Experimental presets are intentionally destructive, clearly labeled, and separated from default premium-safe looks. Editing and preset adaptation remain client-side.

Preset intensity blends the selected recipe against the captured pre-preset editor state, so `0` removes the preset, `50` gives a balanced finish, and `100` applies the full look without changing the deterministic seed. The implementation details and render order are documented in `docs/premium-preset-system.md`.

## Material Finish Philosophy

FORMAT material finishes are procedural/local render passes, not remote stock texture hotlinks. Film, print, paper, dither, and optical finishes are designed to respond to luminance, edges, and preset intent so they feel physically integrated instead of pasted over the image. Portrait-safe material settings keep face protection on by default; product-oriented settings prioritize edge clarity and believable color. Graphic and Experimental material finishes can be destructive, but they are labeled and kept out of the default safe preset experience.

## Premium Effects Lab

The Premium Effects Lab ships with FORMAT-native Disposable Flash Film effects. These are procedural local render passes for hard flash, cyan shadow cast, warm leaks, film grain, dust/scratches, plastic lens softness, chromatic fringing, vignette, configurable date stamps, and in-frame or expanded-print borders.

The shipped one-click effects are original FORMAT recipes, not copied overlays or remote assets. Planned effect families such as Risograph, Xerox, Prism, Reeded Glass, Chrome, and Letterpress are typed in the registry for future architecture but remain disabled until real renderers, tests, and visual QA ship.

## Browser limitations

- WebGL is required for TensorFlow face landmark detection. When WebGL is unavailable, FORMAT keeps the standard image controls available and disables face-aware detection.
- Web Workers are used for larger upscale jobs when available. If workers are unavailable or time out, the app falls back to the synchronous upscale path.
- Very large images and high-scale exports can exceed browser canvas memory. FORMAT estimates memory before preview/export upscale and falls back to the base render when the budget is unsafe.
- Recommended source images: 2000-5000px on the longest edge for daily use, 6000-8192px only on modern desktop hardware.

## Troubleshooting

- If portrait detection never becomes ready, verify the browser supports WebGL and hardware acceleration is enabled.
- If upscale preview falls back, lower the upscale factor or use a smaller source image.
- If export fails, disable upscale first, then clear heavy texture/effect settings and retry.
- If local development behaves differently from production, rebuild with `npm run build`; Playwright runs against `.next/standalone/server.js` to match the configured standalone output. Do not switch to Turbopack unless TensorFlow compatibility has been verified.

## Notes

- The app currently runs fully client-side for editing and portrait analysis
- Uploaded images stay in-browser during normal editing
- Portrait finishing validation guidance lives in `docs/portrait-finishing-validation.md`
