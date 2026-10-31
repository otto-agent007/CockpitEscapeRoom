# Optimus congratulations and reward handoff

## Purpose

After Engine-Out Handling, an Optimus robot congratulates the player for completing Pop T Captain Mode and offers an accessible action to open the protected Tesla Flight Mode film. The red Model Y remains unrevealed until that action.

## 2026-10-29 owner correction and acceptance

The owner reviewed the live browser ending and rejected the generic checkmark/text card and framed film. The next local review must visibly show the animated Optimus candidate delivering the Heart line, then present the Tesla film across the viewport and request browser fullscreen from the reward action. The film should start on that action without another Play click when the browser allows it; retain a clear Play control if autoplay is refused. Keep spoken captions and keyboard/silent/reduced-motion paths. The robot appearance remains a candidate until the owner sees and accepts the actual browser result.

## Current state

The Airbus completion scene in `src/components/QualificationCelebration.tsx` now has a Blender-exported Optimus 3 review candidate, the owner-selected Heart voice, matching caption and **Reveal reward** action. `src/App.tsx` dispatches `CONTINUE_FROM_AIRBUS_TO_REWARD` from that action and requests browser fullscreen. The protected reward phase in `src/components/RewardExperience.tsx` starts the final Tesla film in a viewport-sized cinema. The owner supplied a first Tripo GLB at `/mnt/2TBHDD/Thermo/tesla+humanoid+robot+3d+model_Clone1.glb`; direct inspection found one 39-joint skin, zero animation clips, 800,965 triangles, and one 2048 x 2048 JPEG texture. Tripo refuses Retopo on this rigged export. A bounded Blender wave candidate was made and reimported successfully, but the owner rejected this robot's appearance on 2026-10-28 and requested a new model based on Optimus Gen 3 with general-purpose movement. The first model and preview are retained only as rejected evidence.

## Scope

Generate and inspect a new Optimus Gen 3-based, animation-ready Tripo source. After owner visual choice and source-quality gate, optimize and integrate the approved robot at the post-Airbus handoff. Preserve the existing film and family tribute. This plan does not authorize editing the approved Tesla film scene, exposing the Model Y early, or using raw Tripo GLB directly at runtime.

## Context and constraints

- The player first sees Optimus only after Airbus completion; preload it no earlier.
- The robot is a ceremonial guide, not a vehicle transformation or reward replacement.
- A native HTML congratulations message and action must remain usable without WebGL, on keyboard, on narrow screens, and with reduced motion.
- The original Tripo GLB is immutable. Candidate cleanup occurs in a separate Blender source and `.cache` output; stable skeleton and animation names must be documented.
- Runtime promotion requires the project 4K source-map gate, hierarchy/deformation checks, asset report, browser screenshots and the owner's visual decision.

## Progress

