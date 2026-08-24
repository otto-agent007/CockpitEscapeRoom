# DC-9 chapter: a loading page, a clean chapter frame, and a route record that looks printed

## Purpose

Three things the owner asked for on the DC-9 chapter, all player-visible:

1. **A loading page like the Airbus has.** The DC-9-32 cockpit is a **36.1 MB** GLB. Until it
   parses, the scene draws a grey placeholder box (`boxGeometry args={[3.4, 2.45, 0.35]}` in
   `Dc9Cockpit`). A player who reloads mid-chapter — or whose intro finishes before the download
   does — sits looking at that box. The Airbus already answers this with a full-bleed cockpit still,
   a quote and a download read-out; the DC-9 gets the same treatment.
2. **Drop the prototype furniture.** The chapter still announced itself as unfinished: a `GREYBOX`
   chip in the chapter title bar, a second `GREYBOX — DC-9 FINAL FLIGHT LOG` badge painted over the
   canvas, a `DC-9-32 · safely parked` eyebrow, and a footer line reading *Commemorative,
   non-operational interaction in a safely parked cockpit.* The cockpit is a real donor model, not a
   greybox, and the owner wants the frame quiet.
3. **The Legacy Route Record gets a facelift.** It read as a plain web card — a cream box, six
   flat tiles, a gold button. It is meant to be a piece of paper the player finds clipped to the
   first-officer yoke.

## Current state (before this work)

- `src/App.tsx` renders `AirbusLoader` for `phase === 'airbus'`; nothing equivalent exists for
  `phase === 'dc9'`. The DC-9 entry from the opening screen (`Dc9EntryTransition`) holds a plain
  black overlay at z-index 100 during its `waiting-for-cockpit` stage; a direct reload into the
  chapter has no cover at all.
- `Dc9LoadState` carries only `{ status, message }` — no byte counts — and
  `loadCockpitModel(url)` in `src/scenes/cockpitModelLoader.ts` uses `GLTFLoader.loadAsync(url)`
  with no progress callback. The DC-9 is *preloaded from the opening screen*
  (`preloadDc9Cockpit()`), so by the time the chapter mounts the download is usually already in
  flight against a shared cached promise.
- `Dc9Chapter` top bar: eyebrow + `h1` + `GREYBOX` span. `PrototypeScene` additionally renders
  `.prototype-badge` for every non-Airbus, non-locker phase. Footer: status line +
  `dc9LegacyFlow.disclaimer` + Restart.
- `LegacyRouteRecord` renders six `.dc9-route-choice` tiles (`min-height: 4.5rem`) in a two-column
  grid on `.dc9-document` cream paper.

## Scope

Included: the DC-9 loading page and the load-progress plumbing behind it; removal of both greybox
labels, the *safely parked* eyebrow and the footer disclaimer; a visual redesign of the Legacy
Route Record; the responsive and contrast fixes that redesign exposed; the one e2e assertion that
named the removed badge.

Excluded: the DC-9 GLB itself (unchanged); the chapter's puzzle logic, copy, reducer or persistence
(unchanged); the Airbus loader's behaviour (only its CSS class names move to the shared base); the
Home Operations Log, control check, instrument scan and shutdown panels.

## Context and constraints

- **The loading page must not fight the cinematic entry.** The intro fades to black, dispatches
  `START`, then holds black until the cockpit settles. The loading page therefore sits *above* that
  overlay (z-index 101) and paints its own opaque ground from frame 0, lifting the still and copy
  out of the black rather than cutting to them.
- **No flash on a warm cache.** The minimum hold is measured from app mount, not from chapter
  entry. A player who spends thirty seconds in the intro and arrives with the model already parsed
  gets no hold at all; a player who reloads straight into the chapter gets the full 600 ms.
- **The error path already had an owner.** `Dc9Chapter` renders `.dc9-chapter__load-error` with a
  *Use static cockpit view* button. The loading page steps aside on error rather than adding a
  second, competing recovery UI.
- Tone contract: the aircraft is parked for a commemorative legacy flight. The loading page copy
  celebrates the right seat; it never implies an emergency.
- Accessibility: every route entry keeps its `aria-pressed` state and its
  `"<code>, <city>[, permanently stamped]"` accessible name, so the visual redesign is invisible to
  assistive tech.

## Progress

- [x] 2026-08-23 — Branch `pr/dc9-loader-route-record` cut from `main` at `59fc601`.
- [x] 2026-08-23 — Byte-level load progress plumbed from `GLTFLoader` to `Dc9LoadState`.
- [x] 2026-08-23 — `Dc9Loader` rendered, verified in a throttled browser at 6 Mbit/s.
- [x] 2026-08-23 — Both greybox labels, the *safely parked* eyebrow and the footer disclaimer gone.
- [x] 2026-08-23 — Legacy Route Record redesigned and measured at 1440 / 768 / 375.
- [x] 2026-08-23 — `npm run lint`, `tsc -b`, Vitest, full Playwright suite.

