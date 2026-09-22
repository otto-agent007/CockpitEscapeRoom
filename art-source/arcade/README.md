# Mars arcade cabinet — sprite source

## Published checkpoint contents

The animation checkpoint includes all38 runtime sprites, selected original source art,
generation prompts, and the small historical inputs required by the Python regression
tests. Other candidate images and raw recordings remain in the author's local worktree.
Historical reports below describe that larger local archive; a referenced experiment
path is not necessarily part of this PR. Current browser evidence is in
`preview-renders/mars-arcade/outcomes-v1/`. The arcade remains a dev-only harness:
run `npm run dev` and open `/dev/arcade.html`; it is not in the production Vercel build.

## Current continuation — 2026-09-22

Booster now has three-beat victory and harmless seated knockdown animations in the dev
harness. Five new cells in `booster/normalised-outcomes-ready/` plus existing recoil;
38unique runtime sprites. All five pass unchanged gates. Nine raw generated sources
and exact prompts are preserved in `generated/outcomes-v1/` and `prompts/outcomes-v1/`.
Accepted V4 contact, fixed scale and rules unchanged; no manual pixel edits.
Reduced motion settles immediately; healthy timeout losers/draws stay standing.
See `asset-reports/mars-arcade-outcomes-2026-09-22.md` for checks and playback evidence.
Specials, Sam/Captain outcomes, FX and in-between polish remain unfinished.
Earlier entries below are historical checkpoints, not current source counts.

## Current owner direction — 2026-09-21

V4 C2 contact is now integrated: owner accepted its34px artwork reach(one pixel below
the former minimum). Gameplay reach38 and all timing/other sprites remain unchanged.
No redraw or pixel edit. Fresh fullcheck691tests and heavy/both-facing browser checks
pass; sidebar and normal/half-speed videos refreshed. See the V4 report below.
Earlier candidate/rejection checkpoints follow; they do not describe current selection.

Owner approved V4's initial straighter arm direction. Latest size-corrected C2 is104px
tall beside103px adjacent poses, but fist reach34 fails minimum35. It is a preserved
candidate, not integrated. No new pixel edits or gate changes. Sidebar shows the
five-pose scale comparison. Latest report: mars-arcade-heavy-contact-v4-2026-09-21.md.

Contact artwork remains under revision: owner rejected V2 and V3 arm anatomy despite
passing code/geometry checks. The dev harness has33sources and five Booster heavy beats
within unchanged combat timing, but this is NOT an accepted visual fix. V4 uses a fresh
joint-position guide. Both individually authorized alpha-pixel repairs are preserved;
no Python eye-color edits were approved. Latest evidence: heavy-contact-v3 report.

Earlier V1 repair attempt was **not integrated**: owner identified a Booster heavy arm swap.
`booster/generated/heavy-continuity-v1/` and matching normalized candidate folders retain
six attempts. Final drafts use the same arm, but contact reach and recovery alpha fail
acceptance after the bounded retries. Existing heavy runtime art remains unchanged.
See `asset-reports/mars-arcade-heavy-continuity-2026-09-21.md`; sidebar shows candidates,
not a completed fix. No pixel edits or relaxed gates. Earlier checkpoint below is history.

Newest batch: six heavy key poses under each fighter's `normalised-heavy-ready/`:
startup/contact/recovery for Elon overhand and Sam low sweep.32runtime sprites load.
All pass unchanged full-colour gates at fixed scales; active reach40/42 stays within
38±3/40±3. No balance changes or pixel repairs. These are dynamic lean/crouch drawings,
not standing-height clips.13raw sources and exact prompts remain in `generated/heavy-v1/`
and `prompts/heavy-v1/`. See `asset-reports/mars-arcade-heavy-2026-09-21.md`.
`check-arcade-heavy.mjs` and `record-arcade-heavy.mjs` in `tools/assets/` reproduce proof.
The full5/6-heavy drawing budgets remain unchanged; this is a three-key-pose pilot.
Specials, outcomes, effects, Captain and in-between polish remain unfinished.

