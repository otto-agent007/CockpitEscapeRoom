import { describe, expect, it } from 'vitest'
import { INTRO_SFX_CUES, deriveDueIntroSfx, introSfxWindowSeconds } from './introSfx'
import { deriveIntroAnimation } from './introAnimation'
import { INTRO_DURATION_SECONDS } from './introConfig'

describe('ident gag sound effects', () => {
  it('scores every gag beat inside the ident window', () => {
    expect(INTRO_SFX_CUES).toHaveLength(7)
    expect(INTRO_SFX_CUES.map((cue) => cue.id)).toEqual([
      'enter', 'slam', 'blinded', 'slide', 'flick', 'crooked', 'salute',
    ])
    for (const cue of INTRO_SFX_CUES) {
      expect(cue.timeSeconds, cue.id).toBeGreaterThan(0)
      expect(cue.timeSeconds, cue.id).toBeLessThan(introSfxWindowSeconds())
      expect(cue.sounds.length, cue.id).toBeGreaterThan(0)
    }
  })

  it('keeps the cue times in the order the gag plays them', () => {
    const times = INTRO_SFX_CUES.map((cue) => cue.timeSeconds)
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })

  it('pins each cue to the animation beat it scores', () => {
    // If a beat constant in the tmb2-ident case moves, this fails rather than
    // letting the sound drift silently away from the picture.
    const beatFor = (id: string) =>
      INTRO_SFX_CUES.find((cue) => cue.id === id)!.timeSeconds
    expect(deriveIntroAnimation(beatFor('enter') + 0.01, false).popt?.clipId).toBe('run')
    expect(deriveIntroAnimation(beatFor('slam') + 0.01, false).popt?.clipId).toBe('skid')
    expect(deriveIntroAnimation(beatFor('blinded') + 0.01, false).popt?.clipId).toBe('blinded')
    expect(deriveIntroAnimation(beatFor('slide') + 0.01, false).popt?.clipId).toBe('fall')
    expect(deriveIntroAnimation(beatFor('flick') + 0.01, false).popt?.clipId).toBe('flick')
    expect(deriveIntroAnimation(beatFor('crooked') + 0.01, false).popt?.clipId).toBe('landed')
    expect(deriveIntroAnimation(beatFor('salute') + 0.01, false).popt?.clipId).toBe('salute')
  })

  it('describes well-formed sounds the player can render', () => {
    for (const cue of INTRO_SFX_CUES) {
      for (const sound of cue.sounds) {
        expect(['square', 'triangle', 'noise']).toContain(sound.voice)
        expect(sound.frequency).toBeGreaterThan(0)
        expect(sound.endFrequency).toBeGreaterThan(0)
        expect(sound.durationSeconds).toBeGreaterThan(0)
        expect(sound.durationSeconds).toBeLessThan(1)
        expect(sound.gain).toBeGreaterThan(0)
        expect(sound.gain).toBeLessThanOrEqual(1)
      }
    }
  })

  it('fires each cue exactly once as the clock passes it', () => {
    const fired: string[] = []
    let previous = 0
    for (let time = 0; time <= INTRO_DURATION_SECONDS; time += 1 / 60) {
      for (const cue of deriveDueIntroSfx(previous, time, false)) fired.push(cue.id)
      previous = time
    }
    expect(fired).toEqual(INTRO_SFX_CUES.map((cue) => cue.id))
  })

  it('plays nothing under reduced motion', () => {
    expect(deriveDueIntroSfx(0, 6, true)).toEqual([])
  })

  it('drops a backwards jump and a long stall instead of dumping overdue cues', () => {
    expect(deriveDueIntroSfx(5, 1, false)).toEqual([])
    expect(deriveDueIntroSfx(0, 6, false)).toEqual([])
    expect(deriveDueIntroSfx(Number.NaN, 3, false)).toEqual([])
    // A normal frame still fires.
    expect(deriveDueIntroSfx(2.48, 2.51, false).map((cue) => cue.id)).toEqual(['slam'])
  })
})
