# PROJECT AGENTS.md

Follow the global Codex rules, then apply these project-specific rules.

## Project Context

Project: FORMAT by TAGDesigns
Purpose: Browser-based image finishing workspace for portraits, social graphics, cinematic looks, print/halftone effects, textures, and raster export.
Primary audience: Creators, designers, social content operators, and brand/portrait editors who need fast stylized output.
Primary conversion action: Import an image and render a finished output.
Secondary conversion action: Save reusable specification presets.
Monetization model: Not implemented in this repo.
Deployment target: Next.js standalone build.
Production URL: Not configured.
Staging URL: Local development at `http://localhost:3001/` during QA.

## Stack

Frontend: Next.js App Router, React, TypeScript, Tailwind CSS
Backend: None currently
Database: None currently
Auth: None currently
Payments: None currently
Hosting: Next.js standalone compatible
Analytics: None currently
Package manager: npm

## Commands

Install: `npm install`
Dev: `npm run dev -- --port 3001`
Lint: `npm run lint`
Build: `npm run build`
Start: `npm run start`

## Important Paths

Routes: `app/`
Primary workspace: `app/page.tsx`
Components: `components/`
Engine logic: `lib/engine/`
Upscale logic: `lib/upscale/`
Preset data: `lib/presets.ts`
Shared editor config: `lib/editor-config.ts`
Docs: `docs/`
Env example: `.env.example`

## Non-Negotiables

- Preserve the core FORMAT concept: a professional desktop-first image finishing workspace.
- Keep uploaded images in-browser unless a future feature explicitly adds server processing and updates privacy documentation.
- Do not add auth, payments, tracking, remote storage, or server upload behavior without documenting privacy/security implications.
- Validate accepted upload formats and size limits before rendering.
- Keep export failures visible to the user.
- Run `npm run lint` and `npm run build` before claiming release readiness.

## UX Direction

Visual standard: Dark professional creative-tool chrome, dense but readable controls, amber accent, minimal marketing language.
Primary surface: Desktop/tablet editor with sidebars and canvas.
Mobile: Import/review fallback, not the full editing control surface.
Accessibility: Keyboard-accessible controls, visible focus states, readable labels, no hidden critical actions.

## Release Notes

- Next.js 16 is configured to build with `--webpack` because the current TensorFlow/MediaPipe face landmark package is incompatible with Turbopack static export analysis.
- `npm audit` may report a moderate PostCSS advisory nested inside Next. Do not run `npm audit fix --force` if it proposes downgrading Next.
