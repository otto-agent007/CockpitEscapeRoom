# Pop T v3 — frame generation pack

**Contract v3, full colour.** The machine-readable contract is
`asset-reports/popt-sprite-contract.json`; the reasoning and evidence are in
`plans/0029-popt-native-resolution.md`.

> **This pack was rewritten on 2026-08-17.** The previous version asked for "exact 8x8 blocks" of
> 14 flat colours. That was retired: gpt-image-2 cannot draw a pixel lattice (measured — 34,232
> distinct colours, 57.5% single-pixel runs, no detectable grid), and the intro's own background
> plates are 1586x992 paintings that fail the old orphan-pixel ceiling at 92.9%, so there was
> never a shared pixel grid to join. Forcing the palette deleted Pop T's mouth, fragmented his
> belt and flattened his thumbs. **Do not reintroduce the block/palette instructions.**

## How generation runs

Codex CLI's **built-in `image_gen`** tool, which bills against the ChatGPT plan and needs no API
key. Never set `OPENAI_API_KEY` for these runs and never let it fall back to `scripts/image_gen.py`
— both switch to API billing, which is what exhausted the earlier attempt.

```
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png \
  - < <prompt-file>
```

Attach **only** the identity reference. The old pixel-matrix and target-scale references are
retired — the matrix encouraged the fake pixelation, and the scale mockup is v1 art.

Ask for the largest size the generator will produce **natively**, and tell it not to resize: one
run returned 1254x1254 and was upscaled to the requested 2048, which adds blur and no detail.

## After generation

```
python3 tools/assets/normalise-popt-frame.py <generated.png> <normalised.png> \
    --source-px-per-cell-px 19.0
python3 tools/assets/check-popt-frames-fullcolour.py art-source/intro/tmb2/popt-v2/normalised
```

The scale **19.0** is locked — derived once from the Wave 0 anchor and reused for every frame, so
the character never changes size between clips. Alignment is by the foot-span midpoint. Airborne
poses need a different anchor rule, which is an open decision (see the plan).

## The invariant block

Paste this verbatim at the top of every request, then add the pose brief and the framing block.

> A flat cel-shaded 2D character illustration of a single cartoon airline pilot, full body, drawn
> in clean vector style with hard-edged colour regions.
> 
> The character matches the attached reference exactly: young male pilot, blonde hair, navy peaked
> cap with a gold band above the brim, white short-sleeve uniform shirt with gold-striped
> epaulettes on both shoulders, dark navy necktie, navy trousers with a belt, dark boots.
> 
> Colour and shading rules, followed strictly:
> - Use at most three flat shades per material: a base, one darker shade, one lighter shade.
> - Every colour region is a solid area of ONE flat colour with a hard edge. No gradients, no
>   blending, no soft edges, no glow.
> - NO specular highlights, NO shine, NO reflective streaks, NO gloss anywhere - especially not on
>   the trousers or boots.
> - NO fabric texture, NO fine wrinkles, NO creases, NO folds, NO stitching, NO pinstripes, NO
>   patterns. Trousers and shirt are plain solid colour with only broad shading.
> - NO noise, NO speckling, NO dithering, NO grain, NO stippling.
> 
> Palette to draw from: near-black #040614, dark navy #1A203F, mid navy #3A4772, off-white #F1EFF0,
> light grey-lavender #BAB7CB, mid grey #82819A, skin #F8AC75, mid skin #D5773F, deep brown #280B02,
> brown #6A320A, tan-brown #A35616, gold #F5C424, dark gold #CB8A06, near-black green #20251E.
> 
> Proportions - IMPORTANT: this is a stylised cartoon mascot, not a realistic figure. The head is
> large relative to the body: the whole figure is about FIVE head-heights tall. Short legs, compact
> torso, big head, small hands and feet. Match the chunky heroic-cartoon proportions of the attached
> reference, which is deliberately caricatured.
> 
> Facial features - IMPORTANT: this artwork will be reduced to a sprite only 104 pixels tall, so
> every facial feature must be BOLD, HIGH-CONTRAST and SIMPLIFIED or it will disappear.
> - The MOUTH must be clearly visible: a solid dark shape in a colour much darker than the skin,
>   drawn with the same weight and contrast as the eyebrows. Never a faint crease, never a thin
>   tonal line, never the same hue as the skin.
> - Eyes, eyebrows and mouth are each solid dark shapes, generously sized, well separated from one
>   another, sitting in the lower half of the face.
> - No subtle tonal shading anywhere on the face. No nose shading, no cheek blush, no soft contour.

## The framing block

Paste this after the pose brief.

> Framing: the whole figure is fully visible, standing upright and vertically centred, occupying
> about 90 percent of the image height, with a small even margin above the cap and below the boots.
> Both feet are visible and level.
> 
> Background: a completely flat solid pure magenta field, RGB 255 0 255, filling the entire canvas
> edge to edge. The magenta must appear NOWHERE on the character. No ground, no shadow, no
> horizon, no props, no text, no logo, no border, no watermark, no checkerboard.

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
