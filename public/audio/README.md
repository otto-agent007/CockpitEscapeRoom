# Audio

This is a private, personal build, so owner-supplied or self-made audio may be used freely.

Production audio must include mute and volume controls and must not autoplay before a player gesture.

## Genesis-style placeholder intro

- Owner-supplied source: `/mnt/2TBHDD/Downloads/IntroAudio.mp3`
- Source size: `5,015,659` bytes
- Source SHA-256: `0c1864eb97762841b64c57229c07e70eb620724a02a53ddb69a7465a9eac704f`
- Deployable cut: `public/audio/intro-audio-53s.mp3`
- Deployable size: `1,273,994` bytes
- Deployable SHA-256: `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`
- Verified media: MPEG Layer III, 192 kbps, 48 kHz, joint stereo
- Verified duration: `53.040` seconds, one MP3 frame within the requested first-53-second boundary

The source file remains unchanged outside the repository. The deployable copy was decoded and re-encoded with the workstation's GStreamer 1.24.2 `decodebin`, `audioresample`, `lamemp3enc`, and `id3v2mux` elements. An accurate `0..53 seconds` bounded seek was applied before playback-through-EOS so the MP3 finalized cleanly; the reproducible command and the rejected `identity eos-after` experiment are recorded in `plans/0015-genesis-game-intro.md`.

The app preloads this file on the existing briefing, but playback begins only inside the player's **Start Game** gesture. The intro provides mute, volume, retry-sound, and skip controls. This is owner-supplied placeholder music for the private CockpitEscapeRoom build.

## Captain's Key celebration cheer

- Source: **[File:Clapping hurray (cropped).oga](https://commons.wikimedia.org/wiki/File:Clapping_hurray_(cropped).oga)** on Wikimedia Commons, uploaded by *Starlite*.
- Licence: **public domain**. The Commons API reports `LicenseShortName: Public domain`,
  `UsageTerms: Public domain`, `AttributionRequired: false`, `Restrictions: none`. No attribution
  is required; it is recorded here anyway so the provenance stays reviewable.
- Preserved original: `.cache/cockpit-pipeline/sources/audio/key-celebration/original/clapping-hurray-cropped.oga`
- Source size: `188,398` bytes
- Source SHA-256: `4d5537bb38a4f3a92194261ed2ace4544825327912f47334ef9a33f32e8ff406`
- Source media: Ogg Vorbis, 44.1 kHz mono, 9.80 seconds
- Deployable cut: `public/audio/key-celebration.mp3`
- Deployable size: `53,960` bytes
- Deployable SHA-256: `77d29cb4d0c316d124935b0ea314472ea0d690046a02abab12f40b5d6096eac1`
- Verified media: MPEG Layer III, 128 kbps CBR, 44.1 kHz mono, 3.30 seconds, peak **-2.8 dBFS**

Chosen by measuring the source rather than by name. A per-window band analysis put the vocal
cheer at 6.25–7.60 s (voice/bright energy ratio 1.5–8.1 against 0.02–0.5 for the clapping-only
stretches), so the cut is `-ss 6.15 -t 3.30`: it opens on the "hurray", runs through the loudest
applause swell, and settles. Reproducible command:

```
ffmpeg -ss 6.15 -t 3.30 -i clapping-hurray-cropped.oga \
  -af "afade=t=in:st=0:d=0.03,afade=t=out:st=2.70:d=0.60,volume=0.66" \
  -ac 1 -ar 44100 -c:a libmp3lame -b:a 128k -write_xing 1 key-celebration.mp3
```

`volume=0.66` is a deterministic gain rather than `loudnorm`/`alimiter`: `alimiter` auto-levels
its output by default and pushed the peak straight back to full scale, which is the wrong shape
for a sound that arrives unannounced.

Playback: the Captain's Key reveal plays it once at `volume 0.55`, inside the click that opens the
card, and the card carries a **Sound on/off** toggle whose choice is stored under
`cockpit-escape-room:sound:v1` — deliberately separate from the game-state key, so restarting the
game does not turn the sound back on. There is no volume slider for this one-shot; the intro keeps
its own mute and volume controls.