- [x] 2026-10-28 — located the owner-supplied GLB in `/mnt/2TBHDD/Thermo`; copied it byte-identically into the isolated intake cache and recorded SHA-256.
- [x] 2026-10-28 — parsed the GLB and imported it in Blender 5.1.2; captured neutral front render in `preview-renders/optimus-source-intake/front.png`.
- [x] 2026-10-28 — created a 2-second elbow-led wave candidate, exported and reimported its named animation, and rendered still/video proof. The first shoulder-lift attempt tore the chest. The owner rejected the robot's overall look; neither candidate is approved for runtime.
- [ ] Generate a new Optimus Gen 3-based image/reference set and unrigged P2.0 quad model, then inspect general-purpose joint clearance and owner visual direction.
- [x] 2026-10-29 — found and preserved the new `Optimus3quad20k` unrigged GLB/FBX and `Optimus3_8krigged.glb` PBR family. Direct GLB/FBX inspection and Blender neutral front, side and arm-bend renders recorded in `asset-reports/optimus-gen3-source-intake-2026-10-29.md`. Owner appearance decision remains open.
- [x] 2026-10-29 — opened the exact rigged GLB in a fresh desktop Blender scene, saved a separate bridge intake `.blend`, verified the live Tripo Studio handshake on port 60600, and refreshed the owned tmux image pane with a live viewport capture. The source has no animation actions yet.
- [x] 2026-10-29 — received `Optimus3_animations.zip`, preserved its exact bytes, imported its FBX in isolated Blender, and verified 31 named Actions, all 65 bone names, source PBR image links and in-place hip samples. Opened a separate 31-action review `.blend` in desktop Blender and displayed greeting, cheer, walk and wave stills in the owned tmux image pane. See `asset-reports/optimus-gen3-animation-intake-2026-10-29.md`.
- [ ] Obtain source-quality maps/license status and owner visual direction, then optimize and build a deployable asset.
- [ ] Integrate at the protected Airbus completion handoff and validate in browser.
- [x] 2026-10-29 — found the prior video voiceover's local Kokoro v1.0 model and voice bank under `/mnt/2TBHDD/thermo-explainer-video/tts`, then synthesized Heart and Bella auditions offline. Muxed Heart first with the existing wave motion and then with a 24-frame `greet_01` → `walk` Blender diagnostic, both with captions. Refreshed the owned tmux sidepane with the latter's silent GIF and played its combined MP4 once through desktop audio. The local previews are not approved voices or runtime assets. Evidence: `asset-reports/optimus-gen3-voice-preview-2026-10-29.md`.
- [x] 2026-10-29 — owner selected Heart. Copied its verified 52,149-byte MP3 into `public/audio`, replaced the Airbus completion card's crowd cheer with the captioned Heart line, added native Play/Replay and shared Sound on/off controls, and changed the action to **Reveal reward**. Browser tests cover normal/manual playback, blocked autoplay, muted no-fetch, missing-audio fallback, keyboard reward entry, reduced motion, spoiler gating, 375/768/1440 layouts, and one complete-journey path through film and tribute. The 3D robot remains a separate visual candidate; see `asset-reports/optimus-heart-handoff-2026-10-29.md`.
- [x] 2026-10-29 — owner rejected the text/checkmark browser ending and framed film. Saved the complete 31-action Blender source under `art-source/blender`, exported `greet_01` and `walk` through Blender to a raw GLB, validated it, then resized its three runtime textures to 2K. The 4,844,400-byte review GLB has one 65-joint skin and 40,462 triangles. Integrated it lazily at Airbus completion with the Heart line, a static fallback, and native replay/mute/reward controls. **Reveal reward** requests browser fullscreen and plays the Tesla film across the viewport. Local browser proof at 1440/768/375 is recorded in `asset-reports/optimus-guide-browser-candidate-2026-10-29.md`; owner appearance/motion approval remains open.
- [x] 2026-10-29 — owner selected `dance_02` in place of the greeting/walk motion. Exported only `Armature|dance_02.001` from the preserved 31-action Blender source, resized its three runtime textures to 2K, and changed the Airbus completion model to `public/models/optimus-guide-dance-02-review.glb`. The previous GLB and browser proof remain intact as the superseded candidate. The owner then asked for the 308-frame dance to loop continuously; Play/Replay greeting restarts it alongside Heart. See `asset-reports/optimus-dance-02-browser-candidate-2026-10-29.md` for validation and browser evidence.
- [x] 2026-10-29 — owner asked for a more personal closing than “Happy Father’s Day” and for the reward to be called **The Future Tesla** in player-facing copy. Film and tribute text use the requested reward name; underlying vehicle records retain the exact model identity. The first proposed opening, “One more flight, Captain,” was rejected as too corny and removed. The remaining tribute reads naturally while the owner chooses a replacement opening.
- [x] 2026-10-29 — owner chose “Thank you for being someone we can always count on.” from the next set of opening lines. Added that exact sentence to the data-backed final tribute and updated the complete-journey browser assertion.

## Discoveries

The export is already skinned despite the owner's Tripo Retopo warning. The specific reason a selected wave preset rejected the rig is unconfirmed; Tripo's v3 rig supports fewer built-in preset clips than the v1 biped rig. The source GLB itself has no animation. Direct GLB and Blender intake details are in `asset-reports/optimus-source-intake-2026-10-28.md`.

