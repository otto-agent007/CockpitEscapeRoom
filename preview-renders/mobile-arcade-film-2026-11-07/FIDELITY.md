# Mobile arcade and landscape film review

These are actual production-build browser captures from port 4174 using installed Chromium with touch emulation. Browser plugin is unavailable. Image labels sit outside screenshots; no game pixels were generated/repainted. The owner selected controls below the arena in portrait and beside it in landscape. Owner approved the mobile arcade layout and landscape film screenshot visuals on 2026-11-07 ("ok looks good"). Physical-phone validation and final complete-game review remain separate.

## Player-visible result

- [375px selection](arcade-selection-375.png) keeps Start visible without scrolling.
- [375px fight](arcade-fight-375.png) puts six native controls directly below the complete arena. [812px landscape](arcade-fight-812.png) places thumb controls beside it. The artwork keeps its canonical 320×224 ratio; buttons and Pause/Menu do not intersect the actual canvas.
- [667px fight](arcade-fight-667.png), [768px fight](arcade-fight-768.png), and [1440px fight](arcade-fight-1440.png) retain clear controls and HUD. Holds are at least 48px; utilities 44px. Menu pauses, clears input and leaves Resume explicit. [Phone menu](arcade-menu-375.png) contains secondary actions.
- [Model FLY landscape](film-812.png) has a 324.625px movie region plus a 50.375px control strip on an 812×375 viewport. All custom actions stay below the movie. [667px film](film-667.png), [375px portrait](film-375.png), [768px film](film-768.png) and [1440px film](film-1440.png) retain the complete 16:9 picture. Portrait has rotation guidance; landscape reports “Landscape view.”
- [Final tribute](tribute-375.png) retains the current family copy. A genuine three-second touch hold on its heading opened the earned arcade in this capture run; native Start, Menu and Return actions were exercised afterward. Short/cancelled holds and keyboard/assistive entry have dedicated regression coverage.

The [review contact sheet](mobile-review.png) is displayed in existing owned tmux pane %1. Before evidence is preserved as [portrait arcade](before-arcade-375.png), [landscape arcade](before-arcade-812.png), and [landscape film](before-film-812.png).

## Fidelity and validation

[Runtime receipt](results.json) records page identity, five film layouts, five actual arena/control layouts, playback time/sound, no collected runtime/console errors, and eleven source SHA-256 fingerprints. All source fingerprints match the files staged for review. The runtime movie was fetched without cache and matches the disk file: **38,596,084 bytes**, SHA-256 `b4698d81fb3c931a7d3c2a5a9c8213e4620b30b2ec7726138cd80992f27a8dfd`. Its original frames/music are unchanged. Movie screenshots seek to 12/55 seconds and resume advancing playback for the chosen view; direct seeded reward resumes may require the existing sound-recovery gesture. Automatic sound/playback after the real Reveal action is separately covered by reward/autoplay regression cases.

The actual screenshot/geometry run passes **1/1 in 22.2 seconds** (`/tmp/mobile-arcade-film-capture.log`). Final production browser regression passes **42/42 in 3.1 minutes** (`/tmp/mobile-arcade-film-production.log`), including complete reordered journey, all new touch/menu/landscape/secret-entry cases, audio, controller, unlock/storage/retry, accessibility, reload and reduced-motion behavior. Full lint/types/1,078 unit tests/build and asset/privacy/spoiler/budget guards pass; initial download 578/600 KB. Exact commands and source review are recorded in TEST_REPORT.md and plan 0080.

Native orientation locking has limited browser support. The Watch landscape gesture uses fullscreen/lock where available, native Safari video fullscreen when generic fullscreen is unavailable, and rotate-phone guidance otherwise. Supported/rejected/missing/delayed APIs and Safari branches are tested with stubs; actual browser capture uses Chrome's real fallback and viewport rotation. Physical iOS/Android, Safari/Firefox and the protected hosted browser were not tested. No forced CSS rotation/cropping, new dependencies, movie/sprite/GLB/audio edits, production merge or promotion.
