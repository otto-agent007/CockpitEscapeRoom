# Mars arcade Wave 1 pilot — 2026-09-20

Status: **bounded dev-only likeness pilot; full Wave 1 incomplete**. Owner accepted the
cleaned Elon Musk / Sam Altman direction and asked to continue. Existing game rules,
production app, persistence, preload manifests, and `public/` assets are unchanged.

## Source and provenance

Built-in image generation, with Booster's approved `generated/anchor-likeness-00.png`
as reference. Four first probes and three corrective outputs are retained under
`art-source/arcade/booster/generated/wave-1/`. Exact prompts are under
`art-source/arcade/prompts/wave-1/`. No external source/license, paid API, or new dependency.
These are project-generated cartoon likeness assets, not photographs or endorsements.

Raw outputs are 1024×1536 RGBA. Despite the first prompts asking for magenta, the tool
returned actual alpha. Dark hidden RGB behind alpha zero is **not** an opaque black
background. The old importer discarded alpha; a new opt-in `--source-alpha` uses it,
retains edge transparency, ignores hidden RGB, and rounds float-unpremultiplied color to
the nearest 8-bit value. The legacy magenta/Lanczos path remains byte-identical.

All exports retain Booster's fixed scale **14.038461538461538** and bilinear filter.
No per-pose fitting, hand-painted sprite edits, silhouette filling, or checker exceptions.
Runtime pilot images are four separate 128×128 RGBA PNGs: the three approved anchors and
one idle-inhale frame. No atlas/material/3D pipeline change; only these four images preload,
and only in the dev harness. Nearest-neighbor rendering uses integer 1×/2×/3× CSS stages.

## Probe results and bounded stop

| Probe | Result | Use |
| --- | --- | --- |
| idle-01 attempt 00 | 104 px tall, baseline 119, bounds x40–87; unchanged gate passes | Pilot idle only |
| walk-forward-00 attempt 00 | Gate passes, but lifted boot makes foot-span centering shift the body | Not integrated |
| padJab-00 attempt 00 | One tiny enclosed transparent hole | Preserved, rejected |
| padJab-00 attempt 01 | 104 px tall; unchanged gate passes | Preserved; incomplete clip not integrated |
| padJab-01 attempt 00 | 96 px tall; rightmost extent 41 vs required 30±3 | Rejected for scale/reach |
| padJab-01 attempt 01 | 103 px tall; reach still 41; one transparent speck | Rejected |
| padJab-01 attempt 02 | 103 px tall; reach 28 now acceptable; one speck remains | Rejected; two-correction cap reached |

The first four-frame checkpoint did not pass, so the remaining 43-drawing fighter/5-FX
batch was not generated. Do not treat individual probe successes as complete clip approval.
Next art work must resolve source registration for a lifted foot and the jab silhouette,
then recheck the short motion sample before scaling up. Never weaken the gate to admit it.

Candidate exports are in `normalised-wave-1`, `normalised-wave-1-repair`, and
`normalised-wave-1-final`. The **only accepted new runtime export** is separately under
`normalised-wave-1-pilot/idle/idle-01.png`, generated with the final importer. Earlier
sources, normalized versions, and review sheets remain intact.

## Dev presentation

`/dev/arcade.html` now renders the approved identities. Booster has a two-pose idle preview,
selected from simulation frame count; all combat and round-outcome poses explicitly say
`anchor placeholder — pose not authored`. Oracle/Captain remain static identity anchors.
This is not a completed fighting animation set, and cannot prove the art matches attack reach.

`src/dev/arcadeHarnessSprites.ts` lists only the four accepted image URLs. Missing or
wrong-sized images fall back to the existing boxes, with loading/failure status. Optional
box mode and the original hit regions/centre lines remain available. Input hooks add native
buttons/selects, pointer capture, pause/step/restart, a mirror preset, blur cancellation,
and tap retention across sub-frame render ticks. Reduced motion disables decorative idle
cycling, not essential fight movement. This dev prototype is not full accessibility acceptance.

## Evidence

- Python normalizer regression: RED on missing alpha option, then exact edge-color rounding;
  GREEN **3 tests**, including byte-identical default exports and unchanged source bytes.
- Existing gate mutation tests: clean fixture passes, all seven defects rejected.
- All four runtime pilot images pass the unchanged standing-height/silhouette gate.
- Selector/input Vitest: **9/9**. Full `npm run check`: lint, types, **657 tests / 52 files**,
  and production build pass. Logs: `preview-renders/mars-arcade/wave-1-pilot-check.log`.
- `node tools/assets/check-arcade-pilot.mjs` verifies loading, pause/exact single step,
  responsive integer scaling at 375/768/1440 with no overflow, keyboard movement/hit/block,
  jump/landing, paused native attack, pointer release outside a button, blur cancellation,
  restart, mirror/identity selection, box toggle, reduced motion, reload, and all-images-missing
  fallback. No uncaught browser errors. Log: `wave-1-pilot-browser.log` in the same folder.
- Browser timing findings: ResizeObserver and media-query change delivery are asynchronous.
  Assertions now await observed layout/status instead of assuming 40 simulated ms is enough.
- agent-browser initial launch needed isolated `--no-sandbox` for the host's user-namespace
  restriction. Successful retry showed controls, no page errors, and no Vite overlay.
- Screenshots: `wave-1-pilot-{375,768,1440}.png`, `wave-1-pilot-stage.png`,
  `wave-1-pilot-missing-art.png`; inspect actual render, not only geometry. Stage and candidate
  contact sheet are shown via the existing owned tmux pane, not a new terminal session.
- Independent read-only code review found no actionable defects for this bounded pilot;
  reviewer independently passed Python 3 tests and Vitest 9 tests. Full art/accessibility,
  later wave integration, and browser verification were explicitly outside that review.
- Completed production output scan: no arcade identifiers/source URLs, no `dist/dev`.
  No Vercel preview, deploy, push, commit, PR, or Mars cabinet wiring performed.

Remaining acceptance: full pose set/FX, registration/strike visual coherence, both special
landing outcomes and win/loss with completed art, animation/feel owner review, and later
Mars placement decision. This checkpoint is not full Wave 1 completion.