The first full upper-arm wave exposed poor source skinning at the shoulder and pulled the chest open. An elbow-led wave passed local visual inspection and GLB reimport, but did not meet the owner's desired Optimus 3 appearance or general-movement requirement. The new reference-driven generation recipe is in `asset-reports/optimus-gen3-generation-brief-2026-10-28.md`.

On 2026-10-29 the owner encountered Tripo Studio's explicit quad-model Segmentation block while following the brief. The live Segmentation page confirms that quad and rigged models are unavailable; generic Tripo documentation had omitted this limit. The brief now sends the quad source directly through UV/texturing/rigging and reserves any rigid-panel separation for Blender.

The new rigged export has 40,462 triangles, 65 Mixamo-named joints including fingers, and an 8K BaseColor plus 4K Normal and packed metallic-roughness maps actually wired into its one material. It has no animation clips yet. Blender import succeeded and a 45° shoulder/70° forearm pose showed no obvious chest tearing. This is a marked improvement over the first rejected 800,965-triangle/2K-source model; it is not yet approved for the game. The reference image and broader deformation/motion proof remain missing.

## Decision log

- 2026-10-28: Build an isolated Blender wave candidate from the existing rig rather than sending the owner through more irreversible Tripo operations. Keep the original and the approved Tesla film intact.
- 2026-10-28: Treat the 2K single-texture export as a visual/proxy candidate only; do not promote it to runtime until the 4K PBR source-map requirement is met or a project decision explicitly revises that gate.
- 2026-10-28: Owner rejected the first robot's look. Preserve its source and failed/corrected wave proofs; build a new P2.0 quad, multi-view, unrigged source from an owner-selected Gen 3 reference. Use a v3.0 humanoid/Mixamo-compatible skeleton for later Blender-authored or retargeted actions, rather than relying on Tripo's limited v3 preset library.
- 2026-10-29: Preserve the new Tripo export family as the current review candidate. Use the rigged GLB for appearance/pose proof and the unrigged FBX plus complete PBR source for eventual Blender production. Wait for owner visual choice before making a full action set; do not promote the raw GLB directly to runtime.
- 2026-10-29: Accept owner-selected Tripo motion exports from this same Mixamo-rigged model as animation candidates. Select Tripo's **FBX Blender** export preset with rig and animation included; it is an FBX compatibility preset, not a request to change the existing Mixamo skeleton. Turn **Animation stay in place** on for the primary walk export so game code can own the robot's path. Inspect each action's skeleton, deformation, foot contact and loop before retargeting or runtime export. The live bridge intake scene is kept separate from the approved Tesla film and production asset. Tripo's current conversion docs define these options: https://developers.tripo3d.ai/en/docs/models-convert.
- 2026-10-29: Keep the received 31-action FBX and its Actions together through intake. Its rest-bone endpoints differ from the prior rigged GLB by up to 0.029 import units even though all bone names match. Use `greet_01`, `cheer`, `walk` and possibly `wave_goodbye_02` as review candidates; the supplied `turn` leans backward sharply and is not the default escort turn. Author or adjust the final presentation and turn only after owner visual choice.
- 2026-10-29: Draft the spoken handoff as “Congratulations! You did it! Your pilot skills have earned you something special. Ready to see it?” This preserves the owner's celebratory idea while keeping the vehicle secret. Show the same words as captions, offer replay/mute and a native “Reveal reward” action, and allow silent progression. Use `greet_01` as the editable opening motion candidate (84 frames, 3.5 seconds at 24 fps), then a quiet hold/escort beat paced to the recorded line; do not force the audio into the shorter motion or promote an unlicensed voice. This is a review candidate, not an owner-approved script or voice.
- 2026-10-29: Use Heart for the first voice preview because the prior video voiceover already selected it and it is an American English female voice in the local Kokoro bank. Keep Bella as a separate audition. The first mux uses the available 16-frame `wave_goodbye_02` PBR sample with a held last frame; it is timing evidence, not a final greeting-to-walk animation edit. A revised motion sequence and owner visual/audio choice remain open.
- 2026-10-29: Owner approved Heart for the Optimus voice. Use the full line and audio as the accessible Airbus completion handoff now, with the crowd cheer retained only for the earlier milestone cards. Mount the voice solely after Airbus completion and request the Tesla film only after **Reveal reward**. This voice choice does not approve the robot's appearance, full deformation, Action transition or production GLB.
- 2026-10-29: Owner selected Tripo's `dance_02` for the current browser ending and then requested a loop. Repeat the 12.8-second in-place clip until reward entry, keep the spoken Heart line and caption, and pause the clip for reduced motion. Preserve the earlier greeting/walk candidate as review history. This selection does not waive appearance, deformation, or source-rights review.

