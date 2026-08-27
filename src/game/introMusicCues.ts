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
  /**
   * Re-timed 2026-08-20 (owner): the opening runs FAST — boots through the
   * four stripes at ~1.39 s a beat — so the stripes and aviators both land before
   * the gates, which stay pinned to the 18 s "standing there alone" vocal.
   * Everything after the gates plays long (2.4 s+). The runway lineup act was
   * cut, so the departure stays inside the cockpit and the panel and throttles
   * take the 45.12 and 46.008 hits.
   */
  /** Boots hit the tarmac (+16.9 dB at 7.512). */
  bootsDown: 7.512,
  /** Coffee set down. */
  coffeeDown: 8.898,
  /** The cap flipped and caught. */
  capFlip: 10.284,
  /** Wings pinned. */
  wingsPinned: 11.67,
  /** Four captain's stripes — the track's largest hit (+28.6 dB at 13.056). */
  fourStripes: 13.056,
  /** Aviators down, the last beat before the doors. */
  shadesDown: 15.528,
  /** The hangar doors part around him ON the 18 s vocal and hold through it. */
  doorsParting: 18,
  /** He stands alone, his shadow reaching down the hangar floor. */
  standingAlone: 21,
  /** The reading pile swept aside and the flight log picked up (four stages). */
  logbookSnap: 23.4,
  /** The headset slung over his shoulder. */
  headsetUp: 26.8,
  /** A glance at the watch as he steps into the light. */
  watchCheck: 29.2,
  /** The long walk out across the floor. */
  walkOut: 31.6,
  /** Floodlights slam on and the DC-9 is there with him (+17.8 dB at 35.64). */
  aircraftReveal: 35.64,
  /** The instrument panel wakes left to right (grid: 35.64 + 4 beats). */
  instrumentsAlive: 38.52,
  /** Overhead panel switches sweep on (grid: 35.64 + 6 beats). */
  overheadPanel: 39.96,
  /** Engine light-off on the nacelle, before the hands reach the levers
   * (owner, 2026-08-20). Three spool states over its beat. */
  nacelleLight: 42.12,
  /** The hand settles on the throttles (grid: 35.64 + 12 beats). */
  handOnThrottles: 44.28,
  /** Throttles up — the hand pushes them forward (+9.1 dB at 45.120). */
  throttlesUp: 45.12,
  /** Rotate — the panel surges as the nose lifts (+20.1 dB at 46.008). */
  rotate: 46.008,
  /** Hard cut to the empty right seat (+13.5 dB at 47.496). */
  intoTheSeat: 47.496,
  /** The instrument glow resolves into the game's title (+20.3 dB at 49.704). */
  titleCard: 49.704,
} as const

/** The measured ~83 BPM half-bar beat grid the ritual and montage cuts ride. */
export const BEAT_GRID_SECONDS = 0.72
