# DC-9-51 Reference Pack

## Purpose

Create a compact, license-aware reference library and Blender reference-board scene for a Northwest-style McDonnell Douglas DC-9-51 cockpit. After this milestone, a maintainer can validate the source list, download only approved references, generate contact sheets and a modeling brief, and open a Blender scene that separates primary layout material from secondary, presentation, and missing-view placeholders.

## Current state

`origin/main` contains the starter browser game, Blender pipeline scripts, and one DC-9 pipeline-proof plan. It does not yet contain a structured aircraft reference library, reference manifest validation, contact sheets, or a Blender reference-board scene. The current game remains a greybox and must stay labeled as such until approval.

## Scope

Included: `art-source/references/` hierarchy, YAML manifest, source/report docs, reference tooling under `tools/references/`, package scripts, a Blender reference-scene setup script, and a scoped aircraft-reference curator Skill.

Excluded: final cockpit geometry, production DC-9 modeling, Airbus, Tesla, Mars, MCP tooling, real aircraft procedures, generated GLB changes, and browser game integration.

## Context and constraints

Follow `AGENTS.md`, `docs/VISUAL_REALISM.md`, `docs/ASSET_CONTRACT.md`, and `docs/BLENDER_PIPELINE.md`. The target cockpit definition is Northwest-style DC-9-51, using N775NC as the highest-confidence seed. Lower-ranked DC-9 variants may fill gaps only for shared components or materials and must remain labeled. Simulator coverage is presentation benchmarking only, not authoritative geometry. Reference images are not texture rights unless the manifest explicitly says so.

The Blender scene must never touch `art-source/blender/dc9_master.blend`. Reference boards must be excluded from production export and disabled from normal production rendering.

## Progress

- [x] 2026-06-22 — Created branch `blender/dc9-reference-pack` from `origin/main`.
- [x] 2026-06-22 — Added reference directories, manifest, docs, and source notes.
- [x] 2026-06-22 — Added reference validation, download, contact-sheet, brief, and aggregate check scripts.
- [x] 2026-06-22 — Added Blender reference scene setup and validation/check mode.
- [x] 2026-06-22 — Ran reference and Blender validation commands; evidence recorded below.
- [ ] Run full app `npm run check` after npm registry dependency install succeeds.

## Discoveries

- Wikimedia Commons hosts the seed Northwest DC-9-51/N775NC cockpit photo under CC BY-SA 2.0 and identifies Cory W. Watts as author.
- Wikimedia Commons also hosts a Northwest DC-9-40 cockpit image under selectable GFDL/CC licensing. It is useful only as a secondary shared-layout/material reference because it is not the target -51.
- Simulation Daily coverage of a DC-9 simulator package is useful for presentation benchmarking, but it covers DC-9-10 and DC-9-30 packages rather than the Northwest DC-9-51 target.

## Decision log

- 2026-06-22 — Use YAML as the durable manifest format because it is readable for artists and maintainers; validation uses existing workstation PyYAML, with no new npm production dependency.
- 2026-06-22 — Treat the Wikimedia N775NC cockpit photo as the only primary geometry/layout source in the seed pack.
- 2026-06-22 — Download only entries with an explicit `direct_image_url`; non-downloadable or presentation sources remain manifest/report references with placeholders.
- 2026-06-22 — Generate contact sheets as SVG so the pipeline stays stdlib-only and does not require Pillow.

## Milestones

### Manifest gate

The reference manifest validates required fields, classification vocabulary, variant labeling, local-file placement, duplicate filenames, and unmanifested downloads.

### Source acquisition gate

Downloadable Commons entries can be fetched deterministically, hashed, and reported without overwriting changed files unless `--force` is used.

### Briefing gate

The contact sheet and modeling brief summarize what each source can and cannot support, including missing views and variant-mixing cautions.

### Blender board gate

`art-source/blender/dc9_reference_scene.blend` contains `REF_DC9_51` with the required subcollections, locked image boards for every local reference image, fixed cameras, annotations, and missing-view placeholders.

## Implementation steps

1. Add `plans/0002-dc9-reference-pack.md`.
2. Add `art-source/references/README.md`, `reference-manifest.yaml`, `REFERENCE_REPORT.md`, `dc9-51/notes/modeling-brief.md`, `dc9-51/notes/presentation-benchmark.md`, contact sheets, annotations, and `local-private/.gitkeep`.
3. Add `tools/references/validate_manifest.py`, `download_references.py`, `build_contact_sheet.py`, `generate_modeling_brief.py`, and `check_references.py`.
4. Add `tools/blender/setup_dc9_reference_scene.py`.
5. Add package scripts: `references:validate`, `references:download`, `references:contact-sheet`, `references:brief`, and `references:check`.
6. Run the reference commands and Blender command with the local Blender executable.
7. Update `TEST_REPORT.md` and this plan with actual evidence.

## Validation plan

Run:

```bash
npm run references:validate
npm run references:download
npm run references:contact-sheet
npm run references:brief
npm run references:check
BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py
npm run assets:check
npm run check
```

Inspect the generated SVG contact sheet and `.cache/references/dc9_reference_overview.png` preview when Blender can run. Confirm `references:check` does not download network assets.

## Acceptance criteria

- The requested reference hierarchy exists.
- Manifest validation rejects missing required fields, invalid classifications, unlabeled variants, bad local-file placements, duplicate local filenames, unmanifested downloads, missing confidence, and missing compatibility notes.
- Downloads are deterministic and write SHA-256 state back to the manifest.
- Contact sheets and modeling brief are generated from the manifest.
- Blender reference scene contains required collections, locked reference boards, fixed cameras, annotations, missing-view placeholders, and custom properties on local image reference objects.
- `references:check` is offline and does not invoke downloads.
- Existing app/tooling checks still pass or any failure is recorded honestly.

## Repair loop and stop conditions

Repeat review -> focused repair -> execution/validation -> remaining-delta review. Stop when all acceptance checks pass, after three non-converging attempts, if a required source becomes unavailable, or if owner visual approval is needed.

## Evidence

2026-06-22 evidence:

- `npm run references:validate` passed.
- `npm run references:download` passed and downloaded 3 Commons references, recording SHA-256 hashes in `reference-manifest.yaml`.
- `npm run references:contact-sheet` passed and generated `art-source/references/dc9-51/contact-sheets/dc9-51-contact-sheet.svg`.
- `npm run references:brief` passed and generated `art-source/references/dc9-51/notes/modeling-brief.md`.
- `npm run references:check` passed; it validated the manifest, generated artifacts, built/validated the Blender reference scene, and rendered `.cache/references/dc9_reference_overview.png` without downloading.
- `BLENDER_BIN=/home/user1/.local/bin/blender blender --background --python tools/blender/setup_dc9_reference_scene.py` passed.
- `npm run assets:check` passed in the bootstrap state with no production GLB files.
- `npm run check` did not complete: the first attempt failed immediately because `node_modules/.bin/eslint` was missing; `npm install` then became idle and was stopped; `npm ci` retried internal package-gateway tarball downloads for more than seven minutes and was stopped after repeated `ETIMEDOUT` entries. Full app validation remains blocked by dependency installation, not by a known source-code failure.

## Outcome and handoff

The reference-pack tooling and Blender board are implemented. Remaining limitations: only one seed image is true DC-9-51 cockpit geometry; overhead, pedestal, sidewall, first-officer-side, and close detail views still need owner-approved primary references before production DC-9 modeling. Full app validation should be rerun after dependency installation succeeds.
