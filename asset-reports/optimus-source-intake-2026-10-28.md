# Optimus Tripo source intake — 2026-10-28

## Scope and status

Owner-supplied Tripo candidate for a congratulatory escort after Airbus Engine-Out Handling and before the protected Tesla Flight Mode film. **Rejected by owner on 2026-10-28 for the intended Optimus Gen 3 look.** Preserved as evidence only. No deployable model, runtime integration, or owner visual approval is claimed.

## Provenance

- Found at `/mnt/2TBHDD/Thermo/tesla+humanoid+robot+3d+model_Clone1.glb` after the owner named the export. It was not in either Downloads folder.
- Byte-identical intake copy: `.cache/cockpit-pipeline/sources/model-y-reward/optimus/original/tesla+humanoid+robot+3d+model_Clone1.glb`.
- SHA-256 of source and copy: `c1683a9bdfdd845927172c078b203a3e04f44af05faf4740b4da0e16f2462afb`.
- Source is owner supplied from Tripo. The exact Tripo account/license/export settings have not been verified.

## Direct GLB inspection

| Measure | Result |
| --- | --- |
| File size | 32,307,848 bytes |
| Format | glTF binary 2.0 |
| Geometry | 1 mesh, 1 primitive, 419,542 vertices, 800,965 triangles |
| Rig | 1 skin, 39 joints |
| Animation | 0 clips |
| Materials and textures | 1 material, 1 JPEG image at 2048 x 2048 |
| PBR source set | No separate 4K BaseColor, Normal, or metallic-roughness source maps in this GLB |

The presence of a skin and joints explains why Tripo treats this particular export as rigged and blocks its Retopo tool. It does not prove when or how the rig was added in Tripo. The missing animation explains why a wave cannot play from this file as exported.

## Blender inspection

Imported a copy into Blender 5.1.2 in a background intake process; the approved Tesla scene was not opened or changed. Blender found the 39-bone armature and an armature modifier on the robot mesh. A neutral-light front render is at `preview-renders/optimus-source-intake/front.png`. It shows a recognizable white and dark humanoid robot standing with its arms down. This is source appearance proof, not a browser or animation proof.

## Remaining intake delta

1. Inspect the armature pose and joint axes, then prepare a wave candidate from a separate working copy. Do not retopologize the original GLB in place.
2. Obtain an unrigged high-detail source or perform controlled Blender geometry optimization with deformation checks. Record resulting triangle count and preserve skinning, names, and hierarchy.
3. Obtain/verify complete 4096 x 4096 BaseColor, Normal, and metallic-roughness source maps before production runtime use, per `docs/ASSET_PIPELINE.md` and `TripoAssetLessons.md`.
4. Establish stable Blender source, export contract, preview, browser visual gate, responsive and accessible transition, and spoiler checks before integrating into the game.

## Retained wave experiment and owner decision

An isolated Blender 5.1.2 candidate at `art-source/blender/optimus-escort-wave-candidate.blend` was built by `tools/blender/build_optimus_wave_candidate.py`. The first upper-arm wave pulled the chest mesh open; its rejected render and archived GLB/Blend remain under `preview-renders/optimus-source-intake/` and `.cache/assets/optimus/`. An elbow-led two-second wave kept the shoulder visually stable. Its 24-frame Workbench proof is `preview-renders/optimus-source-intake/wave-preview-workbench.mp4`; a one-minute loop was opened in the desktop video player for owner review. The staged GLB contains a 39-joint skin and `OPTIMUS_CONGRATULATE_WAVE` animation; Blender reimport measured the right-hand head 0.284 m from rest at frame 24 and returned it to rest at frame 48. It remains 800,965 triangles and has only a 2K source image.

The owner requested a new, better Optimus Gen 3-based model with a reusable rig for all needed motions. The first model and wave are **not** the selected production asset. The new generation recipe is `asset-reports/optimus-gen3-generation-brief-2026-10-28.md`.
