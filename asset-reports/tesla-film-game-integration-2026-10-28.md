# Tesla film replaces the reward hangar — local integration

The original deployable-copy record below is historical. The 2026-10-30 PR #118 runtime update at the end of this report records the smaller, quality-checked movie that now ships.

## Source and deployable copy

The completed final movie is `preview-renders/tesla/final-film-2026-10-27/tesla-flight-mode-final-candidate.mp4`. `FINAL_MEDIA_REPORT.json` records 1920×1080, 24 fps, 85.416667 seconds, 2050 frames, original AAC packet identity, full decode and a black last second. The deployable `public/media/tesla-flight-mode-final.mp4` is an exact byte copy, SHA-256 `542f09152b7d9e096410e18acc4902665e084bdaaf3311a929349c1db5b6637c`, 60,766,724 bytes. No transcoding, new soundtrack or GLB edit occurred. Film picture is project/owner-authored from the staged Blender masters; the soundtrack is the unchanged stream from the earlier owner-provided joined preview. Soundtrack rights were not re-audited in this local integration.

## Player behavior

The owner's correction supersedes the earlier optional-dialog version. After Engine-Out Handling, the existing Captain Mode completion card's Continue action enters the protected reward phase and opens the film directly. The old 11.5-second legacy hangar runtime scene is no longer rendered or requested. Native video controls are present; audible playback is attempted on entry, with Play film available if blocked. Reduced-motion and accessible routes wait for Play. Film end or Skip opens the family tribute and earns optional Mars access. Retry handles failed media requests, and Replay starts the movie again. Progress stays local. The old Model Y GLB and Blender master remain preserved as historical sources.

## Validation

Focused direct-film browser regression failed against the prior hangar and passed after replacement. Engine Out win → Captain Mode Continue → direct film passed in Chromium, including no old GLB request. A failed-media case exposed a source/error-handler race; assigning the source after mount repaired it. A combined-run test race was repaired by proving Retry makes a second request before lifting the simulated outage. Final combined Engine Out/reward Chromium run passed 11/11; reward-only suite passed 5/5 after final error-handler tightening. The browser exercised native controls, real playback, near-end completion, replay, keyboard Skip, reload, reduced motion, failed-load Retry and protected request timing.

`npm run check` passed lint, typecheck, 1,032/1,032 unit tests in 94 files and build. `npm run assets:check` passed with the existing nonfatal GLB notices. `node tools/ci/spoiler-guard.mjs dist` passed with no protected reward terms in the initial download. Source, public and built movie SHA-256 match exactly. Scoped `git diff --check` passed. Actual browser captures `preview-renders/model-y-reward/{1440,768,375}-direct-tesla-film.png` were opened and inspected; video controls and player actions fit without horizontal overflow. Scoped source/test/media review found no critical/high issue.

## Remaining boundary

This is a local deployable candidate. Hosted preview, full-journey browser suite, final complete-game visual approval and release deployment remain open. The brief straight horizon edge near scene739 remains in the final film and is documented in the offline film report.

## 2026-10-30 PR #118 runtime size update

The exact-copy statement above describes the 2026-10-28 candidate. PR #118 now keeps that approved original in Git parent commit `171a7a7` (SHA-256 `542f09152b7d9e096410e18acc4902665e084bdaaf3311a929349c1db5b6637c`, 60,766,724 bytes) while `public/media/tesla-flight-mode-final.mp4` ships a smaller H.264 runtime copy (SHA-256 `b4698d81fb3c931a7d3c2a5a9c8213e4620b30b2ec7726138cd80992f27a8dfd`, 38,596,084 bytes). The two-pass libx264 encode used `slow`, 3400 kbps target and `+faststart`; the AAC stream was copied, not re-encoded. Both have 1920×1080 picture, 24 fps, 2,050 frames and 85.416667 seconds. The 4,005 AAC packets have matching SHA-256 `806fa2f86749a54b1e8e293fab503de07c0689f8ca0715dbd751a3fc3c66e281`.

Full 2,050-frame SSIM averaged 0.990039; the lowest frame was 0.969956 and none was below 0.95. `ffmpeg -xerror` decoded the complete runtime movie successfully. Black detection found the final black passage from 84.4167 to 85.375 seconds. This is a quality-checked compression of the same cut; it does not resolve the soundtrack-rights or owner final-review gates.
