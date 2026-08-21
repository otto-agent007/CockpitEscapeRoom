import { describe, expect, it } from 'vitest'
import { gameCopy } from './config'
import {
  IDENTITY_CAMERA,
  TITLE_CARD,
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
import { INTRO_MUSIC_CUES } from './introMusicCues'

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
    expect(Object.keys(POPT_CLIPS)).toEqual([
      'run', 'skid', 'blinded', 'forearm', 'flick', 'crooked', 'salute',
      'tip', 'cover', 'fall', 'swing', 'lookup', 'cap', 'landed', 'walk', 'backlit',
    ])
    // Wave S7: every clip is pre-rendered at its exact on-stage size, and each
    // pivot is the measured foot-span midpoint of its normalised sprite.
    // Twelve frames at 40 ms = 25 fps, up from six at 80 ms = 12.5 fps.
    expect(POPT_CLIPS.run).toMatchObject({
      frameWidth: 50,
      frameHeight: 66,
      columns: 12,
      pivot: { x: 25, y: 65 },
      loopMode: 'loop',
    })
    expect(POPT_CLIPS.run.durations).toHaveLength(12)
    expect(new Set(POPT_CLIPS.run.durations)).toEqual(new Set([40]))
    expect(POPT_CLIPS.skid).toMatchObject({ frameWidth: 57, frameHeight: 68, pivot: { x: 43, y: 67 }, loopMode: 'hold-last' })
    expect(POPT_CLIPS.blinded).toMatchObject({ frameWidth: 39, frameHeight: 67, pivot: { x: 13, y: 66 } })
    expect(POPT_CLIPS.forearm).toMatchObject({ frameWidth: 44, frameHeight: 68, pivot: { x: 12, y: 67 } })
    // The flick sprite is taller than the others because the cap is airborne
    // above his hand; its feet still sit on the pivot row.
    expect(POPT_CLIPS.flick).toMatchObject({ frameWidth: 39, frameHeight: 94, pivot: { x: 16, y: 93 } })
    expect(POPT_CLIPS.crooked).toMatchObject({ frameWidth: 32, frameHeight: 68, pivot: { x: 18, y: 67 } })
    expect(POPT_CLIPS.salute).toMatchObject({ frameWidth: 28, frameHeight: 73, pivot: { x: 18, y: 72 } })
    for (const id of [
      'skid', 'blinded', 'forearm', 'flick', 'crooked', 'salute',
      'tip', 'cover', 'fall', 'swing', 'lookup', 'landed', 'cap',
    ] as const) {
      expect(POPT_CLIPS[id].columns, id).toBe(1)
      expect(POPT_CLIPS[id].loopMode, id).toBe('hold-last')
    }
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

  it('ships no jet sprite at all now the departure happens off camera', () => {
    // Plan 0035 retired every DC-9 sprite: a pale airliner cannot survive being
    // drawn at the sizes this act played it. Nothing may reintroduce one.
    for (let time = 0; time <= 53.04; time += 0.04) {
      const frame = deriveIntroAnimation(time, false)
      expect(frame.popt?.assetId ?? '', `t=${time.toFixed(2)}`).not.toMatch(/dc9/)
      expect(frame.backgroundAssetId ?? '', `t=${time.toFixed(2)}`).not.toMatch(/dc9|night-sky/)
    }
    expect(JSON.stringify(POPT_CLIPS)).not.toMatch(/dc9|liftoff|runway-/)
  })

  it('derives the approved scene actions from normalized media time', () => {
    expect(deriveIntroAnimation(2, false)).toMatchObject({
      sceneId: 'tmb2-ident',
      logo: { visible: true },
      popt: { clipId: 'run' },
    })
    expect(deriveIntroAnimation(6.8, false).sceneId).toBe('beacon-dark')
    expect(deriveIntroAnimation(8, false).backgroundAssetId).toBe('card-boots')
    expect(deriveIntroAnimation(36.2, false)).toMatchObject({
      sceneId: 'aircraft-reveal',
      backgroundAssetId: 'plate-hangar-dark',
      backgroundReveal: { assetId: 'plate-hangar-reveal', progress: 1, axis: 'ttb' },
    })
    expect(deriveIntroAnimation(30, false).backgroundAssetId).toBe('card-logbook')
    expect(deriveIntroAnimation(CUES.doorsParting + 0.5, false)).toMatchObject({
      sceneId: 'doors',
      popt: { clipId: 'backlit' },
    })
    expect(deriveIntroAnimation(34.8, false).sceneId).toBe('walk')
    expect(deriveIntroAnimation(36.5, false).backgroundAssetId).toBe('plate-hangar-dark')
    expect(deriveIntroAnimation(40.8, false).backgroundAssetId).toBe('card-throttles-a')
    expect(deriveIntroAnimation(44, false).backgroundAssetId).toBe('plate-runway-lineup')
    expect(deriveIntroAnimation(48.5, false).backgroundAssetId).toBe('plate-right-seat')
    expect(deriveIntroAnimation(50.2, false).title).toMatchObject({ text: TITLE_CARD.text })
    expect(deriveIntroAnimation(52.5, false).title).not.toBeNull()
  })

  it('cuts every ritual still exactly on its cue', () => {
    expect(deriveIntroAnimation(CUES.bootsDown + 0.01, false).backgroundAssetId).toBe('card-boots')
    expect(deriveIntroAnimation(CUES.coffeeDown + 0.01, false).backgroundAssetId).toBe('card-coffee')
    expect(deriveIntroAnimation(CUES.coffeeDown - 0.01, false).backgroundAssetId).toBe('card-boots')
  })

  it('carries no runtime lettering until the finale title', () => {
    // The CAPT. POP T nameplate lived only on the retired flight-case card, so
    // the intro now letters nothing until the title card at 49.704.
    for (const time of [8, 12, 20, 40]) {
      expect(deriveIntroAnimation(time, false).title, `t=${time}`).toBeNull()
    }
    expect(deriveIntroAnimation(50.2, false).title).not.toBeNull()
  })

  it('slams the floodlights onto the dark plate when the aircraft arrives', () => {
    // The owner moved the aircraft to the end of the ground act (2026-08-20):
    // the reveal now follows the walk instead of opening the montage.
    const before = deriveIntroAnimation(CUES.aircraftReveal - 0.5, false)
    expect(before.sceneId).toBe('walk')

    const slam = deriveIntroAnimation(CUES.aircraftReveal + 0.05, false)
    expect(slam.backgroundAssetId).toBe('plate-hangar-dark')
    expect(slam.backgroundReveal?.progress).toBeGreaterThan(0)
    expect(slam.backgroundReveal?.progress).toBeLessThan(1)
    expect(slam.backgroundReveal?.axis).toBe('ttb')
    expect(slam.camera.zoom).toBeGreaterThan(1.1)
    expect(slam.flash?.color).toBe('white')

    const lit = deriveIntroAnimation(CUES.aircraftReveal + 0.5, false)
    expect(lit.backgroundReveal?.progress).toBe(1)
  })

  it('lands every story cut on its cue, hat first for continuity', () => {
    // The cap flip OPENS the montage (three frames: high, mid-fall, caught),
    // so every later card may wear the hat.
    expect(deriveIntroAnimation(CUES.capFlip + 0.2, false).backgroundAssetId).toBe('card-cap-a')
    expect(deriveIntroAnimation(CUES.capFlip + 0.3, false).backgroundAssetId).toBe('card-cap-mid')
    expect(deriveIntroAnimation(CUES.capFlip + 0.6, false).backgroundAssetId).toBe('card-cap-b')
    expect(deriveIntroAnimation(CUES.wingsPinned + 0.05, false).backgroundAssetId).toBe('card-wings')
    expect(deriveIntroAnimation(CUES.fourStripes + 0.05, false).backgroundAssetId).toBe('card-stripes')
    expect(deriveIntroAnimation(CUES.watchCheck + 0.1, false).backgroundAssetId).toBe('card-watch')
    // Each cut punches in and pops white.
    const cut = deriveIntroAnimation(CUES.fourStripes + 0.03, false)
    expect(cut.camera.zoom).toBeGreaterThan(1.05)
    expect(cut.flash?.color).toBe('white')
  })

  it('sweeps the reading pile off the logbook, lettered at runtime', () => {
    // Owner, 2026-08-20: the Isaacson biography and the Reacher paperbacks lie
    // on the logbook, and the hand pushes them aside to reach it. The covers
    // are generated textless (pack rule); the runtime letters them.
    const books = deriveIntroAnimation(CUES.logbookSnap + 0.5, false)
    expect(books.backgroundAssetId).toBe('card-logbook-books')
    expect(books.labels.map((label) => label.text)).toEqual(['ELON MUSK', 'REACHER', 'LEE CHILD'])
    expect(books.labels.every((label) => label.opacity === 1)).toBe(true)

    // The beat animates: pile -> mid-sweep -> hand on the bare log -> lifted.
    expect(deriveIntroAnimation(CUES.logbookSnap + 1.2, false).backgroundAssetId).toBe('card-logbook-sweep')
    const cleared = deriveIntroAnimation(CUES.logbookSnap + 2.0, false)
    expect(cleared.backgroundAssetId).toBe('card-logbook')
    expect(cleared.labels.map((label) => label.text)).toEqual(['FLIGHT LOG'])

    const lifted = deriveIntroAnimation(CUES.logbookSnap + 2.8, false)
    expect(lifted.backgroundAssetId).toBe('card-logbook-lift')
    expect(lifted.labels.map((label) => label.text)).toEqual(['FLIGHT LOG'])
    // The pick-up lands with its own small punch.
    expect(deriveIntroAnimation(CUES.logbookSnap + 2.45, false).camera.zoom).toBeGreaterThan(1.02)

    // No labels ride the motion frame: the covers are mid-slide there.
    expect(deriveIntroAnimation(CUES.logbookSnap + 1.2, false).labels).toEqual([])

    // Nothing else in the intro letters labels.
    for (const time of [8, 14, 20, 26, 37, 50]) {
      expect(deriveIntroAnimation(time, false).labels, `t=${time}`).toEqual([])
    }
  })

  it('gives the walk-out one long doorway beat rather than a run of quick cuts', () => {
    // History: one 9.96 s held doorway (idling) -> six equal 1.44 s cuts (a
    // metronome) -> this. The owner asked for it dramatically slower, and the
    // ground act's 35.3 s is fixed at both ends, so it carries fewer images.
    const parting = deriveIntroAnimation(CUES.doorsParting + 0.05, false)
    expect(parting.backgroundAssetId).toBe('plate-doorway')
    expect(parting.popt?.clipId).toBe('backlit')
    const wider = deriveIntroAnimation(CUES.standingAlone - 0.05, false)
    expect(wider.doors!.gap).toBeGreaterThan(parting.doors!.gap)
  })

  it('spreads the story across the whole track instead of finishing by 18 s', () => {
    // The complaint this guards: the intro used to run through everything
    // between 7 s and 16 s and then coast. Every consecutive story beat must
    // now be at least two seconds apart, across the entire ground act.
    const beats = [
      CUES.bootsDown, CUES.coffeeDown, CUES.capFlip, CUES.wingsPinned,
      CUES.doorsParting, CUES.standingAlone, CUES.fourStripes, CUES.watchCheck,
      CUES.logbookSnap, CUES.shadesDown, CUES.walkOut, CUES.aircraftReveal,
      CUES.instrumentsAlive, CUES.handOnThrottles,
    ]
    for (let index = 0; index < beats.length - 1; index += 1) {
      expect(beats[index + 1]! - beats[index]!, `gap after beat ${index}`).toBeGreaterThanOrEqual(2)
    }
    // And the story must still be running well past the halfway mark.
    expect(beats[beats.length - 1]!).toBeGreaterThan(40)
  })

  it('holds no single shot longer than five seconds outside the walk and the ending', () => {
    // Guards the pacing fix: the montage cuts every 1-2 s and the walk-out now
    // matches it, so no image may sit still through the body of the intro.
    let prev = ''
    let start = 0
    let worst = { dur: 0, key: '', at: 0 }
    for (let t = 6; t <= CUES.walkOut; t += 1 / 24) {
      const f = deriveIntroAnimation(t, false)
      const key = `${f.backgroundAssetId}|${f.popt?.clipId ?? ''}`
      if (key !== prev) {
        if (prev && t - start > worst.dur) worst = { dur: t - start, key: prev, at: start }
        prev = key
        start = t
      }
    }
    expect(worst.dur, `longest hold was ${worst.key} at ${worst.at.toFixed(2)}s`).toBeLessThan(3.2)
  })

  it('walks the 34px figure across the scale shot smoothly', () => {
    const start = deriveIntroAnimation(CUES.walkOut + 0.1, false)
    const end = deriveIntroAnimation(CUES.aircraftReveal - 0.2, false)
    expect(start.popt?.clipId).toBe('walk')
    expect(end.popt!.x).toBeGreaterThan(start.popt!.x + 90)
    const positions = Array.from({ length: 121 }, (_, index) => (
      deriveIntroAnimation(CUES.walkOut + 0.1 + index / 60, false).popt!.x
    ))
    for (let index = 1; index < positions.length; index += 1) {
      expect(Math.abs(positions[index]! - positions[index - 1]!)).toBeLessThan(4)
    }
  })

  it('wakes the instrument panel between its two generated states on the beat', () => {
    const waking = deriveIntroAnimation(CUES.instrumentsAlive + 0.3, false)
    expect(waking.backgroundAssetId).toBe('card-instruments')
    expect(waking.backgroundReveal).toMatchObject({ assetId: 'card-instruments-b', axis: 'ltr' })
    expect(waking.backgroundReveal!.progress).toBeGreaterThan(0.3)
    expect(waking.backgroundReveal!.progress).toBeLessThan(0.8)
    // Fully awake well before the next cut, now the photo beat between them is gone.
    const awake = deriveIntroAnimation(CUES.instrumentsAlive + 1.2, false)
    expect(awake.backgroundReveal?.progress).toBe(1)
    expect(deriveIntroAnimation(CUES.handOnThrottles + 0.1, false).backgroundAssetId).toBe('card-throttles-a')
    expect(deriveIntroAnimation(CUES.handOnThrottles + 0.5, false).backgroundAssetId).toBe('card-throttles-b')
  })

  it('sweeps the landing lights across the tarmac and lifts them away on rotate', () => {
    const waiting = deriveIntroAnimation(44, false)
    expect(waiting.backgroundAssetId).toBe('plate-runway-lineup')
    expect(waiting.fx.some((fx) => fx.kind === 'runway-lights')).toBe(true)

    const spooling = deriveIntroAnimation(CUES.throttlesUp + 0.05, false)
    expect(spooling.camera.zoom).toBeGreaterThan(1.05)
    // A purpose-built landing-lights fx: reusing radial-rays here read as a
    // sunburst and bare sparkles were far too small to carry the beat.
    const lights = spooling.fx.find((fx) => fx.kind === 'landing-lights')
    expect(lights, 'the landing lights ride throttles-up').toBeDefined()
    expect(spooling.flash?.opacity, 'the lights wash the scene').toBeGreaterThan(0)

    // Rotate lifts the lights out of frame and dims the ground behind them.
    const lifting = deriveIntroAnimation(CUES.rotate + 0.6, false)
    const liftingLights = lifting.fx.find((fx) => fx.kind === 'landing-lights')
    if (liftingLights && lights) {
      expect(liftingLights.kind === 'landing-lights' && liftingLights.y)
        .toBeLessThan(lights.kind === 'landing-lights' ? lights.y : 0)
    }
    expect(lifting.backgroundDim).toBeGreaterThan(0)
  })

  it('rumbles the roll on whole pixels and freezes rotate with hitstop', () => {
    for (let time = CUES.throttlesUp; time < CUES.intoTheSeat; time += 0.05) {
      const { camera } = deriveIntroAnimation(time, false)
      expect(Number.isInteger(camera.offsetX)).toBe(true)
      expect(Number.isInteger(camera.offsetY)).toBe(true)
    }
    expect(deriveIntroAnimation(CUES.rotate + 0.05, false).flash?.color).toBe('white')
  })

  it('cuts to the empty right seat and letters the game title over it', () => {
    const beforeCut = deriveIntroAnimation(CUES.intoTheSeat - 0.05, false)
    expect(beforeCut.backgroundAssetId).toBe('plate-runway-lineup')

    const seat = deriveIntroAnimation(CUES.intoTheSeat + 0.05, false)
    expect(seat.backgroundAssetId).toBe('plate-right-seat')
    expect(seat.title, 'the title waits until its own cue').toBeNull()
    expect(seat.flash?.color).toBe('white')

    const titled = deriveIntroAnimation(50.2, false)
    expect(titled.backgroundAssetId).toBe('plate-right-seat')
    expect(titled.title).toMatchObject({ text: TITLE_CARD.text, opacity: 1 })
    expect(titled.fx.some((fx) => fx.kind === 'radial-rays')).toBe(true)

    // The intro holds the title over the seat instead of collapsing and looping.
    const held = deriveIntroAnimation(52.9, false)
    expect(held.backgroundAssetId).toBe('plate-right-seat')
    expect(held.title).toMatchObject({ opacity: 1 })
    expect(held.pixelCollapse).toBe(0)
  })

  it('letters the title from the game config so the two can never diverge', () => {
    // The opening screen renders gameCopy.title as its heading; the intro must
    // show the same words, and no generated art may carry text.
    expect(TITLE_CARD.text).toBe(gameCopy.title.toUpperCase())
    expect(deriveIntroAnimation(50.2, false).title!.text).toBe(gameCopy.title.toUpperCase())
  })

  it('keeps every sprite on the stage pixel grid for the whole intro', () => {
    // One source pixel must land on a whole number of stage pixels; any
    // fractional scale point-samples the sheet unevenly (plans 0029/0030).
    for (let time = 0; time <= 53.04; time += 0.04) {
      const frame = deriveIntroAnimation(time, false)
      for (const actor of [frame.popt]) {
        if (!actor) continue
        expect(Number.isInteger(actor.scale)).toBe(true)
        expect(actor.scale).toBeGreaterThanOrEqual(1)
      }
    }
    for (const time of [3, 8, 14, 28, 33, 44, 50]) {
      const frame = deriveIntroAnimation(time, true)
      for (const actor of [frame.popt]) {
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

  it('plays the ident hat gag: sprint in, skid, blinded, forearm, flick, crooked, salute, sprint off', () => {
    expect(deriveIntroAnimation(1.2, false).popt).toBeNull()

    const entering = deriveIntroAnimation(2.1, false)
    expect(entering.popt?.clipId).toBe('run')

    const skid = deriveIntroAnimation(2.6, false)
    expect(skid.popt?.clipId).toBe('skid')
    expect(skid.props.some((sceneProp) => sceneProp.id === 'cloud-puff')).toBe(true)
    // The slam that gusts the cap loose carries the punch, flash and highlight.
    expect(skid.flash?.color).toBe('white')
    expect(skid.camera.zoom).toBeGreaterThan(1.1)

    // The key poses still land on the accents, with in-betweens between them.
    expect(deriveIntroAnimation(3.3, false).popt?.clipId).toBe('blinded')
    expect(deriveIntroAnimation(3.5, false).popt?.clipId).toBe('cover')
    expect(deriveIntroAnimation(3.75, false).popt?.clipId).toBe('fall')
    expect(deriveIntroAnimation(4.0, false).popt?.clipId).toBe('forearm')
    expect(deriveIntroAnimation(4.25, false).popt?.clipId).toBe('swing')

    const flick = deriveIntroAnimation(4.5, false)
    expect(flick.popt?.clipId).toBe('flick')
    expect(flick.logo.highlightOpacity).toBe(1)

    expect(deriveIntroAnimation(4.7, false).popt?.clipId).toBe('lookup')

    // The cap's flight is interpolated, not cut: it must move every frame.
    const capAt = (time: number) => deriveIntroAnimation(time, false).cap
    expect(capAt(4.45)).toBeNull()
    const a = capAt(4.6)!
    const b = capAt(4.75)!
    expect(a).not.toBeNull()
    expect(b.x).not.toBe(a.x)
    expect(b.rotation).not.toBe(a.rotation)
    // It arcs: higher in the middle of the flight than at either end.
    expect(capAt(4.7)!.y).toBeLessThan(capAt(4.52)!.y)
    expect(capAt(4.7)!.y).toBeLessThan(capAt(4.88)!.y)
    expect(capAt(4.95)).toBeNull()
    expect(deriveIntroAnimation(4.95, false).popt?.clipId).toBe('crooked')
    expect(deriveIntroAnimation(5.2, false).popt?.clipId).toBe('landed')

    const salute = deriveIntroAnimation(5.5, false)
    expect(salute.popt?.clipId).toBe('salute')
    expect(salute.fx.filter((fx) => fx.kind === 'sparkle').length).toBeGreaterThanOrEqual(3)

    const exiting = deriveIntroAnimation(5.9, false)
    expect(exiting.popt?.clipId).toBe('run')
    expect(exiting.popt!.x).toBeGreaterThan(200)
  })

  it('never leaves Pop T bare-headed for more than the two cap-in-hand beats', () => {
    // Owner contract: the cap stays on him or in his hands. Only the forearm
    // and flick poses show his head uncovered, and both hold the cap in frame.
    const bareHeaded = new Set(['forearm', 'flick', 'fall', 'swing', 'lookup'])
    let bareSeconds = 0
    for (let time = 0; time < 6; time += 0.02) {
      const clipId = deriveIntroAnimation(time, false).popt?.clipId
      if (clipId && bareHeaded.has(clipId)) bareSeconds += 0.02
    }
    expect(bareSeconds).toBeLessThan(1.8)
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
    const first = deriveIntroAnimation(33.8, true)
    const second = deriveIntroAnimation(35.2, true)
    expect(first.sceneId).toBe('walk')
    expect(second.sceneId).toBe('walk')
    expect(second.popt).toEqual(first.popt)
    // The inserts hold the woken panel.
    expect(deriveIntroAnimation(40, true).backgroundAssetId).toBe('card-instruments')
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

  it('zooms the title out of the finale during the 650ms handoff', () => {
    expect(deriveHandoffAnimation(0)).toEqual({
      progress: 0,
      x: 160,
      y: 44,
      scale: 1,
      flashOpacity: 0,
    })
    expect(deriveHandoffAnimation(0.5)).toMatchObject({ progress: 0.5, x: 160, y: 44 })
    expect(deriveHandoffAnimation(1)).toEqual({
      progress: 1,
      x: 160,
      y: 44,
      scale: 4.5,
      flashOpacity: 1,
    })
  })
})
