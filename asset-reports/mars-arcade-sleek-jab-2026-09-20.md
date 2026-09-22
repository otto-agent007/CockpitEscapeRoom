# Mars arcade — sleek wardrobe and 41px jab (2026-09-20)

## Outcome and authority

Owner approved the black-leather wardrobe ("looks good") and then accepted the final
jab extension ("41 is ok"). The dev harness now uses seven matching Booster drawings,
including a distinct pullback. Actual jab reach is41px to match the art, with damage5,
chip1 and startup/active/recovery4/3/7 unchanged. Oracle and Captain assets are untouched.
This completes the bounded outfit/jab checkpoint, not full Wave1 or production integration.

## Sources and provenance

Built-in image generation only. Exact prompts are in
`art-source/arcade/prompts/wardrobe-sleek/`; untouched outputs are in
`art-source/arcade/booster/generated/wardrobe-sleek/`. The approved anchor is
`anchor-00.png`. Original wardrobe sources, earlier jab36 attempts and rejected variants
remain preserved. No manual pixel edits were made in this pass.

All runtime cells below live under `booster/normalised-sleek-ready/`:

| Runtime cell | Raw source under generated/wardrobe-sleek | Height |
| --- | --- | --- |
| anchor/anchor-00.png | anchor-00.png | 104 |
| idle/idle-01.png | idle-01.png | 105 |
| anticipation/anticipation-00.png | anticipation-00.png | 105 |
| walk/walk-00.png | walk-00-correction-01.png | 106 |
| walk/walk-01.png | walk-01.png | 105 |
| jab/jab-00.png | jab-00-correction-02.png | 105 |
| recovery/recovery-00.png | recovery-00.png | 104 |

Unchanged pipeline:128x128 RGBA, scale14.038461538461538,
`--source-alpha --resample bilinear`, baseline119 and pivot64.
Every cell passes the unchanged gate, including standing checks on all clips.
The jab ends at column105:41px from pivot64. Accepted jab SHA-256:
`f86c13a06f00898da4d4b37f48de5a33283518971105334da42f7bbae7fe9287`.

The first wide shuffle had a one-pixel gap at(80,44); one localized source generation
closed it. First jab:41px plus a one-pixel gap at(71,67). First correction:31px, clean.
Second correction:41px, clean. The latter exceeded the earlier36±3 target; generation
stopped at the two-correction cap and the owner explicitly accepted41. No tolerance,
scale, silhouette rule or numeric validator was relaxed.

## Integration and validation

- All eleven runtime sprites load. Every Booster path uses the new outfit, including
  unauthored-pose anchor fallback. Early recovery uses its own drawing, late recovery
  returns to guard. Reduced motion freezes decorative breathing only.
- Recorded approach stops four ticks earlier than the36px draft so the real41px jab
  connects near full extension; block167, hit227, idle290. No synthetic outcomes.
- RED: outfit/recovery tests failed against old paths;41px boundary and spacing tests
  failed against reach36. GREEN:51 focused tests, then `npm run check` passed lint,
  types,672 tests in53 files, and build.
- Python normalizer3tests, prior exact Sam repair2tests, clean gate fixture and7negative
  fixtures pass. All eleven loaded cells pass. Prior pixel repairs remain unchanged.
- Browser scripts:6exchange and12pilot PASS groups. Actual canvas draws both shuffles,
  startup, jab, pullback and Sam reactions; keyboard/pointer, pause/step, replay/cancel,
  reload,375/768/1440 layouts, reduced motion and single/all-image failure paths pass.
- Isolated agent-browser confirms11/11. Production scan finds no arcade content,
  `dist/dev` or `dist/art-source`. `git diff --check` passes.
- Independent read-only code review: no Critical/Important/Minor findings. Reviewer
  independently checked all seven cells and measured41px; its Vitest attempt was blocked
  by read-only cache permissions, so full test evidence is the main-agent run.

## Evidence and remaining scope

Fresh files: `preview-renders/mars-arcade/wardrobe-sleek/`:
`check.log`, `browser-exchange.log`, `exchange-{block,hit,recovery}.png`,
`exchange-{375,768,1440}.png`, and `exchange-motion-{half,normal}.webm`.
Existing tmux pane updated with the actual in-game hit. Earlier `pose-review.png` and
`check-incomplete.log` are deliberately preserved pre-approval evidence, not current status.

Owner motion acceptance, smoother/full action animation, other attacks, arena/FX and
production chapter wiring remain open. No deployment, Vercel preview, commit, push or PR.
Whole-journey e2e and3D asset checks were not rerun for this dev-only checkpoint.
