# DC-9-51 Reference and Source Package

## Purpose

Create the first CockpitEscapeRoom reference-to-source package for the DC-9 cockpit build. This package starts from the primary DC-9-51 / Northwest cockpit image and prepares Agent 1 source discovery to find, rank, and hand off source candidates without silently mixing variants.

## Primary reference

- Reference ID: `dc9_51_n775nc_cockpit_primary`
- Local file: `art-source/references/dc9-51/primary/dc9_51_n775nc_cockpit_primary.jpg`
- Source page: recorded in `art-source/references/reference-manifest.yaml`
- Aircraft: McDonnell Douglas DC-9-51
- Operator: Northwest Airlines
- Registration: N775NC
- Classification: primary visual target

## Files added

- `art-source/references/dc9-51/annotations/dc9_51_n775nc_cockpit_primary_callouts.svg`
- `art-source/references/dc9-51/notes/dc9-51-primary-zone-brief.md`
- `art-source/references/dc9-51/notes/source-discovery-seed.md`
- `art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json`
- `asset-reports/references/dc9-51-reference-source-package.md`

## Modeling zones prepared

The SVG annotation and zone brief define these first modeling zones:

1. Main analog instrument panel.
2. Glareshield, autopilot band, and annunciators.
3. Throttle pedestal and lower radio stack.
4. Captain and first-officer yoke pair.
5. Center gauge stack.
6. Overhead density placeholder.
7. Left and right sidewall placeholders.
8. Windshield frame, wipers, and daylight framing.

## Source discovery intent

The new source discovery seed asks Agent 1 to search at least three source families for each requested component:

1. Extractable 3D/model source.
2. Real cockpit visual reference.
3. Variant/documentation source.

Each candidate must record source location, source variant, target variant, variant scope, geometry completeness, pivot/animation evidence, material evidence, confidence, selection status, limitations, and downstream warnings for Agent 2.

## First source job

Job file: `art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json`

Requested components:

- cockpit shell and main panel blockout;
- captain and first-officer yoke pair;
- throttle pedestal blockout and source candidates;
- main panel gauge density set;
- overhead panel density placeholder.

The job stops at `sourcing_complete` and requires human approval before assembly.

## Validation evidence

This is a reference/source documentation checkpoint. No Blender scene, GLB, material, texture, or runtime file changed.

Recommended validation for the next local run:

```bash
python3 -m tools.blender.cockpit_pipeline.preflight
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/dc9-reference-source-discovery/job.json
python3 -m unittest discover tools/blender/cockpit_pipeline/tests
git diff --check
```

If `validate-job` rejects the extra reference/source fields, either extend the job schema deliberately or convert this job to a seed spec consumed by a future Agent 1 prompt. Do not weaken validation silently.

## Remaining limitations

- One front-facing photo cannot resolve exact overhead, sidewall, pedestal depth, rear cockpit, or label details.
- The primary image is not a texture source.
- Existing DC-9-32 geometry may be useful but must remain labeled as DC-9-32 unless component compatibility is recorded.
- The package prepares source discovery; it does not approve any source candidate for assembly.
