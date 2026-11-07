# Selected Bungee font: browser review

Authority: owner selected **B** after the actual-page Barlow Condensed / Bungee / Rajdhani comparison in the tagged tmux pane. The selected temporary references are `/tmp/captains-key-font-options/B-1440.png` and `B-375.png`; their font/content/layout are retained by this implementation.

The full-resolution selected desktop reference and current 1440 and 375 px screenshots were inspected together. Bungee's rounded uppercase title and button match option B; the cream/gold extrusion, Barlow medium supporting text, amber frame, full square artwork, native focus indicator and existing copy remain. CSS sizes the title against its column instead of the throwaway preview's JavaScript measurement. That creates a small intentional width/placement difference and responsive sizing, with no measured title/art overlap. Font files are smaller provider-generated WOFF2 subsets with the same glyph designs as the preview's full TTFs.

Browser plugin unavailable: installed Playwright/Chromium tested the local production build at http://127.0.0.1:4174/. Fresh captures: 1586×992, 1440×900, 1280×720, 901×900, 768×1024, 375×812 and 667×375. Every capture confirms decoded Bungee and Barlow, complete title/art/Begin visibility, no document overflow, no runtime/console errors or external requests. Enter opens the cinematic with unmuted, unpaused audio advancing past 0.35 seconds. `results.json` records exact measurements.

Eight focused entry/accessibility cases also pass, including blocked fonts at 901/1024/1440 px, pointer user activation, Enter/reduced motion, failed art/retry, reload, saved-chapter resume and matching icons. Safari/Firefox, physical-device audio and hosted-browser behavior were not tested in this font-only revision.
