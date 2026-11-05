# Fighting sound auditions, revision 2

Current decision, 2026-11-04: the owner selected **Heavy hitters**, then explicitly approved the announcer and character specials. Twenty accepted WAVs are integrated locally under `public/audio/mars-arcade-v1/`, byte-identical to these source files. `SELECTION.json` records the approval statements, exact files and hashes; plan 0077 and the [integration report](../../../asset-reports/mars-arcade-audio-2026-11-04.md) record implementation and validation. Arcade snap remains unselected. The generated manifest is the reproducible audition inventory; `SELECTION.json` is the later selection authority.

The first, entirely synthesized sets were not accepted: the owner found them generic and emphasized that this is a fighting game. Those files remain unchanged in `../arcade-candidates-2026-11-03/`. The rest of this document records the revision-2 audition before selection.

Listen locally:

`http://127.0.0.1:5418/art-source/audio/arcade-fight-candidates-v2-2026-11-03/index.html`

The audition page, rejected first-pass media, unselected Arcade snap WAVs and demo mixes remain in the owner's local workspace and are excluded from the PR. The published source records include the selected twenty WAVs, original inputs/licenses, generator, inventory metadata and selection authority. Running the generator can recreate the complete two-set inventory; its manifest also records the historical unselected outputs. The local listening URL above requires the preserved local audition page.

The new source material is recorded contact and moving air. Two directions use the same 10.3-second combo/finish schedule:

- **Arcade snap:** shorter, brighter contact, sharp kick cracks and dry blocks.
- **Heavy hitters:** lower-pitched body contact, fuller kick thuds and a heavier landing.

Each has three jab takes, two heavy punches, two kick impacts, two guarded contacts, a missed swing, a guard break and a knockdown. Repeated button presses cycle variants. Contact sounds start at impact; the demo also places a separate air swing before contact. Misses have no contact layer. Impact/guard/air levels deliberately differ.

Four separate signature candidates give TECHNOKING an electric strike, TEFLON DON spinning swishes and a cap bonk, THE CAPTAIN a synthesized engine/air flyby, and SCAM ALTMAN a flutter/pop text burst. The signature reel plays them in that order. These are sound-design interpretations, not recordings of the literal game objects. A shared recorded announcer offers “Round one,” “Fight!”, “You win!” and “Combo!”; it does not contain a spoken KO. Voices remain candidates, not a selected game feature.

## Source and license evidence

Unmodified selected recordings and included license documents are in `sources/`. `sources.json` records author, canonical page, download URL, archive hash, original filename and each saved source's hash/size. All four primary pages identify CC0; the supplied Thwack and Kenney license files also confirm it. Original archives remain in `/tmp/cockpit-fight-audio-sources/` and can be retrieved from the recorded URLs.

Kenney's original license retains its hash-pinned CRLF and trailing tabs. A path-specific `.gitattributes` whitespace rule preserves that upstream formatting; source and application files keep their normal whitespace checks.

| Source | Author | Basis |
| --- | --- | --- |
| [37 hits/punches](https://opengameart.org/node/2558) | Independent.nu, submitted by qubodup | Selected unmodified `hit*.mp3.flac` recordings, CC0 on source page |
| [Thwack Sounds](https://opengameart.org/content/thwack-sounds) | Jordan Irwin / AntumDeluge | Selected unmodified PCM files, included README and CC0 license |
| [Swishes Sound Pack](https://opengameart.org/content/swishes-sound-pack) | artisticdude | Selected unmodified WAV files, CC0 on source page |
| [Voiceover Pack: Fighter](https://opengameart.org/content/voiceover-pack-fighter-40-taunts) | Kenney | Four unmodified OGG lines and included CC0 license; author upload |

`generate.py` makes the edits/layers: trim, resample/pitch, EQ, transient/body blend, dynamics and endpoint fades, plus original synthesized signature components. Run with existing Python, NumPy and ffmpeg:

```sh
python3 art-source/audio/arcade-fight-candidates-v2-2026-11-03/generate.py
```

The manifest describes **35 candidate WAVs / 4,274,702 bytes**, 48 kHz mono/16-bit PCM. Original inputs total 23 files / 688,749 bytes, including source licenses. All source/output hashes match, every output has non-silent signal, and no samples clip; maximum candidate peak is −1.94 dBFS, including layered demos. Deterministic source edits and seeded synthesis make regeneration reproducible.

## Actual audition checks

Installed Playwright/Chromium 1243 decoded all 35 WAVs. Native playback advanced for every one of the 32 individual variations/signatures/voice lines. Both combo demos started by keyboard; the complete Arcade snap demo reached its natural end; the signature reel and Stop worked. At 375/768/1440 there is no horizontal overflow, both demos are reachable, and the native media/Stop controls remain visible. Reload starts silently. Console/page errors: zero. Screenshots were inspected. Browser plugin unavailable; proof is `/tmp/arcade-fight-v2-browser.json`, `.log` and `-{375,768,1440}.png`.

At the audition handoff, the isolated review browser opened this page and started Arcade snap once by native click, unmuted at volume 0.55 with advancing media time. `/tmp/arcade-fight-v2-owner.json` records that historical handoff. That spike changed no game audio, combat rule, animation, persistence, deployment, paid service or production dependency. The later owner selection and integration are recorded above and in plan 0077.
