# Mars arcade Wave 0 — 2026-09-20 review candidates

## Current result — likeness retained, sprite gates green

Owner feedback: **“yes they are closer”**. Retained the Musk/Altman likeness direction and
the existing Captain source. No further image generation or source painting was needed.
Current review cells are `art-source/arcade/<fighter>/normalised-clean/anchor/anchor-00.png`.
All three pass the unchanged contract checker. Prior failed exports are preserved.

Root-cause investigation found no enclosed tiny holes in the Booster/Captain source masks;
the 3/1 specks appeared at narrow diagonal gaps during Lanczos downsampling. An opt-in
`--resample bilinear` mode in `tools/assets/normalise-popt-frame.py` avoids that ringing.
An initial 8-bit implementation removed holes but failed the chroma gate at low-alpha edges.
Float premultiplied colour and float alpha, resized together and quantized only after
unpremultiplication, fixed the fringe without changing the source or checker thresholds.
The existing Lanczos default remains byte-for-byte identical on all three regression cases.

| Fighter | Input file under its `generated/` directory | Locked source scale | Clean gate |
| --- | --- | --- | --- |
| Booster | `anchor-likeness-00.png` | 14.038461538461538 (1460 / 104) | PASS, exit 0 |
| Oracle | `anchor-likeness-00.png` | 13.60576923076923 (1415 / 104) | PASS, exit 0 |
| Captain | `anchor-00.png` | 13.990384615384615 (1455 / 104) | PASS, exit 0 |

Use those exact scales and `--resample bilinear` for this sprite set. All output cells are
128×128, with 104 px figure height and baseline row 119; x bounds remain Booster 41–87,
Oracle 46–84, Captain 48–80. The filter produces a slightly softer downsample; the raw
identity artwork and scale do not change. No fill or hole-removal operation is used.

Validation on the final code:

- `python3 tools/assets/normalise-popt-frame.test.py`: **2 tests passed**, each covering
  all three source images. RED first rejected the missing option, then caught the fringe;
  GREEN proves valid exports, preserved legitimate leg gaps, unchanged source bytes, and
  byte-identical default exports. This standalone Python test is not part of `npm run check`.
- `python3 tools/assets/check-popt-frames-fullcolour.test.py`: clean reference accepted;
  all seven injected defects rejected, including actual transparent specks and chroma spill.
- Individual unchanged checker invocation on each `normalised-clean` directory: **0 failures**.
- Fresh `npm run check`: ESLint, TypeScript, **653 tests / 51 files**, production build
  **2.41 s**, exit 0. Log: `preview-renders/mars-arcade/wave-0-clean-check.log`.
- Completed `dist/` contains no arcade content or dev entry. `git diff --check` passed.
- Reviewed the entire normalizer/test diff: opt-in only, same locked dimensions/placement,
  no checker changes, no runtime changes, and no added dependencies. Inspected the current
  contact sheet: `preview-renders/mars-arcade/wave-0-clean-review.png`; tmux pane `%1`
  updated and confirmed active.

The debugging skill directed the source-to-export comparison rather than another redraw;
the test-first workflow caught the additional colour-precision defect before acceptance.
This completes the pixel cleanup checkpoint. Remaining visual deviations previously
recorded (including torso angle, foot alignment and soft shading) are art-review items,
not fixed by resampling. Likeness direction acceptance is recorded; final art approval,
motion frames, gameplay integration and the later Mars placement decision remain separate.

Everything below is the historical generation and failed-export record.

## Latest revision — owner-requested public-figure likenesses

After seeing the first review sheet, the owner requested: “we need the caracters to look
more like elon and sam altman”. This explicitly replaces the earlier invented-only visual
restriction for Booster and Oracle. Booster was revised toward Elon Musk, Oracle toward
Sam Altman (removing the generic glasses). Captain is unchanged. No endorsement or actual
event is depicted. Runtime names, rules and integration remain untouched.

One new built-in image-generation edit per fighter used its previous final candidate as
the visual input and the saved `art-source/arcade/prompts/anchor-*-likeness.txt` prompt.
The new outputs are separate, untouched 1024×1536 PNGs:
`art-source/arcade/{booster,oracle}/generated/anchor-likeness-00.png`.
The corresponding 128×128 RGBA cells are under `normalised-likeness/anchor/anchor-00.png`.

| Fighter | Source figure | Derived source scale | Cell bounds | Unchanged checker |
| --- | --- | --- | --- | --- |
| Booster / Musk | 665×1460 | 14.0385 (1460 / 104) | x 41–87, y 16–119 | FAIL: 3 transparent specks, exit 3 |
| Oracle / Altman | 526×1415 | 13.6058 (1415 / 104) | x 46–84, y 16–119 | PASS, exit 0 |

Both normalisations exited 0. These scales supersede the original candidates' scales only
for the new likeness images; no prior image was overwritten. Source and normalized sprites
are shown with the unchanged Captain in `preview-renders/mars-arcade/wave-0-likeness-review.png`.
The sidebar was refreshed using the tmux image skill. Owner likeness approval, Booster's
three transparent specks, Captain's earlier single speck, and previously recorded visual
quality issues remain open. The project check below preceded these source-art-only revisions;
runtime code, contracts and tools have not changed since that passing check.

The rest of this report records the earlier, preserved invented-identity pass.

## Scope and authority