Latest continuation adds eight cells under each fighter's `normalised-movement-ready/`:
Sam forward footwork2 and Elon/Sam airborne rise/apex/fall3each.26runtime sprites load.
Sources/prompts are preserved in `generated/movement-v1/` and `prompts/movement-v1/`.
Fixed scales, clothes, reach and combat rules unchanged; no pixel editing. All eight pass
the existing full-colour gate; Sam jump proportions/extension remain a visual polish item.
See `asset-reports/mars-arcade-movement-2026-09-21.md`. Check movement with
`node tools/assets/check-arcade-movement.mjs`; record native-control motion with
`node tools/assets/record-arcade-movement.mjs`. Heavy/special, outcomes, FX and Captain
animation remain unfinished. Earlier checkpoints below are historical.

Owner accepted Sam jab02 and40px reach. The counterattack is integrated: Sam's three attack
cells are in `oracle/normalised-counterattack-ready/`; Elon's two defensive cells join
`booster/normalised-sleek-ready/`. All18runtime sprites pass unchanged gates; both fighters
now punch/block/recoil in the real-input replay. Sam damage/timing and Elon's41px jab unchanged.
All sources and exact prompts remain in `generated/counterattack-v1/` and
`prompts/counterattack-v1/`. No pixel editing or extra generation after the40px decision.
See `asset-reports/mars-arcade-counterattack-2026-09-21.md` for provenance and current evidence.
Earlier checkpoints follow; the full animation set and production wiring remain unfinished.

Newest bounded checkpoint: two Sam guarded backward-shuffle cells in
`oracle/normalised-footwork-ready/walk-back/`, using the existing13.60576923076923 scale.
Thirteen sprites now load; defensive reactions override walking and forward-walk art
remains unauthored. Rules and earlier assets unchanged. See
`asset-reports/mars-arcade-sam-footwork-2026-09-20.md` for prompts, hashes and motion proof.

Latest: owner approved the sleek black-leather/charcoal outfit and41px jab. All seven
Booster runtime cells are in `booster/normalised-sleek-ready/`; all use the existing
14.038461538461538 scale. Oracle/Captain remain unchanged, for eleven loaded cells total.
Jab damage/timing unchanged; dedicated early pullback now authored. All cells pass.
Source/prompt provenance, checks and current motion evidence:
`asset-reports/mars-arcade-sleek-jab-2026-09-20.md`. The prior checkpoint below is historical.

Owner subsequently accepted the cleaned likeness direction and said to continue.
Current checkpoint: **dev-only short exchange, not full animation**. The dev harness uses
the three `normalised-clean` anchors, Booster's `normalised-wave-1-pilot/idle/idle-01.png`,
and six cells in Booster/Oracle `normalised-exchange-ready/`. These add planted shuffle,
jab anticipation/contact/recovery and Sam's guard/recoil. Failed probes remain preserved
but unloaded. See `asset-reports/mars-arcade-exchange-2026-09-20.md` for exact provenance,
the owner's approval of two localized pixel repairs, source hashes and browser/motion evidence.

New Wave 1 sources have real alpha: use **`--source-alpha --resample bilinear`** with the
locked scale below. Do not convert their hidden RGB into a background. Older magenta-key
anchors must continue using the magenta mode (omit `--source-alpha`).

Run `npm run dev -- --host 127.0.0.1 --port 5317`, then open `/dev/arcade.html`.
`node tools/assets/check-arcade-pilot.mjs` runs the reproducible browser pilot checks.
`node tools/assets/check-arcade-exchange.mjs` checks the short exchange. Use the native
**Play exchange** button to review at half speed; **Free play** returns to the CPU round.
Nothing under `art-source/arcade` is copied into the production build.

The owner confirmed the new likenesses are closer. The current cleaned review cells are
`<fighter>/normalised-clean/anchor/anchor-00.png` for all three fighters; each passes the
unchanged objective gate. The source artwork is unchanged. Latest sidebar comparison:
`preview-renders/mars-arcade/wave-0-clean-review.png`.

Use **`--resample bilinear`** for this arcade set, with the already-derived exact scales:

| Fighter | Source image under `generated/` | Scale for subsequent frames |
| --- | --- | --- |
| booster | `anchor-likeness-00.png` | 14.038461538461538 |
| oracle | `anchor-likeness-00.png` | 13.60576923076923 |
| captain | `anchor-00.png` | 13.990384615384615 |

