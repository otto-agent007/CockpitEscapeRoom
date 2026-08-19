# Scramble intro asset pack — plan 0031

Status 2026-08-18: design gate passed on the greybox animatic
(`preview-renders/tmb2-intro-overhaul/intro-0031-animatic-greybox.mp4`). This pack enumerates
every generated asset the Scramble intro needs, with its prompt brief, target size, and pipeline
route. Composition truth is the animatic: every asset lists the animatic frame that is passed to
the generator as its composition reference.

## Route

- **Generator:** Codex CLI built-in `image_gen` on the ChatGPT plan — never the OpenAI API, never
  `scripts/image_gen.py`, never with `OPENAI_API_KEY` set (see project memory: that silently
  switches billing). Invocation:
  `codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write -i "<refs>" - < prompt.txt`
- **Batching:** image turns burn plan allowance 3–5× faster than text on a rolling 5-hour window.
  Generate wave by wave (S0 → S1 → S2 → S3), never in one sitting.
- **Storage:** `art-source/intro/tmb2/scramble/{refs,prompts,generated,normalised}/`. Deployable
  copies go to `public/images/intro/tmb2/scramble/` only at integration (Task 4), with
  `npm run assets:check` after every manifest change.

## Global rules (every prompt inherits these)

1. **Flat cel-shaded, hard edges.** At most three flat shades per material, no gradients, no
   specular highlights, no fabric texture, no noise/dither/grain. Proven route from the v3 Pop T
   work — flat regions survive the downsample; painterly detail becomes speckle.
2. **NO TEXT of any kind in generated art.** No letters, numbers, logos, placards, instrument
   legends. Models garble type; every label (the CAPT. POP T nameplate, any placard) is drawn by
   the runtime in the bitmap style, or omitted.
3. **Night palette** (from the approved animatic): near-black `#0A0F22`, hangar blue `#141A2E`,
   panel navy `#181E36`, steel `#323E60`, off-white `#FFFDF0`, gold `#F5C424`, amber `#FFB020`,
   sky-blue accent `#75C4FF`, warm skin `#F8AC75`. Character colours follow the v3 Pop T palette
   when he appears.
4. **DC-9 accuracy** wherever the aircraft appears: T-tail (horizontal stabiliser on top of the
   fin), two slim cigar-shaped low-bypass engine nacelles mounted on the rear fuselage beside the
   tail, clean wing with NO underwing engines, narrow tubular fuselage, rounded nose. On the
   ground the aircraft STANDS ON ITS LANDING GEAR — twin-wheel nose strut below the cockpit, main
   gear under the wing root, visible gap between belly and ground (owner catch 2026-08-18: the
   first Northwest plate floated gearless). Era-correct round analog instruments in cockpit
   inserts — no glass-cockpit screens. Never any A320 detail.
5. **Livery (owner direction 2026-08-18): Northwest.** Every aircraft shot wears the classic
   Northwest look: light warm-grey upper fuselage over white lower fuselage split cleanly at the
   window line, an all-RED vertical tail fin carrying a white circular badge with a simple grey
   compass wedge pointing up-and-left, natural-metal/grey nacelles. Signal red `#C8102E`, warm
   grey `#B9BCC0` join the palette. NO airline titles or lettering — the red tail and compass
   disc carry the identity (generated type garbles, and titles would smear at stage scale).
6. **Full-frame assets** (plates and cards) are generated at 1536×1024, centre-cropped to 10:7,
   and BOX-reduced to exactly **320×224**; the runtime draws them 1:1 on the stage. This retires
   the old point-sample-a-1586×992-painting route and its aliasing noise.
7. **Sprites** are generated on a flat pure-magenta `#FF00FF` field and processed by the proven
   chroma-key → despill → downsample chain to their exact on-stage size, blitted 1:1
   (whole-number scales only, per the v3 contract and plan 0030).
8. Composition reference: the listed animatic frame (rendered by
   `tools/design/intro-0031-animatic.py`), passed via `-i`. The prompt states that the reference
   is a rough placeholder layout to follow for framing only, not for style.
