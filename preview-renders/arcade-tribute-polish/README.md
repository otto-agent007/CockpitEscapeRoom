# Moonbase and final tribute polish — 2026-11-03

Production preview: `http://127.0.0.1:5419`, branch `fix/moonbase-ground-line`, based on merged main `794a668`.

`tribute-{375,768,1440}.png` shows the exact family message at larger type. `selection-*.png` and `moonbase-*.png` show the requested names and the lunar floor without the full-width Mars accent. Portrait fighting preserves the complete pixel-art aspect ratio. Small fighter status bars remain combat feedback.

`receipt.json` records actual viewport and tribute dimensions, computed font/line height, overflow, native keyboard Skip/Replay/confirmed Restart, match titles, and canvas stroke counts. Moonbase records zero rust floor strokes; Mars records a positive count. Background switching leaves the paused readout unchanged. No page errors occurred. At 768 px this proof uses reduced motion; the regular browser suites exercise both motion settings at all three widths.

Fresh `npm run check` passed lint/types, 1,048 unit tests in 95 files and build. Production Chromium passed 29/29 cases:

```sh
npx playwright test e2e/arcade-backgrounds.spec.ts e2e/arcade-selection.spec.ts e2e/reward.spec.ts --config=/tmp/roboptimus-review-evidence.config.mjs
```

Local capture helper: `/tmp/arcade-tribute-polish-proof.mjs`. Logs: `/tmp/arcade-tribute-polish-check.log`, `/tmp/arcade-tribute-polish-browser.log`, `/tmp/arcade-tribute-polish-proof.log`. An early capture attempt omitted the native restart confirmation; another attempted a selector in closed Match options. Final capture handles both native paths correctly. These did not require product changes.

`owner-review.json` describes the two visible, isolated-profile review tabs. The tribute is foreground; the second tab has Moonbase paused. Existing browser progress is preserved. This is local proof, with owner acceptance and publication still pending. Sound effects were assessed only; none were added.
