import { describe, expect, it } from 'vitest'
import {
  DC9_DEPARTURE_CHECKPOINTS,
  advanceDc9DepartureFrame,
  advanceDc9DepartureProgress,
  canonicalDc9DepartureFrame,
  createInitialDc9DepartureProgress,
  recordDc9DepartureMistake,
  normalizeDc9DepartureProgress,
} from './dc9MemphisDeparture'

const centeredInput = {
  pitch: 0,
  roll: 0,
  rudder: 0,
  thrust: 0,
  brake: 0,
  lineupConfirmed: false,
}

function advanceFor(
  initial: ReturnType<typeof canonicalDc9DepartureFrame>,
  input: typeof centeredInput,
  seconds: number,
) {
  let frame = initial
  let event: ReturnType<typeof advanceDc9DepartureFrame>['event']
  const steps = Math.ceil(seconds * 60)
  for (let index = 0; index < steps; index += 1) {
    const next = advanceDc9DepartureFrame(frame, input, 1 / 60)
    frame = next.frame
    event ??= next.event
    if (next.event) break
  }
  return { frame, event }
}

describe('DC-9 Memphis departure', () => {
  it('starts stopped at the Concourse B ramp', () => {
    expect(canonicalDc9DepartureFrame('rampStart')).toMatchObject({
      beat: 'rampRelease',
      pathProgress: 0,
      energy: 0,
      safeHold: true,
    })
  })

  it('restores every durable checkpoint to a stopped canonical frame', () => {
    for (const checkpoint of DC9_DEPARTURE_CHECKPOINTS) {
      expect(canonicalDc9DepartureFrame(checkpoint).energy).toBe(0)
    }
  })

  it('cannot cross hold short until stopped and explicitly confirmed', () => {
    const frame = canonicalDc9DepartureFrame('holdShort')
    const moving = advanceDc9DepartureFrame(frame, {
      pitch: 0, roll: 0, rudder: 0, thrust: 0.4, brake: 0, lineupConfirmed: true,
    }, 1 / 60)

    expect(moving.frame.beat).toBe('holdShort')
    expect(moving.event).toBeUndefined()
  })

  it('restores malformed progress to the earliest trustworthy checkpoint', () => {
    expect(normalizeDc9DepartureProgress({
      checkpoint: 'not-real',
      completedBeats: ['takeoffRoll'],
      attempts: { taxi: -3 },
      hintLevel: 9,
    })).toEqual(createInitialDc9DepartureProgress())
  })

  it('advances ramp release with fictional thrust and centered steering', () => {
    const next = advanceFor(canonicalDc9DepartureFrame('rampStart'), {
      ...centeredInput,
      thrust: 0.8,
    }, 2)

    expect(next.event).toEqual({ type: 'checkpoint', checkpoint: 'taxiTurn' })
    expect(next.frame.beat).toBe('taxi')
    expect(next.frame.pathProgress).toBeGreaterThanOrEqual(0.12)
  })

  it('restores the active checkpoint after sustained path deviation', () => {
    const next = advanceFor(canonicalDc9DepartureFrame('taxiTurn'), {
      ...centeredInput,
      thrust: 0.6,
      rudder: 1,
    }, 2)

    expect(next.event).toEqual({ type: 'mistake', beat: 'taxi', reason: 'pathDeviation' })
    expect(next.frame).toEqual(canonicalDc9DepartureFrame('taxiTurn'))
  })

  it('enters the hold-short safe state only with closed fictional thrust and brake', () => {
    const approachingHold = {
      ...canonicalDc9DepartureFrame('taxiTurn'),
      pathProgress: 0.419,
      energy: 0.08,
    }
    const next = advanceDc9DepartureFrame(approachingHold, {
      ...centeredInput,
      brake: 1,
    }, 0.1)

    expect(next.event).toEqual({ type: 'checkpoint', checkpoint: 'holdShort' })
    expect(next.frame).toMatchObject({ beat: 'holdShort', safeHold: true, energy: 0 })
  })

  it('holds a braking, closed-thrust approach at the boundary until it settles', () => {
    const brakingApproach = {
      ...canonicalDc9DepartureFrame('taxiTurn'),
      pathProgress: 0.419,
      energy: 0.4,
    }
    const held = advanceDc9DepartureFrame(brakingApproach, {
      ...centeredInput,
      thrust: 0.2,
      brake: 1,
    }, 1 / 60)

    expect(held.event).toBeUndefined()
    expect(held.frame).toMatchObject({ beat: 'taxi', pathProgress: 0.42, safeHold: false })

    const settled = advanceFor(held.frame, { ...centeredInput, brake: 1 }, 1)
    expect(settled.event).toEqual({ type: 'checkpoint', checkpoint: 'holdShort' })
    expect(settled.frame).toEqual(canonicalDc9DepartureFrame('holdShort'))
  })

  it('restores a moving hold-boundary crossing to the stopped hold-short checkpoint', () => {
    const movingApproach = {
      ...canonicalDc9DepartureFrame('taxiTurn'),
      pathProgress: 0.419,
      energy: 0.8,
    }
    const next = advanceDc9DepartureFrame(movingApproach, {
      ...centeredInput,
      thrust: 0.8,
    }, 0.1)

    expect(next.event).toEqual({ type: 'mistake', beat: 'taxi', reason: 'unsafeHold' })
    expect(next.frame).toEqual(canonicalDc9DepartureFrame('holdShort'))
  })

  it('restores an unconfirmed slow hold-boundary crossing to the stopped hold-short checkpoint', () => {
    const unconfirmedApproach = {
      ...canonicalDc9DepartureFrame('taxiTurn'),
      pathProgress: 0.419,
      energy: 0.1,
    }
    const next = advanceDc9DepartureFrame(unconfirmedApproach, centeredInput, 0.1)

    expect(next.event).toEqual({ type: 'mistake', beat: 'taxi', reason: 'unsafeHold' })
    expect(next.frame).toEqual(canonicalDc9DepartureFrame('holdShort'))
  })

  it('ignores lineup confirmation until the hold is stopped', () => {
    const notStopped = {
      ...canonicalDc9DepartureFrame('holdShort'),
      energy: 0.1,
      safeHold: false,
    }
    const next = advanceDc9DepartureFrame(notStopped, {
      ...centeredInput,
      lineupConfirmed: true,
    }, 1 / 60)

    expect(next.frame.beat).toBe('holdShort')
    expect(next.event).toBeUndefined()
  })

  it('restores runway lineup when pitch arrives before the rotation cue', () => {
    const early = {
      ...canonicalDc9DepartureFrame('runwayLineup'),
      beat: 'takeoffRoll' as const,
      pathProgress: 0.7,
      energy: 0.75,
    }
    const next = advanceDc9DepartureFrame(early, {
      ...centeredInput,
      pitch: 0.5,
      thrust: 0.8,
    }, 1 / 60)

    expect(next.event).toEqual({ type: 'mistake', beat: 'takeoffRoll', reason: 'earlyRotation' })
    expect(next.frame).toEqual(canonicalDc9DepartureFrame('runwayLineup'))
  })

  it('enters initial climb when pitch reaches the broad cue window', () => {
    const cue = {
      ...canonicalDc9DepartureFrame('runwayLineup'),
      beat: 'rotation' as const,
      pathProgress: 0.8,
      energy: 0.8,
    }
    const next = advanceDc9DepartureFrame(cue, {
      ...centeredInput,
      pitch: 0.45,
      thrust: 0.8,
    }, 1 / 60)

    expect(next.event).toEqual({ type: 'checkpoint', checkpoint: 'initialClimb' })
    expect(next.frame.beat).toBe('initialClimb')
  })

  it('keeps the rotation cue available until an aft input arrives', () => {
    const cue = {
      ...canonicalDc9DepartureFrame('runwayLineup'),
      beat: 'rotation' as const,
      pathProgress: 0.8,
      energy: 0.8,
    }
    const waiting = advanceFor(cue, centeredInput, 3 / 60)

    expect(waiting.event).toBeUndefined()
    expect(waiting.frame).toMatchObject({
      beat: 'rotation',
      pathProgress: 0.78,
      safeHold: false,
    })

    const accepted = advanceDc9DepartureFrame(waiting.frame, {
      ...centeredInput,
      pitch: 0.45,
      thrust: 0.8,
    }, 1 / 60)

    expect(accepted.event).toEqual({ type: 'checkpoint', checkpoint: 'initialClimb' })
    expect(accepted.frame.beat).toBe('initialClimb')
  })

  it('gives a rotation-required aft input time to settle into the climb', () => {
    const enteringClimb = {
      ...canonicalDc9DepartureFrame('initialClimb'),
      pitch: 0.45,
      energy: 0.8,
    }
    const settling = advanceFor(enteringClimb, {
      ...centeredInput,
      pitch: 0.45,
      thrust: 0.8,
    }, 3 / 60)

    expect(settling.event).toBeUndefined()
    expect(settling.frame).toMatchObject({ beat: 'initialClimb', altitudeProgress: 0 })

    const stable = advanceDc9DepartureFrame(settling.frame, {
      ...centeredInput,
      thrust: 0.8,
    }, 1 / 60)
    expect(stable.event).toBeUndefined()
    expect(stable.frame.altitudeProgress).toBeGreaterThan(0)
  })

  it('restores initial climb after sustained instability', () => {
    const unstable = advanceFor(canonicalDc9DepartureFrame('initialClimb'), {
      ...centeredInput,
      pitch: 0.8,
      thrust: 0.8,
    }, 1)

    expect(unstable.event).toEqual({ type: 'mistake', beat: 'initialClimb', reason: 'unstableClimb' })
    expect(unstable.frame).toEqual(canonicalDc9DepartureFrame('initialClimb'))
  })

  it('completes a relaxed, steady initial climb', () => {
    const settled = {
      ...canonicalDc9DepartureFrame('initialClimb'),
      altitudeProgress: 0.98,
    }
    const next = advanceDc9DepartureFrame(settled, {
      ...centeredInput,
      pitch: 0.1,
      roll: 0.1,
      thrust: 0.7,
    }, 0.1)

    expect(next.event).toEqual({ type: 'complete' })
    expect(next.frame.beat).toBe('complete')
  })

  it('bounds large deltas so one stalled frame cannot skip a checkpoint', () => {
    const next = advanceDc9DepartureFrame(canonicalDc9DepartureFrame('rampStart'), {
      ...centeredInput,
      thrust: 1,
    }, 10)

    expect(next.frame.beat).toBe('rampRelease')
    expect(next.event).toBeUndefined()
  })

  it('raises progressive hints without deleting completed beats', () => {
    const earned = advanceDc9DepartureProgress(createInitialDc9DepartureProgress(), {
      type: 'checkpoint', checkpoint: 'taxiTurn',
    })
    const first = recordDc9DepartureMistake(earned, 'taxi')
    const second = recordDc9DepartureMistake(first, 'taxi')
    const third = recordDc9DepartureMistake(second, 'taxi')

    expect(first.hintLevel).toBe(1)
    expect(second.hintLevel).toBe(2)
    expect(third.hintLevel).toBe(3)
    expect(third.completedBeats).toEqual(['rampRelease'])
  })

  it('normalizes noisy controls and non-finite deltas into a bounded frame', () => {
    const next = advanceDc9DepartureFrame(canonicalDc9DepartureFrame('rampStart'), {
      pitch: Number.NaN,
      roll: Infinity,
      rudder: -4,
      thrust: 4,
      brake: -2,
      lineupConfirmed: true,
    }, Number.NaN)

    expect(next.frame).toEqual(canonicalDc9DepartureFrame('rampStart'))
  })

  it('produces the same frame for equivalent fixed-step input samples', () => {
    const input = { ...centeredInput, thrust: 0.75, rudder: 0.1 }
    const oneChunk = advanceDc9DepartureFrame(canonicalDc9DepartureFrame('rampStart'), input, 0.1)
    let split = canonicalDc9DepartureFrame('rampStart')
    for (let index = 0; index < 6; index += 1) {
      split = advanceDc9DepartureFrame(split, input, 1 / 60).frame
    }

    expect(oneChunk.frame).toEqual(split)
  })

  it('keeps common frame cadences invariant over equal elapsed time', () => {
    const input = { ...centeredInput, thrust: 0.4, rudder: 0.1 }
    const advanceAtCadence = (delta: number, count: number) => {
      let frame = canonicalDc9DepartureFrame('rampStart')
      for (let index = 0; index < count; index += 1) {
        frame = advanceDc9DepartureFrame(frame, input, delta).frame
      }
      return frame
    }

    const at120Hz = advanceAtCadence(1 / 120, 60)
    const at60Hz = advanceAtCadence(1 / 60, 30)
    const at30Hz = advanceAtCadence(1 / 30, 15)

    expect(at120Hz).toEqual(at60Hz)
    expect(at60Hz).toEqual(at30Hz)
  })
})
