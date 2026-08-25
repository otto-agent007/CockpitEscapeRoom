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

- Source: **owner-supplied download**, `/mnt/2TBHDD/Downloads/storegraphic-crowd-cheers-314919.mp3`,
  incorporated at the owner's direction on 2026-08-23. The owner identified the origin as
  *storegraphic*; the file carries no embedded tags or licence metadata.
- **Licence: public domain, no attribution required** — confirmed by the owner on 2026-08-23, who
  sourced the file. The confirmation is the authority here: the download carries no embedded tags
  and the origin publishes no machine-readable per-file terms, so this was not independently
  verifiable the way the Wikimedia Commons clip it replaces was.
- Preserved original: `.cache/cockpit-pipeline/sources/audio/key-celebration/original/storegraphic-crowd-cheers-314919.mp3`
- Source size: `706,351` bytes
- Source SHA-256: `62a6501be2e736aae0fbd6b1a15d64216c8722081c5e55c4d44035dec1d1b922`
- Source media: MPEG Layer III, 256 kbps, 44.1 kHz stereo, 22.07 seconds
- Deployable cut: `public/audio/key-celebration.mp3`
- Deployable size: `160,958` bytes
- Deployable SHA-256: `35f70174f13ca0c8f37a71eef146e6816d5dbcb29d1bc404e22e5e30b8d2311b`
- Verified media: MPEG Layer III, 128 kbps CBR, 44.1 kHz stereo, 10.00 seconds, peak **-3.7 dBFS**

The owner asked for the first ten seconds, which is what this is: `-t 10.0` from the start, so the
recording's own swell-in from near silence over the first second is preserved. The crowd is still
at full level at ten seconds, so a hard cut would chop mid-cheer; a 1.2-second fade from 8.8 s
lets it resolve. Measured tail RMS falls from 0.102 to 0.023 across that taper. Reproducible
command:

```
ffmpeg -t 10.0 -i storegraphic-crowd-cheers-314919.mp3 \
  -af "afade=t=out:st=8.8:d=1.2,volume=0.80" \
  -ar 44100 -ac 2 -c:a libmp3lame -b:a 128k -write_xing 1 key-celebration.mp3
```

Kept in stereo, unlike the previous mono clip, because the source is a stereo crowd recording and
the width is most of what makes it read as a room full of people. `volume=0.80` is a deterministic
gain: it takes the source's 0.868 peak to -3.7 dBFS.

Playback: every milestone celebration card plays it once at `volume 0.55` — the Captain's Key, the
captain's locker, and Pop T Captain Mode complete — inside the click that got the player there, and
stops it when the card closes, so continuing early cuts it short rather than letting it run on.
Each card carries a **Sound on/off** toggle, and all three share one stored choice under
`cockpit-escape-room:sound:v1`: silencing it at one milestone keeps it silent at the next. The key
is deliberately separate from the game-state key, so restarting the game does not turn the sound
back on. There is no volume slider for this one-shot; the intro keeps its own mute and volume
controls, and the Airbus simulator ambience has its own topbar Sound button.

A card reached without a click — a reload while the celebration is already on screen — is silent,
because the browser blocks playback until the document has been interacted with. That is the
browser's rule, not a setting, and it is why the playback tests click their way to each card.
