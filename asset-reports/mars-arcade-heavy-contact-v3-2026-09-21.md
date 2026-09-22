# Booster five-beat overhand revision — 2026-09-21

OWNER REJECTED V3 CONTACT: subsequent feedback says the overhand contact is still
unacceptable. Passing technical checks and the review below do not approve its art.
V4 work restarts from a plain shoulder/elbow/wrist guide, not another V3 sleeve edit.

Update: owner approved initialV4 arm direction. C2 now matches body scale but reach34
fails minimum35; not integrated. See mars-arcade-heavy-contact-v4-2026-09-21.md for
current results. The following initial-V4 feedback checkpoint is historical.

V4 initial draft is now shown full-size in the owned sidebar, awaiting owner anatomy
feedback. Source/prompt/guide: art-source/arcade/{booster/generated,prompts}/heavy-contact-v4/.
It is not integrated: generator output1280square instead of1536square, yielding84px
height at locked scale and44px fist reach, outside35–41. Alpha/silhouette gate passes.
Do not alter scale/reach to accept it. Further drawing should preserve its reviewed
arm shape at the original body-part scale, using a portrait-format guide if accepted.

## Current result and visual limit

The dev harness now uses wind-up → forward swing → leaning contact → follow-through
→ return to guard. The same foreground arm supplies the strike. Contact reaches37px
(target38±3); timing11/4/18 and damage13 are unchanged.33runtime sprites load.
The owner rejected the earlier stretched-arm V2 contact; it is not the selected contact.
V3 leans the shoulder/torso forward to reduce the long upper arm. Its far guard is
fully occluded, not independently visible. The thick sleeve obscures exact elbow
position: technical checks and reviewer agreement are not owner anatomy approval.
Owner asked specifically that the arm not look deformed; final visual review remains open.

Owner also flagged reddish eyes. Magnified runtime sprites show warm eyelid/skin
colors dominating the tiny eye region. No Python eye-color cleanup was authorized or
performed. V3 generation requested neutral gray eyes, but the wider eye-tint concern
is not declared resolved.

## Sources and selection

Built-in imagegen only, no CLI/API fallback. V2 prompts:
`art-source/arcade/prompts/heavy-continuity-v2/`; V3 contact prompts:
`art-source/arcade/prompts/heavy-contact-v3/`. Corresponding raw files are in
`booster/generated/` under the same version names. Eight new sources preserved:
V2 swing/recovery/contact plus two contact corrections; V3 contact plus two corrections.
No previous source or rejected candidate was deleted.

All normalization uses unchanged arcade contract, source alpha, bilinear resampling
and fixed14.038461538461538scale.128×128cells, baseline119/pivot64. Body lean may lower
silhouette height without changing scale. Selected paths below are relative to
`art-source/arcade/booster/`:

| Beat | Source cell | Height | Timing |
| --- | --- | --- | --- |
| Wind-up | normalised-heavy-ready/heavy-startup/heavy-startup-00.png |103|0–6|
| Forward swing | normalised-heavy-continuity-v2/heavy-swing/heavy-swing-00.png |103|7–10|
| Contact | normalised-heavy-contact-v3-repaired/heavy-active/heavy-active-00.png |100|11–14|
| Follow-through | normalised-heavy-continuity-v2/heavy-recovery/heavy-recovery-00.png |103|15–23|
| Guard | normalised-sleek-ready/block/block-00.png |102|24–32|

First four are copied into `normalised-heavy-continuity-ready/`. Guard reuses existing
approved art. Only Booster heavy selection changes; Sam/Captain, other moves, reach,
damage, timing, reduced-motion semantics and defense priority remain unchanged.
This is a five-key-pose sequence, not certification of a complete polished animation set.

## Rejections and explicitly authorized pixel repairs

V2 initial contact reached39 and passed alpha checks but attached to the wrong shoulder;
rejected on visual inspection. C1 corrects the sleeve's foreground attachment but has a
waist hole; C2 fixes the waist but introduces one hole at70,31. Owner explicitly approved
repairing that exact pixel. Repaired V2 is preserved, but owner then rejected its stretched
upper arm. It is no longer used at runtime.

V3 initial uses torso lean but wrong foreground guard. C1 removes the ambiguous visible
guard and connects the near sleeve to the striking elbow. C2 preserves anatomy while
tucking the jacket flap; one hole remains at74,67. Owner separately approved repairing
that exact new pixel. The selected V3 has reach37, fist tips on rows46–52, and no holes.

`tools/assets/repair-arcade-heavy.py` supports only these two explicit source-hash-guarded
repairs: V2(70,31) copies(70,32), RGBA19/19/18/97; V3(74,67) copies(74,66),
RGBA10/9/9/142. Originals immutable; refuse different existing output. No general hole
filler, no alpha gate changes, no eye edits. Three repair tests were observed RED then
GREEN and prove exactly one changed pixel per authorized candidate.

## Validation

Browser plugin not available; existing installed Playwright used at
`http://127.0.0.1:5317/dev/arcade.html`.
Flow: load harness → native mirror/human controls → heavy attack → five actual
canvas poses → idle. Native held movement separately exercises hit/block/whiff.

- Heavy boundary test RED1/3, then all4GREEN. Literal frame boundaries cover both
  sides/reduced motion; state unchanged, defensive priority, Captain and idle fallback.
- Fresh `npm run check`: lint/types,691tests/55files and production build pass.
- `python3 tools/assets/repair-arcade-heavy.test.py`:3PASS.
- Unchanged full-colour gate:4selected heavy cells PASS, final contact repair PASS.
- `check-arcade-heavy.mjs`:13PASS groups, hit/block/whiff×both fighters×reduced on/off,
  all phases drawn; seven missing heavy cells produce26/33ready and safe fallback.
- `check-arcade-booster-continuity.mjs`:2PASS groups. Both Booster facings, allfive
  actual draw sources observed in the exact paused native tick; ten screenshots
  assert no simulation advancement during capture; idle return.
- Adjacent exchange7/movement5/pilot12 groups passed against33sources before final
  contact selection; final V3 rerun logs are saved separately.
- Native unmodified-clock video at1×(5.96s) and0.5×(9.60s): two complete cycles per
  Booster facing, no page errors. Videos use normal controls, no state injection.
  Inspected frozen both-facing contact/swing/follow-through and16consecutive half-speed
  video samples at8fps beginning3.2s. No arm swap observed; pose transitions remain
  discrete and visual smoothness/anatomy acceptance belongs to the owner.
- Review found a racing active screenshot in the old recorder and an ever-drawn guard
  assertion that could pass on an earlier block. Removed both: dedicated paused-tick
  checker now proves exact pose/frame including recovery guard. All V3 outputs have a
  separate directory, preserving prior gameplay captures.
- No whole-journey e2e/3D asset rerun, new dependency, production wiring, deployment,
  commit or push. Independent final review and final adjacent logs recorded below.

## Evidence

`preview-renders/mars-arcade/heavy-contact-v3/`: five-pose sheet, ten frozen native
pose captures, responsive375/768/1440screenshots, fullcheck/browser logs, normal and
half-speed videos plus original recording files, pixel-repair record and SHA256SUMS.
The owned tmux sidebar was refreshed, and half-speed video opened for owner review.
V2 evidence remains under `heavy-continuity-v2/`; its pose sheet was refreshed during
candidate comparison, so dated raw sources and runtime recordings are stronger
provenance than that evolving sheet.
