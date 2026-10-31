# Optimus Gen 3 Tripo source intake — 2026-10-29

## Status and scene group

Owner-supplied replacement candidate for the post-Airbus congratulations escort. **Visual candidate, not a deployable game asset.** The first robot and its rejected wave remain preserved separately. No game code, protected Tesla film, or public model changed during this intake.

## Exact source and preservation

All files were found under `/mnt/2TBHDD/Downloads/` and copied byte-identically under `.cache/cockpit-pipeline/sources/model-y-reward/optimus-gen3/original/`. The source/license basis is owner-supplied Tripo output; account plan, model reference provenance, and any external likeness permission are not yet recorded.

| Source file | Bytes | SHA-256 | Purpose |
| --- | ---: | --- | --- |
| `Optimus3quad20k.glb` | 741,776 | `0c476306fa823892e6d2523e51ae7f2229cfbe54a50d773d509df89c69712836` | Unrigged P2.0 geometry |
| `Optimus3quad20k.zip` | 724,672 | `78c49c031e7a6e5fca0a1444a4b383d2ef5df87cc4e1b02207f4676c97dad3bb` | Unrigged FBX source package |
| `Optimus3_8ktexture.glb` | 7,292,824 | `b72ace21e846756deb27c27ba466383a65af44f157e435780ea0cf51a06b94ff` | 8K BaseColor intermediate |
| `Optimus3_8kPBR.glb` | 16,234,700 | `b36a1c8f5c35d7fe76b7fcde2e4a7b65f603962eed5ff2be951865d5cbe82d9b` | Unrigged full PBR source |
| `Optimus3_8krigged.glb` | 16,723,560 | `0f9a92a2549d0b48537d184c57c48777840f383b11b1c5ee007ac29b5769338d` | Rigged review target |

## Direct GLB and FBX findings

The rigged GLB has one mesh and material, 23,370 exported vertices, 40,462 triangles, one 65-joint Mixamo-named skin, and **zero animation clips**. Finger joints are present on both hands. The matching PBR model has the same triangle count and three embedded, material-wired maps: 8192×8192 BaseColor, 4096×4096 Normal, and 4096×4096 packed metallic-roughness. The texture-only intermediate contains only the 8K BaseColor and does not meet the PBR gate on its own. The unrigged GLB has no skin, textures or animation. Blender import of the FBX inside the ZIP found 16,983 quads plus 6,496 triangles (40,462 triangulated faces), with no armature. The GLB importer found nonzero vertex influence on shoulder, forearm, hand, index and thumb bones.

The complete PBR map set meets the project's 4K source-map size and wiring requirement. It does not by itself establish good browser appearance or runtime texture size. A 128×128 sample of the packed metallic-roughness image had blue-channel mean 5.4/255 and green-channel mean 133.3/255; material response may need review under game lighting. No destructive optimization was run.

## Blender 5.1.2 visual inspection

Blender background import of the exact rigged GLB succeeded. The body occupies approximately x ±0.50, y ±0.095, z 0–0.995 in import units, with feet at z≈0. The front T-pose shows a clean white and dark silhouette and individually formed fingers; the side view shows a slim profile. A controlled right shoulder 45° / forearm 70° pose raised the hand while the chest stayed visually intact in the neutral-light render. This is one pose check, not a full action-set or walk-cycle proof.

Saved evidence:

- `preview-renders/optimus-gen3-source-intake/front.png`
- `preview-renders/optimus-gen3-source-intake/side.png`
- `preview-renders/optimus-gen3-source-intake/arm-test.png`
- `preview-renders/optimus-gen3-source-intake/live-blender-bridge.png`
- `asset-reports/optimus-gen3-blender-inspection-2026-10-29.json`

The first image-pane attempt returned `not-in-tmux` because the command process lacked tmux environment variables. After the owner identified the attached `codex` tmux client, the owned image pane was updated with the front, side, arm pose, and live Blender viewport captures in sequence.

## Live Blender and Tripo Bridge session

On 2026-10-29 there was no desktop Blender process or live bridge listener. A single Blender 5.1.2 desktop instance was started with the installed Tripo Bridge add-on. The clean unsaved default scene was inspected before replacement. The exact `Optimus3_8krigged.glb` was imported into that live scene, and an intake copy was saved at `.cache/cockpit-pipeline/sources/model-y-reward/optimus-gen3/extracted/optimus3-rigged-bridge-intake.blend` (17,133,963 bytes). The saved scene contains the 65-bone armature, 40,462-triangle body, and the source's small `Icosphere` helper mesh. No animation actions were present. A live viewport screenshot was captured at the path above and shown in the owned tmux image pane.

Blender MCP listened on `127.0.0.1:9876`, and Tripo Bridge listened on `127.0.0.1:60600`. The Tripo Bridge log recorded a Tripo Studio handshake with protocol version 1.1.0; `ss` showed an established local Brave-to-Blender connection on port 60600. This proves the current bridge connection, not the quality or compatibility of any future exported clip. The intake scene is a review source, not a production master or game asset.

## Remaining delta

The owner still needs to judge whether this appearance matches the intended Optimus 3 reference. The actual source image has not been provided in the repository, so likeness cannot be independently checked. Hip/knee, wrist, finger and locomotion deformation have not yet been visually exercised. Before runtime use, create a stable Blender master with named hierarchy/pivots, author or retarget the needed motions, compare them in browser at 375/768/1440, validate accessible native handoff and Model Y spoiler gate, record source/license status, and obtain owner visual approval. No hosted preview or release claim is made.
