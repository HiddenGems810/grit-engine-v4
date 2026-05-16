# FORMAT by TAGDesigns

Professional browser-based image finishing workspace built with Next.js.

## What it does

- Applies commercial-style preset stacks for portraits, lifestyle, print, cinematic, and social content
- Supports portrait finishing controls for skin, eyes, jaw, age, makeup, and polish
- Includes optional upscale preview/export controls for higher-resolution output
- Stores custom presets locally in the browser
- Keeps imported images in-browser during normal editing and export

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
