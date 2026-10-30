# Optimus Heart voice handoff — 2026-10-29

## Goal and status

After the Airbus Engine-Out Handling success, the player hears the owner-selected Heart voice congratulate them, can read the same line and replay or mute it, then chooses **Reveal reward** to enter the protected Tesla Flight Mode film. This local voice handoff is integrated and browser-checked. The animated 3D Optimus remains a review candidate and is not in the game.

## Context and constraints

The owner approved Heart on 2026-10-29 after viewing the greeting-and-walk diagnostic. The script remains an editable default: “Congratulations! You did it! Your pilot skills have earned you something special. Ready to see it?” It names no vehicle before the reward. The existing milestone sound preference is shared with the voice. Native text and buttons remain available with sound off, blocked autoplay, a missing audio file, keyboard input and reduced motion. The Airbus completion screen does not preload the Tesla film; the reward phase owns that request.

## Asset provenance and output

The deployable `public/audio/optimus-congratulations-heart.mp3` is byte-identical to the offline `af_heart` audition. It is 52,149 bytes, 24 kHz mono MP3, about 5.66 seconds including MP3 padding; SHA-256 `596507e432e37eff0d2884399f2ff3b91ed8e42934fec9ef45fbb0b552f5ec1c`. The local Kokoro ONNX model and voice bank remain outside the game. Their hashes, the original model card, voice catalog and license are recorded in `asset-reports/optimus-gen3-voice-preview-2026-10-29.md` and `LICENSES/ASSET_MANIFEST.md`.

The runtime card uses `src/components/QualificationCelebration.tsx`, `src/components/OptimusNarration.tsx` and `src/game/optimusGreeting.ts`. The earlier Captain's Key and locker cards retain the crowd cheer; the Airbus card uses Heart. A browser autoplay refusal leaves a manual Play control. A media loading error keeps a visible caption/fallback notice, including after another Play attempt. Muting removes the audio element so the file is not requested; leaving the card pauses it. The reward action continues into the existing film phase.

## Validation evidence

- `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm run check`: exit 0; repository lint and typecheck, 94 Vitest files / 1,032 tests, and production build passed. This run preceded a small audio-error fallback repair.
- After that repair, focused ESLint and `npm run typecheck`: exit 0. Playwright rebuilt the app and `e2e/reward.spec.ts` passed 10/10 Chromium tests. The missing-file test was first red when a second Play cleared the fallback; it passed after the repair.
- `npm run assets:check`: exit 0. Nearby browser paths for click-driven Engine-Out completion with advancing Heart audio, persistent Sound off, Airbus completion card placement, and reduced-motion reward reload passed across focused runs. The focused `complete reordered journey` Chromium test also passed after updating its film/tribute assertions (1/1); the first run reached the tribute but used a strict text selector matching both its heading and summary.
- Browser screenshots at 375, 768 and 1440 CSS pixels: `preview-renders/optimus-gen3-animation-intake/browser/heart-handoff-{375,768,1440}.png`. Each width kept the native reward action visible and no horizontal overflow. The 375 screenshot was inspected and displayed in the owner's existing tmux image pane. The pane was then updated to the current robot's PBR `greet_04-f047.png` pose for appearance review; this does not imply approval.
- `git diff --check` passed for the scoped tracked files. The source MP3 and deployable MP3 SHA-256 values matched.

## Remaining delta

The current checkmark is a temporary native visual, not the Optimus model. The owner has not approved the new robot's appearance or final motion. Its 31 source Actions need full-cycle deformation, foot-contact and transition checks; a cleaned Blender source and validated optimized GLB are still required before browser integration. No Vercel preview, full E2E suite, complete-game review or release approval is claimed for this voice handoff.