## Milestones and implementation steps

1. Use the generation brief to create and visually review a reference-driven, full-body Optimus 3 candidate. Preserve the unrigged quad source and image views before UV, texturing or rigging. Tripo Studio currently blocks Segmentation for quad models; do any needed armor-panel separation in Blender. Reject candidates with merged fingers, fused armor, poor joint clearance, or inconsistent views.
2. Obtain complete source maps or an unrigged source; optimize geometry with visual/deformation comparison and export a staged GLB through Blender validation. Record size, polygons, textures, materials, names, pivots, animation duration and license status.
3. Update Airbus completion UI to show the approved robot only after completion; retain native HTML congratulations and a reward action. Lazy-load model and protect the film request until reward phase.
4. Add focused tests for spoiler gating, keyboard/reload/reduced-motion and load failure. Verify actual browser playback at 375, 768 and 1440 CSS pixels. Run relevant checks, scoped diff review and update `TEST_REPORT.md`.

## Validation plan and acceptance criteria

Wave preview must visibly move the arm without tearing shoulders/elbows or sliding feet. The production handoff must preserve progress on reload, offer a native reward action, load no Model Y asset/media before that action, and enter the final film directly afterward. Validate source/GLB contracts, focused tests, lint, types, build, asset checks, spoiler guard and actual browser paths. Owner visual review of the transition remains a gate before claiming final completion.

## Repair loop and stop conditions

Review each candidate, repair one identified defect, rerun the failed and nearby checks, and record the remaining delta. Stop after two nonshrinking wave/asset attempts or when a genuine owner visual decision is needed. Do not claim unrun checks passed.

## Evidence and outcome

Initial rejected source SHA-256: `c1683a9bdfdd845927172c078b203a3e04f44af05faf4740b4da0e16f2462afb`. The rejected wave candidate and proof are retained. New Gen 3 rigged-source SHA-256: `0f9a92a2549d0b48537d184c57c48777840f383b11b1c5ee007ac29b5769338d`; its intake report and three renders are linked above. The locally staged 3D browser handoff and viewport-sized film have visual proof; see the new browser candidate report. Owner robot appearance and motion choice, rights for distribution, hosted preview and final complete-game review remain open.

## 2026-10-29 draft PR packaging

A clean ending branch, `feat/optimus-future-tesla-ending`, was cut from `origin/main` at `6f1e5ad`. It contains the Optimus/Heart handoff, `dance_02` loop, viewport-sized final film, owner-selected Future Tesla name and family tribute, Blender/runtime assets, selected browser proof and provenance reports. The unrelated Mars arcade working state remains in the original worktree and its local recovery checkpoint.

On the clean branch, `npm run assets:check` passes with the documented Optimus generated-tangent-space and non-root skinned-mesh warnings. `npm run check` passes lint, typecheck, 985 tests in 89 files and build. Chromium `e2e/reward.spec.ts` passes 12/12; the complete reordered journey and five native Airbus cases pass. The heavy production Airbus cockpit case passed 3D interaction assertions but initially caught a missing baseline favicon in its final console audit. `index.html` now points to the existing approved TMB2 logo PNG and `public/favicon.ico` serves identical bytes. A stale preview listener had masked the first recheck; after restart, a short console probe and the full heavy Airbus audit both pass. `TEST_REPORT.md` records exact coverage and remaining owner/rights/hosted gates.
