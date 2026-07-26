import { describe, expect, it } from 'vitest'
import { INTRO_ACTOR_SCALE, KEY_CLIPS, POPT_CLIPS, deriveIntroAnimation } from './introAnimation'
import { introScenes } from './introConfig'

/**
 * The intro composites Pixel Snapper output onto a fixed stage grid, and the runtime is not
 * allowed to resample it.
 *
 * Sprites are canonical 128 x 128 exported at 256 x 256, so one art pixel is two frame
 * pixels. Drawn at scale `s`, one art pixel covers `2s` stage pixels. The stage is authored
 * at one art pixel per stage pixel, so `2s` must be exactly 1.
 *
 * This regressed once already and was invisible to the rest of the suite: Pop T shipped at
 * 1.12 (2.24 stage pixels per art pixel, shredding the grid) and the key at 0.38 (0.76 —
 * below its authored resolution, discarding roughly a quarter of its pixels). Every existing
 * test passed throughout, because they asserted that actors *existed* at plausible sizes and
 * never that the art survived being drawn.
 */
const STAGE_PIXELS_PER_ART_PIXEL = 1

function sampleTimes(): number[] {
  // A few moments inside every scene, including the boundaries where scenes hand over.
  return introScenes.flatMap((scene) => {
    const span = scene.endSeconds - scene.startSeconds
    return [0.01, 0.25, 0.5, 0.75, 0.99].map((at) => scene.startSeconds + span * at)
  })
}

describe('TMB2 stage pixel grid', () => {
  it('exports every sprite clip on the canonical 128 grid at 2x', () => {
    for (const clip of [...Object.values(POPT_CLIPS), ...Object.values(KEY_CLIPS)]) {
      expect(clip.frameWidth, clip.assetId).toBe(256)
      expect(clip.frameHeight, clip.assetId).toBe(256)
      // Pivot is the canonical (64, 112) carried through the integer runtime scale of 2.
      expect(clip.pivot, clip.assetId).toEqual({ x: 128, y: 224 })
    }
  })

  it('pins the actor scale to the one value that preserves the grid', () => {
    const artPixelsPerFramePixel = 2
    expect(INTRO_ACTOR_SCALE * artPixelsPerFramePixel).toBe(STAGE_PIXELS_PER_ART_PIXEL)
  })

  it('draws every actor in every scene at a whole number of stage pixels per art pixel', () => {
    for (const time of sampleTimes()) {
      const frame = deriveIntroAnimation(time, false)
      for (const actor of [frame.popt, frame.key]) {
        if (!actor) continue
        const stagePixelsPerArtPixel = actor.scale * 2
        expect(
          Number.isInteger(stagePixelsPerArtPixel),
          `${actor.clipId} at ${time.toFixed(2)}s draws ${stagePixelsPerArtPixel} stage px per art px`,
        ).toBe(true)
        // Anything below 1 is sub-pixel: art is discarded before it ever reaches the screen.
        expect(stagePixelsPerArtPixel, `${actor.clipId} at ${time.toFixed(2)}s`).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('holds the same grid in reduced motion', () => {
    for (const time of sampleTimes()) {
      const frame = deriveIntroAnimation(time, true)
      for (const actor of [frame.popt, frame.key]) {
        if (!actor) continue
        expect(Number.isInteger(actor.scale * 2), `${actor.clipId} reduced motion`).toBe(true)
      }
    }
  })

  it('keeps both actors on one grid so they never differ in apparent pixel size', () => {
    for (const time of sampleTimes()) {
      const frame = deriveIntroAnimation(time, false)
      if (!frame.popt || !frame.key) continue
      expect(frame.key.scale, `actors disagree at ${time.toFixed(2)}s`).toBe(frame.popt.scale)
    }
  })
})
