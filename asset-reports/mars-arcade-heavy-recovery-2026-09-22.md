# Booster heavy early recovery — 2026-09-22

## Result and scope

One new early-recovery cell bridges the existing extended contact and low follow-through.
Move frames 15–18 select the new retraction, 19–23 keep the existing follow-through,
and 24–32 keep the existing guard. Startup 0–10 and contact 11–14 are unchanged.
Combat remains 11/4/18 frames, reach 38, damage 13. No game-rule module changed.
All four approved heavy cells remain byte-identical to HEAD, including V4 contact.
The six-pose animation is a bounded improvement, not completion of the animation set.

## Provenance and generation

Built-in imagegen, one initial generation, no corrections or manual pixel editing.
Inputs: `booster/generated/heavy-contact-v4/active-00-c2.png` (identity/scale/stance)
and `booster/generated/heavy-continuity-v2/recovery-00.png` (destination of near arm),
under `art-source/arcade/`. Existing owner-directed project artwork; no tutorial art copied.
Exact final prompt: `art-source/arcade/prompts/heavy-recovery-v1/retract-00.txt`.
Generated source: `art-source/arcade/booster/generated/heavy-recovery-v1/retract-00.png`.
Runtime cell: `art-source/arcade/booster/normalised-heavy-recovery-v1/heavy-retract/heavy-retract-00.png`.
The reference tutorial's video-generation service was not used or purchased.

## Asset contract

Source 1024×1536 RGBA. Unchanged `normalise-popt-frame.py` with source alpha,
bilinear and fixed source-px-per-cell-px 14.038461538461538: bbox 979×1464 to 70×104,
placed rows16–119/cols29–98 in128×128. Unchanged full-colour checker:1frame/0failures.
Runtime uses39 unique sources. No source scale, global contract, normalizer, eye cleanup,
other fighter, production loading or dependency change. Hashes: `ASSET-SHA256SUMS`.

## Validation and evidence

Evidence root: `preview-renders/mars-arcade/heavy-recovery-v1/`.
- Selector boundaries RED (expected missing retract) then GREEN,15 focused tests.
- `npm run check`: lint, types,745 tests/60 files, production build PASS.
- Browser continuity:6 exact paused draws in both facings;2 PASS groups.
- Browser heavy:hit/block/whiff for both fighters with/without reduced motion;
  missing all8heavy drawings falls back safely;13 PASS groups.
- Browser exchange:7 PASS groups; movement:5; pilot:12.
- Before normal-speed video and after normal/half-speed videos saved. Each recording
  completes two native-input attacks per facing, without uncaught page errors.
- Read-only visual review: source and runtime cell, actual-browser three-pose comparison,
  and18 consecutive normal-speed plus18half-speed samples at15fps. Fist lowers and retracts on the same
  foreground arm. Old contact-to-follow-through stance change still exists; this pass
  bridges it, not a claim of continuous video-derived or fully polished animation.
- Sidebar pane %1 updated to `recovery-comparison.png`.
- Outcome suite initially exposed an existing probe mismatch: old fillText instrumentation
  sees no banner after PR76's pixel-font renderer. Replace with actual pixel-font glyph draw observation,
  requiring both headline/subtitle and their bottom above stage row80. Final outcomes rerun:7PASS groups (both winners with normal/reduced motion plus
  actual timer draw, timeout winner and missing-outcome timeout).
  Browser-only mutation moved the banner y34→134; the same assertion rejected bottom175.
  No runtime layout was modified to obtain a passing check.

Reproduce: serve this worktree with `npm run dev -- --port 5349 --strictPort`;
set `ARCADE_PILOT_URL=http://127.0.0.1:5349/dev/arcade.html` and
`ARCADE_EVIDENCE_DIR=preview-renders/mars-arcade/heavy-recovery-v1/<suite>` before
running `node tools/assets/check-arcade-<suite>.mjs` for booster-continuity,
heavy, exchange, movement, outcomes or pilot. Output override preserves older evidence.
Record with `record-arcade-booster-continuity.mjs`, ARCADE_MOTION_SPEED=1 or0.5.

## Limits and review

Dev-only; no production wiring, deployment, PR update, full-journey e2e or3D asset suite.
Owner visual acceptance remains open. Specials, Oracle/Captain outcomes and further
motion polish remain. Existing unrelated reference-study additions to the plan preserved.
Full-diff self-review: no rule change, duplicate source, new dependency, unsafe DOM
insertion or production asset leak. Banner-probe mutation confirms the retained overlap gate rejects a real layout regression.
