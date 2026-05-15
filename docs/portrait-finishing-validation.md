# Portrait Finishing Validation Matrix

Use these checks when validating portrait finishing changes on real images.

## Pass / fail rules

- Pass only if the result looks expensive before it looks edited.
- Fail if likeness shifts, facial geometry warps, or skin looks waxy.
- Fail if lashes, brows, baby hairs, hairlines, jewelry, or eye detail smear or halo.
- Fail if skin tone drifts, especially on melanated skin.
- Fail if teeth, sclera, or makeup effects look synthetic.

## Required scenarios

1. Front camera selfie in daylight
2. Studio beauty portrait with clean lighting
3. Low-light phone selfie with visible compression noise
4. Makeup-heavy beauty image
5. Male grooming portrait
6. Melanated skin portrait in both soft and directional light

## What to inspect

- Identity preservation: eye shape, nose, lips, jaw, smile, and overall likeness stay intact.
- Skin finish: temporary blemishes soften, but pores and natural texture remain visible.
- Feature protection: lashes, brows, edges, baby hairs, and jewelry stay sharp.
- Beauty controls: Makeup Pop, Eye Brightening, Teeth Whitening, Glow Accent, and Beauty Boost enhance existing features only.
- Structural controls: Face Slimming, Jaw Definition, Expression Lift, and Age Shift remain subtle and believable.
- Lens stack balance: denoise, softening, clarity, blur, and glow avoid halos, haze, muddy shadows, and oversharpened pores.

## Slider isolation contract

- Skin Polish: balances micro texture only; no shape change, highlight inflation, or pore wipeout.
- Beauty Boost: subtle presentation refinement only; no age, gender, or structure drift.
- Glow Accent: adds controlled high-point radiance only; no global exposure shift.
- Blemish Removal: removes temporary distractions only; no blanket freckle or beauty-mark deletion.
- Face Slimming: narrows side contour only; no eye, nose, mouth, or smile distortion.
- Expression Lift: adds slight positive energy only; no generated smile or cheek inflation.
- Age Shift: adjusts fine-line and maturity cues only; no bone-structure rewriting.
- Eye Brightening: refreshes visible eye clarity only; no fake whites, halos, or size changes.
- Jaw Definition: improves jaw-to-neck separation only; no cutout shadows or chin reshaping.
- Teeth Whitening: neutralizes yellow cast in visible teeth only; no blue-white glow.
- Makeup Pop: amplifies existing makeup visibility only; no synthetic makeup creation.

## Preset intent targets

- Editorial Model Clean: premium natural polish
- Luxury Beauty Reel: glam but believable
- Men's Groomed Camera: clean and sharp without feminizing
- Gym Selfie Sculpt: crisp, healthy, defined, not over-softened
