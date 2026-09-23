# Oracle blocked-heavy reaction — 2026-09-22

## Delivered behavior

Oracle now braces for an in-range incoming heavy, compresses his guard on a confirmed
block, settles, and returns to the original raised guard. The initial brace uses existing
art; two new drawings provide compression and recovery. All are essential action poses
in both normal and reduced-motion modes. No extra shake or decorative movement added.

Booster heavy's14-frame blockstun uses elapsed0–4 compression,5–10 settle,11–13 guard.
Chip3, guard damage16, knockback and all rule timing remain unchanged. Bracing is only
shown while already blocking a nearby heavy startup; distant attacks do not trigger it.
Light blocks retain their previous drawing. Guard crush follows the clean-hit reaction,
not the block animation. Reset, reload, terminal phases and expired stun clear metadata.

The dev presentation helper was renamed from updateHeavyHitReactions to
updateHeavyReactions and now distinguishes hit/block events. No game-rule file changes.
The selector and harness consume this metadata without mutating combat state.
Runtime now loads44 sources; missing new artwork uses the existing box fallback.

## Source and asset contract

Built-in imagegen, two initial generations, both accepted without corrections.
Reference: `art-source/arcade/oracle/generated/exchange-v1/block-02.png`.
All new files below are under `art-source/arcade/`:
- Raw sources: `oracle/generated/heavy-block-v1/compress-00.png`, `settle-00.png`.
- Selected128×128 RGBA cells: `oracle/normalised-heavy-block-ready/compress/compress-00.png`
  and `oracle/normalised-heavy-block-ready/settle/settle-00.png`.
- Exact complete prompts: `prompts/heavy-block-v1/compress-00.txt`, `settle-00.txt`.

No manual pixel edits or pipeline changes. Existing normalizer uses source-alpha,
bilinear and fixed Oracle scale13.60576923076923. Compression foreground570×1402 becomes
42×103, rows17–119/cols44–85; settle535×1433 becomes39×105, rows15–119/cols45–83.
Both retain baseline119 and pivot64. Unchanged asset gate:2frames,0failures.
Original guard/recoil and approved heavy cells remain byte-identical to HEAD.
No new dependency, paid API or tutorial artwork copied. ASSET-SHA256SUMS saved/verified.

## Verification

Evidence root: `preview-renders/mars-arcade/heavy-block-v1/`.
- TDD RED:2failed/2passed, missing brace/sequence. Focused GREEN:23tests across4files.
- Final `npm run check`: lint, types,775tests in63files, production build PASS.
  First run found test-only prefer-const errors, corrected before the passing run.
- Dedicated native block browser:7PASS groups, covering both facings, reduced motion,
  actual canvas draws, pause/step/reset/reload, chip3/guard16 and missing new art.
  Repeated-block proof drains the real guard meter; the fourth heavy crushes guard,
  switches to clean-hit recoil, and deals13damage after three3-damage blocks.
- Existing clean-hit browser:6PASS groups; heavy hit/block/whiff:13; pilot:12.
  Pilot covers375/768/1440 widths, keyboard controls and all-art failure.
- Normal-speed before/after and half-speed revised recordings each complete four real
  blocked heavy attacks, two per direction, with return to guard and no page errors.
- Actual browser sheet and consecutive normal-speed frames inspected; sidebar pane%1
  updated with block-sheet.png. Short before-after.mp4 skips setup; hit-vs-block.mp4
  compares the clean-hit and blocked-hit motions. Independent clips are not frame-locked.
- Full-diff self-review found no critical/high issue. Final script lint and diff check PASS.

Reproduce: serve local worktree on5349, run `node tools/assets/check-arcade-heavy-block.mjs`.
ARCADE_PILOT_URL overrides URL, ARCADE_EVIDENCE_DIR preserves separate output folders.
Recorder: `record-arcade-heavy-block.mjs`; ARCADE_MOTION_SPEED=0.5 selects half speed.

## Boundaries

Dev-only local harness, no commit/push/deploy or production wiring. No full-journey e2e,
3D asset suite, movement or outcome-suite rerun for this slice. Oracle's blocked-heavy
sequence is implemented; owner visual acceptance remains separate. Booster's received
hit/block reactions, broader jab polish, specials, and the previously rejected deeper
clean-hit stagger drawing remain outside this checkpoint.
