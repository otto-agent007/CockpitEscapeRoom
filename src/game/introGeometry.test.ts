import { describe, expect, it } from 'vitest'
import { computeIntroStagePlacement } from './introGeometry'

describe('TMB2 integer stage placement', () => {
  it.each([
    { width: 1440, height: 900, expected: { scale: 4, left: 80, top: 2, width: 1280, height: 896 } },
    { width: 768, height: 900, expected: { scale: 2, left: 64, top: 226, width: 640, height: 448 } },
    { width: 375, height: 812, expected: { scale: 1, left: 27, top: 294, width: 320, height: 224 } },
  ])('places 320x224 at integer scale inside $width x $height', ({ width, height, expected }) => {
    expect(computeIntroStagePlacement(width, height)).toEqual(expected)
  })

  it('clamps invalid or undersized shells to a one-times stage', () => {
    expect(computeIntroStagePlacement(Number.NaN, -1)).toEqual({
      scale: 1,
      left: -160,
      top: -112,
      width: 320,
      height: 224,
    })
  })
})
