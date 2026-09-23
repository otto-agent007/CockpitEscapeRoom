# Booster SPACE LASER art — 2026-09-23

## Result

Owner feedback on the code-drawn beam: *"The special is too generic, we need to create
some new assets for it."* The special now has generated art end to end:

- **Booster, three poses:** call it in (arm thrown up, phone at the hip, cyan screen), watch it
  land ("nailed it" open hand, smug look), pocket the phone and raise the guard.
- **A Starlink satellite** parks under the HUD over the defender, fires from its lens, and
  flies on to the right once the beam is gone.
- **The beam** runs from the lens to the floor, drawn from one generated beam at three
  widths: 14 px slam, 10 px hold, 6 px thin.
- **The impact** on the regolith plays flash, burst and dust, then leaves a scorch mark.

No rules changed. The hit still resolves on the press frame. The call-in pose is held for 10
recovery frames because the hit itself lasts only one frame and would never be seen. The watch
pose runs to recovery frame 20, then the pocket pose.
Reduced motion keeps all three poses, one steady 10 px beam, and the scorch. It drops the
flash, the width changes and the satellite's exit.

## Art and provenance

The art came from Codex CLI's built-in `image_gen` on the ChatGPT plan, with
`OPENAI_API_KEY` unset for every run. Exact prompts are in
`art-source/arcade/prompts/space-laser-v1/`. There are no hand-painted or Python-repaired pixels.

| Asset | Reference | Attempts | Native size |
| --- | --- | --- | --- |
| `call-it-in-00` | `booster/generated/wardrobe-sleek/anchor-00.png` | 1 | 1024×1536 |
| `watch-00` | `call-it-in-00` | 1 | 1024×1536 |
| `pocket-00-c1` | `pocket-00` | 1 + 1 correction | 1024×1536 |
| `satellite-00` | none | 1 | 2172×724 |
| `impact-sheet-00` | none | 1 | 2172×724 |
| `beam-00` | none | 1 | 941×1672 |

Codex reported a faint halo on the three poses and small lower-body shifts. The halo is about
1% of pixels at very low alpha and vanishes in the downsample. The leg change is minor and
reads as the same stance at game scale.

**The pocket correction.** The first pocket pose failed the gate on one 1 px transparent speck. It
was not a punched-through hole: the enclosed gap between the raised forearm and the chest
narrowed to a single pixel at game scale. The owner rightly noted it is invisible at normal
size. The check was kept, not relaxed. One generator correction tucked the fist against
the collar and closed the crook, and that version passed. The rejected `pocket-00.png` and its
normalised cell remain local only.

## Normalisation

Poses use the unchanged character tool at Booster's locked scale:

```bash
python3 tools/assets/normalise-popt-frame.py SRC DEST \
  --contract asset-reports/mars-arcade-sprite-contract.json \
  --source-px-per-cell-px 14.038461538461538 --resample bilinear --source-alpha
```

The results are 107 / 97 / 101 px occupied height, feet on baseline 119, and they sit inside the envelope.
The gate `check-popt-frames-fullcolour.py` on `booster/normalised-space-laser-ready` reports
3 frames and 0 failures.

Effects use the new `tools/assets/normalise-arcade-effect.py`. It applies the same
premultiplied-alpha area resample as the character tool, but has no feet or cell to place
against:

| Mode | Asset | Result |
| --- | --- | --- |
| `fit --width 80` | satellite | 80×10; lens measured at column 65.5, bottom row 9 |
| `strip --frames 4 --width 64` | impact | 4 × 64×28, one union box so all frames share ground line and centre |
| `beam --width 14/10/6 --height 148` | beam | from row 40 (under the lens) to the floor, row 188 |

The first satellite pass at 56 px wide was 7 px tall and lost its lens, so it was widened to 80 px.

## Runtime

- `src/dev/arcadeHarnessEffects.ts` loads and size-checks the 8 effect images. Its own status line
  reads "8/8 laser effects ready", separate from the character sprite count.
- `src/dev/arcadeHarnessLaser.ts` `laserStrikeLook()` holds the per-age choices: beam width, impact
  frame and satellite offset.
- The character sprite table grows from 46 to 49. Every arcade browser script's readiness
  string moved by exactly 3, and the missing-art cases keep their failure counts.
- If any effect image fails to load, the harness falls back to a flat drawn beam.

## Verification

- `npm run check`: lint, types, 788 tests / 64 files, build PASS. The new selection test was
  RED before the poses were wired.
- `check-arcade-space-laser.mjs` 11 PASS, in 5 cases:
  - guarding / 1440, by button;
  - airborne / 1440, by keyboard;
  - reduced motion / 768;
  - standing / 375;
  - effect art blocked (drawn fallback).
  - Each case asserts from the canvas's own `drawImage` calls which satellite, beam, impact and
    pose are drawn on the hit frame, and that the pose is still up later.
- The other arcade suites all PASS on this branch: pilot 12, stage 9, HUD 10, movement 5,
  exchange 7, heavy 13, heavy-hit 6 (+7 with Oracle attacking), heavy-block 7,
  continuity 2, outcomes 7.
- The HUD check was already failing on #76 before this work. Commit `5e26066` had changed three
  HUD colours without updating the check. The check now asserts the current colours with its
  thresholds unchanged. It also accepts `ARCADE_EVIDENCE_DIR`, because it had been
  overwriting committed screenshots.
- Evidence is in `preview-renders/mars-arcade/space-laser-v2/`. Start with `beam-ages-sheet.png` and
  `art-sheet.png`. The checksums are in `asset-reports/mars-arcade-space-laser-2026-09-23.sha256`.

## Open

- Owner visual review.
- **Character gym:** owner rule, every completed animation belongs in the gym. The gym's
  animation list only exists as uncommitted work in the `mars-backdrop` worktree, so these
  three poses must be added to `ARCADE_GYM_ANIMATIONS` when that lands.
- The satellite's navy solar array is low-contrast against the darkest sky rows under the HUD.
  It still reads through the grey chassis and the beam; a lighter array or a thin light outline
  would help.
