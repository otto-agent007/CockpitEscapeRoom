# Mars arcade — Sam guarded footwork (2026-09-20)

## Approved bounded outcome

Owner approved two guarded backward-shuffle poses so Sam steps rather than sliding in
a fixed guard. The dev selector alternates them every six simulation ticks only when
Oracle is walking and blocking. Actual blockstun and hitstun retain the existing guard
and recoil drawings. Idle returns to the existing anchor; forward walking and other
unauthored actions remain explicitly labeled placeholders.

Elon's sleek outfit, 41px jab, all fight rules and recorded input timings are unchanged.
No changes to Sam's accepted block/recoil files or their earlier exact pixel repairs.

## Art provenance

Built-in image generation, two outputs, no corrective generations or manual pixel edits.
Input: `oracle/generated/exchange-v1/block-02.png` under `art-source/arcade/`.
Exact prompts: `art-source/arcade/prompts/sam-footwork/walk-back-{00,01}.txt`.
Raw outputs: `art-source/arcade/oracle/generated/sam-footwork/walk-back-{00,01}.png`.
Both first normalized copies remain in `oracle/normalised-footwork-v1/walk-back/`;
runtime copies are in `oracle/normalised-footwork-ready/walk-back/`.

Same fixed scale13.60576923076923, `--source-alpha --resample bilinear`, 128x128 RGBA.
Both cells:104px standing height, baseline119, pivot64, one connected figure, no tiny holes,
no chroma residue. Bounds: rear plant x34..93; catch-up x44..84. Both passed the unchanged
standing/silhouette checker on the first attempt. Face/outfit and mirrored poses inspected.

SHA-256, source then runtime:

- Rear plant source: `d469f2d92d4b4bf1608d291936078fbc0a82379ec59e5b6690eff28d7cae2a55`.
- Rear plant runtime: `9d2fba4a9bcb3ea51d49f862105a4e0896acbccee297ac59903191ecf4a51739`.
- Catch-up source: `185ee02a19c42a98168f42a04846fa93adc29490be805260443cfd5265946762`.
- Catch-up runtime: `ae9f7cd15b0a8812a244039013270f66cd25e35371418a8145515d11fdd766cf`.

## Verification

- Selector regression RED against the former fixed guard, then GREEN: both poses, both
  facings, reduced motion, defense priority, stopping, forward-walk and KO fallback.
- Focused52 tests pass; `npm run check` passes lint/types,673 tests in53files and build.
- All13 loaded sprites pass their unchanged gates. Python normalizer3tests, prior Sam
  repair2tests, clean gate plus7negative fixtures pass. No validator modifications.
- Browser exchange6PASS and pilot12PASS groups: actual canvas draws both new paths in
  normal/reduced motion; guarded movement screenshots at163/180, block167, hit227,
  idle290. Native controls, pause/step, replay/cancel, reload,375/768/1440 and missing-image
  fallback pass. Isolated agent-browser independently reports13/13 ready.
- Independent read-only review found no actionable issues; reviewer visually inspected
  new cells/browser captures and independently passed both cells through the checker.
  Reviewer did not rerun full tests or judge continuous video motion.
- Production exclusion scan and `git diff --check` pass. No game-rule or production entry changes.

## Evidence and limitations

`preview-renders/mars-arcade/sam-footwork/` contains `pose-review.png`,
`sam-catch-up.png`, `sam-rear-plant.png`, responsive/defense screenshots,
`check.log`, `browser-{exchange,pilot}.log`, `motion.log`,
and `exchange-motion-{half,normal}.webm`.
The pose comparison was displayed in the existing owned tmux pane.

This is a two-pose backward-walk improvement, not complete or fully smooth character
animation. Owner motion acceptance, forward walking and remaining moves/FX are open.
No production integration, deployment/Vercel preview, commit, push or PR.
Whole-journey e2e and3D asset checks were not rerun.