## Discoveries

- **`loadCockpitModel` caches a promise, so a late subscriber sees no progress events.** The DC-9
  preload starts on the opening screen; the chapter subscribes seconds later, after most of the
  download has already happened. `observeCockpitModelProgress(url, listener)` therefore replays the
  last known `{loadedBytes, totalBytes}` to a new listener on subscribe, so the bar never starts
  from a stale zero.
- **The paper documents were inheriting a dark-panel paragraph colour.** `src/styles.css` sets a
  global `p { color: var(--text-soft) }` = `#bfc9bb`, tuned for the dark cockpit panels. The route
  record's hint paragraph carried no class, so it rendered pale sage on cream — measured
  `rgb(191, 201, 187)` on a `#f6efdb`-ish ground, roughly 1.5:1. `.dc9-document__question` and
  `.dc9-document__note` were fine only because they each set their own colour. Fixed by giving
  `.dc9-document__feedback p` its ink (`#5e3d1c`, measured back as `rgb(94, 61, 28)`).
- **`h1 { max-width: 13ch }` was wrapping the chapter title.** With the eyebrow gone, the top bar's
  shrink-to-fit width came from the `h1`, and "DC-9 Final Flight Log" is 21 characters, so it broke
  across two lines. The top-bar `h1` now opts out of the global cap.
- **A ledger row with a words-based status column truncates the longest city.** Measured at 1440:
  `Minneapolis–St. Paul` needed 148 px of a 135 px cell. Replacing "Open entry"/"Selected" with a
  1.05 rem tick box gave the city 187 px and removed the clipping outright.
- **Two headings must not share an accessible name.** The first full Playwright run failed
  `smoke.spec.ts:304` with a strict-mode violation: the loading page's `h1` and the chapter's own
  title bar `h1` both read `DC-9 Final Flight Log`, so `getByRole('heading', {name})` matched two
  elements. That is a real duplicate for assistive tech, not just a test artefact. The loading page
  now carries the journey's full name from `CLAUDE.md`, **DC-9 First-Officer Final Flight Log**, and
  gets a wider measure (`15ch`) and a smaller clamp so it still sets on two lines.
- **The two-column entry form does not fit a 768 px viewport.** Caught on the evidence pass, not by
  a test: `.dc9-document` is `min(47vw, 43rem)`, so at 768 px the paper is only 361 px wide and two
  ledger columns of ~150 px overlapped the city text with its tick box and its stamp. The old
  two-line tiles tolerated it; one-line rows do not. Measured: a two-column form needs about 500 px
  of content box for the longest city to stay on one line, which the document only reaches past
  roughly 1220 px of viewport. The grid is now one column by default and two from `1240px` up.
  Swept 375/480/640/768/900/1024/1180/1239/1241/1366/1440/1920: no row clipped
  (`scrollWidth == clientWidth` on every row) and no child box outside its row at any width.
- **The 375 px layout did not fit the submit button.** After the redesign the record measured
  669 px of content in 578 px of frame. The now-single-line chapter title bar freed the document's
  `top` from 7 rem to 5.25 rem, and tightening the question, note, feedback and row heights on
  narrow screens brought content to 613 px in a 606 px frame — the whole form including the stamp
  button is reachable without scrolling on a 812 px-tall phone.

## Decision log

- **Shared `.chapter-loader` base rather than a duplicated DC-9 stylesheet** — 2026-08-23. Both
  loading pages are the same object: full-bleed still, directional shade, copy block, download
  read-out. The Airbus markup moved onto the shared class names; `.airbus-loader` and `.dc9-loader`
  now carry only the per-chapter still framing, shade tint and z-order. Consequence: a change to
  loader layout lands on both chapters at once, which is the intent.
- **The loading page hides on error instead of offering its own retry** — 2026-08-23. The Airbus
  loader owns its error state because the Airbus has no other recovery UI; the DC-9 chapter already
  has `.dc9-chapter__load-error` with a fallback button, and two overlapping recovery panels is
  worse than one. Consequence: a DC-9 load failure still shows the placeholder box behind that
  panel, exactly as before this work. Adding a DC-9 retry token (mirroring `airbusRetryToken` and
  `lockerRetryToken`) is the obvious follow-up if the owner wants parity.
- **The minimum loader hold is measured from app mount** — 2026-08-23. See constraints above; the
  alternative (measuring from chapter entry) would force a 600 ms loading page into the middle of
  the cinematic entry for anyone whose model was already parsed.
