# Preset Texture Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make FORMAT presets more reliable and professionally coherent by validating every preset texture reference and routing legacy texture IDs through a local texture registry.

**Architecture:** `lib/textures.ts` becomes the source of truth for texture IDs, aliases, and local preview assets. Preset snapshot application normalizes texture IDs before they reach UI controls or the render engine. Tests enforce that every preset texture resolves to a known local/procedural texture and every preview asset exists.

**Tech Stack:** Next.js, TypeScript, Vitest, Canvas 2D procedural textures.

---

### Task 1: Texture Registry Contract

**Files:**
- Modify: `lib/textures.ts`
- Modify: `lib/engine/texture-engine.ts`
- Test: `lib/textures.test.ts`
- Test: `lib/presets.test.ts`

- [ ] **Step 1: Write failing tests**

Add tests that import `normalizeTextureId`, `isKnownTextureId`, `TEXTURE_ASSETS`, and `PRESETS`. Assert all texture preview paths exist and all preset texture IDs normalize to either `none` or a known local texture.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm run test -- lib/textures.test.ts lib/presets.test.ts`
Expected: FAIL because texture registry helpers do not exist.

- [ ] **Step 3: Implement registry helpers**

Add `TEXTURE_ALIASES`, `normalizeTextureId`, `isKnownTextureId`, and `getTextureAsset`.

- [ ] **Step 4: Wire renderer to registry**

Use `normalizeTextureId()` inside `generateTextureTile()` before drawing.

- [ ] **Step 5: Run tests and confirm pass**

Run: `npm run test -- lib/textures.test.ts lib/presets.test.ts`
Expected: PASS.

### Task 2: Preset Snapshot Texture Normalization

**Files:**
- Modify: `lib/editor-state.ts`
- Test: `lib/editor-state.test.ts`

- [ ] **Step 1: Add failing test**

Add a test showing `4k_linen_tablecloth` becomes `linen` when a preset is applied.

- [ ] **Step 2: Run test and confirm failure**

Run: `npm run test -- lib/editor-state.test.ts`
Expected: FAIL until snapshot normalization uses the texture registry.

- [ ] **Step 3: Normalize preset texture IDs**

Use `normalizeTextureId()` in `buildSnapshotFromPreset()` and `normalizeEditorSnapshot()`.

- [ ] **Step 4: Run tests and confirm pass**

Run: `npm run test -- lib/editor-state.test.ts`
Expected: PASS.

### Task 3: Release Verification

**Files:**
- No code edits unless a verification failure requires a scoped fix.

- [ ] **Step 1: Run full validation**

Run:
`npm run lint`
`npm run build`
`npm run test`
`npm run test:e2e`
`npm audit --omit=dev`

- [ ] **Step 2: Report exact results**

Report pass/fail status, remaining risks, and exact files changed.
