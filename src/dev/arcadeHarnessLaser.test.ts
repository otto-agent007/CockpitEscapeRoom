import { describe, expect, it } from 'vitest'
import {
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  advanceMarsArcade,
  createMarsArcadeRound,
  type MarsArcadeInput,
  type MarsArcadeState,
} from '../game/marsArcade'
import { MARS_ARCADE_FIGHTERS } from '../game/marsArcadeFighters'
import {
  LASER_BEAM_FRAMES,
  LASER_SCORCH_FRAMES,
  laserStrikeLook,
  updateLaserStrikes,
} from './arcadeHarnessLaser'

const neutral = (): MarsArcadeInput => ({ ...NEUTRAL_MARS_ARCADE_INPUT })

function fight(defenderX: number): MarsArcadeState {
  let state = createMarsArcadeRound('booster', 'oracle')
  for (let frame = 0; frame < MARS_ARCADE_TIMING.introFrames; frame += 1) {
    state = advanceMarsArcade(state, [neutral(), neutral()], MARS_ARCADE_TIMING.frameSeconds).state
  }
  return {
    ...state,
    fighters: [
      { ...state.fighters[0], x: -100, meter: MARS_ARCADE_FIGHTERS.booster.moves.special.meterCost },
      { ...state.fighters[1], x: defenderX },
    ],
  }
}

function press(state: MarsArcadeState, button: 'light' | 'special') {
  return advanceMarsArcade(state, [{ ...neutral(), [button]: true }, neutral()], MARS_ARCADE_TIMING.frameSeconds)
}

describe('space laser presentation', () => {
  it('lands the beam on the defender, not the booster', () => {
    const transition = press(fight(150), 'special')
    const strikes = updateLaserStrikes([], transition.state, transition.events)
    expect(strikes).toEqual([{ x: 150, frame: transition.state.frame }])
  })

  it('draws nothing for an ordinary hit', () => {
    const close = fight(0)
    close.fighters[0].x = -28
    const transition = press(close, 'light')
    let state = transition.state
    const events = [...transition.events]
    for (let frame = 0; frame < 10; frame += 1) {
      const next = advanceMarsArcade(state, [neutral(), neutral()], MARS_ARCADE_TIMING.frameSeconds)
      state = next.state
      events.push(...next.events)
    }
    expect(events.map((event) => event.type)).toContain('hit')
    expect(updateLaserStrikes([], state, events)).toEqual([])
  })

  it('ages with the fight clock and leaves once the scorch has faded', () => {
    const struck = press(fight(150), 'special')
    const strikes = updateLaserStrikes([], struck.state, struck.events)
    const later = { ...struck.state, frame: struck.state.frame + LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES - 1 }
    expect(updateLaserStrikes(strikes, later, [])).toHaveLength(1)
    expect(updateLaserStrikes(strikes, { ...later, frame: later.frame + 1 }, [])).toEqual([])
  })

  it('slams in wide, thins out, then leaves only the scorch', () => {
    const looks = Array.from({ length: LASER_BEAM_FRAMES + 1 }, (_, age) => laserStrikeLook(age, false))
    expect(looks[0]?.beamWidth).toBe(14)
    expect(looks.map((look) => look?.beamWidth)).toContain(10)
    expect(looks[LASER_BEAM_FRAMES - 1]?.beamWidth).toBe(6)
    expect(looks[LASER_BEAM_FRAMES]?.beamWidth).toBe(0)
    expect(laserStrikeLook(LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES, false)).toBeNull()
  })

  it('plays the impact flash, burst and dust once, then leaves the scorch', () => {
    const frames = Array.from({ length: LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES }, (_, age) => laserStrikeLook(age, false)?.impactFrame)
    expect(frames[0]).toBe(0)
    expect([...new Set(frames)]).toEqual([0, 1, 2, 3])
    expect(frames[frames.length - 1]).toBe(3)
  })

  it('holds the satellite over the target while it fires, then flies it on', () => {
    expect(laserStrikeLook(0, false)?.satelliteOffset).toBe(0)
    expect(laserStrikeLook(LASER_BEAM_FRAMES - 1, false)?.satelliteOffset).toBe(0)
    const leaving = laserStrikeLook(LASER_BEAM_FRAMES + 5, false)?.satelliteOffset ?? 0
    expect(leaving).toBeGreaterThan(laserStrikeLook(LASER_BEAM_FRAMES, false)?.satelliteOffset ?? 0)
  })

  it('keeps the beam and scorch under reduced motion, without flash, pulse or drift', () => {
    const looks = Array.from({ length: LASER_BEAM_FRAMES }, (_, age) => laserStrikeLook(age, true))
    expect(new Set(looks.map((look) => look?.beamWidth))).toEqual(new Set([10]))
    expect(new Set(looks.map((look) => look?.impactFrame))).toEqual(new Set([3]))
    expect(new Set(looks.map((look) => look?.satelliteOffset))).toEqual(new Set([0]))
    expect(laserStrikeLook(LASER_BEAM_FRAMES, true)).toEqual({ beamWidth: 0, impactFrame: 3, satelliteOffset: null })
  })
})
