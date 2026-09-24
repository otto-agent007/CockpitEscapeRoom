---
name: arcade-animation
description: Take a Mars arcade fighter animation from generated art to a clip in the fight, with boxes, timing and proof. Use when adding or revising any Booster, Oracle or Captain clip, authoring hitboxes in the character gym, normalising sprite frames, or answering "why does this pose pop / whiff / not play".
---

# Arcade animation workflow

One table describes every clip: `src/game/marsArcadeAnimations.json`. The harness plays
from it, the gym edits it, the validator checks it, the tests pin it to the frame data.
Nothing about a clip lives anywhere else — not in the sprite selector, not in a script.

## Inputs

- The fighter (`booster`, `oracle`, `captain`) and the clip name (`jab`, `heavy`, `walk-forward`, …).
- For a move clip: the move id in `src/game/marsArcadeFighters.ts` and its startup / active /
  recovery counts. The drawing budget is derived: `src/game/marsArcadeSpriteBudget.ts`.
- The fighter's locked scale from `art-source/arcade/README.md` (never re-derive it per frame).
- The prompt pack `asset-reports/mars-arcade-frame-prompt-pack.md` and, for a move, the
  reach and height band in `asset-reports/mars-arcade-sprite-contract.json`.

## The loop

1. **Generate** the source drawings with Codex `image_gen` against the fighter's anchor, or
   as one image-to-video clip (walks, sweeps, reactions are where a single clip beats
   separate poses). The video route is free: `tools/assets/generate-arcade-video.py` drives a
   Hugging Face Space from the tooling venv (`uv venv .cache/arcade-video-venv && uv pip install
   --python .cache/arcade-video-venv/bin/python gradio_client pillow`):
   `.cache/arcade-video-venv/bin/python tools/assets/generate-arcade-video.py <anchor.png> <out>
   --space ltx|wan-flf --prompt "<start pose, the verb, end pose; in place; flat colours>"`.
   `wan-flf` takes the anchor as first AND last frame, which is what a cycle wants. Expect a
   queue; `HF_TOKEN` lifts the quota. Save every raw output and `generation.json` under
   `art-source/arcade/<fighter>/generated/<wave>/`.
2. **Pick**, for a video: `python3 tools/assets/pick-arcade-frames.py <clip.mp4> <out> --frames N
   --policy cycle|action|hold`. Review `picks-contact-sheet.png`. A pick is a candidate, not a drawing.
3. **Normalise the clip together**, one alignment for the whole clip:
   `python3 tools/assets/normalise-arcade-clip.py art-source/arcade/<fighter>/normalised-<set>-ready
   <sources…> --clip <name> --source-px-per-cell-px <locked> --source-alpha --align <mode>`.
   Modes: `feet` (stances, one-shots), `planted-foot --planted rear|front` (steps, lunges,
   sweeps), `torso --torso-reference <cell>` (in-place walks), `bbox` (airborne, downed),
   `preserve-canvas` (frames from one video). The report beside the cells records what moved.
4. **Gate each cell**: `python3 tools/assets/check-popt-frames-fullcolour.py <set-dir>
   --contract asset-reports/mars-arcade-sprite-contract.json` (add `--in-place-clip` for walks).
5. **Wire the clip** into the table: add or extend the entry in `marsArcadeAnimations.json` with
   `src`, `pose`, `phase`, `hold` per drawing (holds per phase must sum to the move's frame data),
   `loop`, `moveId`, `reviewed: false`. The gym's Frame panel can do this too (pose, phase, hold,
   drawing path, duplicate / delete / reorder).
6. **Audit the sequence**: `python3 tools/assets/audit-arcade-clip.py <fighter>:<clip>`. Read
   `preview-renders/mars-arcade/clips/<fighter>-<clip>/review.md`: pop between drawings,
   feet off the baseline, height or torso drift on a cycle. Fix the drawing or the alignment,
   never the threshold.
7. **Author boxes in the gym**: `npx vite --port <yours> --strictPort`, open `/dev/gym.html`.
   Fit body and hurt from the drawing, then tighten; put the attack box on the striking surface
   of every active drawing (its forward edge lands on `reach`, or record a `reachException`);
   check the opponent overlay at the move's reach; play at real holds with onion skin on.
   Tick **boxes reviewed** and Save. Save is refused while the validator reports errors.
8. **Validate and test**: `npm run arcade:validate` (rules + silhouette checks), `npm run test`.
9. **Prove in the harness**: the relevant `tools/assets/check-arcade-*.mjs` against a dev server
   on your own port, plus `tools/assets/check-arcade-gym.mjs` and `check-arcade-playground.mjs`.
   Evidence goes under `ARCADE_EVIDENCE_DIR`; restore any committed PNGs outside your own prefix
   before committing. In `/dev/arcade.html` the Bounds toggles overlay the table's boxes on the
   sprites; the Fighter playground section edits `src/game/marsArcadeTuning.json` live (walk,
   jump, gravity, HP, guard, per-move damage / knockback / stun) and Save writes it — the
   cabinet loads the same file, so a tuning change is a balance change and is reviewed as one.
10. **Report**: `asset-reports/mars-arcade-<clip>-<date>.md` with prompts, sources, the
    normalise report, the audit table, the gym screenshot and the harness proof. Update
    `TEST_REPORT.md`.

## Human gates

Anchor acceptance; pose acceptance from the contact sheet; alignment mode when a clip pops;
box sign-off (the `reviewed` flag); any change to reach, holds or frame data (balance).

## Rules that bite

- Drawings never encode travel; the engine owns x and y.
- Frames are keyed by drawing file. Inserting a pose never moves a box; a pose that changes
  phase does move its holds, so re-check the hold sums.
- Scale is measured on the source at the locked scale (head width), never on a planted foot.
- A seeded box is a starting point, not evidence. `reviewed: false` stays until someone looked.
- Do not hand-edit generated cells; regenerate or re-normalise.
- Peer sessions share the tree: use your own worktree and port, never `git add -A`.
