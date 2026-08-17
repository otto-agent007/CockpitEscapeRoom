# Pop T v2 — frame generation pack

Owner-facing. Everything here is copy-paste ready for ChatGPT Image. The machine-readable
contract these prompts implement is `asset-reports/popt-sprite-contract.json`; the reasoning
and evidence are in `plans/0029-popt-native-resolution.md`.

**What changes from the frames we have:** nothing about who Pop T is. Same character, same 14
colours, same poses. He is redrawn at **twice the linear resolution** — 92 pixels tall instead
of 46 — because he plays at 41% of the screen and 46 pixels cannot hold that size. The frames
we have resolve about one fifth the detail of the key mascot standing next to him.

---

## Before you start

Attach these three images to **every** generation. They live in
`art-source/intro/tmb2/popt-v2/references/`.

| Attach | File | Why |
| --- | --- | --- |
| 1 | `identity-anchor-1024.png` | Who he is. Colours, uniform, proportions, face. |
| 2 | `target-scale-mockup-1024.png` | How big he sits in the cell. The chunky pixels in it are the *old* art doubled — they show the size to hit, not the quality. |
| 3 | `pixel-matrix-8x8-1024.png` | The 8×8 block grid. Constraint only — it must never appear in the artwork. |

Generate **one frame per request**. Never ask for a sheet, a pose board, or several poses in one
image: the pipeline needs each frame on the same locked grid, and a multi-pose image drifts.

Save each result as `art-source/intro/tmb2/popt-v2/generated/<clip>/<clip>-NN.png`, numbering
from `00`. Tell me when a wave is done and I will snap, normalise, export, and validate it.

---

## The invariant block

Paste this verbatim at the top of every request, then add the one-line pose brief under it.

> Draw a single 16-bit Genesis-era pixel-art character frame on a 1024×1024 canvas.
>
> The artwork must read as exactly 128×128 logical pixels: every pixel is an exact 8×8 block of
> one flat colour, aligned to the attached matrix reference. No block may be half-sized, offset,
> blurred, gradient-filled, or anti-aliased. Do not draw the matrix itself.
>
> The character is the pilot from the attached identity reference — same face, same navy peaked
> cap with a gold band, same white short-sleeve uniform shirt with epaulettes and a dark tie,
> same navy trousers, same dark boots. Keep him unmistakably the same character.
>
> Use only these 14 colours and full transparency. No other colour, no intermediate shade:
> #040614 #1A203F #F1EFF0 #F8AC75 #280B02 #BAB7CB #D5773F #F5C424 #20251E #3A4772 #A35616
> #CB8A06 #6A320A #82819A
>
> Composition, in logical pixels of the 128×128 grid: he stands on a baseline at row 111, centred
> on column 64. Standing height is 92 rows (top of cap at row 19). No pose may leave the box
> from column 10 to 118 and row 7 to 116.
>
> Fully transparent background. No ground, no shadow, no props, no duffel bag, no key character,
> no text, no logo, no border, no frame, no watermark, no UI.
>
> He faces right. Draw a clean readable silhouette: every limb separated from the torso, arms at
> least 3 pixels thick, no stray single pixels floating off the body, no speckled dithering inside
> flat areas. Shade in deliberate clusters, not noise.

---

## Wave 0 — the anchor (1 frame)

Generate this one first and send it to me before anything else. Every later frame is a pose
delta from it, so if the anchor drifts the whole set drifts.

**`anchor-00`** — Standing at rest, three-quarter view facing right. Weight even on both feet,
arms relaxed at his sides, hands open, chin level, calm neutral expression. This is the reference
pose, not an action pose.

---

## Wave 1 — locomotion (12 frames)

He runs in almost every scene. This wave alone changes how the whole intro reads.

### `run` — 8 frames, loops

Full run cycle facing right. Consistent stride length and consistent head height across the cycle
except where noted; frames 4–7 are the same cycle on the opposite leg.

| Frame | Pose |
| --- | --- |
| `run-00` | Right foot contacts ground ahead, left arm swung forward, torso leaning into the run. |
| `run-01` | Compression — supporting knee bent deepest, head 2 px lower, both arms mid-swing. |
| `run-02` | Passing — trailing leg drawn under the body, arms crossing at his sides. |
| `run-03` | Extension — pushed off, both feet clear of the ground, head 2 px higher, arms fully split. |
| `run-04` | Left foot contacts ground ahead, right arm swung forward. |
| `run-05` | Compression on the left leg, head 2 px lower. |
| `run-06` | Passing on the opposite leg. |
| `run-07` | Extension airborne, opposite arm split. |

### `idle` — 4 frames, loops

Barely-moving breathing loop. Feet planted identically in all four frames.

| Frame | Pose |
| --- | --- |
| `idle-00` | Neutral stand, identical to the anchor. |
| `idle-01` | Inhale — chest and shoulders lift 1 px, cap lifts 1 px. |
| `idle-02` | Neutral. |
| `idle-03` | Exhale — shoulders settle 1 px below neutral, head tips a hair forward. |

---

## Wave 2 — the ground story beats (17 frames)

### `duffel-pull` — 6 frames, loops

He is hauling on the strap of a heavy duffel bag off-frame to his right. **Draw only him** —
hands closed as if gripping a strap, no bag.

| Frame | Pose |
| --- | --- |
| `duffel-pull-00` | Grip set, both hands closed at chest height to his right, body leaning back about 10°, heels planted. |
| `duffel-pull-01` | Heave begins — lean deepens, back leg braced, arms straightening. |
| `duffel-pull-02` | Peak strain — deepest lean, both arms taut, jaw set, one heel dug in and lifting. |
| `duffel-pull-03` | The strap slips — body jerks forward, arms slack, surprised beat. |
| `duffel-pull-04` | Recovering the grip, hands re-closing, torso straightening. |
| `duffel-pull-05` | Reset — upright, shoulders dropped, catching a breath before the next pull. |