- **The two-column form is gated on viewport width, not on `auto-fit`** — 2026-08-23. `auto-fit` with
  a `minmax` floor would also collapse to one column, but the printed gutter rule between the
  columns cannot be conditioned on how many tracks `auto-fit` produced. An explicit `1240px` query
  keeps the rule and the columns switching together. Consequence: the breakpoint has to be
  re-derived if the document's `min(47vw, 43rem)` width ever changes.
- **Route entries became one-line ledger rows with a tick box, not two-line tiles** — 2026-08-23.
  Six tiles at 4.5 rem read as web cards and, in one column on a phone, pushed the submit button off
  screen. One line per station is both more like a printed form and 108 px shorter.
- **No carrier name anywhere on the record** — 2026-08-23. The puzzle's hint calls DTW and MSP
  "Northwest hubs", which is a fact about the airports, not a claim about Pop T's employer. The
  form fields stay to what the game already asserts: aircraft, seat, entry count.

## Milestones

1. **The player never waits on the grey box.** Entering or reloading the DC-9 chapter shows a
   full-screen DC-9-32 flight-deck page with a live download read-out, which dissolves into the
   live cockpit.
2. **The chapter frame reads as finished.** No `GREYBOX` chip, no canvas badge, no *safely parked*
   eyebrow, no *Commemorative, non-operational…* footer.
3. **The Legacy Route Record reads as a printed document**: binder margin with punched holes, a
   ruled masthead over typed form fields, ledger rows with boxed station codes and tick boxes, a
   red `RECORDED` rubber stamp on permanently stamped stops, a pencil annotation for the hint, and
   an oxblood stamp-pad submit.

## Implementation steps

- `src/scenes/cockpitModelLoader.ts` — add `CockpitModelProgress`,
  `observeCockpitModelProgress(url, listener) => unsubscribe`, a per-URL last-progress record, and
  an `onProgress` callback on the cached `loadAsync`. `clearCockpitModel` clears the record too.
- `src/scenes/PrototypeScene.tsx` — widen `Dc9LoadState` with optional
  `loadedBytes` / `totalBytes` / `percentage`; subscribe in the `Dc9Cockpit` load effect and forward
  progress (capped at 99 % until the parsed scene is staged, because the last percent is glTF
  parsing); unsubscribe on teardown; report bytes on `ready` and `error`. Delete the
  `.prototype-badge` element.
- `src/App.tsx` — `Dc9Loader` component; `showDc9Loader` / `dc9LoaderFading` /
  `dc9LoaderStartedAtRef`; a fade effect keyed on `ready` | `error`; re-arm inside `restart()`;
  render it for `phase === 'dc9'` when not skipping 3D and not in accessible fallback. Move the
  Airbus loader markup onto the shared `chapter-loader*` class names.
- `src/styles.css` — rename the loader block to `.chapter-loader*`, add `.dc9-loader` framing,
  shade, z-order and rise animation plus its reduced-motion opt-out; delete every
  `.prototype-badge` rule.
- `src/components/dc9/Dc9Chapter.tsx` — top bar down to the `h1`; footer down to status + Restart.
- `src/game/config.ts` — drop the now-unused top-level `dc9LegacyFlow.disclaimer`. (The control
  check and instrument scan keep their own, which are still shown.)
- `src/components/dc9/LegacyRouteRecord.tsx` — add the binder element and the `<dl>` form fields;
  give the code/city their own classes; swap the status word for `.dc9-route-choice__mark` or the
  `Recorded` stamp.
- `src/components/dc9/dc9Chapter.css` — the whole route-record block, the feedback ink fix, the
  top-bar `h1` cap, and the narrow-screen tightening.
- `e2e/smoke.spec.ts` — the badge assertion becomes `toHaveCount(0)` plus a positive check that the
  top bar now reads exactly `DC-9 Final Flight Log`.

## Validation plan

