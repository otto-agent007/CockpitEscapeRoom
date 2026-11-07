# Arcade entry: concept-to-browser review

Design authority: owner-selected B, `art-source/branding/entry-options-2026-11-06/arcade-adventure.png`, and the subsequently approved `arcade-page-concept.png` beside it. The owner said "B and make the whole page match that aesthetic", then approved the full-page concept with "yeah that looks dope".

The accepted concept and latest `entry-1586.png` were both opened with `view_image` in the same final QA pass. Capture matches the concept's native **1586 × 992** dimensions. The browser was installed Chromium/Playwright because Browser/IAB is unavailable. All visible text and the real Begin control are HTML, with the selected image rendered separately.

| Comparison | Browser evidence and disposition |
| --- | --- |
| Composition | Desktop keeps the title/control column left and complete square art right. Artwork starts near x=655 at concept-native width, matching the concept's split. No card or circle crop remains. |
| Approved image | Runtime derives from unchanged B source; its 32 px tab icon is byte-identical to the selected preview. The selected source takes precedence over small re-illustration differences inside the layout concept. No tint or replacement art was introduced. |
| Palette and frames | Indigo canvas, pale-gold title, lavender supporting copy, amber artwork border and stepped outer corners were inspected together. The old smooth, circular emblem treatment is gone. |
| Typography | Three title lines, pixel font, gold/orange offset shadow and spaced pixel supporting text match the direction. First-pass title scale, leading and support-text spacing were repaired before this capture. Pixelify Sans recreates the generated lettering with a licensed real font; exact AI-drawn glyph shapes are not used as raster UI. |
| Begin control | Amber rectangle, square corners, pixel bevel, dark label and left play symbol match the concept. A visible white keyboard-focus outline is an intentional accessibility addition. Click/Enter produces actual unmuted, advancing soundtrack playback. |
| Copy | The Captain’s Key; For Pop T, from your crew.; Click to begin; Your flight begins with sound. All match after normalizing case/line breaks. The earlier Welcome aboard eyebrow was removed; no new labels, counters, navigation or slogans were added. |
| Responsive layout | Native desktop, 1440×900, 1280×720, 768×1024, 375×812 and 667×375 keep the full title/art/Begin in view without horizontal or vertical document overflow. Narrow portrait stacks artwork and controls; short landscape retains two columns. These are deliberate responsive adaptations of the desktop concept. |
| Fallback and loading | A measured blocked-font overlap was reproduced RED, repaired with metric-adjusted local font faces, then passed GREEN at 901/1024/1440. Initial-art failure still offers native retry, and no soundtrack starts before Begin. |

No material visual mismatches remain in the inspected states. Normal captures record zero page/console errors and no external requests. Safari/Firefox and physical device audio output were not tested. Owner approval of the actual browser result remains separate from the earlier concept approval.

Screenshots and measured bounds are in this directory's `entry-{1586,1440,1280,768,375,667}.png` and `results.json`. The actual 1440 browser screenshot was loaded into the existing tagged tmux image pane `%1`; this records a pane update, not owner acceptance.
