# Mars arcade sprite Wave 0 prompt

## Goal

Produce the three Wave 0 identity anchors for the Mars arcade cabinet — one neutral fighting
stance per archetype — normalised into the contract cell, passing the objective gate, with
each fighter's source scale derived and recorded. Owner review of the three identities is the
deliverable; no motion frames follow until they are approved.

## Context

The fight loop is committed and proven headlessly (`src/game/marsArcade.ts`, 34 tests). The
art contract is `asset-reports/mars-arcade-sprite-contract.json` and the process is
`asset-reports/mars-arcade-frame-prompt-pack.md`; the living record is
`plans/0044-mars-arcade-fight-loop.md`. Ready-to-send prompt text for all three anchors is
already assembled in `art-source/arcade/prompts/anchor-*.txt` — send those, do not rewrite
them. `art-source/arcade/README.md` holds the exact commands.

Generation runs through Codex's **built-in `image_gen`**, billed to the ChatGPT plan. Never
set `OPENAI_API_KEY` and never fall back to `scripts/image_gen.py`; both switch to API
billing. Only `captain` has an existing identity reference to attach
(`art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png`); the other two
anchors create theirs.

Use `$blender-web-assets` for the asset-report discipline. Medium reasoning is enough; this
is a bounded generation-and-validation pass, not a design task.

**Unresolved, and not yours to settle:** `prompts/04_AIRBUS_BONUS_AND_MARS.md` already claims
the Mars Easter egg for the red Model Y as a surface vehicle. The cabinet may sit inside that
mission or supersede it. Do not resolve this; flag it and continue — Wave 0 is art, and
nothing here depends on the answer.

## Constraints

- The fighters are unnamed invented archetypes. No real or public person may be named,
  caricatured, or made recognisable, in artwork or in prompt text. Owner decision 2026-09-19.
- Full-colour route only. Do not reintroduce the retired 14-colour palette or 8×8 block
  instructions from the Pop T v2 contract; they deleted his mouth and fragmented his belt.
- Derive `--source-px-per-cell-px` once per fighter from that fighter's own anchor with
  `--derive-scale`, record it, and never re-fit it per frame.
- Nothing in this asset group may depict or reference the protected ground-transport reward.
- THE CAPTAIN is Pop T: same 104 px standing height and 128 px cell as his intro frames, so
  the same character cannot change size between chapters.
- Two regeneration attempts per frame, then flag it rather than fighting it.
- Wave 0 only. Do not begin Wave 1, do not touch the fight rules, and do not wire anything
  into the app.

## Done when

- `art-source/arcade/<fighter>/normalised/anchor/anchor-00.png` exists for all three.
- `python3 tools/assets/check-popt-frames-fullcolour.py --contract
  asset-reports/mars-arcade-sprite-contract.json art-source/arcade/<fighter>/normalised`
  exits 0 for each fighter.
- Each fighter's derived scale is recorded in `plans/0044-mars-arcade-fight-loop.md`.
- `npm run check` still passes and `dist/` still contains no arcade content.
- The three anchors are presented side by side for owner review, with the Mars-slot conflict
  noted and unresolved.
