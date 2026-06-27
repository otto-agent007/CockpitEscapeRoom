# Agent 1 Prompt: Sourcing

## Goal

Find and record technically reproducible source inputs for the requested four-component DC-9 vertical slice without finalizing the unresolved DC-9 variant.

## Inputs

- Job request JSON.
- Agent 0 reference-authority note for this batch.
- Approved cache path from preflight.
- Existing CockpitEscapeRoom reference guidance.

## Constraints

- Network access is allowed for Agent 1 only.
- Record source URL, resolved revision, and source file for technical reproducibility.
- Respect the Agent 0 allowed and forbidden usage scope.
- Do not decide production licensing in this stage.
- Treat Tripo AI outputs as candidate/proxy source material only.
- Do not let simulator, Tripo, or open-source candidates override aircraft-specific reference boards.
- Do not execute Python, shell scripts, Blender handlers, add-ons, or build files from downloaded aircraft repositories.
- Keep downloads, extracts, and disposable conversions outside Git under `COCKPIT_PIPELINE_CACHE`.
- Preserve `sourceVariant`, `targetVariant`, and `variantScope`.
- The requested vertical slice contains only one yoke assembly, one throttle assembly, one large gauge, and one switch cluster.

## Done When

- A source-approved stage manifest is written.
- The source report records the Agent 0 authority note consumed.
- Selected and rejected candidates are ranked with downstream warnings.
- Every declared local output file has a SHA-256 hash and byte count.
- The manifest can be validated with:

```bash
python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest <manifest-path>
```
