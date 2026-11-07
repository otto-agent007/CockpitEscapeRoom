# Owner-selected Arcade Adventure entry

The owner reviewed three generated options in the tagged tmux image pane, selected **B**, requested that the whole page match, and approved the full-page arcade concept ("yeah that looks dope"). Candidate selection and final browser-layout review are distinct; the selected artwork is fixed while the implementation is verified.

## Source authority and runtime derivatives

- Approved original: `art-source/branding/entry-options-2026-11-06/arcade-adventure.png`, 1254 × 1254, 1,703,074 bytes, SHA-256 `9f860b039ca422c241eec45b81c5a4171a796fb10edbaf255f1ef98928a9215d`. Its bytes are unchanged from owner selection.
- The built-in image maker generated that original. Its exact prompt is in `arcade-adventure.prompt.txt` beside it. The full-page concept is `arcade-page-concept.png` in that directory; it uses the selected B image as reference and locks the layout, palette, copy and type direction. It is a design reference, not a raster substitute for native HTML text/controls.
- Runtime art: `public/images/captains-key-arcade.webp`, 1024 × 1024, 207,518 bytes. Exact recipe: `sharp(source).resize(1024, 1024, { kernel: 'nearest' }).webp({ quality: 94, effort: 6 })`. The complete square is displayed without a circle crop or color overlay. Independent review reproduced these bytes exactly.
- Runtime icons: `public/favicon-arcade-{16,32}.png`, `public/apple-touch-icon-arcade.png`. The 32 px file is copied byte for byte from the selected preview. The 180 px touch icon uses `png({ palette: true, colours: 16, dither: 0, compressionLevel: 9 })` after resizing, yielding 8,021 bytes and keeping the existing initial-download budget; the main artwork and selected tab icon are unaffected.
- Exact bytes/hashes for all runtime derivatives are in `art-source/branding/entry-options-2026-11-06/selected-b-runtime.json`. The first winged-key source stays recoverable in Git; its old display/icon files are omitted from current builds.

## Owner-selected Bungee typography

After reviewing three real-page font previews in the tagged tmux pane, the owner selected **B — Bungee**. Bungee 400 supplies the title and Begin button; Barlow 500 supplies readable dedication and loading/error/retry text. The owner subsequently requested removal of the “Your flight begins with sound.” helper line. This replaces the declined Pixelify Sans font without altering the selected artwork or icon.

Both fonts are self-hosted Google Fonts WOFF2 subsets, with no local font editing and no runtime third-party request. `art-source/branding/entry-options-2026-11-06/font-provenance.json` records the exact CSS/download/license URLs, requested characters, bytes and hashes; `bungee-google.css` and `barlow-google.css` retain the provider responses. The exact title/button text is included in Bungee's 2,476-byte subset. Barlow's 15,368-byte subset includes printable English ASCII plus curly quotes, ellipsis, dashes and multiplication, covering current visible copy and ASCII asset diagnostics. If localized/non-English copy is later introduced, expand the recorded subsets first.

Original SIL OFL 1.1 copyright/licenses are shipped as `public/fonts/Bungee-OFL.txt` and `public/fonts/Barlow-OFL.txt`. The retired public Pixelify font/license are removed; their original bytes and source CSS remain recoverable in Git. No dependency or budget limit changes.

The title sizes against its copy column using CSS container units so Bungee's wider letters fit above the tablet breakpoint. Native Arial/Impact/sans-serif fallbacks retain readable text while fonts load or fail; this is checked with both WOFF2 requests blocked.

## Full-page design contract

- Deep indigo canvas, stepped amber frame and complete B artwork at right on desktop.
- Three-line pale-gold Bungee title at left, lavender dedication, a hard-edged amber Begin button with a pixel bevel, with no sound helper line.
- Native title, captions and button; pointer/Enter invoke the original synchronous sound-start handler.
- Narrow screens stack the artwork and centered controls; short landscape screens use two columns to retain a visible Begin control.
- Allowed visible copy remains The Captain’s Key; For Pop T, from your crew.; Click to begin; existing loading/error/retry messages. The first version's Welcome aboard eyebrow is removed.

Actual browser fidelity, viewport evidence, commands and remaining limitations are recorded in plan 0078 and TEST_REPORT.md when verification completes.


## Bungee revision evidence

The selected previews are `/tmp/captains-key-font-options/B-1440.png` and `B-375.png`. Current production-browser captures and measurements are recorded in `preview-renders/captains-key-bungee-entry-2026-11-06/` and `TEST_REPORT.md`. Earlier Pixelify screenshots and test results below remain historical evidence of the prior version.

Fresh validation: eight entry/accessibility browser checks, lint/types/build, asset contracts, privacy/spoiler guards and the unchanged initial budget pass (597/600 KB). Full responsive results, actual sound proof and visual comparison are recorded in the new evidence directory. Independent review found no Critical/Important issue; its Minor character-coverage wording correction is applied above.
