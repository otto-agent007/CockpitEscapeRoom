# TMB2 Acting-Frames Prompt Pack (owner generation)

Recorded 2026-08-15 under plan `plans/0028-sega-punch-intro.md`, Task 5. The canonical
records live in `tmb2-intro-assets.json` → `generationPrompts` (taxonomy
`character-acting`, status `recorded-awaiting-owner-generation`). This page is the
copy-paste view for generating them in ChatGPT Image.

## Why

The SEGA-feel gap that remains after the code-only punch pass is **acting**: the intro
has ~35 unique Pop T drawings for 53 seconds, so characters slide along paths holding
short loops. Genesis-era gags are dozens of unique frames. These packs give each major
beat its own performed clip.

## How to generate

1. Open each pack below. Generate **one image per pose line** in ChatGPT Image,
   1024×1024. Prefix every pose line with the pack's style block (the long paragraph),
   then the pose text.
2. Keep the character identical across a pack's frames (same generation thread helps).
3. Drop the finished images into a folder per pack (any location) and hand them over —
   integration quantizes them through the Pop T animation contract (16-color locked
   palette, 128×128 canonical, bottom-center pivot, baseline 111) and nothing reaches
   runtime without passing it plus the manifest/hash gate.
4. Also still owed from the previous pack: **`runway-day-v1`** (the daylight runway
   plate, prompt already in the ledger). Generating it in the same batch closes that
   gate too.

## Priority 1 — the beats that sell the SEGA feel

- **ident-logo-tap-v1** (7 frames) — Pop T's logo gag in the ident: sprint, skid,
  amazed look-up, tap, wink, thumbs-up. Replaces the startle/victory stand-ins.
- **duffel-struggle-v1** (6) — a real tug performance: anticipation, strain,
  slip, brow-wipe, re-grip.
- **startle-big-take-v1** (5) — the exclaim slam earns a full comic take with the
  cap popping off and caught again.
- **catch-celebrate-v1** (5) — the finale victory: fist hoist, V-arms, heel-click,
  flex, cap-brim tug.

## Priority 2 — polish wave

- **run-cycle-8f-v1** (8) — true 8-drawing sprint cycle.
- **bull-spin-recover-v1** (6) — accordion hit, pinwheel spin, dazed sit, recovery.
- **slide-dust-v1** (5) — full slide arc with pop-up and fist-shake.
- **glide-bank-v1** (6) — banking, scanning, surging, reaching glide vocabulary.
- **key-taunt-plus-v1** (6, key mascot) — nose-thumb, laughter, beckon, salute,
  launch-coil, zip-away.

Tripo stays in reserve; nothing in this pack needs a 3D candidate.
