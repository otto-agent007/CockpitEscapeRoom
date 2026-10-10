# Arcade typography and low-energy feedback

Goal: cleaner, modern text in the local arcade and its controls; a prominent low-energy red warning that remains readable and supports reduced motion. User requested modern fonts and low-energy blinking. Work inline in the existing animation-workflow checkout; no publication or production dependency.

Context: shared dev shell uses uppercase monospace and canvas uses5x7bitmap text. Long green health bar already dims rapidly below25%; current renderer doesn't honor reduced motion for that warning. Blue special meter is separate. Sam's accepted2second reading pause,4.5second dialogue and1secondpen hold must remain unchanged.

Design decision: owner confirmed the long green health bar; also improve the blue special meter. Use existing25% threshold,1Hz red pulse, LOW label without a percentage (owner direction), steady red in reduced motion; no health/damage/meter rule changes. Keep the special meter blue and show a cyan ready rim plus cost notch. Use local system sans-serif for shell/HUD/dialogue, monospace for diagnostic numbers. No remote fonts, downloads, tracking or new dependency.

Files: dev/arcade-shell.css, dev/arcade.html, src/dev/arcadeHarness.ts, src/dev/arcadeHarnessPivot.ts, new src/dev/arcadeTypography.ts, src/game/marsArcadeHud.ts/test; evidence and reports. Existing HUD rectangles/portrait framing, sprites, bounds, move tables and tuning remain exact.

Done when: real regular arcade shows clean names/timer/banners/Sam dialogue and modern native controls; real damage brings health to25%or lower and visible red warning pulses at1Hz with LOW cue, remains steady for reduced motion and stops when notcritical/KO; mirroredbar lengths remain readable and no overlap at375/768/1440. Accessible low-health feedback mirrors canvas. Pause/reload/native/keyboard controls and Sam behavior remain working. Focused RED/GREEN, fullchecks main/review, browser before/candidate proof, scoped review and hash-verified recovery. Browser plugin is absent; use regular Playwright and existing owner-visible agent-browser session. Preserve all dirty work, owner drafts and prior versions; no commit/deploy.

Progress: inspected live source, status, existing25%/8tick blink and sprite/typography code. Owner chose long green health bar for red pulse, asked for cooler blue bar, and explicitly removed the percentage. Cyan segments and a cost notch highlight special readiness at the actual move cost; full meter stays gold.

Validation: Modern local system-sans HUD and shared arcade/gym controls; monospace diagnostic text retained. Health: existing25% threshold, slower1Hz red pulse, LOW text, steady reduced-motion and KO, no percentage per owner. Cyan segmented special meter with readiness from actual move cost and notch;100meter stays gold. No dependencies or remote fonts. HUD rectangles and accepted sprite/move/tuning bytes unchanged.

Verification: focused health RED(old8tick phase failed) to GREEN(36 focused tests), main npm run check961tests/86files, review974/88 plus lint/types/build. Native real two Sam attacks bring target22HP, both sides and both motion settings; sampled red frame changes only for normal motion, LOW without%, accessible warning clears on restart. Arcade/gym at375/768/1440 both5360/5362 no overflow/errors. Four Sam reading/pen browser cases pass:120stationaryreading ticks,60pen image ticks with57nonattackingrecovery, single36hit/theft; modern speech lines fit. Gym5362 server stopped at last step; restored listener and separate two-gym recheck passed. Original failed log retained. Tmux%1 updated with actual stage screenshot; no owner acceptance inferred.

Fresh scoped review: no Critical/Important findings. Deferred minor: special-cost notch uses continuous width so some costs land one stage pixel into a segment gap; cosmetic. System font checked on current workstation; cross-platform metrics not verified. Browser plugin unavailable, regular Playwright fallback used.

Remaining: save verified recovery and review owner-reported Booster clothing mismatch as separate art candidate; no HUD code changes required.

HUD recovery verified:69files, SHA256342e344139f1f5bf50ce52ac58749fbdcfe5b5da79b31c8e6bff32f51a3a0afe, fresh main/review107/155sprite normal play/gym reopen passed. HUD implementation complete; owner-reported art mismatch tracked separately in plan0057.
