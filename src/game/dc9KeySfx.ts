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

function note(
  voice: IntroSfxSound['voice'],
  frequency: number,
  delaySeconds: number,
  durationSeconds: number,
  sustainSeconds: number,
  gain: number,
): IntroSfxSound {
  return { voice, frequency, endFrequency: frequency, delaySeconds, durationSeconds, sustainSeconds, gain }
}

/**
 * A C major arpeggio that arrives one note at a time and then rings as a chord.
 *
 * Every voice carries an explicit `sustainSeconds`. The first version of this cue did not,
 * and inherited the ident gag's percussive envelope: measured in the browser it peaked at
 * 0.37, fell to one percent of that by 300 ms and was inaudible by 500 ms, so a
 * second-long chord played as a click. The notes now hold for roughly half their length
 * before releasing.
 *
 * The stagger is what makes it read as a flourish rather than a stab: the four notes enter
 * 90 ms apart and overlap from 0.27 s, so the chord assembles under the player as the card
 * opens.
 */
export const DC9_KEY_FANFARE: IntroSfxCue = {
  id: 'dc9-key-reveal',
  timeSeconds: 0,
  sounds: [
    //     voice       Hz        in     len   hold  gain
    note('triangle', 523.25, 0.00, 1.10, 0.55, 0.16), // C5
    note('triangle', 659.25, 0.09, 1.05, 0.50, 0.15), // E5
    note('triangle', 783.99, 0.18, 1.00, 0.46, 0.14), // G5
    note('square', 1046.50, 0.27, 0.95, 0.42, 0.09), // C6, a little sparkle on top
    // A brushed-metal shimmer under the chord, for the key itself.
    { voice: 'noise', frequency: 5200, endFrequency: 1600, delaySeconds: 0.22, durationSeconds: 0.85, sustainSeconds: 0.12, gain: 0.04 },
  ],
}

/** Peak gain of the loudest voice, so a test can hold the mix in place. */
export function dc9KeyFanfarePeakGain(): number {
  return Math.max(...DC9_KEY_FANFARE.sounds.map((sound) => sound.gain))
}

/**
 * When the last voice falls silent, in seconds from the start of the cue. Includes each
 * voice's delay, or the AudioContext would be released before the top note finished.
 */
export function dc9KeyFanfareDurationSeconds(): number {
  return Math.max(...DC9_KEY_FANFARE.sounds.map((sound) => (sound.delaySeconds ?? 0) + sound.durationSeconds))
}
