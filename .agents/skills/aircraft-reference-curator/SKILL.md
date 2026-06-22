---
name: aircraft-reference-curator
description: Build and maintain license-aware aircraft reference packs for CockpitEscapeRoom, including manifest entries, contact sheets, modeling briefs, and variant-mixing guardrails.
---

# Aircraft Reference Curator Workflow

Use this skill when adding or revising aircraft references, source manifests, contact sheets, modeling briefs, or Blender reference boards.

## Required Reading

1. `AGENTS.md`
2. `docs/VISUAL_REALISM.md`
3. `art-source/references/README.md`
4. The active reference-pack ExecPlan

## Workflow

1. Define the target aircraft, variant, operator, era, and cockpit section.
2. Rank sources by authority:
   - Primary: same aircraft variant/operator/cockpit section.
   - Secondary: nearby DC-9 variants or shared family components.
   - Presentation: simulator, render, article, or mood material.
   - Mood: broad texture/lighting inspiration only.
   - Rejected: documented but excluded.
3. Record every source in `art-source/references/reference-manifest.yaml` before downloading.
4. Download only when the manifest includes a direct image URL and license-compatible source record.
5. Label variant, operator, registration, viewpoint, confidence, intended uses, limitations, and target compatibility for every entry.
6. Keep original images untouched. Put callouts and markups under `annotations/`.
7. Run `npm run references:check` after changing the manifest, downloads, contact sheets, brief, or Blender reference scene.

## Variant-Mixing Guardrails

- The DC-9 target is Northwest-style DC-9-51 unless an owner decision changes it.
- Lower-ranked DC-9 variants may fill gaps only for shared analog layout, material family, or component shape.
- MD-80/MD-81 references are derivative-family references and must not drive target DC-9-51 geometry unless a specific shared component is documented.
- Simulator sources are presentation benchmarks only.
- If two strong real-aircraft references conflict on a major cockpit feature, stop and record the conflict instead of choosing silently.

## Output

Report source IDs added or changed, license/usage limits, generated artifacts, validation commands, missing views, and any owner decisions required before production modeling.