- `npm run lint`, `npx tsc -b`, `npx vitest run`, `npx playwright test` (full suite, preview
  servers killed first so Playwright rebuilds rather than reusing another branch's `dist/`).
- Browser probes against `vite` on 127.0.0.1:5199 with the save patched in place (boot once so the
  app writes a schema-valid save, then patch only the `dc9` slice — the sanitiser derives `stage`
  from route evidence, so a hand-written state is not enough):
  - loading page with CDP throttling at 6 Mbit/s, at 1440 / 768 / 375, screenshot plus the
    read-out text, then screenshot again after the page detaches;
  - route record at 1440 / 768 / 375 in the open, three-selected, one-stamped and final-hint
    states, with `boundingBox`, `scrollHeight` vs `clientHeight`, computed colours and per-cell
    `scrollWidth` vs `clientWidth`;
  - every other chapter stage at 1440 and 375 to prove the top-bar and document-offset changes did
    not disturb them.

## Acceptance criteria

- Entering `phase === 'dc9'` with the GLB still downloading shows `.dc9-loader` with a percentage
  that advances and a `<progress>` that tracks it; the page detaches once the cockpit is ready.
- `.prototype-badge` has count 0 in every phase; `.dc9-chapter__topbar` has the exact text
  `DC-9 Final Flight Log`; the string *Commemorative, non-operational* appears nowhere in `src/`.
- The Legacy Route Record dialog stays under 650 px tall at 1440×900 (the existing e2e bound) and
  no city label is clipped at any of the three widths.
- Every existing DC-9 e2e assertion passes unchanged apart from the badge line.

## Repair loop and stop conditions

Review → focused repair → re-measure in the browser → remaining-delta review. Stop when the
acceptance checks pass, or at the owner gate.

## Evidence

Commands actually run on `pr/dc9-loader-route-record`:

- `npm run lint` — clean.
- `npx tsc -b --pretty false` — clean.
- `npx vitest run` — **421 passed across 33 files**.
- `npx playwright test` (full suite, preview servers killed first) — **60 passed, 1 skipped,
  1 failed**: `smoke.spec.ts:304`, the duplicate-heading strict-mode violation above.
- After the heading fix, `npx playwright test e2e/smoke.spec.ts` — **30 passed, 1 skipped**,
  including `smoke.spec.ts:304` and the 2.5-minute real-GLB
  `DC-9 production cockpit stages the Final Flight Log with the existing registry`.
- After the two-column fix, `npx playwright test e2e/smoke.spec.ts` re-run — **30 passed,
  1 skipped**, again including the real-GLB DC-9 test.

Browser measurements (Chromium, `vite` dev server, save patched in place):

- Loading page, CDP throttle 6 Mbit/s: read-out advanced through
  `Preparing the DC-9-32 flight deck / 37% / 13.3 of 36.1 MB downloaded` at 1440,
  `39% / 14.1 of 36.1 MB` at 768, `36% / 13.0 of 36.1 MB` at 375, then the page detached and the
  live cockpit rendered.
  Screenshots: `dc9-loader-{1440,768,375}.png`, `dc9-after-loader-{1440,768,375}.png`.
- Route record dialog height: **499 px at 1440×900** (the e2e bound is 650), 709 px at 768×1024,
  608 px at 375×812.
- Route record overflow (`scrollHeight`/`clientHeight`): 497/497 at 1440, 707/707 at 768, 613/606 at
  375 (7 px, versus 669/578 before the narrow-screen tightening).
- Width sweep at 375/480/640/768/900/1024/1180/1239/1241/1366/1440/1920 with one stop stamped and
  one selected: columns flip 1 → 2 between 1239 and 1241 as intended, **zero clipped rows and zero
  child boxes outside their row at every width**.
- City cells: `scrollWidth == clientWidth == 187` for all six at 1440 (was 148/135 for
  `Minneapolis–St. Paul`).
- Feedback paragraph ink: `rgb(94, 61, 28)` (was `rgb(191, 201, 187)`).
  `.dc9-document__question` unchanged at `rgb(40, 33, 23)`, which is what the e2e contrast
  assertion checks.

Owner-review screenshots, all at 1440 / 768 / 375, in
`preview-renders/dc9-loader-route-record/`: `01-loading-page-*` (captured under a 6 Mbit/s CDP
throttle), `02-chapter-frame-*` (the live cockpit the page hands off to, with the cleaned title bar
and footer), `03-route-record-open-*`, `04-route-record-selected-*`, `05-route-record-stamped-*`,
`06-route-record-final-support-*`.

## Outcome and handoff

**Awaiting owner review.** All three requested changes are in and measured. Known limitations,
stated plainly:

- A DC-9 GLB load failure still falls back to the placeholder box behind
  `.dc9-chapter__load-error`; the loading page deliberately does not offer its own retry. Adding a
  `dc9RetryToken` to match the Airbus and locker is a small follow-up if wanted.
- At 375 px the record still overflows its frame by 7 px, so the page scrolls a hair; the submit
  button is on screen.
- Between roughly 1240 and 1300 px the two-column form is on but tight, so
  `Minneapolis–St. Paul` sets on two lines and the dialog grows to 533 px. Nothing clips; it is
  simply the least pretty width.
- The loading page copy (`Every hour of it hand-flown.` / `The right seat, six dials in a fixed
  scan, and the routes that built a career.`) is written to match the Airbus page's voice and is
  the owner's to change.
