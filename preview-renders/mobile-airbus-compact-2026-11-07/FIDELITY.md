# Compact mobile Airbus controls

The owner requested removing mobile pitch buttons, replacing bank labels with arrows, then making the whole controls box smaller. These are actual local-production browser screenshots of the existing A320 GLB. No aircraft pixels were generated or repainted, and no camera/GLB/physics changes were made.

| Viewport | Previous cockpit / tray | Current cockpit / tray |
| --- | --- | --- |
| 375×812 | 432 / 380px | 532 / 280px |
| 667×375 | 177 / 198px | 203 / 172px |

The phone controls take 34.5% of screen height; the cockpit has 23% more vertical space. The hold box has one row of bank/thrust buttons (plus directional balance in Engine-Out). Holds remain at least 48px; utilities remain 44px. Required task actions appear first in their scrollable shelf. Route advice remains visible; landscape places its meter beside it, with longer advice scrollable. Native descriptive names, two-finger holds, keyboard input and safe release remain intact. DC-9 pitch and desktop A320 pitch controls remain available.

Phone: [Storm Line](a320-flight-375.png), [Engine-Out](a320-engine-375.png). Landscape: [Storm Line](a320-flight-667.png), [Engine-Out](a320-engine-667.png). The phone Storm Line image is displayed in existing owned tmux pane %1. Owner approval is pending.

[Storm Line receipt](a320-flight-results.json) and [Engine-Out receipt](a320-engine-results.json) include page identity, actual canvas/tray/button geometry, overflow/error collection and SHA-256 fingerprints for the UI/CSS/browser-test source. The first arrow-only candidate is preserved in the sibling `mobile-airbus-bank-controls-2026-11-07` folder; it is superseded by these smaller controls.

The final real-GLB capture run passes 2/2 in 2.2 minutes with four screenshots, no collected runtime/console errors and source fingerprints matching the current files. Live holds clear the viewer toolbar after guidance updates.

Validation uses installed Playwright/Chromium with touch emulation against local production on port 4174 because the Browser plugin is unavailable. Final production regression checks pass 17/17, including 375/667/768/932/1024 widths, later route/corridor choices, longer live Engine-Out advice, toolbar clearance, desktop pitch restoration at 1440, two-finger control input, Help/pause/focus, native keyboard, reload and axe. Lint/types/build, 35 focused Airbus simulation/input tests, 578/600 KB initial budget and independent source review pass. See TEST_REPORT.md and plan 0079 for exact commands/logs and historical full-game evidence. Physical phones, Safari/Firefox and the protected hosted browser were not tested in this revision. Production merge/promotion is outside this checkpoint.
