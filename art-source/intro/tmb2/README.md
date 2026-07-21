# TMB2 intro source vault

This directory is the durable source of truth for the Pop T chase intro.

## Authority

- Creative authority: `recovered/2026-07-19-storyboards/pilot Pop T with golden blond hair and blue eyes.png`.
- Secondary reference: `recovered/2026-07-19-storyboards/pop t chasing the brass key.png`.
- Recovered Pop T animation package: `recovered/2026-07-19-popt-runtime-archive/PopT-cinematic-runtime-assets.zip`.
- Recovered cartoon-key poses and runway plate: `recovered/2026-07-20-cartoon-key-and-runway/originals/`.

All recovered files retain their original bytes and filenames. See `asset-reports/tmb2-intro-assets.json` for hashes, dimensions, duplicate relationships, exclusions, and processing provenance.

## Processing boundary

GameDevStuff is build tooling only. Sprite processing is pinned to repository `https://github.com/otto-agent007/GameDevStuff` at commit `22722eabc8f09a706013305a0911a9d322ca9f4f`. Runtime files remain committed under `public/images/intro/tmb2/`; the browser never depends on GameDevStuff or a local cache.

Authenticated GameDevStuff state must be created under `umask 0077` on this workstation. Its verified Pixel Snapper release is `pixel-snapper-v1.0.0-commit.5743009` (binary SHA-256 `bd03110406efc2efc0b094c0442a2265cb44f935a3f418fc30fdc20e77eb3f96`). The recovered key plates require configured chroma tolerance `45`; inspection then reports one unclipped foreground component per unique pose. The pinned standalone `snap` CLI currently fails signed-receipt validation after managed installation, so this recovery retains its manual handoff and executes the hash-verified binary with explicit arguments before returning to pipeline normalization and export.

ImageGen may create only the four missing storyboard scene plates under `generated/backgrounds/`. Recovered sources are not regenerated for convenience.

## Intentionally excluded binaries

- `/mnt/2TBHDD/Downloads/IntroAudio.mp3` remains outside this public repository under the existing audio policy. The tracked deployable cut is `public/audio/intro-audio-53s.mp3`.
- `/mnt/2TBHDD/Downloads/TMB2-current-intro.mp4` is timing evidence that embeds the same owner-supplied music. Its hash and media properties are recorded, but it is not a source dependency.

The milestone is not complete until committed runtime/source hashes are verified from the pushed remote commit and a clean checkout passes the asset gate.
