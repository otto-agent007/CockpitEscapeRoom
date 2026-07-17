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
