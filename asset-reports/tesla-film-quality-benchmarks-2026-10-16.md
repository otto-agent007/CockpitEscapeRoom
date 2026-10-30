# Tesla film: native quality baseline

Scope: resume the October 16 handoff and measure representative ending frames. This is a baseline for cloud/lighting polish, with no final film or asset approval.

The source is `/mnt/2TBHDD/Downloads/terafab-flyover-CANDIDATE-2026-10-16b-smooth-turn.blend`, opened in ordinary desktop Blender 5.1.2 through the installed localhost bridge. GPU: NVIDIA GeForce GTX 1050 Ti, 4 GiB. Scene: `TF_Flyover`, camera `TF_CAM_Chase`, 1,046 objects, 198 materials. No geometry, materials, textures, animation or deployable GLB was changed; source/license authority remains the existing owner-provided scene and its preserved recovery records.

Evidence: [three-frame contact sheet](../preview-renders/tesla/quality-2026-10-16/benchmark-contact.png), [machine-readable report](../preview-renders/tesla/quality-2026-10-16/BENCHMARK_REPORT.json), [replayable benchmark](../preview-renders/tesla/quality-2026-10-16/benchmark-frame.py), [qualification notes](../preview-renders/tesla/quality-2026-10-16/DIAGNOSTIC-NOTES.md).

| Frame | Subject | Native size | Wall time |
| --- | --- | --- | --- |
| 705 | Accepted repaired turn | 1920×1080 | 84.607 s |
| 780 | Sunrise/cloud break | 1920×1080 | 75.512 s |
| 840 | Bright-point ending | 1920×1080 | 64.939 s |

Profile: EEVEE, 32 render samples, four-pixel volume tiles, 64 volume samples and volume shadows. The source's transparent film setting is preserved because its compositor separates the Environment pass from mist-graded geometry. All temporary render settings and the starting frame are restored after every frame.

`python3 preview-renders/tesla/quality-2026-10-16/verify-benchmarks.py` passes: three complete/nonblank PNGs, exact dimensions/hashes, unchanged source/movie hashes, unchanged action curves, unchanged object/material counts and restored render settings. Current source SHA-256 is `fc1e61344503f0f4be39236818059b77eb685c63afe305aac6d764ab1395c9db`; movie SHA-256 remains `a0bc891c02c0d15a1dc8545ac064d7a126b2b4e060196cf2ec8ceb1d2273fa55`. The older recovery copy has a different binary hash, while sampled appearance signatures and every recorded action curve match. The later live save remains authoritative and untouched.

The first benchmark incorrectly forced opaque film and produced false haze. Three diagnostic outputs retain that mistake and are explicitly disqualified for appearance selection. Corrected `quality32-alpha` outputs are the qualifying baseline. The before/after alpha comparison identifies the benchmark error; it does not establish a defect in the saved scene.

All three native frames and the contact sheet were inspected. The cloud deck still has a flat boundary and little bank definition; the sun disc and lighting remain rough. Higher sampling improves the baseline but does not establish final visual quality. Next work is a separate bounded cloud/lighting candidate with the accepted animation, music, timing and text-free ending preserved.

The separate hangar checkpoint, current hangar master and October 6 flyover source exist. Earlier assembly scripts reuse the first 562 frames of a 12 fps joined movie before appending Terafab; the latest ending begins after movie frame 845. Neither earlier segment is benchmarked here. These three ending timings cannot verify the full 1080p/24fps render estimate; the historical 1–2 day estimate remains provisional.

The owned tmux pane `%1` was refreshed with the actual finished contact sheet. A separate post-load desktop inspection records the clean reopened source in `clean-reopen.json`. No application code or runtime asset changed, so npm, GLB export, browser journey tests and a hosted preview were not run for this offline benchmark. Full film rendering and game integration remain pending. Work remains local.

Scoped full-diff self-review found no remaining critical or high-severity findings after correcting the alpha override. Syntax, scoped whitespace, report links, finished sequence and the separate clean-reopen record pass. Before snapshots verify that the resume/report edits only add this benchmark record and preserve the prior content.
