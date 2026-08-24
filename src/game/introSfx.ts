/**
 * Sound effects for the TMB2 ident hat gag (plan 0034).
 *
 * These are synthesized at runtime rather than shipped as audio files: no
 * binary assets, no licensing question, nothing downloaded, and square/noise
 * voices are what the Genesis-era hardware this ident imitates actually used.
 *
 * This module is pure — a table of cues and the logic that decides which have
 * become due between two clock samples. It constructs no AudioContext, so the
 * whole schedule is unit-testable. `introSfxPlayer.ts` turns a descriptor into
 * sound and knows nothing about the story.
 */

/** Which synthesized voice plays a cue. */
export type IntroSfxVoice =
  /** Square wave — melodic blips, taps, the salute sting. */
  | 'square'
  /** Triangle wave — softer, rounder body for thuds. */
  | 'triangle'
  /** Filtered white noise — gusts, skids, fabric, impacts. */
  | 'noise'

export type IntroSfxSound = {
  voice: IntroSfxVoice
  /** Start frequency in Hz. Ignored by the noise voice. */
  frequency: number
  /** Frequency at the end of the sound; a slide when it differs from the start. */
  endFrequency: number
  durationSeconds: number
  /** Peak gain before the player applies the user's volume. 0–1. */
  gain: number
}

export type IntroSfxCue = {
  id: string
  /** Seconds into the intro, on the same clock as INTRO_MUSIC_CUES. */
  timeSeconds: number
  sounds: readonly IntroSfxSound[]
}

const IDENT_GAG_WINDOW_SECONDS = 6

function square(
  frequency: number,
  endFrequency: number,
  durationSeconds: number,
  gain: number,
): IntroSfxSound {
  return { voice: 'square', frequency, endFrequency, durationSeconds, gain }
}

function triangle(
  frequency: number,
  endFrequency: number,
  durationSeconds: number,
  gain: number,
): IntroSfxSound {
  return { voice: 'triangle', frequency, endFrequency, durationSeconds, gain }
}

function noise(durationSeconds: number, gain: number, frequency = 1200, endFrequency = 300): IntroSfxSound {
  return { voice: 'noise', frequency, endFrequency, durationSeconds, gain }
}

/**
 * The gag's sound track, beat for beat. Times match the constants in the
 * `tmb2-ident` case of introAnimation.ts; the alignment is test-locked.
 */
export const INTRO_SFX_CUES: readonly IntroSfxCue[] = [
  {
    // Pop T sprints in: two quick footfall blips.
    id: 'enter',
    timeSeconds: 1.776,
    sounds: [square(220, 180, 0.05, 0.18), noise(0.04, 0.1)],
  },
  {
    // The logo slams home, he skids, and the gust takes his cap: a low thud
    // under a long noise skid, then the airy whoosh of the gust.
    id: 'slam',
    timeSeconds: 2.496,
    sounds: [
      triangle(140, 48, 0.34, 0.45),
      noise(0.3, 0.3, 2600, 700),
      noise(0.42, 0.16, 700, 2400),
    ],
  },
  {
    // Blinded — the cap drops over his eyes. A soft descending bonk.
    id: 'blinded',
    timeSeconds: 3.216,
    sounds: [triangle(360, 150, 0.14, 0.3), noise(0.1, 0.12, 900, 400)],
  },
  {
    // The cap falls free off his face: a short fabric slide. Moved from 3.636
    // when the gag went from six poses to twelve, so it still lands on the
    // frame where the cap actually comes loose.
    id: 'slide',
    timeSeconds: 3.696,
    sounds: [noise(0.16, 0.14, 1500, 600)],
  },
  {
    // He flicks it back up: a rising whip.
    id: 'flick',
    timeSeconds: 4.416,
    sounds: [square(300, 900, 0.12, 0.26), noise(0.09, 0.12, 600, 2200)],
  },
  {
    // It lands crooked on his head: a hollow wooden knock.
    id: 'crooked',
    timeSeconds: 5.136,
    sounds: [triangle(200, 96, 0.16, 0.34), noise(0.06, 0.14, 1100, 500)],
  },
  {
    // Straighten and salute: a bright two-note sting.
    id: 'salute',
    timeSeconds: 5.376,
    sounds: [square(660, 660, 0.1, 0.26), square(990, 990, 0.22, 0.24)],
  },
]

/**
 * Cues that fall in `(previousTimeSeconds, currentTimeSeconds]`.
 *
 * Returns nothing under reduced motion, which holds a single static logo frame
 * and has no gag to score, and nothing when the clock jumps backwards (a loop
 * restart) or leaps forward (a scrub or a dropped frame), so a stall never
 * dumps a pile of overdue sounds at once.
 */
export function deriveDueIntroSfx(
  previousTimeSeconds: number,
  currentTimeSeconds: number,
  reducedMotion: boolean,
): readonly IntroSfxCue[] {
  if (reducedMotion) return []
  if (!Number.isFinite(previousTimeSeconds) || !Number.isFinite(currentTimeSeconds)) return []
  const delta = currentTimeSeconds - previousTimeSeconds
  if (delta <= 0 || delta > 0.5) return []
  return INTRO_SFX_CUES.filter(
    (cue) => cue.timeSeconds > previousTimeSeconds && cue.timeSeconds <= currentTimeSeconds,
  )
}

/** Every gag cue sits inside the ident window; nothing scores the story. */
export function introSfxWindowSeconds(): number {
  return IDENT_GAG_WINDOW_SECONDS
}
