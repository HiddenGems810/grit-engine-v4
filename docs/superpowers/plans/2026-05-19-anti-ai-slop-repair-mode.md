# Anti-AI Slop Repair Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote Anti-AI Slop Repair into a top-level, typed creator workflow that maps to the real render/export stack.

**Architecture:** Add a pure repair-profile helper that converts named repair controls into an `EngineSnapshot`. Keep React components presentational, and let `app/page.tsx` own mode state, reset semantics, and history. The render/export path remains unchanged because the mode writes the same snapshot fields used by preview and export.

**Tech Stack:** Next.js App Router, React client components, TypeScript, Vitest, Playwright.

---

### Task 1: Typed Repair Engine

**Files:**
- Create: `lib/anti-ai-repair.ts`
- Test: `lib/anti-ai-repair.test.ts`

- [x] Add `AntiAiRepairModeId`, `AntiAiRepairSettings`, profile defaults, clamping, and `buildAntiAiRepairSnapshot`.
- [x] Verify the helper preserves face identity controls, enables portrait/material protection, and creates physical grain/lens/material output.

### Task 2: UI Surface

**Files:**
- Create: `components/anti-ai-repair-panel.tsx`
- Modify: `app/page.tsx`
- Modify: `components/mobile-control-dock.tsx`

- [x] Add a top-level desktop panel above the histogram.
- [x] Add a mobile quick action section.
- [x] Keep the old Face & Airbrush section focused on portrait controls instead of duplicate flagship buttons.

### Task 3: State And Reset Semantics

**Files:**
- Modify: `app/page.tsx`

- [x] Capture the pre-mode snapshot before applying repair.
- [x] Let tuning sliders rebuild from the captured base snapshot.
- [x] Reset mode back to the captured base.
- [x] Clear preset state when repair mode takes over, and clear repair state when a preset takes over.

### Task 4: Release Verification

**Files:**
- Modify: `tests/e2e/smoke.spec.ts`

- [x] Add an E2E flow that imports an image, applies Anti-AI Slop Repair, tunes controls, and exports.
- [x] Run `npm run lint`, `npm run build`, `npm run test`, and `npm run test:e2e`.
