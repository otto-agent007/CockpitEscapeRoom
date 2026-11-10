# Locker lighting, iPhone restart recovery and Engine-Out sidestick controls

## Purpose

On 2026-11-09 the owner played the live site (captainskey.vercel.app, production `aaa6808`) on an iPhone in Brave and reported:

1. The locker room cinematic renders really dark: hard to see, especially the captain's hat reveal.
2. After **Restart game** in the same tab, the replayed DC-9 rendered all black, with none of the interior visible.
3. In Engine-Out: "keep the sidestick arrows and make them work, and lose the directional balance, that is unnecessary extra controls. Keep the paired thrust."

The player-visible goal: the locker reads clearly through the cinematic and the hat reveal, and a replay on a phone never shows a silent black cockpit.

## Current state (measured, not assumed)

- **The hat reveal has no light.** `LockerRoom` switched `LOCKER_HAT_LIGHT` to intensity 7 on reveal and rotated `LOCKER_UPPER_CUBBY_DOOR`, but neither node exists in `public/models/locker-room.glb` (50 nodes, no `KHR_lights_punctual`). Both came from the retired proxy builder `tools/blender/create_locker_room_proxy.py`. The black cap therefore stays in the unlit upper cubby during the two-second hold.
- **The whole locker is dim.** Luminance census of the production build at 1440×900 (sRGB-decoded relative luminance of non-background pixels): watch view median 0.047, establishing shot median 0.082 with 86% of the frame pure black.
- **The three.js 0.186.1 → 0.187.0 bump (#126, deployed the same morning) is not the cause.** The DC-9 renders identically on both versions, and the locker lighting code and GLB are unchanged since August.
- **The DC-9 black screen does not reproduce on desktop.** Production renders the DC-9 on a fresh load and after Restart from the locker, with a live WebGL context. Restart resets in place: one WebGL context keeps every chapter's GPU textures and the parsed-model cache. Decoded texture estimates from the GLBs: DC-9 171 MiB, Memphis 32 MiB, locker 352 MiB, Airbus 109 MiB, about 660 MiB in total before geometry (about 1.15M triangles). Restart also starts an Airbus preload. iOS WebKit gives a tab far less graphics memory than a desktop, and a lost WebGL context renders black while the HTML interface keeps working, which matches the report. The app had no `webglcontextlost` handling.

- **Engine-Out's sidestick arrows could not fix the drift.** The reduced ENG 1 drives a drift of -0.55 against a 0.45 limit. Only directional balance (A/D, right-stick X, Balance holds) moved it; bank did not. So the arrows responded but could not do the job the meter asked for.

## Scope

- `src/scenes/PrototypeScene.tsx`: a React-owned hat key light replaces the dead GLB lookup, a locker-only tone-mapping exposure is restored on unmount, and a lost-3D-view notice is added.
- `src/App.tsx`, `src/game/storage.ts`: Restart reloads the page when the save was cleared. It keeps the in-memory reset when storage refuses the clear, since a reload would then resurrect the old progress.
- `src/styles.css`: notice styling.
- Engine-Out: `src/game/airbusEngineOut.ts` (the drift is cancelled by the aircraft's bank angle; corridor failure is named before drift in Diversion), `src/game/airbusInput.ts` and `src/game/useAirbusSimulator.ts` (the directional axis, A/D keys, right-stick X and Balance holds are removed), `src/game/airbusRouteGuidance.ts` and `src/components/Hud.tsx` (copy and the removed control group), and `docs/GAME_DESIGN.md`.
- Tests: `e2e/graphics-recovery.spec.ts` (new), `src/game/storage.test.ts`, the Airbus unit tests, `e2e/airbus-engine-out.spec.ts` and `e2e/mobile-cockpit.spec.ts`.

Out of scope: GLB edits, texture downsizing, and disposing chapter GPU memory between chapters. These are possible follow-ups if the iPhone still loses the context mid-journey.

## Decision log

- Light the hat at runtime rather than re-exporting the GLB. The production asset carries no lights, every other locker light is already React-owned, and an asset rebuild needs `BLENDER_BIN` plus source files and would change a public runtime contract.
- Lift exposure rather than individual lights. It keeps the rig's warm key/fill ratios, and it is one number to tune. The renderer is shared with the cockpits, so the previous exposure is restored on unmount.
- Reload on Restart. A fresh page is the only way to guarantee the replay a clean WebGL context and memory on iOS. The Begin page needs a tap either way, so the player-visible flow is unchanged.
- Restart dispatches RESET before reloading. The auto-save writes every state change and the page keeps running until the reload lands, so a late simulator tick could otherwise write back the progress that was just cleared.
- Engine-Out drift authority is 1.0. Any steady right bank from 2.5° up to the 25° attitude limit keeps the drift inside 0.45, and that range contains the whole 8-24° SAFE RETURN band, so the two meters never disagree. 1.15 was rejected because it failed on drift between 21.7° and 24°, inside the diversion meter's green band.
- The owner chose "release springs back level" over a hold-on-release sidestick, so the bank model is unchanged.
- In Diversion, a left bank is reported as a corridor failure before a drift failure, so the specific "SAFE RETURN is to the right" coaching survives.
- Notice rather than automatic reload on context loss. An automatic reload can loop on a device that keeps running out, and the notice tells the player that progress is saved.

## Progress

- [x] Reproduce and measure on production-equivalent builds (live bundle hash `game-CGdlMisC.js` matched locally).
- [x] Hat key light, exposure lift, Restart reload, lost-view notice.
- [x] Engine-Out: sidestick bank cancels the drift; directional balance removed; paired thrust unchanged.
- [ ] Owner visual review of the locker candidate (Tier 1 gate) on a Vercel preview, on the iPhone.
- [ ] Owner confirms Restart → DC-9 renders on the iPhone.

## Validation and evidence

Recorded in the PR and in `TEST_REPORT.md` once the owner accepts the visuals. Commands actually run are listed there, not here.

## Follow-up — 2026-11-10 owner feedback (iPhone)

The owner reported that the locker room is fixed. Remaining requests: "make the mobile version zoom in close to the airspeed indicator", "the Captain's key is still a little off screen to the right", and for Engine-Out, "like it was on desktop where you have to use the arrow/thrust (arrow/D) alternating".

- **Engine-Out.** The owner chose "Desktop arrow/D back; phone thrust buttons act as D". Commit `f991373` is reverted, which restores the original simulation, keys and desktop Balance group. On compact layouts the Increase/Decrease buttons hold `balanceRight`/`balanceLeft`, and the briefing and guidance name Increase. Speed holds itself in Engine-Out, so phones give up nothing.
- **Instrument scan.** On narrow screens the scan centres on the five flight instruments and fits their width to the canvas aspect (`src/scenes/dc9ScanFraming.ts`). Desktop is byte-identical. The FOV no longer re-aims the look when the canvas resizes.
- **Captain's Key.** The look stops are now 1.0 rad right and 0.30 rad down (were 0.72 and 0.18). The key lands at (241, 545) on 390×844 after turning fully right and down.
- **Evidence:** `preview-renders/phone-scan-and-key-2026-11-10/FIDELITY.md`.

## Follow-up — Engine-Out final rhythm (2026-11-10, after #129)

The owner confirmed the instrument scan and the key, but said Engine-Out was "a little off": "I liked how it was, with the banking right for the first part and the banking right and thrust for the 2nd part." The confirmed design (AskUserQuestion with a per-stage preview):
- **Stabilization:** a right bank alone cancels the drift. This restores #128's `f991373` via a revert of #129's `cddc2ed` and `30cdbff`.
- **SAFE RETURN:** the right turn bleeds speed. The energy target subtracts 0.35 × bank/25° and diversion energy responds at 0.8/s, so the player alternates the arrow with Increase. Constants were tuned in a pure-equation simulation of digital tap rhythms: no thrust fails in about 7 s; arrow 0.3 s per 0.8 s with Increase 0.6 s per 1.6 s completes with zero unsafe time; held thrust through a 10° turn overspeeds.
- **Controls:** paired thrust is real on every device. In Engine-Out D/A also drive thrust, keeping the owner's desktop arrow/D rhythm. No balance control.

