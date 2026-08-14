/**
 * Story-beat accents measured once from public/audio/intro-audio-53s.mp3
 * (ffmpeg astats, 0.1s RMS windows; a cue is an RMS jump over the previous
 * window). Values are baked so playback stays deterministic — the runtime
 * never analyzes audio. Each cue lies inside its locked scene window from
 * introConfig; the dB figure is the measured jump at that instant.
 */
export const INTRO_MUSIC_CUES = {
  /** Pop T finishes materializing and stands ready (+16.9 dB at 7.512). */
  assembleDone: 7.512,
  /** First duffel tug lands on the grid downbeat (+16.0 dB at 8.976). */
  firstDuffelJolt: 8.976,
  /** The key bursts from the bag on the pickup before the slam (+9.3 dB). */
  keyBurst: 12.696,
  /** Red "!" pops on the largest hit in the whole track (+28.6 dB). */
  exclaim: 13.056,
  /** The key stops taunting and rockets offscreen (+14.5 dB at 14.544). */
  keyFlyExit: 14.544,
  /** Runway cart crosses Pop T's lane (+13.4 dB at 19.368). */
  cartNearMiss: 19.368,
  /** The key swats the baseball (+14.6 dB at 24.552). */
  ballDeflect: 24.552,
  /** Pop T meets the bull statue (+9.6 dB at 30.480). */
  bullImpact: 30.48,
  /** The red digital horizon ignites with the sky scene (+17.8 dB). */
  skyGridIgnite: 35.64,
  /** The lunge that misses (+9.1 dB at 45.120). */
  missLunge: 45.12,
  /** Recovery surge back into the chase (+20.1 dB at 46.008). */
  catchRecover: 46.008,
  /** Glove closes on the key (+13.5 dB at 47.496). */
  catchGrab: 47.496,
  /** Winged-globe emblem stamps in (+20.3 dB at 49.704). */
  emblemStamp: 49.704,
} as const

/** The duffel tugs repeat on the measured ~83 BPM half-bar grid. */
export const DUFFEL_JOLT_PERIOD_SECONDS = 0.72
