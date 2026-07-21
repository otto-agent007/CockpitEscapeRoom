# TMB2 Intro Asset Recovery and Production Design

## Goal

Recover every usable TMB2 intro asset currently available in `/mnt/2TBHDD/Downloads`, preserve the recovered originals durably in CockpitEscapeRoom, rebuild a clean canonical runtime package, and replace the existing placeholder montage with the blonde-haired Pop T chase storyboard.

The completed intro remains a skippable 53-second sequence between **Start Game** and the DC-9 First-Officer Final Flight Log. It retains the existing audio controls, silent fallback, reduced-motion behavior, responsive layout, and one-shot DC-9 handoff.

## Confirmed Evidence

- The former package existed only in a temporary Codex workspace at short commit `c039ce1` and was never pushed.
- The former package reported 104 validated assets and a 52-entry runtime preload set.
- The former production ZIP reported SHA-256 `c93c42567d0dfcb6ce6cceb74ea4705dcdf05b35842fdcc3cf0ad6738613a157`.
- GitHub cannot resolve `c039ce1` in GameDevStuff.
- GameDevStuff PR #7 contains only the Pixel Snapper palette-binding repair and its regression test; it does not contain the lost package.
- GameDevStuff PR #8 adds a durable asset-persistence policy, but it does not contain recovered game assets.
- The exact former package cannot be restored. This milestone creates a new canonical package without imitating the former 104-file count or inventing missing filenames.

## Authoritative Creative Source

`/mnt/2TBHDD/Downloads/pilot Pop T with golden blond hair and blue eyes.png` is the authoritative intro storyboard. It establishes:

- blonde-haired, blue-eyed Pop T in a navy pilot uniform;
- a playful cartoon brass key antagonist and guide;
- the oversized duffel opening beat;
- an airport/runway chase;
- a ballpark detour;
- a city-finance/Charging Bull beat;
- a cloud and aircraft chase;
- the final catch and winged-emblem payoff.

`/mnt/2TBHDD/Downloads/pop t chasing the brass key.png` is preserved as a secondary storyboard reference. The 53-second `/mnt/2TBHDD/Downloads/TMB2-current-intro.mp4` is timing evidence rather than a source asset: its hash and media properties are recorded, but it is not committed because it embeds the owner-supplied placeholder music already represented by the tracked runtime cut.

## Recovered Source Vault

CockpitEscapeRoom permanently owns the recovered source material under:

```text
art-source/intro/tmb2/
├── recovered/
│   ├── 2026-07-19-storyboards/
│   ├── 2026-07-19-popt-runtime-archive/
│   └── 2026-07-20-cartoon-key-and-runway/
├── generated/
│   ├── backgrounds/
│   └── props/
└── README.md
```

The vault preserves original bytes. Original filenames, download timestamps, file sizes, dimensions, SHA-256 hashes, and duplicate relationships are recorded in a tracked machine-readable manifest. The two duplicate cartoon-key downloads remain represented in provenance, while only one byte-identical copy is needed in the normalized runtime package.

The existing full-length owner-supplied `IntroAudio.mp3` remains outside the public repository under the current audio policy. Its tracked 53.040-second deployable cut remains `public/audio/intro-audio-53s.mp3`.

## GameDevStuff Tool Boundary

GameDevStuff supplies reusable pixel-sprite tooling; it does not become a runtime dependency or the authority for CockpitEscapeRoom assets.

- Pin the tooling source to GameDevStuff commit `22722eabc8f09a706013305a0911a9d322ca9f4f`, which includes merged PR #7.
- Record the repository URL, exact commit, commands, configuration, and validation output in the CockpitEscapeRoom asset report.
- Use the pipeline to inspect, background-clean, normalize, align, export, and validate the recovered Pop T and cartoon-key frames.
- Do not depend on mutable `main`, a temporary worktree, or an unpushed GameDevStuff branch.
- Do not put CockpitEscapeRoom product assets into GameDevStuff as their only durable copy.
- Apply the persistence safeguards from GameDevStuff PR #8 even if that PR remains unmerged.

## ImageGen Boundary

ImageGen creates only missing standalone artwork needed to execute the approved storyboard. Recovered assets are never regenerated merely for convenience.

Required new scene plates:

1. Oversized navy pilot-duffel scene.
2. Night ballpark/baseball scene.
3. Neon city-finance/Charging Bull scene.
4. High-altitude cloud-and-aircraft scene.

Generate each background independently in a wide 16:10 composition with safe subject zones for Pop T, the cartoon key, captions, and responsive cropping. Do not bake Pop T, the cartoon key, text, logos, protected reward imagery, or UI controls into the background.

Generate separate transparent or removable-chroma props only when the layered scene needs them: duffel, baseball, Charging Bull, passenger jet, and winged emblem. Use the built-in ImageGen path, generate one distinct asset per call, remove chroma locally when alpha is required, and validate edges before runtime use.

Every generation uses the authoritative storyboard as a style, palette, mood, and composition reference. Final selected outputs are copied into `art-source/intro/tmb2/generated/` immediately, assigned descriptive versioned filenames, hashed, manifested, and committed. Rejected experiments do not become runtime assets.

