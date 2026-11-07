# Mobile cockpit touch presentation

The owner reported that phone control panels obscured the cockpit and selected compact native controls below the cockpit, with instructions in Help. The new layout reserves actual canvas space above the touch tray for DC-9 control check/scan/departure/shutdown and A320 qualification/Storm Line/Engine-Out. The DC-9 remains the first-officer/right-seat view; the A320 remains the captain/left-seat view. Camera poses, GLBs, geometry, materials, textures, lights, mesh contracts and game rules were not edited.

## Runtime asset identity

The browser fetched these actual runtime files without cache and compared their byte lengths and SHA-256 hashes against `public/`; all match. Existing source/license/asset reports remain authoritative for unchanged object/material/texture counts and game_id contracts. No new export or asset intake occurred.

| Runtime model | Bytes | SHA-256 |
| --- | ---: | --- |
| `models/dc9-cockpit.glb` | 36,050,764 | `e092a1d8907db5ed8fb9dc1032cac3874e0295287ae33ecb7e50f5d6ebf6d9ac` |
| `models/dc9-memphis-legacy-departure.glb` | 1,916,956 | `e730c5918007e7200096f743b149c8cd1ad748da6ffc1e449d6795cd4b564d63` |
| `models/airbus-captain.glb` | 39,884,100 | `0a6c8aeb1e1fdbfc85db01becb812ca0c3b7810208d03fba65f26c4fa4306251` |

## Browser evidence and design fidelity

Current captures and runtime-model receipt are in `preview-renders/mobile-cockpit-controls-2026-11-06/`. The initial 375×812 DC-9 overlay was 359×471 (58% of the screen), above an additional footer. The final control check has an unobstructed 375×522 canvas and a separate native tray beginning at y522; other stages reserve their own required control height. The short-landscape layout keeps the view separate, with native holds and required actions reachable beside scrollable details.

The comparison uses actual app screenshots, with labels outside the player UI. No aircraft image was generated/repainted for this milestone. Both model frames and native control names remain stage-specific. Hold controls are at least 48px; utility actions at least 44px. Current-axis progression, first-miss/repeated-miss coaching, safe retry, 1995 memory label/live cue, native modal Help/focus/resize, two-finger release/cancel, reduced motion, reload and desktop fallback have focused coverage.

## Validation boundary

Installed Playwright/Chromium is used because the Browser plugin is unavailable. The full production regression run passes 29 cases (including complete reordered journey). All 1,060 unit tests in 96 files, lint/typecheck/build, model/intro asset contracts, privacy/spoiler guards and unchanged size limits pass. After final compact-only refinements, the focused production set passes 15 cases. Local logs are linked in plan 0079 and TEST_REPORT.md. The real A320 sidestick accepts a phone tap after label selection; the placed-card capture proves the resulting state.

Independent source review raised feedback/focus/breakpoint/live-cue issues, all resolved; no Critical/Important residual. Final Vercel preview is prepared for owner playtest, with protection unchanged. Safari/Firefox and a physical phone have not been tested; short landscape uses scrollable task/readout details and long route copy while required touch actions stay visible. No production merge/promotion is part of this checkpoint.
