# Owner-selected Arcade Adventure entry

The owner reviewed three generated options in the tagged tmux image pane, selected **B**, requested that the whole page match, and approved the full-page arcade concept ("yeah that looks dope"). Candidate selection and final browser-layout review are distinct; the selected artwork is fixed while the implementation is verified.

## Source authority and runtime derivatives

- Approved original: `art-source/branding/entry-options-2026-11-06/arcade-adventure.png`, 1254 × 1254, 1,703,074 bytes, SHA-256 `9f860b039ca422c241eec45b81c5a4171a796fb10edbaf255f1ef98928a9215d`. Its bytes are unchanged from owner selection.
- The built-in image maker generated that original. Its exact prompt is in `arcade-adventure.prompt.txt` beside it. The full-page concept is `arcade-page-concept.png` in that directory; it uses the selected B image as reference and locks the layout, palette, copy and type direction. It is a design reference, not a raster substitute for native HTML text/controls.
- Runtime art: `public/images/captains-key-arcade.webp`, 1024 × 1024, 207,518 bytes. Exact recipe: `sharp(source).resize(1024, 1024, { kernel: 'nearest' }).webp({ quality: 94, effort: 6 })`. The complete square is displayed without a circle crop or color overlay. Independent review reproduced these bytes exactly.
- Runtime icons: `public/favicon-arcade-{16,32}.png`, `public/apple-touch-icon-arcade.png`. The 32 px file is copied byte for byte from the selected preview. The 180 px touch icon uses `png({ palette: true, colours: 16, dither: 0, compressionLevel: 9 })` after resizing, yielding 8,021 bytes and keeping the existing initial-download budget; the main artwork and selected tab icon are unaffected.
- Exact bytes/hashes for all runtime derivatives are in `art-source/branding/entry-options-2026-11-06/selected-b-runtime.json`. The first winged-key source stays recoverable in Git; its old display/icon files are omitted from current builds.

## Pixel font

Pixelify Sans (weights 400–700) is self-hosted at `public/fonts/pixelify-sans-latin.woff2`: 12,016 bytes, SHA-256 `4a5633a0c9c1b73abd133a56d3716c2d8df2ed03cb987346f72194aeb224f382`. The source CSS and download/license URLs are recorded in the source directory's `pixelify-sans-google.css` and `font-provenance.json`. The unmodified Latin WOFF2 is supplied by Google Fonts, and its SIL OFL 1.1 copyright/license is shipped beside it as `public/fonts/PixelifySans-OFL.txt`. The running page makes no external font request and adds no production dependency.

## Full-page design contract

- Deep indigo canvas, stepped amber frame and complete B artwork at right on desktop.
- Three-line pale-gold pixel title at left, lavender dedication, a hard-edged amber Begin button with a pixel bevel, and the existing sound helper.
- Native title, captions and button; pointer/Enter invoke the original synchronous sound-start handler.
- Narrow screens stack the artwork and centered controls; short landscape screens use two columns to retain a visible Begin control.
- Allowed visible copy remains The Captain’s Key; For Pop T, from your crew.; Click to begin; Your flight begins with sound.; existing loading/error/retry messages. The first version's Welcome aboard eyebrow is removed.

Actual browser fidelity, viewport evidence, commands and remaining limitations are recorded in plan 0078 and TEST_REPORT.md when verification completes.
