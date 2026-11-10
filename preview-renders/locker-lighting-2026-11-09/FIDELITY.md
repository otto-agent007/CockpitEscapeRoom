# Locker lighting evidence — 2026-11-09

Captured with Playwright in local production builds at 1440×900 and 375×812. HUD overlays are hidden so the canvas is judged on its own.

- `before-*` is the live production bundle (`game-CGdlMisC.js`, main `aaa6808`).
- `after-*` is this branch: the hat key light plus locker exposure 1.6.
- `hat-reveal-*` is the real two-second hold at `hat-focus`, reached by answering "1,000 hours". It is not a reload of a revealed save: a revealed save resumes on `wings-focus`.
- `entry-wide-375` is the cinematic's establishing shot.

## Luminance census

Values are sRGB-decoded relative luminance (0-1). "Lit" means non-background pixels. "Hat box" is the hat mesh's GLB bounds projected through the recorded camera pose, so the hat is measured by its own pixels.

| Frame | Lit median before → after | Hat box median before → after |
| --- | --- | --- |
| hat-reveal 1440 | 0.044 → 0.080 | 0.045 → 0.262 (5.8×) |
| hat-reveal 375 | 0.052 → 0.088 | 0.042 → 0.236 (5.6×) |
| watch-focus 1440 | 0.047 → 0.085 | — |
| watch-focus 375 | 0.051 → 0.087 | — |
| entry-wide 375 | 0.080 → 0.136 | — |

With the hat light alone (no exposure change), the hat box median at 1440 was 0.148, and every pre-reveal frame was byte-for-byte unchanged, so the light stays off until the reveal.

## DC-9 black-screen investigation

- `dc9-production-0.187-fresh-load.png` and `dc9-three-0.186.1-fresh-load.png` show the 0.187 three.js bump does not break the cockpit.
- `dc9-production-after-restart-from-locker.png` shows desktop Chromium renders the DC-9 after an in-place Restart with a live WebGL context.

The owner's black DC-9 happened on an iPhone (Brave/WebKit). That points at graphics-memory exhaustion: no desktop reproduction is possible. See plan 0081.
