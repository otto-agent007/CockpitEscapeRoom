# Tesla final film — completed local film and game integration handoff

The owner authorized combining the earlier full Tesla movie with the approved N physical cloud passage for the final film. The old 1100×620/12 fps movie remains `/mnt/2TBHDD/Downloads/flying-tesla-terafab-JOINED-PREVIEW-2026-10-16b-smooth-turn.mp4`, SHA-256 `a0bc891c02c0d15a1dc8545ac064d7a126b2b4e060196cf2ec8ceb1d2273fa55`. It is a reference and soundtrack source, not the new picture source.

## Current job

The desktop Blender 5.1.2 pipeline finished all three segments and local assembly. `PIPELINE_PROGRESS.json` says complete and `FINAL_MEDIA_REPORT.json` says pass. No publishing or deployment occurred. The movie was opened in Totem for the owner; the owner replied “nice put it in the game.” Game integration is tracked in plan0070. The owner later clarified that the old runtime legacy hangar must be replaced completely: Engine Out Continue now opens the film itself, followed by the tribute.

The validated local movie is `tesla-flight-mode-final-candidate.mp4`, SHA-256 `542f09152b7d9e096410e18acc4902665e084bdaaf3311a929349c1db5b6637c`. `FINAL_MEDIA_REPORT.json` records2050 video frames at1920×1080/24fps, original AAC packet hash, full decode and black tail. `public/media/tesla-flight-mode-final.mp4` is a byte-identical game copy. Preserve both files and the approved source masters; use plan0070 and its asset report for browser evidence.

`tesla-flight-mode-combined-review-12fps.mp4` is retained only as a diagnostic: its audio and frame checks pass, but the old-preview-to-N splice at scene703→705 has a visible sky exposure jump. Do not present it as the final cut. The native film renders the full new ending from scene567 and avoids that temporary splice. `COMBINED_REVIEW_REPORT.json` and `combined-review-anchors/` record the finding.

## Exact film contract

24 fps sequence: hangar frames1–1124 (1124), flyover1–566 (566), ending567–902 (336), then24 black frames. Total2050 video frames/85.4167 s; black begins84.4167 s. The original AAC soundtrack is copied without reencoding and its packet stream should hash `806fa2f86749a54b1e8e293fab503de07c0689f8ca0715dbd751a3fc3c66e281`. No closing title or quote. Render settings: hangar64 EEVEE samples, flyover48, ending32 with volume128/tile4 and film transparency. The ending uses its Main layer through754 and VehicleOnly from755 onward, as in the accepted proof.

The master files are under `art-source/blender/`: `flying-tesla-hangar-CHECKPOINT-2026-09-15d-bttfA-cloudfade.blend` (`c38c738...`), `terafab-flyover-CANDIDATE-2026-10-06a-high-flyover.blend` (`32c4dea...`), and `tesla-film-final-2026-10-28-trail-fade.blend` (`9f99da8...`). First two are byte-identical local copies of the Downloads checkpoints. The ending is a separate candidate derived from exact owner-approved N (`34726fd...`), not the unreviewed later save at the old N pathname. It changes only three afterburner plume Z-scale curves to remove a dark segmented trail at scene727 and restores original size by755. Native frame763 is pixel identical to owner-approved N. The approved N source remains untouched.

## Evidence and review boundary

Native still pilots, trail isolation, the candidate recipe and four animation batch benchmarks are in this folder. All three source segments passed missing-texture, source-hash, clean-scene and settings-restoration checks. Flyover566 and candidate ending567 were visually continuous; hangar1124 and flyover1 are both cloud-covered. The remaining straight horizon edge visible briefly near candidate frame739 at 1080p is recorded for final visual review. Approximate picture-render time from warm-frame benchmarks is18 hours plus variation and encoding.
Old joined-movie hangar frames150/400 were also compared with native staged-master frames300/800; transformation and hover shot compositions match the old cut mapping. Extracted references are under `old-cut-reference/`.

See [plan 0069](../../../plans/0069-tesla-final-film.md), [plan 0070](../../../plans/0070-tesla-film-game-integration.md), [asset report](../../../asset-reports/tesla-final-film-2026-10-28.md), and `TEST_REPORT.md`. Final complete-game review remains open. This is local same-disk work; no remote publication.