## Canonical Runtime Package

Normalized browser assets live under:

```text
public/images/intro/tmb2/
├── backgrounds/
├── key/
├── popt/
├── props/
├── tmb2-intro-assets.json
└── contact-sheet.png
```

`tmb2-intro-assets.json` is the runtime contract. It contains:

- package schema version;
- source and runtime SHA-256 hashes;
- source provenance and duplicate relationships;
- asset role and scene assignment;
- dimensions, alpha status, and file size;
- sprite pivot, baseline, frame duration, and loop mode where applicable;
- preload inclusion;
- GameDevStuff tool commit for processed sprites;
- ImageGen prompt identifier and source reference for generated art.

The runtime package uses only files referenced by the intro configuration or its preload list. The new package count is evidence-derived; no target count is imposed.

## Intro Sequence

The existing 53-second audio remains the presentation clock. The new story timeline is:

| Time | Beat | Player-visible action |
| --- | --- | --- |
| 0-4 seconds | TMB2 ident | TMB2 boot card establishes the console-era presentation. |
| 4-11 seconds | Oversized duffel | Pop T pulls the oversized duffel; the cartoon key appears and startles him. |
| 11-19 seconds | Runway chase | Pop T chases the key across the recovered airport/runway background. |
| 19-27 seconds | Ballpark detour | The key redirects the chase through the baseball memory beat. |
| 27-35 seconds | Bull market launch | Pop T and the key cross the city-finance scene with the Charging Bull motif. |
| 35-43 seconds | Cloud chase | The chase moves into clouds with an aircraft silhouette and gliding motion. |
| 43-49 seconds | The catch | Pop T catches or reaches the key and recovers into the winged-emblem payoff. |
| 49-53 seconds | Mission ready | CockpitEscapeRoom title lockup hands off into the DC-9 chapter. |

The animation remains data-driven in `src/game/introConfig.ts`. Presentation logic belongs in focused React components and CSS rather than hard-coded timing branches. The intro may use sprite sheets, individual frames, and layered scene plates, but it does not advance persisted game progress while playing.

## Accessibility and Failure Behavior

- Preserve native **Skip Intro**, mute, volume, and retry controls.
- Preserve Escape-to-skip and one-shot completion behavior.
- Keep an accessible text equivalent for every story beat.
- Reduced motion replaces travel, sprite cycling, rapid wipes, and parallax with static approved frames and restrained crossfades.
- Missing or undecodable optional visual assets fall back to a text/card presentation without blocking the DC-9 handoff.
- Audio failure preserves the existing monotonic silent timeline and retry behavior.
- At approximately 375, 768, and 1440 CSS pixels, captions and controls remain visible without horizontal overflow.

## Story and Product Constraints

- Preserve the journey: briefing -> intro -> DC-9 First-Officer Final Flight Log -> locker -> Airbus A320 Pop T Captain Mode -> protected reward.
- The intro celebrates Pop T as an expert pilot; it does not depict an accident, emergency, or operational failure.
- Do not show or name the Model Y, Flight Mode, Mars reward, or later protected surprises.
- Do not change persistence, reducer rules, cockpit GLBs, interaction contracts, locker behavior, or Airbus behavior.
- Add no production dependency, analytics, tracking, account, upload, external font, or network-hosted runtime media.

## Validation and Persistence Gate

The milestone is not complete until all of the following are true:

1. Every recovered original is inventoried and either committed or explicitly excluded with a reason and SHA-256 hash.
2. Every runtime file is referenced by the canonical manifest and exists at its recorded hash.
3. Source and runtime contact sheets receive visual inspection.
4. Focused unit tests prove timeline boundaries, preload selection, duplicate handling, manifest integrity, and spoiler exclusion.
5. Browser tests prove natural completion, skip, Escape, repeated completion, audio failure/retry, keyboard controls, reload, and reduced motion.
6. Visual checks cover approximately 375, 768, and 1440 CSS pixels.
7. `npm run check`, `npm run test:e2e -- --workers=1`, `npm run assets:check`, and `git diff --check` pass.
8. `TEST_REPORT.md`, the active ExecPlan, `LICENSES/ASSET_MANIFEST.md`, and the intro asset report contain actual evidence.
9. The complete asset milestone is committed to CockpitEscapeRoom and pushed to a remote branch.
10. Remote file hashes match the local committed hashes.
11. A clean checkout of the remote commit restores the manifest, source vault, runtime package, and application checks without relying on Downloads, local caches, or temporary worktrees.
12. The owner receives a consistent browser proof set for the intro visual gate.

## Done When

- No usable recovered TMB2 image or sprite exists only in Downloads or a temporary directory.
- The new canonical package is self-describing, hash-bound, and remotely recoverable.
- The blonde-haired Pop T storyboard is recognizable in the complete 53-second browser intro.
- The intro retains all existing accessibility, audio, responsive, reduced-motion, and DC-9 handoff behavior.
- Missing standalone art has been generated, reviewed, persisted, and integrated without replacing recovered authoritative sources.
- CockpitEscapeRoom, not ChatGPT history or a temporary tool workspace, is the durable authority for the shipped intro.
