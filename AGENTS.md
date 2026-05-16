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

<!-- context7 -->
Use the `ctx7` CLI to fetch current documentation whenever the user asks about a library, framework, SDK, API, CLI tool, or cloud service -- even well-known ones like React, Next.js, Prisma, Express, Tailwind, Django, or Spring Boot. This includes API syntax, configuration, version migration, library-specific debugging, setup instructions, and CLI tool usage. Use even when you think you know the answer -- your training data may not reflect recent changes. Prefer this over web search for library docs.

Do not use for: refactoring, writing scripts from scratch, debugging business logic, code review, or general programming concepts.

## Steps

1. Resolve library: `npx ctx7@latest library <name> "<user's question>"` — use the official library name with proper punctuation (e.g., "Next.js" not "nextjs", "Customer.io" not "customerio", "Three.js" not "threejs")
2. Pick the best match (ID format: `/org/project`) by: exact name match, description relevance, code snippet count, source reputation (High/Medium preferred), and benchmark score (higher is better). If results don't look right, try alternate names or queries (e.g., "next.js" not "nextjs", or rephrase the question)
3. Fetch docs: `npx ctx7@latest docs <libraryId> "<user's question>"`
4. Answer using the fetched documentation

You MUST call `library` first to get a valid ID unless the user provides one directly in `/org/project` format. Use the user's full question as the query -- specific and detailed queries return better results than vague single words. Do not run more than 3 commands per question. Do not include sensitive information (API keys, passwords, credentials) in queries.

For version-specific docs, use `/org/project/version` from the `library` output (e.g., `/vercel/next.js/v14.3.0`).

If a command fails with a quota error, inform the user and suggest `npx ctx7@latest login` or setting `CONTEXT7_API_KEY` env var for higher limits. Do not silently fall back to training data.
Run Context7 CLI requests outside Codex's default sandbox. If a Context7 CLI command fails with DNS or network errors such as ENOTFOUND, host resolution failures, or fetch failed, rerun it outside the sandbox instead of retrying inside the sandbox.
<!-- context7 -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
