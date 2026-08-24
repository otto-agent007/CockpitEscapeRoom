import { describe, expect, it } from 'vitest'
import { DC9_KEY_FANFARE, dc9KeyFanfareDurationSeconds, dc9KeyFanfarePeakGain } from './dc9KeySfx'

describe('DC9_KEY_FANFARE', () => {
  it('is a rising major triad that blooms rather than arpeggiating', () => {
    const pitched = DC9_KEY_FANFARE.sounds.filter((sound) => sound.voice !== 'noise')
    expect(pitched).toHaveLength(4)
    // C5 E5 G5 C6, each ringing longer than the one below it.
    expect(pitched.map((sound) => Math.round(sound.frequency))).toEqual([523, 659, 784, 1047])
    for (let index = 1; index < pitched.length; index += 1) {
      expect(pitched[index]!.durationSeconds).toBeGreaterThan(pitched[index - 1]!.durationSeconds)
    }
  })

  it('holds a steady pitch on every note', () => {
    for (const sound of DC9_KEY_FANFARE.sounds) {
      if (sound.voice === 'noise') continue
      expect(sound.endFrequency).toBe(sound.frequency)
    }
  })

  it('stays a short, quiet flourish rather than a jingle', () => {
    expect(dc9KeyFanfareDurationSeconds()).toBeLessThanOrEqual(1.5)
    expect(dc9KeyFanfarePeakGain()).toBeLessThanOrEqual(0.25)
    // Everything starts together, so the summed peak is what the player actually hears.
    const summed = DC9_KEY_FANFARE.sounds.reduce((total, sound) => total + sound.gain, 0)
    expect(summed).toBeLessThanOrEqual(1)
  })

  it('ships no audio file', () => {
    for (const sound of DC9_KEY_FANFARE.sounds) {
      expect(['square', 'triangle', 'noise']).toContain(sound.voice)
    }
  })
})