9. Two regeneration attempts per asset, then flag it here and move on.

## Waves

### Wave S0 — style anchors (generate first, owner look-gate before S1–S3)

| id | type | beat | animatic ref (t) | notes |
|---|---|---|---|---|
| `plate-hangar-reveal` | plate 320×224 | 13.056 reveal | 13.83 | The DC-9 side profile under banks of ceiling floodlights, small backlit figure at left. Defines the scene style. The **dark pre-reveal variant is derived in post** (darken + mask), not generated. |
| `card-flight-case` | card 320×224 | 10.416 still | 10.58 | The captain's flight case on a bench under one light pool, latches open, blank brass nameplate (runtime draws the text). Defines the card style. |

### Wave S1 — plates (5 generations)

| id | beat | animatic ref | notes |
|---|---|---|---|
| `plate-doorway` | 26.0–30.48 doors | 27.5 | View through the hangar doorway: bright apron light shaft, DC-9 dark beyond. Door leaves are NOT in the plate — they slide as separate layers. |
| `strip-door-leaf` | 26.0–30.48 | 27.5 | One industrial hangar-door leaf as a vertical strip (tileable), drawn twice and slid apart by the runtime. |
| `plate-walk-tarmac` | 31.5–35.64 walk | 33.5 | Night apron, DC-9 nose and forward fuselage looming from the right, walk lane across the foreground, hangar glow behind. |
| `plate-runway-lineup` | 42.84–49.7 | 43.5 | Runway ahead to the horizon at night, static environment only — centreline dashes, edge lights, streaks, strobes are runtime FX (proven look in the animatic). |
| `plate-night-sky` | 47.5–53 | 50.0 | Starfield with faint horizon glow for the jet pass, title, and collapse. Contrail and rays are runtime FX. |

### Wave S2 — still cards (13 generations + 4 delta frames)

| id | beat | animatic ref | frames | notes |
|---|---|---|---|---|
| `card-boots` | 7.512 | 7.58 | 1 | Boots hitting wet tarmac, low close-up. |
| `card-coffee` | 8.976 | 9.17 | 1 | Coffee mug set on steel table, steam as flat shapes (runtime may add wisps). |
| `card-flight-case-shut` | 11.856 | 12.00 | 1 (delta of S0 card) | Same framing, latches closed. |
| `card-gloves` | 14.544 | 14.67 | 2 | Open fingers → snapped fists, same framing. |
| `card-stripes` | 16.704 | 16.92 | 1 | Epaulette with four gold stripes; runtime does the reveal wipe + shine. |
| `card-harness` | 19.368 | 19.50 | 1 | Harness X-straps and buckle over the white shirt; runtime ticks. |
| `card-wings` | 21.528 | 21.67 | 1 | The gold wings badge, close; runtime sparkles. |
| `card-cap-flip` | 24.552 | 24.67 | 2 | Cap mid-air → cap caught on the hand, same framing. |
| `card-shades` | 30.48 | 30.58 | 1 | Aviators just seated, lens band; runtime draws the streak. |
| `card-engine-nacelle` | 35.64 | 36.00 | 1 + 2 fan frames | Slim rear-mount low-bypass nacelle, intake facing, visible spinner; two fan-blur frames for the spool flicker. |
| `card-instruments` | 38.52 | 38.67 | 2 | DC-9-era round-dial panel band: frame A dials UNLIT and legend-free, frame B the same panel ALIVE (lit faces, needles, green/amber annunciators). The runtime wipes A→B left-to-right on the beat instead of drawing its own glow. |
| `card-photo` | 39.96 | 40.08 | 1 | Photo clipped to the glareshield: an adult and a child, faces simple and generic; gold clip. |
| `card-throttles` | 41.4 | 41.58 | 2 | DC-9 centre-pedestal levers; hand above → hand settled, same framing. |

### Wave S3 — sprites (magenta chroma route, exact on-stage sizes)

