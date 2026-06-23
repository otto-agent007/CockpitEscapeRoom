# DC-9 Three-Agent Foundation Report

## Scope

Ubuntu-owned foundation only. No full cockpit sourcing or construction was performed, and no production model under `public/models/**` was created or replaced.

## Files Changed

- `art-source/cockpit-pipeline/**`
- `asset-reports/cockpit-pipeline/**`
- `preview-renders/cockpit-pipeline/**`
- `tools/blender/AGENTS.md`
- `tools/blender/cockpit_pipeline/**`

## Commands Run

| Command | Result |
|---|---|
| `git fetch origin main` | Pass |
| `git checkout -B asset/dc9-three-agent-foundation origin/main` | Pass |
| `python3 -m unittest discover tools/blender/cockpit_pipeline/tests` | Pass, 5 tests |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-manifest art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/manifests/source-approved.json` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from source-approved --to assembly-approved` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from assembly-approved --to shading-approved` | Pass |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from requested --to assembly-approved` | Expected fail; assembly blocked before source approval |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli can-transition --from source-approved --to shading-approved` | Expected fail; shading blocked before assembly approval |
| `python3 -m tools.blender.cockpit_pipeline.preflight` | Pass |
| `BLENDER_BIN=/does/not/exist python3 -m tools.blender.cockpit_pipeline.preflight` | Expected fail; missing Blender reported |
| `BLENDER_EXPECTED_VERSION=9.9 python3 -m tools.blender.cockpit_pipeline.preflight` | Expected fail; version mismatch reported |
| `python3 -m tools.blender.cockpit_pipeline.pipeline_cli blender-smoke` | Pass |

## Toolchain Evidence

- Repository root: `/mnt/2TBHDD/CockpitEscapeRoom`
- Active branch: `asset/dc9-three-agent-foundation`
- Blender executable: `/home/user1/.local/bin/blender`
- Blender version: `Blender 5.1.2`
- Node version: `v26.3.0`
- Git version: `git version 2.43.0`
- Git LFS availability: `git-lfs/3.4.1`
- Pipeline cache path: `/mnt/2TBHDD/CockpitEscapeRoom/.cache/cockpit-pipeline`

## Generated Evidence

Disposable, untracked cache outputs:

- `.cache/cockpit-pipeline/blender-smoke/neutral-preview.png`
- `.cache/cockpit-pipeline/blender-smoke/cockpit-pipeline-smoke.glb`
- `.cache/cockpit-pipeline/blender-smoke/smoke-report.json`

The smoke report recorded a 3316-byte temporary GLB and reopened/imported `SMOKE_ROOT` and `SMOKE_YOKE`.

## Remaining Limitations

- The source manifest is a sample contract with a local technical note, not a real aircraft source approval.
- Licensing analysis is intentionally out of scope.
- The final DC-9 variant remains unresolved; sample records preserve `sourceVariant`, `targetVariant`, and `variantScope`.
- Windows-owned `TEST_REPORT.md` was not updated because this Ubuntu task is constrained to Ubuntu-owned paths.

## Agent 1 Launch Command

```bash
python3 -m tools.blender.cockpit_pipeline.preflight && python3 -m tools.blender.cockpit_pipeline.pipeline_cli validate-job art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json
```

After that command passes, use `tools/blender/cockpit_pipeline/prompts/agent1-sourcing.md` with `art-source/cockpit-pipeline/jobs/sample-dc9-unresolved-vertical-slice/job.json`.