### `startle-stumble` — 5 frames, holds on the last

The moment something bursts out of the bag. Comedy recoil, never fear.

| Frame | Pose |
| --- | --- |
| `startle-stumble-00` | Upright shock — head snaps back, eyes wide, shoulders up. |
| `startle-stumble-01` | Both arms fly up and out, heels lifting off the ground. |
| `startle-stumble-02` | Backpedalling, weight behind him, one leg kicked forward. |
| `startle-stumble-03` | Arms windmilling for balance, cap tipping off the crown. |
| `startle-stumble-04` | Landed hard on the back foot, cap askew, wide-eyed. **Hold pose — make it read as a still.** |

### `baseball-slide` — 6 frames, holds on the last

A ballpark slide along the ground, left to right.

| Frame | Pose |
| --- | --- |
| `baseball-slide-00` | Last sprint step, planting hard to drop. |
| `baseball-slide-01` | Dropping into the slide, lead leg extending forward, trailing leg tucked. |
| `baseball-slide-02` | Sliding, hip down, lead leg fully out, torso leaned back on one arm. |
| `baseball-slide-03` | Deepest point — free arm stretched forward and up, reaching. |
| `baseball-slide-04` | Decelerating, torso rising, lead leg starting to fold. |
| `baseball-slide-05` | Stopped, propped on one elbow, looking up after the thing he missed. **Hold pose.** |

---

## Wave 3 — the sky and the finale (26 frames)

### `bull-spin` — 8 frames, plays once

He runs into a bronze statue and cartwheels off it. Slapstick, no injury read — he is fine.

| Frame | Pose |
| --- | --- |
| `bull-spin-00` | Full-speed run contacting something solid, chest first, arms flung back. |
| `bull-spin-01` | Body folds around the impact, feet still driving forward. |
| `bull-spin-02` | Lifted — both feet leave the ground, body starting to rotate head-over-heels. |
| `bull-spin-03` | Quarter turn, body horizontal, arms and legs spread. |
| `bull-spin-04` | Half turn, upside down, cap separating from his head. |
| `bull-spin-05` | Three-quarter turn, coming back around, arms reaching for the ground. |
| `bull-spin-06` | Landing crouch, both hands and feet down, absorbing it. |
| `bull-spin-07` | Sitting on the ground, dazed but grinning, cap dropping back onto his head. **Hold pose.** |

### `pilot-glide` — 6 frames, loops

Flying through open sky, arms out, cape-less superhero glide. **Draw the tilts into the pose —
the body axis genuinely tips — rather than drawing a level pose that will be rotated later.**

| Frame | Pose |
| --- | --- |
| `pilot-glide-00` | Level glide, body horizontal, arms swept back, legs trailing straight. |
| `pilot-glide-01` | Nose down about 4°, leading arm dipping, shirt hem lifting. |
| `pilot-glide-02` | Level, shirt and trouser cuffs fluttering. |
| `pilot-glide-03` | Nose up about 4°, chin lifted, trailing leg kicked. |
| `pilot-glide-04` | Level, both arms swept furthest back, fastest read. |
| `pilot-glide-05` | Nose down about 2°, settling back toward frame 0 so the loop closes. |

### `reach-catch` — 6 frames, holds on the last

The lunge at the end of the chase.

| Frame | Pose |
| --- | --- |
| `reach-catch-00` | Wind-up — reaching arm cocked back, body coiled, eyes locked ahead. |
| `reach-catch-01` | Lunge begins, torso extending forward, trailing leg straightening. |
| `reach-catch-02` | Full extension, arm at maximum reach, fingers spread wide, body stretched long. |
| `reach-catch-03` | Fingers just closing on empty air, body still extended. |
| `reach-catch-04` | Hand closed into a fist, arm beginning to draw back, torso folding in. |
| `reach-catch-05` | Fist pulled to his chest, elbow tucked, triumphant look starting. **Hold pose.** |

### `victory-recovery` — 6 frames, holds on the last

The win. **Draw his hand closed as if holding something aloft — do not draw the key itself.**

| Frame | Pose |
| --- | --- |
| `victory-recovery-00` | Landing and settling, knees absorbing, head down. |
| `victory-recovery-01` | Straightening up, shoulders squaring. |
| `victory-recovery-02` | Chest out, closed fist starting to lift from the waist. |
| `victory-recovery-03` | Fist raised to shoulder height, chin coming up. |
| `victory-recovery-04` | Arm nearly straight overhead, broad grin, free hand on hip. |
| `victory-recovery-05` | Full triumphant stance, fist punched straight up, cap tilted back. **Hold pose — this is the frame the emblem card lands on.** |

---

## When a frame comes back

Reject and regenerate it yourself if any of these is obviously wrong — it is cheaper than my
validation round trip:

- Pixels are not clean 8×8 blocks, or edges are soft or blurred.
- Any colour outside the 14, including a near-miss shade or a grey edge.
- Background is not fully transparent, or a shadow or ground line crept in.
- The bag, the key character, text, or a border appeared.
- His feet are not on the baseline, or he grew or shrank against the previous frame.
- Single pixels floating off the silhouette.

Two regeneration attempts per frame, then send it to me anyway and flag it — the contract allows
a targeted deterministic correction, and past that it is an art call, not a tooling one.

I validate every frame against `asset-reports/popt-sprite-contract.json`: palette conformance,
grid alignment, baseline drift, silhouette connectivity, and orphan-pixel rate (must come in
under 6%; the frames we have today measure 13.1%).