| id | beat | on-stage size | frames | notes |
|---|---|---|---|---|
| `spr-popt-walk` | 31.5–35.64 | 34 px tall | 6 walk cycle | Three-quarter back view, uniform colours reading against the dark apron. |
| `spr-popt-backlit` | 26.0–30.48 | 64 px tall | 1 | Standing silhouette, near-black against the door light. |
| `spr-popt-reveal` | — | — | 0 | **Dropped 2026-08-18**: the reveal plate already carries its painted figure, and a static figure in a static 1.5 s shot needs no sprite (the baked-in sin was interactive objects, not set dressing). |
| `spr-dc9-runway` | 42.84–47.5 | 52 px wide | 1 | Tail-on silhouette holding on the centreline; beacon/strobes are runtime FX. |
| `spr-dc9-liftoff` | 47.496 | 3 sizes (far/mid/near) | 1 generation | Belly-quarter view, generated once at 1024 and normalised to three pre-rendered widths (80/160/320) swapped during the 0.5 s sweep so sprite scales stay whole. |

Running total: 2 (S0) + 5 (S1) + 17 (S2) + 12 (S3) ≈ 36 generations. The retired chase needed 55
acting frames for Pop T alone before counting its plates.

## Prompt construction

Copy `art-source/intro/tmb2/scramble/prompts/plate-hangar-reveal.txt` (Wave S0 anchor) as the
template: it carries the built-in-tool constraints, the global rules above as a verbatim style
block, and the per-asset scene brief. For each new asset swap only the scene brief, the output
path, and the reference list. Sprite prompts instead extend the v3 character template
(`art-source/intro/tmb2/popt-v2/prompts/anchor-00.txt`) with the magenta-field rules it already
contains.

## Validation

- Wave S0: visual owner gate on the two anchors (style lock), plus format check (dimensions,
  no text, palette adherence by eye at stage scale).
- Waves S1–S2: per-asset stage-scale reduction inspected against the matching animatic frame;
  format check scripted once the anchor style is locked.
- Wave S3: the existing sprite gate chain (`tools/assets/normalise-popt-frame.py`,
  `check-popt-frames-fullcolour.py`) with envelope/baseline parameters set per sprite id.

## Generation log

- 2026-08-18 — `plate-hangar-reveal`: attempt 1 accepted. Native 1498×1050 (tool ignored the
  1536×1024 request; kept unresized per prompt). Codex tokens ~39k. DC-9 silhouette check at
  stage scale: T-tail with stabiliser on top ✓, rear-fuselage nacelle ✓, clean wing (no underwing
  engines) ✓, gold cheatline ✓, backlit figure ✓, flat floor reflection ✓. Normalised to
  `normalised/plate-hangar-reveal-320.png` (centre-crop 1498×1048 → BOX 320×224).
- 2026-08-18 — `card-flight-case`: attempt 1 accepted. Native 1498×1050, ~34k tokens. Two open
  brass latches ✓, blank nameplate ✓ (runtime will letter it), hard-edged light pool ✓, no text ✓.
  Generator chose a three-quarter view over the ref's front-on framing — kept, it reads better.
  Normalised to `normalised/card-flight-case-320.png`.
- Note for future waves: the tool returns 1498×1050 for landscape requests; the 10:7 centre-crop
  loses only 2 rows equivalent. Not a defect.
- 2026-08-18 — Owner direction on the v1 anchors: Northwest livery on the DC-9, and a more modern
  flight case. Livery promoted to global rule 5; both prompts revised in place; v1 generations
  kept as `generated/*-v1.png`.
- 2026-08-18 — `plate-hangar-reveal` v2: attempt 1 accepted. Northwest scheme reads at stage
  scale: grey-over-white split at the window line ✓, all-red fin with white compass disc ✓,
  metal nacelle ✓, T-tail/rear-engine/clean-wing accuracy held ✓, no lettering ✓.
- 2026-08-18 — `card-flight-case` v2: attempt 1 accepted. Matte-black hard shell, brushed-steel
  open latches, blank steel nameplate, red accent line ✓. Normalised 320×224 files refreshed.
