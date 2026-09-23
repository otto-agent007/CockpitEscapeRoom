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
  laserBeamShape,
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
    const phases = Array.from({ length: LASER_BEAM_FRAMES + 1 }, (_, age) => laserBeamShape(age, false)?.phase)
    expect(phases[0]).toBe('slam')
    expect(phases).toContain('hold')
    expect(phases).toContain('thin')
    expect(phases[LASER_BEAM_FRAMES]).toBe('scorch')
    expect(laserBeamShape(0, false)?.width).toBeGreaterThan(laserBeamShape(LASER_BEAM_FRAMES - 1, false)?.width ?? 0)
    expect(laserBeamShape(LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES, false)).toBeNull()
  })

  it('holds one steady width under reduced motion, but still shows the beam', () => {
    const widths = new Set(
      Array.from({ length: LASER_BEAM_FRAMES }, (_, age) => laserBeamShape(age, true)?.width),
    )
    expect(widths.size).toBe(1)
    expect([...widths][0]).toBeGreaterThan(0)
    expect(laserBeamShape(LASER_BEAM_FRAMES, true)?.phase).toBe('scorch')
  })
})
