import { describe, expect, it } from 'vitest'
import { introScenes } from './introConfig'
import { deriveIntroFrame } from './introRenderer'

const representativeTimes = [0, 3, 6, 12, 16, 22, 28, 35, 42, 48, 51, 53] as const

describe('finished TMB2 intro choreography', () => {
  it.each([
    { time: 0, scene: 'tmb2-ident', actors: [] },
    { time: 3, scene: 'tmb2-ident', actors: ['popt'] },
    { time: 6, scene: 'duffel', actors: ['popt', 'duffel'] },
    { time: 12, scene: 'key-escape', actors: ['popt', 'key'] },
    { time: 16, scene: 'runway', actors: ['popt', 'key'] },
    { time: 22, scene: 'ballpark', actors: ['popt', 'key', 'baseball'] },
    { time: 28, scene: 'city-finance', actors: ['popt', 'key', 'bull'] },
    { time: 35, scene: 'sky', actors: ['popt', 'key'] },
    { time: 42, scene: 'final-pursuit', actors: ['popt', 'key'] },
    { time: 48, scene: 'catch', actors: ['popt', 'key'] },
    { time: 51, scene: 'loop-reset', actors: ['key'] },
    { time: 53, scene: 'loop-reset', actors: ['key'] },
  ])('shows $scene production subjects at $time seconds', ({ time, scene, actors }) => {
    const frame = deriveIntroFrame(time)

    expect(frame.scene.id).toBe(scene)
    expect(frame.actors.map((actor) => actor.id)).toEqual(actors)
  })

  it('gives every scene a named environment and ordered integer layers', () => {
    for (const time of representativeTimes) {
      const frame = deriveIntroFrame(time)
      expect(frame.environment).toMatch(/^[a-z][a-z0-9-]+$/)
      expect(frame.layers).toEqual(['backdrop', 'ground', 'actors', 'foreground', 'effects'])
      for (const actor of frame.actors) {
        expect(Number.isInteger(actor.x)).toBe(true)
        expect(Number.isInteger(actor.y)).toBe(true)
      }
    }
  })

  it('uses every approved story scene without exposing protected rewards', () => {
    const serialized = JSON.stringify(
      introScenes.map((scene) => deriveIntroFrame(scene.startSeconds + 0.01)),
    )

    expect(serialized).not.toMatch(/tesla|model y|flight mode|mars/i)
    expect(serialized).toMatch(/runway/)
    expect(serialized).toMatch(/ballpark/)
    expect(serialized).toMatch(/city-finance/)
    expect(serialized).toMatch(/sky/)
  })
})
