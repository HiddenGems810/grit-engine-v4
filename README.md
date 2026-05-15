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

## Release posture

- Desktop and tablet are the primary editing surfaces.
- Mobile is an import/review fallback, not the complete control surface.
- Accepted upload formats are JPG, PNG, and WebP, capped at 50 MB and 8192px per side.
- Next.js 16 is used with the Webpack compiler path because the TensorFlow/MediaPipe face landmark stack is not currently compatible with Turbopack static export analysis.

## Notes

- The app currently runs fully client-side for editing and portrait analysis
- Uploaded images stay in-browser during normal editing
- Portrait finishing validation guidance lives in `docs/portrait-finishing-validation.md`
