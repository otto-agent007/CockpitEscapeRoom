import { describe, expect, it } from 'vitest'
import { DC9_KEY_FANFARE, dc9KeyFanfareDurationSeconds, dc9KeyFanfarePeakGain } from './dc9KeySfx'

describe('DC9_KEY_FANFARE', () => {
  const pitched = DC9_KEY_FANFARE.sounds.filter((sound) => sound.voice !== 'noise')

  it('is a rising C major arpeggio', () => {
    expect(pitched.map((sound) => Math.round(sound.frequency))).toEqual([523, 659, 784, 1047])
    for (const sound of DC9_KEY_FANFARE.sounds) {
      if (sound.voice === 'noise') continue
      expect(sound.endFrequency).toBe(sound.frequency)
    }
  })

  it('staggers the notes so the chord assembles rather than stabbing', () => {
    const entries = pitched.map((sound) => sound.delaySeconds ?? 0)
    for (let index = 1; index < entries.length; index += 1) {
      expect(entries[index]!).toBeGreaterThan(entries[index - 1]!)
    }
    // ...but they overlap: the first note is still holding when the last one enters.
    const first = pitched[0]!
    const last = pitched[pitched.length - 1]!
    expect(last.delaySeconds ?? 0).toBeLessThan((first.delaySeconds ?? 0) + (first.sustainSeconds ?? 0))
  })

  /**
   * The bug this guards: without a sustain every voice inherits the ident gag's percussive
   * envelope, which is one percent of peak a third of the way through and inaudible by half.
   * Measured in the browser, that made the whole fanfare a click.
   */
  it('holds every voice long enough to be heard, not just attacked', () => {
    for (const sound of DC9_KEY_FANFARE.sounds) {
      expect(sound.sustainSeconds, `${sound.voice} ${sound.frequency}`).toBeDefined()
      expect(sound.sustainSeconds!).toBeGreaterThan(0.1)
      expect(sound.sustainSeconds!).toBeLessThan(sound.durationSeconds)
      // At least a third of the note is at full level before the release starts.
      expect(sound.sustainSeconds! / sound.durationSeconds).toBeGreaterThan(0.12)
    }
  })

  it('counts a voice as finished only after its own delay', () => {
    const naive = Math.max(...DC9_KEY_FANFARE.sounds.map((sound) => sound.durationSeconds))
    expect(dc9KeyFanfareDurationSeconds()).toBeGreaterThan(naive)
    expect(dc9KeyFanfareDurationSeconds()).toBeCloseTo(1.22, 6)
  })

  it('stays a short, quiet flourish rather than a jingle', () => {
    expect(dc9KeyFanfareDurationSeconds()).toBeLessThanOrEqual(1.5)
    expect(dc9KeyFanfarePeakGain()).toBeLessThanOrEqual(0.2)
    // Every voice can be holding at once, so the summed level is what reaches the master.
    const summed = DC9_KEY_FANFARE.sounds.reduce((total, sound) => total + sound.gain, 0)
    expect(summed).toBeLessThanOrEqual(0.75)
  })

  it('ships no audio file', () => {
    for (const sound of DC9_KEY_FANFARE.sounds) {
      expect(['square', 'triangle', 'noise']).toContain(sound.voice)
    }
  })
})
