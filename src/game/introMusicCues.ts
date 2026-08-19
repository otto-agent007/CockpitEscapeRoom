/**
 * Story-beat accents for the Scramble intro (plan 0031). The measured cues
 * come from public/audio/intro-audio-53s.mp3 (ffmpeg astats, 0.1 s RMS
 * windows; a cue is an RMS jump over the previous window), measured once for
 * plan 0028 and unchanged since — the track is the same, only the story on
 * top of it moved. Cues marked "grid" are extrapolated on the measured
 * ~83 BPM half-bar grid (0.72 s), the same grid the ident beats ride. Values
 * are baked so playback stays deterministic — the runtime never analyzes
 * audio. Each cue lies inside its scene window from introConfig.
 */
export const INTRO_MUSIC_CUES = {
  /** Boots hit the tarmac — first ritual still (+16.9 dB at 7.512). */
  bootsDown: 7.512,
  /** Coffee set down (+16.0 dB at 8.976; also the beat-grid origin). */
  coffeeDown: 8.976,
  /** The flight case (grid: 8.976 + 2 beats). */
  flightCase: 10.416,
  /** The latches snap shut (grid: 8.976 + 4 beats). */
  latchesSnap: 11.856,
  /** Floodlights slam onto the DC-9 — largest hit in the track (+28.6 dB). */
  hangarReveal: 13.056,
  /** The suit-up montage opens: the cap flipped and caught (+14.5 dB at 14.544). */
  capFlip: 14.544,
  /** Four captain's stripes (grid: 14.544 + 3 beats). */
  fourStripes: 16.704,
  /** The logbook snaps shut (+13.4 dB at 19.368). */
  logbookSnap: 19.368,
  /** Wings pinned (grid: 19.368 + 3 beats). */
  wingsPinned: 21.528,
  /** A glance at the watch — time to go (+14.6 dB at 24.552). */
  watchCheck: 24.552,
  /** Shades down, white streak (+9.6 dB at 30.480). */
  shadesDown: 30.48,
  /** Engine light-off; the beacon starts flashing on the grid (+17.8 dB). */
  engineStart: 35.64,
  /** The instrument panel wakes left to right (grid: 35.64 + 4 beats). */
  instrumentsAlive: 38.52,
  /** The photo on the glareshield (grid: 35.64 + 6 beats). */
  thePhoto: 39.96,
  /** The hand settles on the throttles (grid: 35.64 + 8 beats). */
  handOnThrottles: 41.4,
  /** Throttles up — the takeoff roll begins (+9.1 dB at 45.120). */
  throttlesUp: 45.12,
  /** Rotate — the nose lifts (+20.1 dB at 46.008). */
  rotate: 46.008,
  /** The DC-9 pulls up past the camera (+13.5 dB at 47.496). */
  jetPass: 47.496,
  /** Winged-globe emblem stamps into the contrail (+20.3 dB at 49.704). */
  emblemStamp: 49.704,
} as const

/** The measured ~83 BPM half-bar beat grid the ritual and montage cuts ride. */
export const BEAT_GRID_SECONDS = 0.72
