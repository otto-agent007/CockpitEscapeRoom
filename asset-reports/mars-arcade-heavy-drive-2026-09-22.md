# Booster heavy drive pass — 2026-09-22

## Result

The owner rejected the recovery-only pass as stiff and weak. Two new drawings now
add forward drive before contact and an intermediate return to guard. The previous
retraction drawing stays. Eight poses span the same 33-frame heavy attack:
wind-up 0–4, swing 5–7, drive 8–10, contact 11–14, retract 15–18,
follow-through 19–23, settle 24–28, guard 29–32.
Combat remains startup 11 / active 4 / recovery 18, damage 13, reach 38.
Original heavy cells, including the approved V4 contact, are byte-identical to HEAD.
Other fighters, stage/HUD work and production gameplay were not changed by this pass.

## Assets and provenance

Built-in imagegen used existing project art as references; no tutorial artwork copied.
Exact prompts are in `art-source/arcade/prompts/heavy-drive-v1/`.
Raw sources are in `art-source/arcade/booster/generated/heavy-drive-v1/`.
Initial drive failed the unchanged gate on one tiny internal alpha hole. One focused
imagegen correction passed. Initial settle passed. Both attempts and correction are
preserved; no manual pixel editing or gate relaxation.
Selected cells live in `booster/normalised-heavy-drive-ready/` under the arcade art root.
Unchanged normalizer: source-alpha, bilinear, source scale 14.038461538461538.
Drive foreground 980×1455 becomes 70×104; settle 779×1449 becomes 55×103.
Both are 128×128 RGBA with baseline 119 and pivot 64. Gate: 2 frames, 0 failures.
Runtime source count is 41. No new dependency or paid video service.

## Verification

Evidence: `preview-renders/mars-arcade/heavy-drive-v1/`.
- Selector regression RED then GREEN: 15 focused tests.
- `npm run check`: lint, types, 767 tests / 61 files, production build PASS.
  This includes the concurrent character-gym checkpoint already present in the worktree.
- Native browser heavy: 13 PASS groups covering hit/block/whiff, both directions,
  reduced motion and missing-art fallback (all 10 heavy cells unavailable).
- Continuity: 2 PASS groups; eight distinct actual canvas draws at frozen native ticks.
- Exchange: 7 PASS groups. Pilot: 12 PASS groups, including 375/768/1440 layouts,
  keyboard, pause/step, reload and missing-art controls.
- Normal and half-speed recordings each complete two attacks in both directions,
  without uncaught page errors. Before normal-speed capture is preserved.
- `before-after.mp4` is a side-by-side normal-speed capture; browser startup timing
  is not frame-locked between the independent recordings.
- Actual-browser eight-pose sheet inspected and displayed in existing tmux pane %1.
- Full diff self-review and `git diff --check` pass; no critical/high finding.

## Limits

This is a bounded heavy-motion revision, not approval of the whole combat presentation.
Contact power still depends on the existing hit reactions/effects; no new hitstop,
impact sound or balance tuning was added. Owner motion review remains open.
Outcome and movement suites passed during the immediately preceding recovery pass;
not repeated for these two additional poses. No full-journey e2e, 3D asset suite,
production deployment, commit or push. Historical evidence is preserved.
