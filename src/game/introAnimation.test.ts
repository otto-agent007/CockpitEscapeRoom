import { describe, expect, it } from 'vitest'
import {
  KEY_CLIPS,
  POPT_CLIPS,
  deriveHandoffAnimation,
  deriveIntroAnimation,
  getSpriteFrame,
  type SpriteTiming,
} from './introAnimation'
import { DUFFEL_JOLT_PERIOD_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

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
    expect(deriveIntroAnimation(3, true).logo).toEqual({
      visible: true,
      buildProgress: 1,
      highlightOpacity: 0,
    })
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
  })

  it('materializes Pop T from blue pixels before the duffel struggle', () => {
    const assembling = deriveIntroAnimation(6.6, false)
    expect(assembling.fx.some((fx) => fx.kind === 'pixel-assemble')).toBe(true)
    expect(assembling.backgroundDim).toBeGreaterThan(0)
    expect(assembling.popt?.opacity).toBeLessThan(1)
    expect(assembling.key).toBeNull()

    const tugging = deriveIntroAnimation(10.5, false)
    expect(tugging.fx.some((fx) => fx.kind === 'pixel-assemble')).toBe(false)
    expect(tugging.backgroundDim).toBe(0)
    expect(tugging.popt?.opacity).toBe(1)
    expect(tugging.popt?.clipId).toBe('duffel-pull')
    expect(tugging.fx.some((fx) => fx.kind === 'sweat')).toBe(true)
  })

  it('locks the duffel tugs to the measured jolt grid', () => {
    const midJolt = deriveIntroAnimation(
      INTRO_MUSIC_CUES.firstDuffelJolt + DUFFEL_JOLT_PERIOD_SECONDS / 2,
      false,
    )
    const boundary = deriveIntroAnimation(
      INTRO_MUSIC_CUES.firstDuffelJolt + DUFFEL_JOLT_PERIOD_SECONDS - 0.001,
      false,
    )
    expect(midJolt.popt!.x).toBeLessThan(boundary.popt!.x - 2)
  })

  it('bursts the key from the bag with a flash, spray, and the red exclaim slam', () => {
    const preBurst = deriveIntroAnimation(12.5, false)
    expect(preBurst.key).toBeNull()
    expect(preBurst.popt?.clipId).toBe('duffel-pull')

    const bursting = deriveIntroAnimation(12.8, false)
    expect(bursting.key?.clipId).toBe('fly')
    expect(bursting.fx.some((fx) => fx.kind === 'burst-flash')).toBe(true)
    expect(bursting.fx.some((fx) => fx.kind === 'sparkle')).toBe(true)

    const slammed = deriveIntroAnimation(13.2, false)
    expect(slammed.fx.some((fx) => fx.kind === 'exclaim')).toBe(true)
    expect(slammed.popt?.clipId).toBe('startle-stumble')
    expect(slammed.key?.clipId).toBe('taunt')

    const exiting = deriveIntroAnimation(15.2, false)
    expect(exiting.key?.clipId).toBe('fly')
    const exitTrail = exiting.fx.filter((fx) => fx.kind === 'sparkle')
    expect(exitTrail.length).toBeGreaterThanOrEqual(4)
    for (const sparkle of exitTrail) {
      expect(sparkle.x).toBeLessThan(exiting.key!.x + 8)
    }
    expect(deriveIntroAnimation(15.9, false).key!.x).toBeGreaterThan(300)
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