- 2026-08-18 — **Owner catch on the v2 hangar plate: no landing gear** (the jet floated on its
  reflection). Gear language added to the prompt and promoted into global rule 4;
  `plate-hangar-reveal` v3 regenerated (attempt 2): nose strut + twin wheels, main gear under the
  wing, belly gap ✓, livery and accuracy held ✓. This makes v3 the locked reveal plate.
- 2026-08-18 — **Wave S1 complete, five for five on first attempts** (livery lock held):
  - `plate-doorway` — tall lit aperture, DC-9 nose face-on inside with nose gear, spill pool,
    amber beacon. Aperture is narrower than the animatic mock; the runtime door leaves simply
    close over it. Native 1498×1050.
  - `strip-door-leaf` — tool returned 1254×1254 square, but full-bleed and correct: steel panel
    grid, ribs, bolts, right-edge hazard chevrons. Normalised 168×224, right-anchored so the
    chevrons ride the leading edge. (First read as "black margins" was the contact sheet's empty
    slot, not the asset — noted so nobody regenerates it.)
  - `plate-walk-tarmac` — nose and forward fuselage looming from the right with nose gear, open
    walking lane lower-left for the sprite, flat reflection, light cones. Native 1498×1050.
  - `plate-runway-lineup` — bare converging runway (no markings, no lights — runtime FX will own
    them, as specced), horizon band with distant tower silhouettes, stars. Native 1498×1050.
  - `plate-night-sky` — stars, thin flat streak clouds, warm glow band low. Native 1498×1050.
  All normalised to `normalised/*-320.png` (leaf: `-168.png`); review sheet delivered to owner.
- 2026-08-18 — **Wave S2 complete: 18/18 generated in one batched background run**
  (`wave-s2-driver.sh`, log `wave-s2.log`, ~07:40–08:13), all first-attempt, native ~1498×1050,
  all normalised to 320×224. Delta frames held their base framing well (gloves, cap, nacelle
  spool pair, throttles). Two flags for the owner, neither treated as blocking:
  1. `card-flight-case-shut` reframed slightly vs the open-case card (reads as a closer second
     angle rather than an exact match cut — arguably fine for a 1.4 s-apart beat cut).
  2. `card-nacelle-a/b/c` came out chunkier than a JT8D — wide high-bypass-style intake instead
     of the slim low-bypass inlet the prompt asked for. Story reads (rear-mount + red tail
     visible); regenerate on owner request with stronger narrow-inlet language.
  Unrequested bonus kept: `card-coffee` added a hand with a striped jacket cuff setting the mug
  down — consistent with the uniform and warmer than the empty frame.
