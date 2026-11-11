# iPhone film sound, Home Screen fullscreen, landscape arcade — 2026-11-10

Captured with Playwright in local production builds using phone touch emulation. "Before" is `main` at `9f5a1d9`.

## Landscape arcade arena
Pause and Menu moved from their own top row into the top of the side columns, so the 320×224 arena spans the full height.

| Viewport | Arena before | Arena after | Share of screen height |
| --- | --- | --- | --- |
| 844×340 (iPhone landscape with browser bars) | 391×274 | **466×326** (+41% area) | 0.81 → 0.96 |
| 844×390 | 463×324 | **537×376** (+35% area) | 0.83 → 0.96 |
| 812×375 | 441×309 | **516×361** | 0.82 → 0.96 |
| 932×430 | 520×364 | **594×416** | 0.85 → 0.97 |
| 667×375 | 441×309 | 447×313 | width-limited by the two control columns |

`e2e/mobile-arcade-layout.spec.ts` still proves no control overlaps the arena, every P1 control is at least 48 px, Pause and Menu are at least 44 px, and all stay inside the viewport at six sizes.

## Home Screen fullscreen on iPhone
`home-screen-help-390.png` shows what the fullscreen button opens when a browser cannot put a page fullscreen (every iPhone browser): the Add to Home Screen steps and the separate-progress caveat. In Home Screen mode the button is hidden. The manifest and Apple meta tags make the icon open with no browser bars.

## Film sound
iOS behaviour cannot be emulated in Chromium. Unit tests cover the bless logic, and the film and reward browser tests (42 passed) prove the adopted element plays, falls back muted, retries and replays as before. The owner confirms on the iPhone.
