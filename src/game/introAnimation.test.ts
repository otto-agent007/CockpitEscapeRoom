import { describe, expect, it } from 'vitest'
import {
  IDENTITY_CAMERA,
  KEY_CLIPS,
  POPT_CLIPS,
  accentFlash,
  accentPunch,
  accentShake,
  deriveHandoffAnimation,
  deriveIntroAnimation,
  getSpriteFrame,
  hitstopTime,
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
      popt: { clipId: 'run' },
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
    const bullStar = deriveIntroAnimation(31, false).fx.find((fx) => fx.kind === 'impact-star')
    expect(bullStar).toBeDefined()
    expect(bullStar!.scale).toBeLessThanOrEqual(0.4)
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

  it('sprints Pop T across the runway while the key flies ahead of him', () => {
    const start = deriveIntroAnimation(16.4, false)
    const end = deriveIntroAnimation(21.6, false)
    expect(end.popt!.x - start.popt!.x).toBeGreaterThan(160)
    expect(start.key?.clipId).toBe('fly')
    expect(start.fx.some((fx) => fx.kind === 'sparkle')).toBe(true)

    const crossing = deriveIntroAnimation(INTRO_MUSIC_CUES.cartNearMiss, false)
    const cart = crossing.props.find((sceneProp) => sceneProp.id === 'runway-cart')
    expect(Math.abs(cart!.x - crossing.popt!.x)).toBeLessThan(24)
    expect(crossing.popt!.y).toBeLessThan(184)
  })

  it('deflects the baseball off the key at one shared point on the accent', () => {
    const impact = deriveIntroAnimation(INTRO_MUSIC_CUES.ballDeflect + 0.008, false)
    const ball = impact.props.find((sceneProp) => sceneProp.id === 'baseball')
    const star = impact.fx.find((fx) => fx.kind === 'impact-star')
    expect(ball).toBeDefined()
    expect(star).toBeDefined()
    expect(Math.abs(ball!.x - impact.key!.x)).toBeLessThan(8)
    expect(Math.abs(ball!.x - star!.x)).toBeLessThan(8)
    expect(impact.popt?.clipId).toBe('baseball-slide')

    // The ball rises after the swat and the slide carries Pop T past the base.
    const after = deriveIntroAnimation(25.2, false)
    const ballAfter = after.props.find((sceneProp) => sceneProp.id === 'baseball')
    expect(ballAfter!.y).toBeLessThan(ball!.y)
    expect(deriveIntroAnimation(27, false).popt!.x).toBeGreaterThan(226)

    // Direction change stays smooth: no frame-to-frame jump reaches 4px.
    const positions = Array.from({ length: 121 }, (_, index) => (
      deriveIntroAnimation(23.5 + index / 60, false).key!
    ))
    for (let index = 1; index < positions.length; index += 1) {
      expect(Math.hypot(
        positions[index]!.x - positions[index - 1]!.x,
        positions[index]!.y - positions[index - 1]!.y,
      )).toBeLessThan(4)
    }
  })

  it('runs the key up the lit chart and spins Pop T off the bull on the accent', () => {
    const climbing = deriveIntroAnimation(30, false)
    const glow = climbing.fx.find((fx) => fx.kind === 'chart-glow')
    expect(glow).toBeDefined()
    expect(climbing.key?.clipId).toBe('run')
    expect(climbing.popt?.clipId).toBe('run')

    const justAfterImpact = deriveIntroAnimation(INTRO_MUSIC_CUES.bullImpact + 0.09, false)
    expect(justAfterImpact.popt?.clipId).toBe('bull-spin')
    expect(justAfterImpact.popt?.sourceFrame).toBeLessThanOrEqual(1)
    expect(justAfterImpact.fx.some((fx) => fx.kind === 'impact-star')).toBe(true)

    const recovered = deriveIntroAnimation(32.5, false)
    expect(recovered.popt?.clipId).toBe('run')
    const perched = deriveIntroAnimation(34.2, false)
    expect(perched.key?.clipId).toBe('taunt')
    expect(perched.fx.find((fx) => fx.kind === 'chart-glow')?.progress).toBe(1)
  })

  it('misses on the lunge accent then locks the key to the glove at the grab', () => {
    const gliding = deriveIntroAnimation(44, false)
    expect(gliding.popt?.clipId).toBe('pilot-glide')

    const missing = deriveIntroAnimation(INTRO_MUSIC_CUES.missLunge + 0.3, false)
    expect(missing.popt?.clipId).toBe('reach-catch')
    expect(missing.key?.clipId).toBe('fly')
    // The dodge lifts the key well above its approach line while Pop T whiffs.
    expect(missing.key!.y).toBeLessThan(105)

    const caught = deriveIntroAnimation(INTRO_MUSIC_CUES.catchGrab + 0.1, false)
    expect(caught.key?.clipId).toBe('tug')
    expect(caught.key!.x).toBeCloseTo(caught.popt!.x + 24, 5)
    expect(caught.fx.some((fx) => fx.kind === 'impact-star')).toBe(true)

    // The laser grid persists through the pursuit for horizon continuity.
    expect(deriveIntroAnimation(43, false).fx.some((fx) => fx.kind === 'laser-grid')).toBe(true)
  })

  it('streams cloud puffs past the airborne glide', () => {
    const early = deriveIntroAnimation(36.5, false)
    const later = deriveIntroAnimation(37.5, false)
    const earlyPuff = early.props.find((sceneProp) => sceneProp.id === 'cloud-puff')
    const laterPuff = later.props.find((sceneProp) => sceneProp.id === 'cloud-puff')
    expect(earlyPuff).toBeDefined()
    expect(laterPuff!.x).toBeLessThan(earlyPuff!.x)
    expect(early.key?.clipId).toBe('fly')
    expect(early.fx.some((fx) => fx.kind === 'sparkle')).toBe(true)
  })

  it('stamps the emblem card over a dimmed stage on the late accent', () => {
    const victory = deriveIntroAnimation(49, false)
    expect(victory.popt?.clipId).toBe('victory-recovery')
    expect(victory.key?.clipId).toBe('tug')
    expect(victory.card).toBeNull()

    const stamped = deriveIntroAnimation(50.2, false)
    expect(stamped.card).toMatchObject({ assetId: 'emblem-finale', scale: 1, opacity: 1 })
    expect(stamped.backgroundDim).toBe(1)
    expect(stamped.popt).toBeNull()
    expect(stamped.key).toBeNull()
    expect(stamped.fx.some((fx) => fx.kind === 'radial-rays')).toBe(true)

    // The card cuts before the loop-reset drag gag begins.
    expect(deriveIntroAnimation(51.2, false).card).toBeNull()
  })

  it('keeps the red laser grid exclusive to the airborne scenes', () => {
    expect(deriveIntroAnimation(38, false).fx.some((fx) => fx.kind === 'laser-grid')).toBe(true)
    expect(deriveIntroAnimation(47, false).fx.some((fx) => fx.kind === 'laser-grid')).toBe(true)
    for (const time of [3, 8, 13, 18, 24, 31, 49.9, 52]) {
      expect(deriveIntroAnimation(time, false).fx.some((fx) => fx.kind === 'laser-grid')).toBe(false)
    }
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

  it('suppresses transient fx and holds curated poses in reduced motion', () => {
    const transient = new Set(['sparkle', 'burst-flash', 'exclaim', 'sweat', 'impact-star', 'pixel-assemble'])
    for (const time of [3, 8, 13, 18, 24, 31, 38, 44, 49, 52]) {
      const frame = deriveIntroAnimation(time, true)
      for (const fx of frame.fx) {
        expect(transient.has(fx.kind), `${fx.kind} must not render in reduced motion`).toBe(false)
      }
    }
    // The city holds the pre-impact chase, never the post-impact splat.
    expect(deriveIntroAnimation(31, true).popt?.clipId).toBe('run')
    // The airborne scenes hold a static laser grid; catch holds the emblem card.
    expect(deriveIntroAnimation(38, true).fx.some((fx) => fx.kind === 'laser-grid')).toBe(true)
    expect(deriveIntroAnimation(50, true).card).not.toBeNull()
    expect(deriveIntroAnimation(50, true).backgroundDim).toBe(1)
  })

  it('plays the SEGA-style ident gag: sprint in, skid, tap, flare, sprint off', () => {
    expect(deriveIntroAnimation(1.2, false).popt).toBeNull()

    const entering = deriveIntroAnimation(2.1, false)
    expect(entering.popt?.clipId).toBe('run')

    const skid = deriveIntroAnimation(2.6, false)
    expect(skid.popt?.clipId).toBe('startle-stumble')
    expect(skid.props.some((sceneProp) => sceneProp.id === 'cloud-puff')).toBe(true)

    const tap = deriveIntroAnimation(3.99, false)
    expect(tap.popt?.clipId).toBe('victory-recovery')
    expect(tap.flash?.color).toBe('white')
    expect(tap.camera.zoom).toBeGreaterThan(1.1)
    expect(tap.logo.highlightOpacity).toBeGreaterThan(0)

    const flare = deriveIntroAnimation(4.8, false)
    expect(flare.logo.highlightOpacity).toBe(1)
    expect(flare.fx.filter((fx) => fx.kind === 'sparkle').length).toBeGreaterThanOrEqual(3)

    const exiting = deriveIntroAnimation(5.8, false)
    expect(exiting.popt?.clipId).toBe('run')
    expect(exiting.popt!.x).toBeGreaterThan(200)

    // The key never cameos before its duffel burst reveal.
    for (const time of [1, 2.5, 4, 5.5]) {
      expect(deriveIntroAnimation(time, false).key).toBeNull()
    }
  })

  it('lands a camera punch, flash, or hitstop on every measured accent', () => {
    const burst = deriveIntroAnimation(INTRO_MUSIC_CUES.keyBurst + 0.05, false)
    expect(burst.camera.zoom).toBeGreaterThan(1.1)
    expect(burst.flash?.color).toBe('white')

    const exclaim = deriveIntroAnimation(INTRO_MUSIC_CUES.exclaim + 0.06, false)
    expect(exclaim.flash?.color).toBe('red')
    expect(Math.abs(exclaim.camera.offsetX) + Math.abs(exclaim.camera.offsetY)).toBeGreaterThan(0)
    const frozen = deriveIntroAnimation(INTRO_MUSIC_CUES.exclaim + 0.01, false)
    const frozenLater = deriveIntroAnimation(INTRO_MUSIC_CUES.exclaim + 0.1, false)
    expect(frozenLater.popt!.x).toBe(frozen.popt!.x)

    const chase = deriveIntroAnimation(18, false)
    expect(chase.camera.zoom).toBeGreaterThan(1.05)
    const nearMiss = deriveIntroAnimation(INTRO_MUSIC_CUES.cartNearMiss + 0.05, false)
    expect(nearMiss.camera.zoom).toBeGreaterThan(chase.camera.zoom)

    const deflect = deriveIntroAnimation(INTRO_MUSIC_CUES.ballDeflect + 0.05, false)
    expect(deflect.flash?.color).toBe('white')
    expect(deflect.camera.zoom).toBeGreaterThan(1.2)

    const bull = deriveIntroAnimation(INTRO_MUSIC_CUES.bullImpact + 0.05, false)
    expect(bull.flash?.color).toBe('red')

    expect(deriveIntroAnimation(INTRO_MUSIC_CUES.skyGridIgnite + 0.05, false).flash).not.toBeNull()

    const grab = deriveIntroAnimation(INTRO_MUSIC_CUES.catchGrab + 0.05, false)
    expect(grab.flash?.color).toBe('white')
    expect(grab.camera.zoom).toBeGreaterThan(1.2)

    const stamp = deriveIntroAnimation(INTRO_MUSIC_CUES.emblemStamp + 0.03, false)
    expect(stamp.flash?.color).toBe('white')
    expect(stamp.flash!.opacity).toBeGreaterThan(0.5)
  })

  it('opens impact stars at full presence so the hitstop freeze frame reads', () => {
    const deflect = deriveIntroAnimation(INTRO_MUSIC_CUES.ballDeflect + 0.008, false)
    const star = deflect.fx.find((fx) => fx.kind === 'impact-star')
    expect(star!.opacity).toBeGreaterThan(0.9)
  })

  it('freezes the acting clock at an accent then catches smoothly back up', () => {
    expect(hitstopTime(10, 10.5, 0.12)).toBe(10)
    expect(hitstopTime(10.55, 10.5, 0.12)).toBe(10.5)
    expect(hitstopTime(10.7, 10.5, 0.12)).toBeGreaterThan(10.5)
    expect(hitstopTime(10.7, 10.5, 0.12)).toBeLessThan(10.7)
    expect(hitstopTime(11.5, 10.5, 0.12)).toBe(11.5)
    // Continuity at the catch-up boundary keeps the ≤4px motion contract.
    expect(hitstopTime(10.92, 10.5, 0.12)).toBeCloseTo(10.92, 10)
  })

  it('spikes the accent punch envelope at the hit and decays it away', () => {
    expect(accentPunch(9, 10)).toBe(0)
    expect(accentPunch(10.06, 10)).toBeCloseTo(1, 5)
    expect(accentPunch(10.31, 10)).toBeLessThan(0.6)
    expect(accentPunch(11.5, 10)).toBe(0)
  })

  it('shakes deterministically within its amplitude and settles to rest', () => {
    expect(accentShake(10.1, 10, 3)).toEqual(accentShake(10.1, 10, 3))
    const shaken = accentShake(10.05, 10, 3)
    expect(Math.abs(shaken.x)).toBeLessThanOrEqual(3)
    expect(Math.abs(shaken.y)).toBeLessThanOrEqual(3)
    expect(Math.abs(shaken.x) + Math.abs(shaken.y)).toBeGreaterThan(0)
    expect(accentShake(9.9, 10, 3)).toEqual({ x: 0, y: 0 })
    expect(accentShake(11, 10, 3)).toEqual({ x: 0, y: 0 })
  })

  it('flashes hard on the accent frame and fades inside the window', () => {
    expect(accentFlash(9.99, 10)).toBe(0)
    expect(accentFlash(10, 10)).toBe(1)
    expect(accentFlash(10.05, 10)).toBe(1)
    expect(accentFlash(10.15, 10)).toBeLessThan(1)
    expect(accentFlash(10.4, 10)).toBe(0)
  })

  it('keeps reduced motion free of camera moves and accent flashes', () => {
    for (const time of [3, 8, 13, 18, 24, 31, 38, 44, 49, 52]) {
      const frame = deriveIntroAnimation(time, true)
      expect(frame.camera).toEqual(IDENTITY_CAMERA)
      expect(frame.flash).toBeNull()
    }
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
