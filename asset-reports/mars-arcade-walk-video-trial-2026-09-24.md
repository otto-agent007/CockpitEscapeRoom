# Mars arcade — Oracle walk from a free image-to-video clip (trial, 2026-09-24)

Decision A of `plans/0046-arcade-animation-workflow-v2.md`: "try the video route with a cheap
or free model". This is the first clip, end to end, with nothing paid.

## Route

| Step | Tool | Result |
| --- | --- | --- |
| Generate | `tools/assets/generate-arcade-video.py … --space ltx` on `Lightricks/ltx-video-distilled` (free ZeroGPU, no token) | 2.5 s, 512×768, 30 fps, 73 frames, **295 s in the queue**, seed 7. Prompt and provenance: `art-source/arcade/oracle/generated/walk-video-trial-v1/generation.json` |
| Generate (Wan 2.2 first-last-frame, anchor as both ends) | same tool, `--space wan-flf` | **Refused: anonymous ZeroGPU quota is 60 s and the job asks for 180 s.** Needs `HF_TOKEN` (a free Hugging Face account). Not retried. |
| Pick | `pick-arcade-frames.py --frames 4 --policy cycle --span-factor 10` | dense 6, 16, 26, 36 — one stride cycle after the settle |
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

## Status

Candidate, in the gym as `oracle:walk-forward-video` (wired with `arcade-anim.mjs wire`, boxes
seeded, `reviewed: false`) so it can be reviewed with onion skin next to the shipped walk. The
harness never plays it — no fighter state maps to it — and the shipped Oracle walk is unchanged.
The raw clip, picks, cells and provenance are committed as evidence.
