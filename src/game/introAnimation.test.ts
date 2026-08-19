import { describe, expect, it } from 'vitest'
import {
  IDENTITY_CAMERA,
  JET_CLIPS,
  POPT_CLIPS,
  accentFlash,
  accentPunch,
  accentShake,
  beaconOn,
  deriveHandoffAnimation,
  deriveIntroAnimation,
  getSpriteFrame,
  hitstopTime,
  type SpriteTiming,
} from './introAnimation'
import { BEAT_GRID_SECONDS, INTRO_MUSIC_CUES } from './introMusicCues'

const CUES = INTRO_MUSIC_CUES

describe('Scramble sprite animation contract', () => {
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

  it('binds every Pop T clip to its exact on-stage cell', () => {
    expect(Object.keys(POPT_CLIPS)).toEqual(['run', 'skid', 'tap', 'walk', 'backlit'])
    // Wave S4: the legacy 256-cell sheets are fully retired; every clip is
    // pre-rendered at its exact on-stage size with a bottom-centre pivot.
    expect(POPT_CLIPS.run).toMatchObject({
      frameWidth: 44,
      frameHeight: 66,
      columns: 6,
      pivot: { x: 22, y: 65 },
      loopMode: 'loop',
    })
    expect(POPT_CLIPS.run.durations).toHaveLength(6)
    expect(POPT_CLIPS.skid).toMatchObject({ frameWidth: 45, frameHeight: 56, loopMode: 'hold-last' })
    expect(POPT_CLIPS.tap).toMatchObject({ frameWidth: 34, frameHeight: 72, loopMode: 'hold-last' })
    expect(POPT_CLIPS.walk).toMatchObject({
      frameWidth: 26,
      frameHeight: 50,
      columns: 6,
      pivot: { x: 13, y: 49 },
      loopMode: 'loop',
    })
    expect(POPT_CLIPS.walk.durations).toHaveLength(6)
    expect(POPT_CLIPS.backlit).toMatchObject({
      frameWidth: 28,
      frameHeight: 64,
      pivot: { x: 14, y: 63 },
      loopMode: 'hold-last',
    })
  })

  it('pre-renders the DC-9 at every size it plays so scales stay whole', () => {
    expect(Object.keys(JET_CLIPS)).toEqual([
      'runway', 'runway-36', 'runway-26', 'liftoff-48', 'liftoff-80', 'liftoff-160', 'liftoff-320',
    ])
    expect(JET_CLIPS.runway).toMatchObject({ frameWidth: 52, frameHeight: 18 })
    expect(JET_CLIPS['runway-36'].frameWidth).toBe(36)
    expect(JET_CLIPS['runway-26'].frameWidth).toBe(26)
    expect(JET_CLIPS['liftoff-48'].frameWidth).toBe(48)
    expect(JET_CLIPS['liftoff-80'].frameWidth).toBe(80)
    expect(JET_CLIPS['liftoff-160'].frameWidth).toBe(160)
    expect(JET_CLIPS['liftoff-320'].frameWidth).toBe(320)
    for (const clip of Object.values(JET_CLIPS)) {
      expect(clip.columns).toBe(1)
      expect(clip.durations).toHaveLength(1)
    }
  })

  it('derives the approved scene actions from normalized media time', () => {
    expect(deriveIntroAnimation(2, false)).toMatchObject({
      sceneId: 'tmb2-ident',
      logo: { visible: true },
      popt: { clipId: 'run' },
    })
    expect(deriveIntroAnimation(6.8, false).sceneId).toBe('beacon-dark')
    expect(deriveIntroAnimation(8, false).backgroundAssetId).toBe('card-boots')
    expect(deriveIntroAnimation(13.5, false)).toMatchObject({
      sceneId: 'hangar-reveal',
      backgroundAssetId: 'plate-hangar-dark',
      backgroundReveal: { assetId: 'plate-hangar-reveal', progress: 1, axis: 'ttb' },
    })
    expect(deriveIntroAnimation(20, false).backgroundAssetId).toBe('card-logbook')
    expect(deriveIntroAnimation(28, false)).toMatchObject({
      sceneId: 'doors',
      popt: { clipId: 'backlit' },
    })
    expect(deriveIntroAnimation(33, false).popt?.clipId).toBe('walk')
    expect(deriveIntroAnimation(37.5, false).backgroundAssetId).toBe('card-nacelle-c')
    expect(deriveIntroAnimation(40.5, false).backgroundAssetId).toBe('card-photo')
    expect(deriveIntroAnimation(44, false).jet?.clipId).toBe('runway')
    expect(deriveIntroAnimation(50.2, false).card).toMatchObject({ assetId: 'emblem-finale' })
    expect(deriveIntroAnimation(52.5, false).pixelCollapse).toBeGreaterThan(0)
  })

  it('cuts every ritual still exactly on its cue', () => {
    expect(deriveIntroAnimation(CUES.bootsDown + 0.01, false).backgroundAssetId).toBe('card-boots')
    expect(deriveIntroAnimation(CUES.coffeeDown + 0.01, false).backgroundAssetId).toBe('card-coffee')
    expect(deriveIntroAnimation(CUES.coffeeDown - 0.01, false).backgroundAssetId).toBe('card-boots')
    expect(deriveIntroAnimation(CUES.flightCase + 0.01, false).backgroundAssetId).toBe('card-flight-case')
    expect(deriveIntroAnimation(CUES.latchesSnap + 0.01, false).backgroundAssetId).toBe('card-flight-case-shut')
  })

  it('letters the blank nameplate at runtime, only on the case cards', () => {
    // Pack rule 2: generated art carries no text; the runtime letters it.
    const caseCard = deriveIntroAnimation(10.6, false)
    expect(caseCard.nameplate).toEqual({ text: 'CAPT. POP T', x: 175, y: 141 })
    expect(deriveIntroAnimation(12, false).nameplate).not.toBeNull()
    expect(deriveIntroAnimation(8, false).nameplate).toBeNull()
    expect(deriveIntroAnimation(20, false).nameplate).toBeNull()
  })

  it('slams the floodlights onto the dark plate on the biggest hit', () => {
    const before = deriveIntroAnimation(CUES.hangarReveal - 0.5, false)
    expect(before.sceneId).toBe('ritual')

    const slam = deriveIntroAnimation(CUES.hangarReveal + 0.05, false)
    expect(slam.backgroundAssetId).toBe('plate-hangar-dark')
    expect(slam.backgroundReveal?.progress).toBeGreaterThan(0)
    expect(slam.backgroundReveal?.progress).toBeLessThan(1)
    expect(slam.backgroundReveal?.axis).toBe('ttb')
    expect(slam.camera.zoom).toBeGreaterThan(1.1)
    expect(slam.flash?.color).toBe('white')

    const lit = deriveIntroAnimation(CUES.hangarReveal + 0.5, false)
    expect(lit.backgroundReveal?.progress).toBe(1)
  })

  it('lands every suit-up cut on its cue, hat first for continuity, watch last', () => {
    // The cap flip OPENS the montage (three frames: high, mid-fall, caught),
    // so every later card may wear the hat; the watch check closes it as the
    // "time to go" button into the doors (owner reorder 2026-08-18).
    expect(deriveIntroAnimation(CUES.capFlip + 0.2, false).backgroundAssetId).toBe('card-cap-a')
    expect(deriveIntroAnimation(CUES.capFlip + 0.3, false).backgroundAssetId).toBe('card-cap-mid')
    expect(deriveIntroAnimation(CUES.capFlip + 0.6, false).backgroundAssetId).toBe('card-cap-b')
    expect(deriveIntroAnimation(CUES.fourStripes + 0.05, false).backgroundAssetId).toBe('card-stripes')
    expect(deriveIntroAnimation(CUES.logbookSnap + 0.05, false).backgroundAssetId).toBe('card-logbook')
    expect(deriveIntroAnimation(CUES.wingsPinned + 0.05, false).backgroundAssetId).toBe('card-wings')
    expect(deriveIntroAnimation(CUES.watchCheck + 0.1, false).backgroundAssetId).toBe('card-watch')
    // Each cut punches in and pops white.
    const cut = deriveIntroAnimation(CUES.logbookSnap + 0.03, false)
    expect(cut.camera.zoom).toBeGreaterThan(1.05)
    expect(cut.flash?.color).toBe('white')
  })

  it('grinds the doors open around the backlit silhouette', () => {
    const early = deriveIntroAnimation(26.5, false)
    const late = deriveIntroAnimation(30, false)
    expect(early.doors!.gap).toBeGreaterThanOrEqual(6)
    expect(late.doors!.gap).toBeGreaterThan(early.doors!.gap)
    // The aperture in the plate spans x 119–200; the gap never overshoots it.
    expect(late.doors!.gap).toBeLessThanOrEqual(44)
    expect(early.popt).toMatchObject({ clipId: 'backlit', x: 160 })
    expect(Number.isInteger(early.doors!.gap)).toBe(true)
  })

  it('walks the 34px figure across the scale shot smoothly', () => {
    const start = deriveIntroAnimation(31.6, false)
    const end = deriveIntroAnimation(35.5, false)
    expect(start.popt?.clipId).toBe('walk')
    expect(end.popt!.x).toBeGreaterThan(start.popt!.x + 90)
    const positions = Array.from({ length: 121 }, (_, index) => (
      deriveIntroAnimation(31.6 + index / 60, false).popt!.x
    ))
    for (let index = 1; index < positions.length; index += 1) {
      expect(Math.abs(positions[index]! - positions[index - 1]!)).toBeLessThan(4)
    }
  })

  it('spools the nacelle through its three states and wakes the beacon on the grid', () => {
    expect(deriveIntroAnimation(CUES.engineStart + 0.2, false).backgroundAssetId).toBe('card-nacelle-a')
    expect(deriveIntroAnimation(CUES.engineStart + 0.8, false).backgroundAssetId).toBe('card-nacelle-b')
    expect(deriveIntroAnimation(CUES.engineStart + 2, false).backgroundAssetId).toBe('card-nacelle-c')

    // The anti-collision beacon is locked to the beat grid after light-off.
    expect(beaconOn(CUES.engineStart - 0.1)).toBe(false)
    expect(beaconOn(CUES.engineStart + 0.01)).toBe(true)
    expect(beaconOn(CUES.engineStart + 0.4)).toBe(false)
    expect(beaconOn(CUES.engineStart + BEAT_GRID_SECONDS + 0.01)).toBe(true)
    const frame = deriveIntroAnimation(CUES.engineStart + 0.05, false)
    expect(frame.fx.some((fx) => fx.kind === 'beacon' && fx.on)).toBe(true)
  })

  it('wakes the instrument panel between its two generated states on the beat', () => {
    const waking = deriveIntroAnimation(CUES.instrumentsAlive + 0.3, false)
    expect(waking.backgroundAssetId).toBe('card-instruments')
    expect(waking.backgroundReveal).toMatchObject({ assetId: 'card-instruments-b', axis: 'ltr' })
    expect(waking.backgroundReveal!.progress).toBeGreaterThan(0.3)
    expect(waking.backgroundReveal!.progress).toBeLessThan(0.8)
    const awake = deriveIntroAnimation(CUES.thePhoto - 0.2, false)
    expect(awake.backgroundReveal?.progress).toBe(1)
    expect(deriveIntroAnimation(CUES.handOnThrottles + 0.1, false).backgroundAssetId).toBe('card-throttles-a')
    expect(deriveIntroAnimation(CUES.handOnThrottles + 0.5, false).backgroundAssetId).toBe('card-throttles-b')
  })

  it('rolls, rotates, and pulls the DC-9 past the camera on the measured accents', () => {
    const lineup = deriveIntroAnimation(44, false)
    expect(lineup.backgroundAssetId).toBe('plate-runway-lineup')
    expect(lineup.jet).toMatchObject({ clipId: 'runway', x: 160, scale: 1 })
    expect(lineup.fx.some((fx) => fx.kind === 'runway-lights')).toBe(true)
    expect(lineup.fx.some((fx) => fx.kind === 'nav-strobe')).toBe(true)

    const roll = deriveIntroAnimation(CUES.throttlesUp + 0.05, false)
    expect(roll.camera.zoom).toBeGreaterThan(1.05)
    const rollLights = roll.fx.find((fx) => fx.kind === 'runway-lights')
    expect(rollLights!.kind === 'runway-lights' && rollLights!.speed).toBeGreaterThan(0)

    // The roll reads as receding: the jet shrinks through pre-rendered sizes
    // as it accelerates away — never a fractional scale.
    const shrinking = deriveIntroAnimation(46.6, false)
    expect(shrinking.jet?.clipId).toBe('runway-36')
    const rotating = deriveIntroAnimation(CUES.rotate + 0.9, false)
    expect(rotating.jet?.clipId).toBe('runway-26')
    expect(rotating.jet!.y).toBeLessThan(lineup.jet!.y)
    expect(rotating.fx.some((fx) => fx.kind === 'exhaust')).toBe(true)

    // The overhead pass sweeps up-right (matching the sprite's nose-up-right
    // attitude) through two pre-rendered sizes. Sample times sit past the
    // 0.12 s hitstop hold and its catch-up, which stretch the pass on the
    // acting clock.
    const near = deriveIntroAnimation(CUES.jetPass + 0.05, false)
    expect(near.jet?.clipId).toBe('liftoff-160')
    const huge = deriveIntroAnimation(CUES.jetPass + 0.45, false)
    expect(huge.jet?.clipId).toBe('liftoff-320')
    expect(huge.jet!.x).toBeGreaterThan(near.jet!.x)
    for (const sample of [near, huge]) {
      expect(sample.jet!.scale).toBe(1)
    }
    // After the pass, the small silhouette climbs out along the contrail.
    const climbing = deriveIntroAnimation(48.9, false)
    expect(climbing.jet?.clipId).toBe('liftoff-48')
    expect(climbing.fx.some((fx) => fx.kind === 'contrail')).toBe(true)
  })

  it('rumbles the roll on whole pixels and freezes the pass with hitstop', () => {
    for (let time = CUES.throttlesUp; time < CUES.jetPass; time += 0.05) {
      const { camera } = deriveIntroAnimation(time, false)
      expect(Number.isInteger(camera.offsetX)).toBe(true)
      expect(Number.isInteger(camera.offsetY)).toBe(true)
    }
    // SEGA hitstop at the pass: the acting clock freezes while flash and
    // punch keep running on real time.
    const frozen = deriveIntroAnimation(CUES.jetPass + 0.01, false)
    const frozenLater = deriveIntroAnimation(CUES.jetPass + 0.1, false)
    expect(frozenLater.jet!.y).toBe(frozen.jet!.y)
    expect(deriveIntroAnimation(CUES.jetPass + 0.05, false).flash?.color).toBe('white')
  })

  it('stamps the emblem into the contrail and holds it through the collapse', () => {
    const preStamp = deriveIntroAnimation(49.5, false)
    expect(preStamp.card).toBeNull()

    const stamped = deriveIntroAnimation(50.2, false)
    expect(stamped.backgroundAssetId).toBe('plate-night-sky')
    expect(stamped.card).toMatchObject({ assetId: 'emblem-finale', scale: 1, opacity: 1 })
    expect(stamped.fx.some((fx) => fx.kind === 'radial-rays')).toBe(true)
    expect(stamped.fx.some((fx) => fx.kind === 'contrail')).toBe(true)

    const flashFrame = deriveIntroAnimation(CUES.emblemStamp + 0.03, false)
    expect(flashFrame.flash?.color).toBe('white')
    expect(flashFrame.flash!.opacity).toBeGreaterThan(0.5)
    expect(flashFrame.card!.scale).toBe(0.9)

    // Loop-reset holds the title while the pixels take it apart.
    const resetting = deriveIntroAnimation(52.5, false)
    expect(resetting.card).not.toBeNull()
    expect(resetting.pixelCollapse).toBeGreaterThan(0)
  })

  it('keeps every sprite on the stage pixel grid for the whole intro', () => {
    // One source pixel must land on a whole number of stage pixels; any
    // fractional scale point-samples the sheet unevenly (plans 0029/0030).
    for (let time = 0; time <= 53.04; time += 0.04) {
      const frame = deriveIntroAnimation(time, false)
      for (const actor of [frame.popt, frame.jet]) {
        if (!actor) continue
        expect(Number.isInteger(actor.scale)).toBe(true)
        expect(actor.scale).toBeGreaterThanOrEqual(1)
      }
    }
    for (const time of [3, 8, 14, 28, 33, 44, 50]) {
      const frame = deriveIntroAnimation(time, true)
      for (const actor of [frame.popt, frame.jet]) {
        if (!actor) continue
        expect(Number.isInteger(actor.scale)).toBe(true)
      }
    }
  })

  it('rests the camera at identity and lifts it only for a punch', () => {
    let lifted = 0
    let total = 0
    for (let time = 0; time <= 53.04; time += 0.04) {
      const { camera } = deriveIntroAnimation(time, false)
      total += 1
      expect(Number.isInteger(camera.offsetX)).toBe(true)
      expect(Number.isInteger(camera.offsetY)).toBe(true)
      expect(camera.zoom).toBeGreaterThanOrEqual(1)
      expect(camera.zoom === 1 || camera.zoom >= 1.02).toBe(true)
      if (camera.zoom !== 1) lifted += 1
    }
    // Zoom is a punch, never a framing device (plan 0030). The Scramble's
    // montage adds more cuts than the chase had, so the ceiling allows the
    // extra accents while still forbidding held zooms.
    expect(lifted / total).toBeLessThan(0.2)
  })

  it('plays the SEGA-style ident gag: sprint in, skid, tap, flare, sprint off', () => {
    expect(deriveIntroAnimation(1.2, false).popt).toBeNull()

    const entering = deriveIntroAnimation(2.1, false)
    expect(entering.popt?.clipId).toBe('run')

    const skid = deriveIntroAnimation(2.6, false)
    expect(skid.popt?.clipId).toBe('skid')
    expect(skid.props.some((sceneProp) => sceneProp.id === 'cloud-puff')).toBe(true)

    const tap = deriveIntroAnimation(3.99, false)
    expect(tap.popt?.clipId).toBe('tap')
    expect(tap.flash?.color).toBe('white')
    expect(tap.camera.zoom).toBeGreaterThan(1.1)
    expect(tap.logo.highlightOpacity).toBeGreaterThan(0)

    const flare = deriveIntroAnimation(4.8, false)
    expect(flare.logo.highlightOpacity).toBe(1)
    expect(flare.fx.filter((fx) => fx.kind === 'sparkle').length).toBeGreaterThanOrEqual(3)

    const exiting = deriveIntroAnimation(5.8, false)
    expect(exiting.popt?.clipId).toBe('run')
    expect(exiting.popt!.x).toBeGreaterThan(200)
  })

  it('freezes the acting clock at an accent then catches smoothly back up', () => {
    expect(hitstopTime(10, 10.5, 0.12)).toBe(10)
    expect(hitstopTime(10.55, 10.5, 0.12)).toBe(10.5)
    expect(hitstopTime(10.7, 10.5, 0.12)).toBeGreaterThan(10.5)
    expect(hitstopTime(10.7, 10.5, 0.12)).toBeLessThan(10.7)
    expect(hitstopTime(11.5, 10.5, 0.12)).toBe(11.5)
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

  it('holds a representative pose in reduced motion while preserving scene time', () => {
    expect(deriveIntroAnimation(3, true).logo).toEqual({
      visible: true,
      buildProgress: 1,
      highlightOpacity: 0,
    })
    const first = deriveIntroAnimation(32, true)
    const second = deriveIntroAnimation(35, true)
    expect(first.sceneId).toBe('walk')
    expect(second.sceneId).toBe('walk')
    expect(second.popt).toEqual(first.popt)
    // The inserts hold the photo — the quiet heart of the montage.
    expect(deriveIntroAnimation(40, true).backgroundAssetId).toBe('card-photo')
  })

  it('suppresses transient fx and camera moves in reduced motion', () => {
    const allowed = new Set(['runway-lights', 'contrail', 'radial-rays'])
    for (const time of [3, 8, 10.6, 13.5, 20, 28, 33, 37, 40, 44, 50, 52]) {
      const frame = deriveIntroAnimation(time, true)
      for (const fx of frame.fx) {
        expect(allowed.has(fx.kind), `${fx.kind} must not render in reduced motion`).toBe(true)
      }
      expect(frame.camera).toEqual(IDENTITY_CAMERA)
      expect(frame.flash).toBeNull()
    }
  })

  it('zooms the emblem out of the title card during the 650ms handoff', () => {
    expect(deriveHandoffAnimation(0)).toEqual({
      progress: 0,
      x: 160,
      y: 106,
      scale: 1,
      flashOpacity: 0,
    })
    expect(deriveHandoffAnimation(0.5)).toMatchObject({ progress: 0.5, x: 160, y: 106 })
    expect(deriveHandoffAnimation(1)).toEqual({
      progress: 1,
      x: 160,
      y: 106,
      scale: 4.5,
      flashOpacity: 1,
    })
  })
})
