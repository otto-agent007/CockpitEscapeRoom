# Mars arcade — Oracle walk from a free image-to-video clip (trial, 2026-09-24)

Decision A of `plans/0046-arcade-animation-workflow-v2.md`: "try the video route with a cheap
or free model". This is the first clip, end to end, with nothing paid.

## Route

| Step | Tool | Result |
| --- | --- | --- |
| Generate | `tools/assets/generate-arcade-video.py … --space ltx` on `Lightricks/ltx-video-distilled` (free ZeroGPU, no token) | 2.5 s, 512×768, 30 fps, 73 frames, **295 s in the queue**, seed 7. Prompt and provenance: `art-source/arcade/oracle/generated/walk-video-trial-v1/generation.json` |
| Generate (Wan 2.2 first-last-frame, anchor as both ends) | same tool, `--space wan-flf` | **Refused: anonymous ZeroGPU quota is 60 s and the job asks for 180 s.** Needs `HF_TOKEN` (a free Hugging Face account). Not retried. |
| Pick | `pick-arcade-frames.py --frames 4 --policy cycle` | first pass guessed a spacing of 10 and the owner saw him walk backwards: the samples were out of phase. The picker now MEASURES the cycle (28 dense frames; the one-step dip at 14 is rejected in favour of the deeper full-cycle match) and spreads the picks over exactly one cycle: dense 6, 13, 20, 27 |
| Normalise | `normalise-arcade-clip.py --align torso --torso-reference <shipped walk-forward-00> --chroma #FF00FF` at 6.8029 (the locked 13.6058 halved, the clip being half the anchor's size) | 4 cells, `art-source/arcade/oracle/normalised-walk-video-trial/walk-forward/` |
| Gate | `check-popt-frames-fullcolour.py --in-place-clip walk-forward` | 3 of 4 pass; `walk-forward-00` has one ≤2 px transparent speck |
| Audit | `audit-arcade-clip.py` (as a loop clip) | **FAIL**: upper body pops −3,0 / +4,+3 / −1,−4 px between drawings (ceiling 2) |

## What the clip is

The model held identity, outfit, palette, camera and scale across all 73 frames and produced a
readable alternating stride with counter-swinging arms, in place, on the flat magenta field — the
consistency the per-pose route never gave us (see the dense contact sheet in the generated folder).
The hands open and close between frames, and the last ~10 frames smear the feet.

## What the pipeline found, and fixed

- **Codec spill.** Magenta rang 3–6 px into the figure, wider than the edge band the neighbour
  despill rebuilds; the gate failed all four cells at magenta-ness up to 53. `normalise-arcade-clip.py`
  now ends with a **despill clamp** (dominant key channels pulled to the suppressed one plus the
  spill ceiling, Spriterrific's rule ported): 0 spill failures after.
- **preserve-canvas is the wrong alignment for this clip.** The body wanders ~5 px across the
  clip, so one shared offset left the torso 8–13 px off the reference line. Per-drawing torso
  alignment holds the back line; that is what the shipped walks use too.
- **What remains is real.** The upper-body pop the audit reports is the model's sway, not a
  normalisation error; the gym's onion skin shows it. Two honest options: a per-drawing nudge in
  the normaliser (Spriterrific's manual aligner, which this run argues for), or re-generating with
  a stricter "torso locked" prompt and picking picks closer in phase.

## Per-drawing nudge (2026-09-25): tried, cannot rescue this clip

`normalise-arcade-clip.py --nudge INDEX:DX,DY` now exists (recorded in the report, tested,
mutation-checked). Applied to this clip it answers the question the trial left open:

- The committed cells reproduce byte for byte from the picks with `--align torso
  --torso-reference normalised-walk-ready/walk-forward/walk-forward-00.png`, so the search below
  started from exactly what is in the gym.
- The audit's pops are not sideways sway. The torso back line is already 49.0 on all four
  drawings; what moves is the height: tops at rows 17 / 16 / 18 / 14 against a fixed baseline,
  a 4 px bob between the stride and passing drawings, plus the head leaning with the stride.
- Of the 81 nudge sets the per-cell gate allows (no vertical move, torso within 1 px), **none**
  passes the audit: the vertical pops (−3 on the wrap, +4 from 02 to 03) remain in every one.
- An exhaustive search that ignores the gate found 12 sets that pass the audit, the smallest
  `2:-2,-1 3:2,1`. Written and gated, it FAILS the gate on both nudged drawings (feet on rows
  118 and 120; torso at 47 and 51 against 49). It passes the audit only by spending the audit's
  looser tolerances, so it was reverted; the committed cells are unchanged.

What would fix it is in the drawings, not their placement: re-generate with a prompt that
holds the head height (or with Wan first-last-frame once `HF_TOKEN` is set), or pick drawings
closer in bob phase. Whether a 4 px bob is acceptable for Oracle's walk is an owner call; the
audit's 2 px ceiling was not changed.

## Wan first-last-frame from the shipped drawing (2026-09-26): passes both checks

The owner preferred the shipped walk, so the second trial starts from it: the shipped walk's
own full-resolution source `generated/walk-v2/walk-forward-00-c1.png` as BOTH the first and
the last frame on `multimodalart/wan-2-2-first-last-frame` (free Hugging Face account token in
`HF_TOKEN`, never written to disk in the repo), seed 7, 2.1 s. The prompt adds "head and hips
stay at the same height, no bobbing; the torso stays upright"; the negative prompt adds
"walking backwards, moonwalk, bobbing head, bouncing, leaning" (the space's own default
negative carries "walking backwards" too). 1111 s in the queue; 33 frames at 16 fps, 512x768.
Provenance: `generated/walk-video-wan-v1/generation.json`.

| Step | Result |
| --- | --- |
| Clip | Identity, outfit and line style are the shipped drawing's; head level through the whole loop; stride, passing, stride, passing, back to the start pose at frame 32. Feet blur in the passing frames (8-13, 24-30) and the fists smear pink at times. |
| Pick | The picker could not measure the period: it searches lags up to half the clip and this whole clip is ONE cycle by construction (same first and last drawing). Period 32, so `--span-factor 8 --start-fraction 0`: dense 0, 8, 16, 24. Dense 16 left a 1 px hole where the fist nearly meets the chin; 15 and 17 both gate clean, 17 overlaps its neighbours best, so pick 2 is dense 17 (recorded as `manualOverride` in `selection.json`). |
| Normalise | `--align torso --torso-reference normalised-walk-ready/walk-forward/walk-forward-00.png` at 6.8029, to `normalised-walk-video-wan/walk-forward/`. The first pass left 1-2 px of magenta at 16-17 (ceiling 15): averaging during the downsample re-tints pixels the source clamp had fixed (key-ness is not linear), so the normaliser now clamps the cell again after resampling. |
| Gate | 4 of 4 pass. |
| Audit | **pass**: tops 16/15/16/15, height 104/105, torso 49.0 on every drawing, largest pop 0,+1. The shipped walk measures the same (tops 16/16/15/16). The LTX walk bobbed 4 px. |

It is now the `oracle:walk-forward-video` candidate (re-wired with `arcade-anim.mjs wire`,
boxes seeded, `reviewed: false`), replacing the LTX cells, which stay committed as evidence.
The shipped walk is unchanged; whether the candidate ships is the owner's call.

## Status

Candidate, in the gym as `oracle:walk-forward-video` (wired with `arcade-anim.mjs wire`, boxes
seeded, `reviewed: false`) so it can be reviewed with onion skin next to the shipped walk. The
harness never plays it — no fighter state maps to it — and the shipped Oracle walk is unchanged.
The raw clip, picks, cells and provenance are committed as evidence.
