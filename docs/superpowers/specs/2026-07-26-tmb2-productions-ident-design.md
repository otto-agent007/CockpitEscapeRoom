# TMB2 Productions Ident

## Goal

Replace the procedurally drawn `TMB2` opening ident with the exact
owner-approved `TMB2logo.png`, retain the existing blue assembly and gold/white
highlight choreography, and add restrained gold `PRODUCTIONS` small caps
centered beneath it.

The player-visible result is a higher-fidelity opening ident without changing
the approved 53.04-second intro clock, Start behavior, accessibility, reduced
motion, spoiler protection, or DC-9 handoff.

## Context

The exact authority is
`art-source/intro/tmb2/owner-approved/TMB2logo.png`, an 811,581-byte,
1659x948 RGB PNG with SHA-256
`673d13b96bc19b35b508630d1d662d16672ac4bb6ad665a7f6b1b7cee992ce17`.
It is byte-identical to `/mnt/2TBHDD/Downloads/TMB2logo.png`.

The current intro:

- uses the established media-clock timeline in `src/game/introAnimation.ts`;
- emits a procedural `logo` draw command in `src/game/introRenderer.ts`;
- draws inferred block glyphs for `TMB2`;
- preserves native input and screen-reader behavior outside the renderer; and
- packages runtime images through
  `public/images/intro/tmb2/tmb2-intro-assets.json`.

## Approved presentation

The existing ident timing remains authoritative:

1. A blue assembly mask reveals the logo.
2. The exact logo artwork resolves over the assembly.
3. A restrained gold/white highlight passes over the completed logo.
4. `PRODUCTIONS` fades in beneath the logo in centered gold small caps.

The word is subordinate to the TMB2 artwork: it must remain smaller, widely
tracked, and visually quiet. It must not alter the approved logo typography or
compete with the Start prompt.

Reduced-motion presentation shows the complete logo and `PRODUCTIONS` treatment
without animated assembly or highlight travel.

## Asset design

A deterministic build step derives runtime assets from the approved source:

- `tmb2-ident-source.png`: a byte-identical runtime fallback copy;
- `tmb2-ident-base.png`: the tightly cropped and stage-sized exact artwork;
- `tmb2-ident-blue-mask.png`: the blue assembly layer;
- `tmb2-ident-highlight-mask.png`: the white/gold highlight layer; and
- `tmb2-productions.png`: deterministic gold small caps on transparency.

The TMB2 layers may crop, resize, and mask the source but must never redraw,
trace, or infer its typography. `PRODUCTIONS` is new subordinate artwork and may
be generated from a deterministic bitmap alphabet so runtime output does not
depend on browser or workstation fonts.

Every runtime asset is hash-bound in the intro manifest with role
`logo-layer`, scene group `ident`, and source/provenance metadata. The asset
builder verifies the approved source hash before generating or copying
anything.

## Runtime design

`src/game/introAnimation.ts` keeps its existing logo visibility,
`buildProgress`, and `highlightOpacity` values. No cue boundary changes.

`src/game/introRenderer.ts` replaces the procedural `logo` command with
manifest-backed `logo-layer` commands:

- blue mask clipped by `buildProgress`;
- exact base artwork blended in during the latter portion of assembly;
- highlight mask drawn with restrained screen blending; and
- productions layer faded in as assembly completes.

The Canvas remains 320x224 with the existing integer nearest-neighbor browser
scaling. Logo bounds and caption placement are authored once in stage
coordinates and must fit at 375, 768, and 1440-pixel viewports without overflow.

## Loading and failure behavior

The logo assets join the opening preload gate because the ident is the first
scene. Existing retry and silent-accessibility behavior remains unchanged.

If a derived layer cannot decode, the renderer uses the byte-identical runtime
source image as the visual fallback. It must never fall back to procedural TMB2
glyphs. A total image-load failure retains the existing accessible retry path
and never advances into a partially loaded intro.

## Accessibility

- Existing scene summaries remain the semantic description of the ident.
- No text essential to starting the game is embedded only in the image.
- The native Start, sound, and retry controls are unchanged.
- Reduced motion resolves directly to the complete ident treatment.
- `PRODUCTIONS` is decorative branding and does not add another focus target.

## Testing

Test-first coverage will prove:

- the approved source hash is mandatory;
- all five runtime files are manifest-backed logo layers;
- procedural TMB2 glyph commands are absent;
- the renderer emits blue, base, highlight, and productions layers at the
  intended progress thresholds;
- fallback uses the exact source asset;
- reduced motion emits the completed ident;
- current intro cue boundaries and input behavior remain unchanged;
- `npm run assets:check`, `npm run check`, and the focused/full browser suites
  pass; and
- actual browser captures at 375, 768, and 1440 pixels show a centered,
  readable ident without overflow or console/request failures.

## Scope

Included: the approved logo source, deterministic ident derivatives,
`PRODUCTIONS`, manifest/build contracts, renderer integration, tests, browser
evidence, and reports.

Excluded: changing the 53.04-second soundtrack or cue timings, revising later
intro scenes, importing the unfinished production-polish checkpoint wholesale,
changing the DC-9 handoff, or revealing the Model Y reward early.
