# FORMAT Premium Preset System

FORMAT presets are typed aesthetic recipes that resolve into the same editor snapshot used by preview and export. The UI does not run a separate preset renderer; selecting a preset writes a deterministic snapshot into the production render stack.

## Registry Contract

Every shipped preset declares:

- stable slug `id`
- display `name`
- visible `category`
- curation metadata: `family`, `tier`, `intensity`, `subjectBias`, `previewTone`
- safety metadata: `skinSafe`, `bestFor`, `avoidFor`, `safetyNotes`
- release metadata: `defaultIntensity`, `compatibleImageTypes`, `recipeVersion`, `exposed`
- effect recipe values for tone, color, portrait finishing, texture, material, print, film, optical, grain, bloom, vignette, and Y2K star behavior where relevant

Custom presets are still local browser snapshots. They use the same render fields, but the curated registry tests only apply to the shipped preset library.

## Intensity Behavior

The preset intensity slider blends between the captured pre-preset editor state and the preset recipe:

- `0` restores the captured base state.
- `25` applies a subtle version of the same recipe.
- `50` applies a balanced version.
- `75` applies the intended strong creator look.
- `100` applies the full stylized recipe.

Changing intensity never changes the preset seed key. Material, film, texture, and print identities stay stable once the preset is active; only their strengths scale.

## Operation Order

The preview and export renderer share this order:

1. base image draw and correction
2. portrait-aware denoise, polish, feature protection, and shape passes
3. preset tone, LUT, HSL, split-tone, and color recipe
4. material, paper, print, film, and texture passes
5. grain, halation, bloom, light leak, and Y2K highlight stars
6. vignette, OSD, histogram/fingerprint, and export transform

Manual controls remain editable after applying a preset because the preset resolves into normal editor state. Selecting a new preset captures the current editor state as the new base. Resetting the active preset returns to the captured pre-preset base.

## Shipped Families

- FORMAT Signature: default one-click commercial creator finishes.
- Portrait + Beauty: identity-safe face and skin-safe looks.
- Film + Camera: analog-style rolloff, grain, halation, and camera response.
- Social + Creator: high-impact creator and profile-photo looks.
- Cinematic: mood, shadow density, and campaign-style grades.
- Product + Brand: clean commercial and ecommerce finishes.
- Graphic + Print: intentional halftone, print, poster, and zine looks.
- Experimental: destructive glitch, horror, thermal, CCTV, and VHS effects hidden from the default view.

Incomplete presets are not exposed. Registry tests require each exposed preset to have metadata and at least five meaningful render effects.