- 2026-08-18 — Owner direction: both figures in the photo are BLOND, and confirmation requested
  that the instrument panel comes alive. `card-photo` took three attempts (v1 dark-haired child +
  hidden pilot hair; v2 fixed the pilot only; v3 via a delta pass on v2 — "change only the
  child's hair" — landed both blond with framing held). The delta-fix technique is the reliable
  route for targeted corrections. `card-instruments-b` (ALIVE panel) generated as a delta of the
  dark panel, first attempt: lit faces, needles at varied angles, amber/blue rim arcs, green and
  amber annunciators, framing held — the runtime reveals A→B left-to-right on the 38.52 beat.
- 2026-08-18 — **Wave S3 complete: 9/9 generated in one batched background run**
  (`wave-s3-driver.sh`, log `wave-s3.log`), all first-attempt. Normalised through the new
  `tools/assets/normalise-scramble-sprite.py` (magenta key → despill → alpha-weighted BOX):
  walk cycle 6 frames at 34 px tall (16–18 px wide — low drift, anchor+frame-1 double-reference
  held identity and scale), backlit doorway figure 25×64, DC-9 runway tail-on 52×18 (grey
  stabiliser over the red fin — era-correct), DC-9 liftoff normalised to 80/160/320 widths from
  one generation (gear up, red fin + compass disc, rear nacelles, exhaust wedges). Review sheet
  and animated walk-cycle check delivered. `spr-popt-reveal` dropped as noted in the wave table.
  **All generation waves are now COMPLETE: 31 shipped images from 31+6 attempts.**
- 2026-08-18 — **Sprite quality verified by measurement** (owner asked "are we sure the sprites
  are good enough"). Census over all 11 normalised sprite files: magenta spill 0 everywhere;
  walk cycle feet locked on bottom row 33 in all 6 frames, horizontal centroid drift ±0.7 px,
  opaque mass ±7%; identity reads at 34 px. One real finding: semi-transparent edge fringes made
  the runway jet's stabiliser/wingtips and the liftoff exhaust tips count as disconnected
  pieces. Fixed by hardening alpha (≥60 → opaque, else transparent) and dropping <4 px floating
  specks — after which **every sprite is exactly one connected component** (runway jet merged
  120+9+9+2 → 179; two speck px dropped on liftoff-320). The hardening + speck-drop now live
  inside `tools/assets/normalise-scramble-sprite.py`, so re-runs and future sprites inherit it.
  In-context composites (doorway, lineup, night sky) checked at stage scale. Remaining judgment
  is aesthetic (the owner's) plus the real-browser proof in Task 5.

- 2026-08-18 — **Waves S4 + S4B: owner punch-list repairs, 15/15 generated** (11 + 4, background
  drivers `wave-s4-driver.sh` / `wave-s4b-driver.sh`). New technique proven: **single-sheet
  cycles** — the run and walk cycles were each generated as ONE image of six side-by-side poses,
  sliced by `tools/assets/slice-scramble-sheet.py`, then normalised with a shared scale derived
  from frame 1 so airborne poses don't breathe. Results: 64 px ident run/skid/tap (legacy
  256-cell sheets fully retired), 48 px walk cycle, `card-watch` (replaces the scrapped gloves),
  `card-logbook` (replaces the cut harness on the 19.368 click), exact-framing `case-shut` redo,
  blond `shades` delta, and the cap set rebuilt around the game's captain's hat
  (`captains-hat-celebration.png` passed as an image reference): charcoal crown, silver oak-leaf
  visor, chin cord, red-ringed badge, three-frame flip. Two S4 cap deltas and the two harness
  frames were superseded by mid-wave owner directions and are not wired in (kept in generated/
  for the record).

- 2026-08-18 — **Wave S5: hat unification (5 generations).** Owner gate round 2: three different
  hats had crept in, and the trim must be GOLD not silver. Canonical hat defined (game hat shape,
  all-gold metalwork: braided gold chin cord with end buttons, gold oak-leaf visor spray, round
  badge with red ring / cream disc / blue centre / gold wings). Gold delta on the flip base, mid
  and caught rebuilt from the gold base, watch card's invented cap replaced with the canonical
  hat (took two attempts: the first came back with a plain gold winged disc; a second delta
  passing the flip card as a badge reference landed it exactly). Shades card and all character
  sprites already read as gold-banded and stand unchanged.
- 2026-08-18 — **Montage reorder for continuity** (owner: the watch shows the hat being worn, so
  it cannot precede the catch): the cap flip now OPENS the suit-up on the 14.544 snap accent and
  the watch check CLOSES it on 24.552 as the "time to go" button into the doors. Cues renamed to
  what they host (`capFlip` 14.544, `logbookSnap` 19.368, `watchCheck` 24.552 — measured values
  locked by test, unchanged).

- 2026-08-18 — **The emblem finale card replaced (owner: "new emblem, get rid of the key").**
  `s5-emblem-finale` generated once, first attempt: the winged-globe insignia alone — layered
  gold wings (card-wings passed as the style reference), gridded deep-blue globe in a gold ring,
  blank signal-red ribbon — on magenta, normalised to a 220×94 TRANSPARENT sprite shipped at the
  existing `emblem/finale-card.png` path, so the night-sky plate, contrail and runtime rays show
  through it. The retired design's last asset (old-style Pop T holding the golden key) is gone;
  `tools/assets/build-intro-emblem.py` no longer produces this file and is superseded for it.
  **Asset production for the Scramble intro is COMPLETE: 52 accepted generations, zero old art
  remaining.**
