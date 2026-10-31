# Audio

This is a private, personal build, so owner-supplied or self-made audio may be used freely.

Production audio must fail safely. The automatic cinematic may attempt its soundtrack when it mounts; browser rejection keeps the visual timeline running silently and exposes a visible retry. The long-form cinematic provides mute and volume controls, while one-shot milestone and simulator layers provide persistent sound toggles appropriate to their scope.

## Console-era cinematic soundtrack

- Owner-supplied source: `/mnt/2TBHDD/Downloads/IntroAudio.mp3`
- Source size: `5,015,659` bytes
- Source SHA-256: `0c1864eb97762841b64c57229c07e70eb620724a02a53ddb69a7465a9eac704f`
- Deployable cut: `public/audio/intro-audio-53s.mp3`
- Deployable size: `1,273,994` bytes
- Deployable SHA-256: `be635257cce2ebb3e7e327cada37e09b4a3b4c292e5e385f280955a1d2843507`
- Verified media: MPEG Layer III, 192 kbps, 48 kHz, joint stereo
- Verified duration: `53.040` seconds, one MP3 frame within the requested first-53-second boundary

The source file remains unchanged outside the repository. The deployable copy was decoded and re-encoded with the workstation's GStreamer 1.24.2 `decodebin`, `audioresample`, `lamemp3enc`, and `id3v2mux` elements. An accurate `0..53 seconds` bounded seek was applied before playback-through-EOS so the MP3 finalized cleanly; the reproducible command and the rejected `identity eos-after` experiment are recorded in `plans/0015-genesis-game-intro.md`.

The app loads this file with the automatic cinematic and attempts playback once. There is no outer **Start Game** gesture. If autoplay is rejected, the visual timeline advances on its silent fallback clock and exposes **Retry sound**; the cinematic also provides mute, volume, retry-sound, and skip controls. This is owner-supplied music for the private CockpitEscapeRoom build.

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

Playback: the Captain's Key and captain's locker cards play it once at `volume 0.55` inside the click that got the player there, and
stops it when the card closes, so continuing early cuts it short rather than letting it run on.
Each card carries a **Sound on/off** toggle, and all three share one stored choice under
`cockpit-escape-room:sound:v1`: silencing it at one milestone keeps it silent at the next. The key
is deliberately separate from the game-state key, so restarting the game does not turn the sound
back on. There is no volume slider for this one-shot; the intro keeps its own mute and volume
controls, and the Airbus simulator ambience has its own topbar Sound button.

A card reached without a click — a reload while the celebration is already on screen — is silent,
because the browser blocks playback until the document has been interacted with. That is the
browser's rule, not a setting, and it is why the playback tests click their way to each card.

## Optimus congratulations voice

- Local source: Kokoro v1.0 ONNX model and voice bank at `/mnt/2TBHDD/thermo-explainer-video/tts/`; model and bank hashes and license links are recorded in `asset-reports/optimus-gen3-voice-preview-2026-10-29.md`.
- Approved voice: `af_heart` (Heart), selected by the owner on 2026-10-29 after hearing the greeting-and-walk preview.
- Spoken line and on-screen caption: “Congratulations! You did it! Your pilot skills have earned you something special. Ready to see it?”
- Deployable: `public/audio/optimus-congratulations-heart.mp3`, 52,149 bytes, SHA-256 `596507e432e37eff0d2884399f2ff3b91ed8e42934fec9ef45fbb0b552f5ec1c`, 24 kHz mono MP3, 5.664 seconds including MP3 padding.

The clip was generated offline with the local Heart voice at speed 0.96, then encoded to MP3. The ONNX model and voice bank stay outside the deployable game. The Airbus completion card mounts the clip only after chapter completion, attempts playback, offers a native replay control if autoplay is blocked, shares the persistent milestone Sound on/off choice, and keeps the entire line visible if audio is unavailable. Muting removes the audio element, so the file is not requested. The voice stops when the player selects **Reveal reward**.
