/**
 * The fanfare that plays when the Captain's Key reveal opens.
 *
 * Synthesized at runtime for the same reasons the intro's gag is: no binary
 * asset, no licensing question, nothing downloaded. The descriptor shape is
 * `IntroSfxSound`, so `IntroSfxPlayer` can render it unchanged — that player
 * owns an AudioContext and knows nothing about any particular story.
 *
 * This module is pure so the fanfare can be asserted without WebAudio.
 */

import type { IntroSfxCue, IntroSfxSound } from './introSfx'

function tone(
  voice: IntroSfxSound['voice'],
  frequency: number,
  endFrequency: number,
  durationSeconds: number,
  gain: number,
): IntroSfxSound {
  return { voice, frequency, endFrequency, durationSeconds, gain }
}

/**
 * A rising major triad with a soft shimmer over it — a small, warm "you earned
 * this" rather than an arcade jingle. The whole thing is under a second and a
 * half so it is finished well before the player reads the card.
 *
 * `IntroSfxPlayer.play` starts every sound in a cue at once, so the arpeggio is
 * spelled out as overlapping tones of increasing length rather than as separate
 * scheduled cues: each note starts together and the longer ones ring on, which
 * lands as a chord blooming open.
 */
export const DC9_KEY_FANFARE: IntroSfxCue = {
  id: 'dc9-key-reveal',
  timeSeconds: 0,
  sounds: [
    // C5 - E5 - G5 - C6, each ringing longer than the last.
    tone('triangle', 523.25, 523.25, 0.34, 0.20),
    tone('triangle', 659.25, 659.25, 0.52, 0.18),
    tone('triangle', 783.99, 783.99, 0.72, 0.17),
    tone('square', 1046.5, 1046.5, 1.05, 0.10),
    // A brushed-metal shimmer under the chord, for the key itself.
    tone('noise', 5200, 1600, 0.9, 0.05),
  ],
}

/** Peak gain of the loudest voice, so a test can hold the mix in place. */
export function dc9KeyFanfarePeakGain(): number {
  return Math.max(...DC9_KEY_FANFARE.sounds.map((sound) => sound.gain))
}

/** Longest voice in the fanfare, in seconds. */
export function dc9KeyFanfareDurationSeconds(): number {
  return Math.max(...DC9_KEY_FANFARE.sounds.map((sound) => sound.durationSeconds))
}
