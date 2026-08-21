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
   * Re-timed 2026-08-20 (third pass) to slow the whole intro down.
   *
   * The arithmetic that drives this: two anchors are fixed by the track — the
   * doors open on the 18 s vocal, and the aircraft reveal lands on the +17.8 dB
   * hit at 35.64. That splits the story into windows of 10.5 s, 17.6 s and
   * 7.2 s. Carrying all nineteen images forced one of those windows to about
   * 1.3 s per shot every time, which is why the whole story used to be over
   * before 18 s. At roughly 2.5 s per shot these windows hold FIFTEEN images,
   * so four were cut and the suit-up moved AFTER the doors: the stripes, watch,
   * logbook and shades now read as things noticed on the way out, and the
   * shades go on as he steps into the light.
   */
  /** Boots hit the tarmac (+16.9 dB at 7.512). */
  bootsDown: 7.512,
  /** Coffee set down. */
  coffeeDown: 10.284,
  /** The cap flipped and caught — the track's largest hit (+28.6 dB at 13.056). */
  capFlip: 13.056,
  /** Wings pinned. */
  wingsPinned: 15.528,
  /** The hangar doors part around him ON the 18 s "standing there alone"
   * downbeat, and keep grinding open through the whole vocal. The release-lever
   * insert that used to take this hit is retired (owner, 2026-08-20): the
   * gates themselves are the image the lyric asks for. */
  doorsParting: 18,
  /** He stands alone, his shadow reaching down the hangar floor. */
  standingAlone: 21,
  /** Four captain's stripes on the shoulder as he goes. */
  fourStripes: 23.4,
  /** A glance at the watch. */
  watchCheck: 25.7,
  /** Dad's reading pile — the Musk biography and the Reacher paperbacks —
   * swept aside to get to the logbook beneath. Widened to 3.4 s so the joke
   * has room: books first, then the hand on the bare logbook. */
  logbookSnap: 28,
  /** Shades down as he steps into the light. */
  shadesDown: 31.4,
  /** The last of the walk out across the floor. */
  walkOut: 33.4,
  /** Floodlights slam on and the DC-9 is there with him (+17.8 dB at 35.64). */
  aircraftReveal: 35.64,
  /** The instrument panel wakes left to right (grid: 35.64 + 4 beats). */
  instrumentsAlive: 38.52,
  /** The hand settles on the throttles (grid: 35.64 + 7 beats). */
  handOnThrottles: 40.68,
  /** Throttles up — the landing lights blaze across the tarmac (+9.1 dB at 45.120). */
  throttlesUp: 45.12,
  /** Rotate — the light sweep lifts off the ground and away (+20.1 dB at 46.008). */
  rotate: 46.008,
  /** The last light is gone; hard cut inside to the empty right seat (+13.5 dB at 47.496). */
  intoTheSeat: 47.496,
  /** The instrument glow resolves into the game's title (+20.3 dB at 49.704). */
  titleCard: 49.704,
} as const

/** The measured ~83 BPM half-bar beat grid the ritual and montage cuts ride. */
export const BEAT_GRID_SECONDS = 0.72
