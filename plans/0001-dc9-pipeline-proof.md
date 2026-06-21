# DC-9 Blender-to-browser pipeline proof

## Purpose

After this milestone, the owner can open a Vercel preview and judge a small model-correct DC-9 cockpit blockout from the captain’s seat. Three switches, one gauge, one annunciator, and one Memphis route card will prove that Blender names, pivots, custom properties, animations, materials, and scale survive export into the game.

## Current state

The repository contains a working React Three Fiber greybox with three interactive switches, a gauge, Crew/Captain modes, one route puzzle, persistent progress, a red vehicle proxy, and a Mars trigger. It is intentionally not a DC-9 model. Blender validation/export scripts exist, but no master `.blend` or production GLB is present.

## Scope

Included: reference-board approval, DC-9 shell/main-panel blockout, captain approval camera, three controls, one gauge, one annunciator, one route card, validation, GLB export, browser integration, accessible equivalents, screenshots, and evidence.

Excluded: full cockpit detail, real procedures, all five final puzzles, Airbus, production vehicle asset, production audio, and Blender MCP.

## Context and constraints

Follow `AGENTS.md`, `docs/VISUAL_REALISM.md`, `docs/ASSET_CONTRACT.md`, and `docs/BLENDER_PIPELINE.md`. The cockpit must look model-specific in major geometry, but interactions remain fictional. Do not use unlicensed photos as textures or copy airline logos/liveries.

## Progress

- [x] 2026-06-21 — Repository starter, greybox loop, tests, docs, scripts, Skills, and CI scaffold created.
- [ ] Approve model-correct reference board and confirm likely DC-9 variant.
- [ ] Create and validate the Blender proof asset.
- [ ] Integrate the GLB and capture approval evidence.
- [ ] Receive owner approval or record the visual delta.

## Discoveries

- The exact DC-9 variant is not yet confirmed.
- The exact Airbus model is not needed for this milestone but remains a future blocker.
- The browser application already separates game rules from 3D presentation, which allows the greybox to be replaced without rewriting puzzle state.

## Decision log

- Use Three.js through React Three Fiber because production cockpit presence, lighting, and camera movement justify real 3D.
- Use Skills and deterministic Blender scripts before MCP.
- Use a proof-of-pipeline asset before detailed modeling to reduce scale/export/pivot risk.

## Milestones

### Reference and camera gate

Build an approved reference set and place `CAM_DC9_CAPTAIN_APPROVAL`. A viewport screenshot must show a credible captain-eye sightline before detail modeling.

### Interaction-contract gate

Create `DC9_ROOT`, stable interactive names, correct pivots, and exported `game_id` properties. The validator and GLB inspector must report the expected objects.

### Browser gate

Replace or conditionally load the greybox with the proof GLB. Both 3D and HTML controls must drive the same state. The gauge and annunciator must react to puzzle completion.

### Visual approval gate

Provide fixed Blender renders and Vercel screenshots. The owner decides whether the blockout is unmistakably DC-9 and lists any visual delta.

## Implementation steps

1. Confirm Blender executable and exact version; record local setup without committing machine paths.
2. Create `art-source/blender/dc9_master.blend` from the project template.
3. Add the required root hierarchy and approval camera.
4. Build the limited blockout and interaction objects.
5. Run `npm run asset:dc9`; repair validation failures.
6. Inspect the GLB and update the asset report.
7. Add a typed DC-9 asset adapter in `src/scenes/` that verifies expected nodes and metadata.
8. Keep the existing HTML control path.
9. Run unit, browser, visual, persistence, and asset checks.
10. Update evidence and stop for owner approval.

## Validation plan

Run:

```bash
npm run asset:dc9
npm run assets:check
npm run check
npm run test:e2e
```

Test correct and wrong switch sequences, keyboard buttons, pointer controls, reload, reduced motion, missing-asset fallback, and viewports near 375, 768, and 1440 px. Check the console and capture captain-view screenshots.

## Acceptance criteria

- `dc9_master.blend` contains the required root and approval camera.
- Validation reports no errors.
- The deployable GLB contains all expected named controls and custom properties.
- The browser loads the asset without uncaught errors and retains the accessible control path.
- The owner can judge the DC-9 silhouette and captain viewpoint from a Vercel preview.
- No full-cockpit work begins before approval.

## Repair loop and stop conditions

Repeat review → focused repair → export/run → validation → remaining-delta update. Stop when all technical checks pass and the owner approves the visual direction, after three non-converging repair passes, or when a missing reference/variant decision requires owner input.

## Evidence

Record Blender version, asset report, validation output, GLB size, expected node list, screenshots, Vercel preview, commands, and owner feedback here during implementation.

## Outcome and handoff

Pending. The next milestone after approval is one polished DC-9 puzzle, not the full cockpit.
