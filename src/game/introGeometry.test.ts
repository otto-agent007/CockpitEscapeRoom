import { describe, expect, it } from 'vitest'
import { computeIntroStagePlacement } from './introGeometry'

describe('intro stage geometry', () => {
  it.each([
    {
      shell: { width: 1_440, height: 900 },
      expected: { scale: 4, left: 80, top: 2, width: 1_280, height: 896 },
    },
    {
      shell: { width: 768, height: 900 },
      expected: { scale: 2, left: 64, top: 226, width: 640, height: 448 },
    },
    {
      shell: { width: 375, height: 812 },
      expected: { scale: 1, left: 27, top: 294, width: 320, height: 224 },
    },
  ])('places a whole-pixel stage inside $shell.width x $shell.height', ({ shell, expected }) => {
    const placement = computeIntroStagePlacement(shell.width, shell.height)

    expect(placement).toEqual(expected)
    expect(Object.values(placement).every(Number.isInteger)).toBe(true)
    expect(placement.width).toBe(320 * placement.scale)
    expect(placement.height).toBe(224 * placement.scale)
  })
})
