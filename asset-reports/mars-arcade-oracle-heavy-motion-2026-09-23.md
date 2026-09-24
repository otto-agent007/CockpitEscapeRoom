# Oracle heavy motion — 2026-09-23

## Result and scope

Oracle's HARD CUTOFF, a low sweep kick (startup 13 / active 3 / recovery 20), played only
three drawings: it held the squat for 13 frames, snapped to full extension, and jumped from
half-risen straight to idle. Booster's heavy was rebuilt to eight poses after the owner
rejected stiff motion. Oracle now plays five poses:

| Frames | Pose | Source |
| --- | --- | --- |
| startup 0–9 | wind-up (squat) | existing |
| startup 10–12 | **sweep**: leg swinging in at ankle height | new |
| active 13–15 | contact | existing |
| recovery 0–11 | rise (fists at chin) | existing |
| recovery 12–19 | **settle**: upright, hands opening toward idle | new |

Combat values are unchanged: no rules, balance, reach, normaliser, contract, dependency or
production change. Presentation only. Runtime sources went from 66 to 68.

The plan was four in-betweens. Two did not make it, for measured reasons (below):
**chamber** (knee lifted, before the sweep) and **retract** (leg pulled back, after
contact).

## Provenance

Built-in Codex image generation (ChatGPT plan, no API key). Prompts:
`art-source/arcade/prompts/oracle-heavy-motion-v1/`. Raw sources:
`art-source/arcade/oracle/generated/heavy-motion-v1/`. Runtime:
`art-source/arcade/oracle/normalised-heavy-motion-ready/`. Oracle's fixed scale
13.60576923076923, bilinear, source alpha, unchanged normaliser. No hand-painted pixels.

- **settle**: `settle-00.png`, first attempt (one rerun, because the first call referred
  to an unattached third image and Codex declined without generating).
- **sweep**: `sweep-00-v2.png`, a fresh source. v1 overshot the contact (reach 54 vs 42);
  its pose correction came back oversized (source head width 312 → 378 px).
- **retract**: rejected. v1 was at scale (head 320 px) but did not retract: the leg still
  reached past the contact (45 vs 42) and it had a speck. Its pose correction, v2, and v3
  and v4 (with side-by-side neighbour references) all drew the head too large: 329–363 px on
  the full-resolution sources, against 298–320 for the contact, rise and sweep around it.
  That is a visible size pulse right after the kick lands. See `scale-census-head.log`.
- **chamber**: rejected. Three sources, seven generations. v1 and v2 each kept a speck in
  the sleeve-to-raised-thigh wedge through both corrections. v3 was redesigned with the
  fists at the chin and still had two specks; it also reached 41, about as far as the
  contact.

Seventeen image generations in total (chamber 7, retract 5, sweep 3, settle 1, contact
redraw 1), plus the one declined call and one bent-knee contact candidate never used.

## What was learned

- **Correcting a pose by editing inflates the figure.** Both corrections that changed the
  pose came back larger: head width on the source went 312 → 378 px (sweep) and 320 → 363
  (retract). A speck-only correction kept scale (chamber 332 → 333). Fix a wrong pose with
  a fresh source, not an edit.
- **Measure scale on the head, in the full-resolution source.** The planted sneaker is NOT
  a reliable ruler: it foreshortens with the pose. It said the approved contact was 15%
  small (15 px vs 17–19); the head says it is in range (305 px against 277–320 for its
  neighbours), and a same-scale crop of the heads confirms it. `scale-census.log` keeps the
  misleading sneaker numbers for the record. A first hair census counted the trousers too
  and was discarded.
- **The contact does not shrink; the crouch does.** The "smaller on impact" look is the
  deeper squat (73 rows tall against 80–92), not the drawing scale.
- The sweep's foot sits slightly above and past the contact toe (reach 47 vs 42), so the
  kick arcs in rather than stopping short. It reads as follow-through in the browser, but
  it is the owner's call.

## Contact redraw attempt — reverted

On the wrong sneaker reading, the owner asked for the contact to be fixed. A redraw at
"full size" (`contact-00.png`, gate PASS) reached 54 px against the rules' 40, and the owner
chose to raise HARD CUTOFF's reach to 52 to match. The head census then showed the
redraw's head was the oversized one (350 px against 277–320), and the original contact was
in range. Both the contact swap and the reach change were reverted: the rules files match
`origin/main`. The redraw stays local as a rejected candidate
(`normalised-heavy-contact-v1/`), with a bent-knee candidate (`contact-01.png`) that was
never needed. The owner was told plainly.

## Hitbox bug found and fixed

The gym pairs saved boxes with poses by position and only appends new frames at the end.
Adding the sweep and settle shifted `oracle:heavy`'s authored boxes: the contact's attack
box landed on the sweep pose. `src/game/marsArcadeBounds.json` is migrated to the five-pose
order (wind-up, sweep, contact, rise, settle). The authored boxes are unchanged on their own
poses; the two new poses get starter body/hurt boxes from their same-phase neighbour and no
attack box. New test `keeps every saved frame on a pose with the same phase` in
`arcadeGymManifest.test.ts` fails on the shifted file and passes on both the original
three-pose layout and the migrated one.

## Verification

- Selector tests (`arcadeHarnessHeavy.test.ts`): RED 2 fail / 2 pass against the previous
  selector, then GREEN. Frame boundaries in both facings, both motion preferences,
  unchanged state, and a real simulated attack that draws every pose then idles.
- `npm run check`: 831 tests in 70 files, lint, types, build PASS.
- Gate: 2 frames, 0 failures.
- New `tools/assets/check-arcade-oracle-heavy-continuity.mjs`: 2 PASS. Five distinct
  canvas draws on paused native ticks in both facings, screenshots unchanged by capture,
  idle return. `check-arcade-heavy.mjs` now also requires the Oracle sweep and settle
  draws and blocks them in its missing-art run: 13 PASS. Every other arcade suite passes
  at 68 sources. The gym loads `oracle:heavy` with 5 frames and no page errors.
- Browsers ran on Playwright 1.61 / Chromium 1228 from the main checkout (main's Chromium
  1243 download timed out in the sandbox). Not run: full-journey e2e, 3D suite, real-time
  recording. Technically verified, not owner-approved.

## Evidence

`preview-renders/mars-arcade/oracle-heavy-motion-v1/`: `browser-pose-sheet.png` (the five
browser-drawn poses), per-pose canvas screenshots for both facings,
`candidates-true-scale-sheet.png` (all candidates at runtime scale, including the rejected
chamber and retract), `scale-census.log`, browser and gate logs, `SHA256SUMS`. Rejected
raws and intermediate normalised folders stay local.

```bash
ARCADE_PILOT_URL=http://127.0.0.1:5352/dev/arcade.html node tools/assets/check-arcade-oracle-heavy-continuity.mjs
ARCADE_PILOT_URL=http://127.0.0.1:5352/dev/arcade.html node tools/assets/check-arcade-heavy.mjs
python3 tools/assets/check-popt-frames-fullcolour.py \
  art-source/arcade/oracle/normalised-heavy-motion-ready \
  --contract asset-reports/mars-arcade-sprite-contract.json
```
