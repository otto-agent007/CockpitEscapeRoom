import { describe, expect, it } from 'vitest'
import {
  computeIntroStagePlacement,
  INTRO_MAX_RENDER_SCALE,
  INTRO_STAGE_HEIGHT,
  INTRO_STAGE_WIDTH,
} from './introGeometry'

describe('TMB2 stage placement', () => {
  it.each([
    { width: 1440, height: 900, expected: { scale: 900 / 224, renderScale: 4, left: 77, top: 0, width: 1286, height: 900 } },
    { width: 768, height: 900, expected: { scale: 2.4, renderScale: 2, left: 0, top: 181, width: 768, height: 538 } },
    { width: 375, height: 812, expected: { scale: 375 / 320, renderScale: 1, left: 0, top: 275, width: 375, height: 263 } },
  ])('fills $width x $height with a centred, letterboxed stage', ({ width, height, expected }) => {
    expect(computeIntroStagePlacement(width, height)).toEqual(expected)
  })

  it('keeps the same composition at every width by preserving the stage aspect', () => {
    for (const [width, height] of [[1440, 900], [1280, 720], [768, 1024], [375, 667], [320, 568]]) {
      const placement = computeIntroStagePlacement(width!, height!)
      expect(placement.width).toBeLessThanOrEqual(width!)
      expect(placement.height).toBeLessThanOrEqual(height!)
      // Contain fit: the stage touches at least one shell edge, so no axis is wasted.
      expect(placement.width === width || placement.height === height).toBe(true)
      expect(placement.width / placement.height).toBeCloseTo(INTRO_STAGE_WIDTH / INTRO_STAGE_HEIGHT, 1)
    }
  })

  it('rasterizes on a whole-number multiple of the logical stage', () => {
    for (const [width, height] of [[1440, 900], [1280, 720], [768, 1024], [375, 667], [3840, 2160]]) {
      const { renderScale, scale } = computeIntroStagePlacement(width!, height!)
      expect(Number.isInteger(renderScale)).toBe(true)
      expect(renderScale).toBeGreaterThanOrEqual(1)
      expect(renderScale).toBeLessThanOrEqual(INTRO_MAX_RENDER_SCALE)
      // Compositing stays close to 1:1 so the stage can keep nearest-neighbour
      // scaling, unless the shell is large enough to hit the raster cost ceiling.
      const compositeRatio = scale / renderScale
      expect(
        (compositeRatio >= 0.8 && compositeRatio <= 1.25) || renderScale === INTRO_MAX_RENDER_SCALE,
      ).toBe(true)
      expect(INTRO_STAGE_HEIGHT * renderScale).toBeGreaterThan(0)
    }
  })

  it('clamps invalid or undersized shells to a one-times stage', () => {
    expect(computeIntroStagePlacement(Number.NaN, -1)).toEqual({
      scale: 1,
      renderScale: 1,
      left: -160,
      top: -112,
      width: 320,
      height: 224,
    })
  })
})
