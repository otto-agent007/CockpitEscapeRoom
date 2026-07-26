import { describe, expect, it } from 'vitest'
import {
  KEY_CLIPS,
  POPT_CLIPS,
  deriveHandoffAnimation,
  deriveIntroAnimation,
  getSpriteFrame,
  type SpriteTiming,
} from './introAnimation'

describe('TMB2 sprite animation contract', () => {
  it('selects frames from authored durations and loop modes', () => {
    const loop: SpriteTiming = { durations: [140, 120, 160, 180], loopMode: 'loop' }
    const hold: SpriteTiming = { durations: [90, 110, 260], loopMode: 'hold-last' }
    const once: SpriteTiming = { durations: [80, 80, 80], loopMode: 'once' }

    expect(getSpriteFrame(loop, 0)).toBe(0)
    expect(getSpriteFrame(loop, 139)).toBe(0)
    expect(getSpriteFrame(loop, 140)).toBe(1)
    expect(getSpriteFrame(loop, 599)).toBe(3)
    expect(getSpriteFrame(loop, 600)).toBe(0)
    expect(getSpriteFrame(hold, 999)).toBe(2)
    expect(getSpriteFrame(once, 999)).toBe(2)
  })

  it('binds every recovered Pop T clip to the shared bottom-center pivot', () => {
    expect(Object.keys(POPT_CLIPS)).toEqual([
      'idle',
      'run',
      'reach-catch',
      'duffel-pull',
      'startle-stumble',
      'baseball-slide',
      'bull-spin',
      'pilot-glide',
      'victory-recovery',
    ])
    expect(Object.values(POPT_CLIPS).every((clip) => (
      clip.frameWidth === 256
      && clip.frameHeight === 256
      && clip.pivot.x === 128
      && clip.pivot.y === 224
    ))).toBe(true)
    expect(POPT_CLIPS['duffel-pull'].durations).toEqual([140, 120, 160, 180])
    expect(POPT_CLIPS['startle-stumble'].loopMode).toBe('hold-last')
    expect(POPT_CLIPS['bull-spin'].loopMode).toBe('once')
  })

  it('uses exactly sixteen approved cartoon-key poses', () => {
    expect(KEY_CLIPS.taunt.frameIndices).toHaveLength(4)
    expect(KEY_CLIPS.run.frameIndices).toHaveLength(6)
    expect(KEY_CLIPS.fly.frameIndices).toHaveLength(4)
    expect(KEY_CLIPS.tug.frameIndices).toHaveLength(2)

    const runtimeFrames = Object.values(KEY_CLIPS).flatMap((clip) => clip.frameIndices)
    expect(runtimeFrames).toHaveLength(16)
    expect(new Set(runtimeFrames).size).toBe(16)
    expect(runtimeFrames).not.toContain(2)
    expect(runtimeFrames.every((frame) => frame >= 0 && frame <= 16)).toBe(true)
  })

  it('derives the approved scene actions from normalized media time', () => {
    expect(deriveIntroAnimation(2, false)).toMatchObject({
      sceneId: 'tmb2-ident',
      logo: { visible: true },
      popt: null,
      key: null,
    })
    expect(deriveIntroAnimation(8, false).popt?.clipId).toBe('duffel-pull')
    expect(deriveIntroAnimation(13, false)).toMatchObject({
      sceneId: 'key-escape',
      popt: { clipId: 'startle-stumble' },
      key: { clipId: 'taunt' },
    })
    expect(deriveIntroAnimation(18, false).popt?.clipId).toBe('run')
    expect(deriveIntroAnimation(24, false).popt?.clipId).toBe('baseball-slide')
    expect(deriveIntroAnimation(31, false).popt?.clipId).toBe('bull-spin')
    expect(deriveIntroAnimation(44, false).popt?.clipId).toBe('pilot-glide')
    expect(deriveIntroAnimation(49, false).popt?.clipId).toBe('victory-recovery')
    expect(deriveIntroAnimation(52, false).key?.clipId).toBe('tug')
  })

  it('moves actors smoothly rather than in ten or twelve CSS-sized jumps', () => {
    const runwayPositions = Array.from({ length: 61 }, (_, index) => (
      deriveIntroAnimation(16 + index / 60, false).key?.x
    ))
    expect(new Set(runwayPositions).size).toBeGreaterThan(48)
    for (let index = 1; index < runwayPositions.length; index += 1) {
      expect(Math.abs(runwayPositions[index]! - runwayPositions[index - 1]!)).toBeLessThan(4)
    }
  })

  it('holds a representative pose in reduced motion while preserving scene time', () => {
    const first = deriveIntroAnimation(17, true)
    const second = deriveIntroAnimation(21, true)
    expect(first.sceneId).toBe('runway')
    expect(second.sceneId).toBe('runway')
    expect(second.popt).toEqual(first.popt)
    expect(second.key).toEqual(first.key)
  })

  it('stages Pop T as the readable comedy lead and keeps accent props restrained', () => {
    for (const time of [8, 13, 18, 24, 31, 38, 44, 49]) {
      const frame = deriveIntroAnimation(time, false)
      expect(frame.popt?.scale).toBeGreaterThanOrEqual(1.05)
      if (frame.key) expect(frame.key.scale).toBeLessThanOrEqual(0.4)
    }
    expect(deriveIntroAnimation(18, false).props.find((prop) => prop.id === 'runway-cart')?.scale)
      .toBeLessThanOrEqual(0.7)
    expect(deriveIntroAnimation(31, false).props.find((prop) => prop.id === 'bull-impact')?.scale)
      .toBeLessThanOrEqual(0.4)
    expect(deriveIntroAnimation(44, false).props.find((prop) => prop.id === 'pilot-wings')?.scale)
      .toBeLessThanOrEqual(0.6)
    const pursuit = deriveIntroAnimation(44, false)
    const wings = pursuit.props.find((prop) => prop.id === 'pilot-wings')
    expect(wings?.x).toBeCloseTo(pursuit.popt!.x)
    expect(wings!.y).toBeLessThan(pursuit.popt!.y)
    // Wings deploy from Pop T's back, so they must never paint over his uniform.
    expect(wings!.layer).toBe('back')
  })

  it('plants Pop T on every ground plate with a contact shadow at his feet', () => {
    for (const time of [8, 13, 18, 24, 31]) {
      const frame = deriveIntroAnimation(time, false)
      const shadow = frame.props.find((prop) => prop.id === 'shadow')
      expect(shadow, `scene at ${time}s`).toBeDefined()
      expect(shadow!.layer).toBe('back')
      expect(Math.abs(shadow!.x - frame.popt!.x)).toBeLessThanOrEqual(12)
      expect(Math.abs(shadow!.y - frame.popt!.y)).toBeLessThanOrEqual(6)
    }
  })

  it('lays the finance trace along the key path instead of a second painted chart', () => {
    for (const progress of [0.2, 0.6, 0.95]) {
      const time = 28 + 7 * progress
      const frame = deriveIntroAnimation(time, false)
      const graph = frame.props.find((prop) => prop.id === 'graph')!
      expect(graph.layer).toBe('back')
      // The trace starts at the key's own origin and extends by its scene progress.
      expect(graph.x).toBe(106)
      expect(graph.y).toBe(172)
      expect(graph.phase).toBeCloseTo(progress, 2)
      expect(graph.x + 150 * graph.phase).toBeCloseTo(frame.key!.x, 5)
      expect(graph.y - 72 * graph.phase).toBeCloseTo(frame.key!.y, 5)
    }
  })

  it('lands impact and weather accents in front of the actors', () => {
    const finance = deriveIntroAnimation(31, false)
    expect(finance.props.find((prop) => prop.id === 'bull-impact')?.layer).toBe('front')
    expect(deriveIntroAnimation(24, false).props.find((prop) => prop.id === 'baseball')?.layer)
      .toBe('front')
    expect(deriveIntroAnimation(38, false).props.find((prop) => prop.id === 'cloud-puff')?.layer)
      .toBe('front')
  })

  it('keeps a plate under the reset beat instead of cutting to a bare black frame', () => {
    for (const time of [51.2, 52, 52.9]) {
      expect(deriveIntroAnimation(time, false).backgroundAssetId).toBe('background-clouds')
    }
  })

  it('gives the sky victory pose something to stand on', () => {
    const catchFrame = deriveIntroAnimation(49, false)
    const cloud = catchFrame.props.find((prop) => prop.id === 'cloud-puff')!
    expect(Math.abs(cloud.x - catchFrame.popt!.x)).toBeLessThanOrEqual(8)
    expect(cloud.y).toBeGreaterThanOrEqual(catchFrame.popt!.y)
  })

  it('flies and rotates the key into the lock during the 650ms handoff', () => {
    expect(deriveHandoffAnimation(0)).toEqual({
      progress: 0,
      keyX: 160,
      keyY: 112,
      keyScale: 0.45,
      keyRotation: 0,
      flashOpacity: 0,
    })
    expect(deriveHandoffAnimation(0.5)).toMatchObject({
      progress: 0.5,
      keyX: 160,
      keyY: 112,
    })
    expect(deriveHandoffAnimation(1)).toEqual({
      progress: 1,
      keyX: 160,
      keyY: 112,
      keyScale: 4.5,
      keyRotation: Math.PI * 2,
      flashOpacity: 1,
    })
  })
})
