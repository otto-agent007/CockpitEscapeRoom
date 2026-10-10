# Mars arcade combat box draft — 2026-10-03

Owner accepted the current boxes for continued work: "box feel looks good for now".
All 15 revised clips now carry `reviewed: true`. Both rules were off at that acceptance
checkpoint. The owner subsequently requested both enabled; plan 0050 records activation.
The draft status/evidence below records checkpoint `d321a21`.
Current proof command: `node preview-renders/mars-arcade/box-review-2026-10-03/box-draft-proof.mjs --accepted`.

Draft boxes for 51 existing frames in 15 clips. The owner's current Oracle walk stays.
The gym now distinguishes head, upper body, legs, and protruding limbs instead of filling
the entire silhouette rectangle. A long stride can be swept without a jab hitting the air
above its foot; an extended punch can be struck without making the air below it vulnerable.

## Scope and source authority

Changed: `src/game/marsArcadeAnimations.json` hurtboxes, two Oracle-heavy body outlines,
and Oracle-heavy review status. All revised clips remain `reviewed: false`. The validator's
warning now says boxes await owner sign-off, because manual drafts are no longer seeds.
Previously reviewed Booster jab/block and Oracle block remain byte-for-byte equivalent.

Clips: Booster idle/walk-forward/walk-back/heavy/special/hit/jump; Oracle
idle/walk-forward/walk-back/jab/heavy/hit/jump; Captain idle. Existing PNG paths,
holds, phases, strike/guard boxes, sprite contract, source art, licenses, tuning, candidates,
and fighter content are unchanged. No image generation, normalization, optimization,
material/texture/export change, dependency, or production integration occurred.

Cells remain 128x128 RGBA, authored facing right around pivot x=64 and floor row 119.
Regional rectangles approximate anatomy and still include some empty pixels between legs.
Owner visual judgment and optional-rule balance acceptance remain open. Cosmetic
heavy-block/outcome clips and the rejected walk candidate keep their existing seeded boxes.
Captain still lacks move clips; its attacks retain the reach fallback. Projectile boxes and
crouch/low-defense mechanics are outside this pass.

## Optional-bounds distance changes

Furthest whole-pixel separation against an idle defender, measured through the engine.
Only hurtboxes changed; strikes and holds did not. With bounds off, every existing reach
boundary stays the same. Bounds and hit stop still default off.

| Move | Defender | Bounds before | Bounds draft | Delta |
| --- | --- | ---: | ---: | ---: |
| Booster jab | Oracle | 59 | 56 | -3 |
| Booster jab | Captain | 55 | 53 | -2 |
| Booster heavy | Oracle | 53 | 50 | -3 |
| Booster heavy | Captain | 49 | 47 | -2 |
| Oracle jab | Booster | 62 | 60 | -2 |
| Oracle jab | Captain | 55 | 53 | -2 |
| Oracle sweep | Booster | 61 | 61 | 0 |
| Oracle sweep | Captain | 54 | 53 | -1 |

Oracle sweep's startup drawing starts at row 40, while its old hurtbox started at row 28.
The revised head follows the crouch; torso, support leg, and raised leg are separate.
Settle now follows its own drawing. Both stale silhouette warnings disappear.
Booster heavy's existing drawn-reach exception remains intact.

## Actual validation

- New regressions failed on the previous boxes: mirrored stride mid-air miss / low-leg
  hit for both fighters; Oracle crouch empty-air miss / raised-shoe coverage; mirrored
  active-arm hit / empty-air miss for Booster heavy and Oracle jab. They now pass.
- Focused bounds/animation/connect Vitest: 51 tests pass. The 56 hit / 57 miss jab boundary
  is proved through the engine on both facings; reach-only and jump/guard paths remain pinned.
- `npm run check`: lint, TypeScript, 884 tests in 74 files, build pass.
- `npm run arcade:validate`: 25 clips, 79 frames, 72 drawings; 0 errors, 22 owner-sign-off
  warnings. Baseline had 23 warnings: two stale silhouette warnings plus 21 unreviewed clips.
- Final gym/playground/bounds browser scripts pass: 13/7/6 ok. They cover real playback,
  overlays, keyboard edits/undo, invalid Save, tuning/reset, candidate isolation, low guard,
  hit stop, and reduced motion. Each uses this pass's isolated evidence directory.
- `box-draft-proof.mjs` passes: all 51 frames visited at 375/768/1440, box counts and pending
  sign-off verified, mirror/onion/keyboard exercised, four moves hit at the reported distance
  and miss one pixel farther, repeated invalid Save refused, reload restores data, switches
  and candidate load off, no horizontal overflow or page errors. Responsive screenshots are
  representative; 51 individual before/draft comparisons cover every revised drawing.
- The proof asserts the entire animation table matches baseline after removing the intended
  box edits and Oracle-heavy flag change. Art/tuning/fighter-content Git comparison and
  `git diff --check` pass. Independent full-diff review found no issues.

## Review and recovery

Local gallery: http://127.0.0.1:5360/preview-renders/mars-arcade/box-review-2026-10-03/review.html
Gym/playground: http://127.0.0.1:5360/dev/gym.html and /dev/arcade.html.

Evidence directory contains `before.json` from `9d7e649`, `connect-before.md`,
`connect-after.md`, `review.html`, 51 images under `comparison/`, representative captures
under `responsive/`, and check logs. Reproduce the gallery/responsive proof from this
worktree with `node preview-renders/mars-arcade/box-review-2026-10-03/box-draft-proof.mjs`.
It reads the current table and does not save animations or tuning.

The arcade-animation skill requires "box sign-off (the `reviewed` flag)" as a human gate.
This is a completed engineering draft, awaiting that judgment. No hosted preview or
production-journey E2E was run; local evidence is for the dev-only arcade tools.