Continues `prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md` from Claude's committed handoff
`07081b7` in `/mnt/2TBHDD/CockpitEscapeRoom.worktrees/mars-arcade` on
`feat/mars-arcade-fight-loop`. Goal: three neutral identity anchors for owner review.
No fight rules, application wiring, persistence, preload manifests, or deployable assets
were changed. No motion frames were generated. This is an incomplete art gate.

The first request for each fighter used its existing `art-source/arcade/prompts/anchor-*.txt`
verbatim. The Captain used the existing Pop T identity reference named in that prompt.
Generation used the built-in `image_gen` tool; no API key or CLI image-generation fallback.
Two targeted correction requests followed per fighter, reaching the handoff's retry limit.

The `blender-web-assets` skill is applied only for the handoff's requested asset-report
discipline: preserve source, record dimensions, validation, deviations and review status.
These are 2D PNG source candidates; Blender, GLB export and runtime integration do not apply.

## Saved artifacts and scales

All raw images are untouched 1024×1536 PNG generator outputs. For each fighter:

- `art-source/arcade/<fighter>/generated/anchor-attempt-00.png`: original request.
- `art-source/arcade/<fighter>/generated/anchor-attempt-01.png`: first correction.
- `art-source/arcade/<fighter>/generated/anchor-00.png`: final second correction candidate.
- `art-source/arcade/<fighter>/normalised/anchor/anchor-00.png`: 128×128 RGBA cell.

| Fighter | Source figure bounds (width × height) | Scale (source px / cell px) | Normalised bounds | Gate |
| --- | --- | --- | --- | --- |
| Booster | 666×1451 | 13.9519 (1451 / 104) | x 40–87, y 16–119 | FAIL: 2 transparent specks |
| Oracle | 522×1404 | 13.5000 (1404 / 104) | x 46–84, y 16–119 | PASS |
| Captain | 468×1455 | 13.9904 (1455 / 104) | x 48–80, y 16–119 | FAIL: 1 transparent speck |

The existing normaliser derived the scale once from each final source, used that exact
unrounded value for this cell, despilled magenta edges, downsampled, and placed the feet at
baseline 119 / pivot column 64. Keep this scale for later frames of the same approved anchor;
if the owner replaces an identity anchor, explicitly supersede its scale instead of silently
re-fitting later frames.

## Generation review and stop condition

Original Booster/Oracle candidates turned the torso toward the viewer, added clothing detail
and soft shading. The initial Captain and Booster's first correction introduced a black halo
background instead of the required magenta field. They are preserved as rejected attempts.
Oracle's first correction hid the second leg completely. The second corrections restore
magenta backgrounds and a visible two-foot stance, and simplify the clothes.

Remaining visual findings: Booster still shows more of the chest than a strict orthographic
side view; all three retain some soft shading; Booster and Captain soles are not perfectly
level. The Captain's head/hat is proportionally larger than the five-head-height direction.
These are visual findings even where the numerical gate passes. The Oracle's numerical pass
does not constitute owner identity approval.

The unchanged checker reports small enclosed transparent regions (at most 2 pixels per
region) on Booster and Captain after normalisation. They were not painted over, the checker
was not weakened, and the scale was not varied to evade the failure. No more regeneration
is attempted because the brief explicitly limits it to two corrections per frame.

## Commands and evidence

For each fighter, run from the arcade worktree:

```sh
python3 tools/assets/normalise-popt-frame.py \
  art-source/arcade/<fighter>/generated/anchor-00.png \
  art-source/arcade/<fighter>/normalised/anchor/anchor-00.png \
  --contract asset-reports/mars-arcade-sprite-contract.json --derive-scale
python3 tools/assets/check-popt-frames-fullcolour.py \
  --contract asset-reports/mars-arcade-sprite-contract.json \
  art-source/arcade/<fighter>/normalised
```

All normalisations exited 0. Checker exits: Booster 3, Oracle 0, Captain 3.

`npm run check` passed ESLint, TypeScript, 653 tests across 51 files and the production
build (38.75 s). Log: `preview-renders/mars-arcade/wave-0-check.log`. The completed build
contains no `MARS ARCADE`, `BOX HARNESS`, `THE BOOSTER`, `arcadeHarness`, `marsArcade`, or
`ORBITAL INSERTION` strings and no `dist/dev` directory. `git diff --check` passed.

Review sheet: `preview-renders/mars-arcade/wave-0-identity-review.png`, rendered with local
headless Chromium from source images and normalized cells at 3× nearest-neighbor scale.
It was inspected and displayed with the tmux image skill in the existing preview pane `%1`;
status confirmed active. This static contact sheet is not a gameplay browser test or
Vercel preview. Owner review remains outstanding.

Full scoped diff review found no changes to runtime, rules, preload paths, contract or
normalisation/checker code. The unresolved asset issues above remain explicit findings;
no production-ready or full Wave 0 completion claim is made.

SHA-256 for the review PNG:
`3df6194c440e78b3e2558ca811b2e9cf6777006d7d32612889b61f1a01301d84`.

## Remaining decision

Review the three identities and decide whether to retain these designs for a bounded art
cleanup or revise them. Wave 1 remains gated on identity approval and corrected sprites.
The earlier Mars surface-vehicle mission versus arcade-cabinet placement conflict remains
unresolved; it does not block this art review but must be settled before scene integration.
