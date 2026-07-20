import { describe, expect, it } from 'vitest'
import {
  getIntroSpriteFrame,
  introSpriteClips,
  validateIntroSpriteClips,
} from './introSpriteClips'

describe('intro sprite clips', () => {
  it('keeps every Pop T clip on normalized 256px cells with a shared feet anchor', () => {
    expect(() => validateIntroSpriteClips(introSpriteClips)).not.toThrow()

    for (const clip of Object.values(introSpriteClips)) {
      expect(clip.frameWidth).toBe(256)
      expect(clip.frameHeight).toBe(256)
      expect(clip.anchor).toEqual({ x: 64, y: 112 })
      expect(clip.drawSize).toEqual({ width: 128, height: 128 })
    }
  })

  it('samples looping clips from scene-relative time deterministically', () => {
    expect(getIntroSpriteFrame('run', 0)).toBe(0)
    expect(getIntroSpriteFrame('run', 0.079)).toBe(0)
    expect(getIntroSpriteFrame('run', 0.08)).toBe(1)
    expect(getIntroSpriteFrame('run', 0.64)).toBe(0)
    expect(getIntroSpriteFrame('run', Number.NaN)).toBe(0)
  })

  it('holds the final reach frame instead of wrapping the catch', () => {
    expect(getIntroSpriteFrame('reach', 0)).toBe(0)
    expect(getIntroSpriteFrame('reach', 0.5)).toBe(2)
    expect(getIntroSpriteFrame('reach', 5)).toBe(3)
  })
})
