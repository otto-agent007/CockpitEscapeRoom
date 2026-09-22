# Booster contact V4 — integrated with owner-approved reach exception

## Current result

Owner said “1 pixel is good enough,” approving the34px art reach for V4 C2. This is
an explicit contact-specific exception to the earlier35px minimum, not a global gate
change. C2 is now byte-identical to the selected runtime contact. No further generation
or pixel editing. V3 original/repaired source remains preserved. Gameplay reach38,
damage13, timing11/4/18, other poses/fighters, normalizer and contract are unchanged.

## Fresh integration verification

- Before copy, exact runtime/C2 comparison was RED; after copy it was GREEN.
- Selected four heavy cells: unchanged full-colour checker4frames/0failures. Contact
  height104, reach34, no tiny holes. The reach discrepancy is accepted, not concealed.
- `npm run check`: lint, types,691tests across55files, production build all pass.
- `node tools/assets/check-arcade-heavy.mjs`:13PASS groups — both fighters' hit/block/
  whiff outcomes with/without reduced motion, plus missing-heavy fallback.33sprites
  ready normally,26ready/7failed in deliberate fallback. Page identity and no uncaught
  page errors verified.375/768/1440widths have no horizontal overflow.
- `node tools/assets/check-arcade-booster-continuity.mjs`:2PASS groups, all five actual
  draws in exact paused native ticks in both Booster facings, then idle. Ten screenshots.
- `record-arcade-booster-continuity.mjs` at ARCADE_MOTION_SPEED1 and0.5: both facings
  complete two native-input cycles each, no page errors. Videos5.92s/9.60s respectively.
- Viewed both frozen contact facings and16consecutive half-speed video samples at8fps
  starting3.2s. Arm remains the foreground arm through wind-up/swing/contact/recovery;
  discrete key-pose motion remains, not a claim of fully polished in-between animation.
- Browser plugin not available; installed Playwright used against
  http://127.0.0.1:5317/dev/arcade.html. Flow: native heavy input → five artwork beats →
  hit/block/whiff or mirror demonstration → idle. No blank screen or framework overlay
  in inspected captures; no uncaught page errors. Full console-warning audit not rerun.
- Only three script output paths change(v3→v4); assertions unchanged. Gameplay code
  unchanged this integration turn. Evidence remains separate from previousV3 captures.
- Independent read-only review found no new critical/high or blocking issue; verified
  C2 byte identity, preservedV3 and other poses, mechanics and no renewed arm swap or
  V2 stretching. Review sampled motion, not uninterrupted normal-speed smoothness;
  exact anatomy beneath clothing/every-spacing hit alignment/final owner acceptance
  remain outside that verdict. These are not asserted as complete here.
- No full journey e2e, deployment, whole animation-set acceptance, eye cleanup, commit
  or push. Red-eye concern on other poses remains open.

Evidence: `preview-renders/mars-arcade/heavy-contact-v4/` contains fullcheck/browser/
motion logs, videos, frozen captures and refreshed sidebar pose sheet.
`RUNTIME-SHA256SUMS` verifies selected contact bytes; `SHA256SUMS` preserves candidates.

## Earlier candidate history — superseded by owner exception above

Owner approved the initial V4 arm shape as better. This approves anatomy direction,
not runtime dimensions or the complete five-beat animation. V2 and V3 remain rejected.

## Scope and invariants

Correct only Booster contact body scale/reach while retaining the approved tapered,
nearly straight camera-near arm and aligned wrist. Preserve original sources and all
attempts. No change to 11/4/18 timing, damage13, reach38, other poses/fighters or the
normalizer/contract. No additional pixel or eye-color editing permission is implied.

Built-in imagegen edits; no API/CLI fallback. Exact prompts and original code-native
SVG/PNG placement guides: `art-source/arcade/prompts/heavy-contact-v4/`.
Raw sources: `art-source/arcade/booster/generated/heavy-contact-v4/`.
All normalized cells use fixed14.038461538461538scale, source alpha and bilinear filter.

## Preserved attempts

- Initial:1280square output despite1536square request. Normalized height84/reach44;
  no holes, but size and reach fail. Owner approved the arm shape after sidebar review.
- C1:1024×1536 portrait. Bbox972×1254 →69×89; height89/reach36, fist tips49–55.
  Unchanged full-colour gate passes and no tiny holes; body is still undersized beside
  the103px startup. Not integrated. C2 targets body-part size using original startup
  as a second reference, retaining the contact arm shape and reducing excess margins.

## Validation status

- C2:1024×1536 portrait. Bbox976×1464 →70×104; height104, consistent with103px
  startup/swing/recovery. Fist reaches34px on rows37–43; boot also reaches34px on
  rows115–119. Thus it is ONE pixel short of minimum35 and is not integrated.
  Full-colour gate passes, no tiny alpha holes. Sidebar five-pose sheet shows C2 at
  unchanged scale; the straighter tapered sleeve remains, without the V3 bowed shape.
- Two targeted corrections are preserved. Bounded batch stops at remaining reach
  failure, not at claimed completion. Further reach correction needs owner direction.
- Fresh commands: unchanged normalizer for C1 and C2; full-colour checker1frame/0failures
  for each; read-only reach/height/hole measurements. Reach is a separate FAIL for C2.
- No application code, selected runtime cells, combat rules, contract or normalizer
  changed this turn. Runtime still uses the rejected V3 preview pending a passing V4.
  No browser/fullcheck rerun or completed visual fix claimed. No pixel repairs performed.

Evidence: `preview-renders/mars-arcade/heavy-contact-v4/pose-review.png` (owned pane%1),
`asset-checks.log` and `SHA256SUMS`. Initial/C1/C2 source and normalized files preserved.
Red-eye concern on other runtime poses remains open; no eye pixel edits performed.