This opt-in export avoids Lanczos ringing at narrow gaps and retains float precision until
unpremultiplication. The tool's default remains unchanged for existing intro assets.
Run `python3 tools/assets/normalise-popt-frame.test.py` for the real-asset regression and
default-output checks. Final art review remains separate from the passing pixel gates.

### Earlier likeness exports (preserved)

Booster now resembles Elon Musk; Oracle resembles Sam Altman without the former glasses.
Captain is unchanged. This explicitly supersedes the earlier invented-only art direction.
Original candidates remain intact. Latest raw files are
`{booster,oracle}/generated/anchor-likeness-00.png`; their normalized review cells are
`{booster,oracle}/normalised-likeness/anchor/anchor-00.png`. Current review sheet:
`preview-renders/mars-arcade/wave-0-likeness-review.png`.

New candidate scales (derive once, do not apply the older scales below to these images):
Booster **14.0385 (1460 / 104)**; Oracle **13.6058 (1415 / 104)**.
Oracle passes the existing gate. Booster fails on three transparent specks. These are
likeness-review candidates, not approved anchors for motion generation.

Fighter art for the optional arcade cabinet behind the ending. The contract is
`asset-reports/mars-arcade-sprite-contract.json`, the process is
`asset-reports/mars-arcade-frame-prompt-pack.md`, and the task brief for the current wave is
`prompts/05_MARS_ARCADE_SPRITE_WAVE_0.md`.

## Layout

```
art-source/arcade/
  prompts/            ready-to-send prompt text, assembled from the pack
  <fighter>/
    generated/        raw generator output, untouched
    normalised/
      <clip>/         <clip>-NN.png in the 128x128 contract cell
```

`<fighter>` is `booster`, `oracle` or `captain`.

## Generating

Codex CLI's built-in `image_gen` only. Never set `OPENAI_API_KEY`.

```
# booster and oracle have no reference yet - the anchor creates it
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  - < art-source/arcade/prompts/anchor-booster.txt

# the captain is Pop T, so his existing identity anchor is attached
codex exec -C /mnt/2TBHDD/CockpitEscapeRoom -s workspace-write \
  -i art-source/intro/tmb2/popt-v2/references/identity-anchor-1024.png \
  - < art-source/arcade/prompts/anchor-captain.txt
```

## Normalising and gating

Derive each fighter's scale **once**, from that fighter's own anchor, then reuse it for every
frame of that fighter. Re-fitting per frame makes the character change size between clips.

```
CONTRACT=asset-reports/mars-arcade-sprite-contract.json

# once per fighter - prints the scale to lock in
python3 tools/assets/normalise-popt-frame.py \
    art-source/arcade/booster/generated/anchor-00.png /tmp/probe.png \
    --contract $CONTRACT --derive-scale

# every frame thereafter, with that printed value
python3 tools/assets/normalise-popt-frame.py \
    art-source/arcade/booster/generated/anchor-00.png \
    art-source/arcade/booster/normalised/anchor/anchor-00.png \
    --contract $CONTRACT --source-px-per-cell-px <locked value>

python3 tools/assets/check-popt-frames-fullcolour.py \
    --contract $CONTRACT art-source/arcade/booster/normalised
```

Both tools are the Pop T ones, reused unchanged via `--contract`. Verified 2026-09-19 against
this contract in both directions: a correct 104 px frame passes; a short one, a floating one,
and one with leftover `#FF00FF` are rejected.

Airborne and knocked-down poses have no foot span on the baseline — normalise those with
`--align bbox` and record the offset once per clip.

## Locked scales

| Fighter | source px per cell px | Derived from |
| --- | --- | --- |
| booster | 13.9519 (1451 / 104) | `booster/generated/anchor-00.png` |
| oracle | 13.5000 (1404 / 104) | `oracle/generated/anchor-00.png` |
| captain | 13.9904 (1455 / 104) | `captain/generated/anchor-00.png` |

These scales bind the 2026-09-20 review candidates only; identity approval remains open.
Each fighter has its original and first correction under `generated/anchor-attempt-00.png`
and `anchor-attempt-01.png`; `anchor-00.png` is the final, second correction. The Oracle
passes the objective gate. The Booster fails on two transparent specks and the Captain on
one. Do not begin motion generation from these candidates yet. See
`asset-reports/mars-arcade-wave-0-2026-09-20.md` for validation and visual deviations.
