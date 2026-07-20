import { describe, expect, it } from 'vitest'
import { deriveIntroFrame } from './introRenderer'

describe('intro frame derivation', () => {
  it.each([0, 3, 6, 12, 16, 22, 28, 35, 42, 48, 51, 53])('keeps authored geometry integral at %s seconds', (time) => {
    const frame = deriveIntroFrame(time)
    for (const actor of frame.actors) {
      expect(Number.isInteger(actor.x)).toBe(true)
      expect(Number.isInteger(actor.y)).toBe(true)
    }
  })

  it('derives the scene from media time rather than frame deltas', () => {
    expect(deriveIntroFrame(21.999).scene.id).toBe('runway')
    expect(deriveIntroFrame(22).scene.id).toBe('ballpark')
  })

  it.each([
    { time: 53.04, scene: 'tmb2-ident', progress: 0 },
    { time: 53.04 * 3, scene: 'tmb2-ident', progress: 0 },
    { time: Number.NaN, scene: 'tmb2-ident', progress: 0 },
    { time: 59.04, scene: 'duffel', progress: 0 },
    { time: 60.54, scene: 'duffel', progress: 0.25 },
  ])('normalizes $time before scene-relative progress', ({ time, scene, progress }) => {
    const frame = deriveIntroFrame(time)

    expect(frame.scene.id).toBe(scene)
    expect(frame.progress).toBeCloseTo(progress)
    expect(frame.actors.every((actor) => Number.isInteger(actor.x) && Number.isInteger(actor.y))).toBe(true)
  })
})
