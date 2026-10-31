# Arcade Moonbase background — approved artwork

The owner requested a Moonbase option alongside Mars and chose an outdoor lunar base with Earth in the sky. Both the player arcade and development fighter playground now provide a native Background selector. Mars remains the first-use default. Selection changes scenery without restarting or modifying combat, and a separate strict version 1 local preference remembers the choice. Corrupt or unavailable settings recover safely; denied writes still allow in-session selection. Earned T+M+B access and chapter persistence remain separate.

## Source and asset contract

- Generated in this session with the built-in `image_gen` tool from the retained text prompt. No downloaded third-party artwork or external license was introduced. Owner approved the rendered appearance on 2026-10-14: **“very nice. I like it.”** The [approval receipt](../preview-renders/mars-arcade/moonbase-2026-10-14/owner-approval.json) binds that acceptance to the source hash and shown preview.
- Untouched source: [moonbase-panorama.png](../art-source/arcade/generated/moonbase-v1/moonbase-panorama.png). Exact [prompt](../art-source/arcade/generated/moonbase-v1/prompt.txt) and [generation provenance](../art-source/arcade/generated/moonbase-v1/generation.json) are retained beside it.
- Actual dimensions: **1836 × 857**, opaque RGB, **2,473,220 bytes**. The requested dimensions were 1920 × 896; the renderer checks the actual file dimensions. SHA-256: `9399a2d6d6c743ca634450ce6f373e1c251e37810d6c27e7c38a30e7052f0c05`.
- Runtime logical panorama: **480 × 224**, nearest-neighbor drawing, unchanged fighter floor **188**. Bounded panning covers the 320 px viewport at both actual camera limits, ±104. Original Mars five-layer drawing and camera/floor geometry remain unchanged.
- Vite emits the PNG at its canonical art-source path with bytes identical to the generated source. There is no pixel editing, resampling, recompression, new dependency, material, mesh, animation, or GLB export. The source contributes 2.47 MB only when Moonbase is selected inside the arcade; no premature Moon request occurs with the default Mars setting.
- Image caches and completion callbacks are scoped to their backgrounds. Late loads cannot replace the current choice. Failed art uses gray fallback bands and a native Retry background control while combat stays usable.

## Actual verification

- RED: missing settings module and absent Background selector in the preceding production build. GREEN: **30 focused tests**; complete `npm run test` **1,032 tests / 94 files** pass.
- Live-source lint passes with `npm run lint -- --ignore-pattern 'preview-renders/**'`; immutable recovery/evidence snapshots are excluded. `npm run build` passes typecheck and production build. `npm run assets:check` passes with existing model notices. `npm run arcade:validate`: **58 clips / 202 frames / 164 drawings, 0 errors / 4 retained candidate warnings**.
- Built-preview Playwright: **10/10 background cases** pass at 375, 768, and 1440 px with normal/reduced motion. They prove actual Moonbase PNG drawing, no premature Moon load, unchanged paused round state, keyboard selection, reload/restart, corrupt/denied storage, missing art and retry, both real camera edges, and chapter return/T+M+B re-entry. The existing earned Easter egg suite passes **15/15**, including serious/critical accessibility checks.
- The first background browser run captured paused state before the render loop updated the readout. The corrected verifier waits for both Resume and PAUSED before comparing identical state; no fight code was changed to satisfy it.
- All **779 preexisting PNGs**, canonical animation JSON, combat tuning JSON, and original Mars stage/geometry module match the saved Moonbase-start hashes. Production Moonbase PNG bytes match the source. Independent scoped code review reports **no Critical or Important findings**.
- Live development smoke passes at **5360**: actual Moonbase and Mars drawing, unchanged paused state, actual Trump special PNG in the 58-clip gym, and keyboard frame stepping. No save, art correction, box edit, or non-read request occurred in the isolated browser context. No application errors were observed; the preexisting missing `/favicon.ico` 404 is recorded separately in `dev-smoke.json`.

Evidence and reproducible development smoke script: [moonbase-2026-10-14](../preview-renders/mars-arcade/moonbase-2026-10-14/). Rendered [1440 px preview](../preview-renders/mars-arcade/moonbase-2026-10-14/browser-final/moonbase-1440-normal.png), narrow/reduced-motion previews, and both camera-edge images are retained. The owned tmux pane was refreshed with the rendered preview. Browser plugin unavailable; installed Chromium/Playwright was used against local preview 5370 and development 5360.

## Remaining boundary

Implementation and scoped browser verification are local, and the new Moonbase appearance is owner-approved. No new hosted preview, commit, push, merge, or deployment occurred, and the entire unrelated E2E suite was not rerun. Existing fighter approvals, tuning, and all other scene artwork remain preserved.
