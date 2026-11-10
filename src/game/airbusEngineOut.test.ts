import { describe, expect, it } from 'vitest'
import * as engineOutModule from './airbusEngineOut'
import {
  advanceEngineOut,
  createEngineOutStateAtCheckpoint,
  restartEngineOutCheckpoint,
  type EngineOutState,
} from './airbusEngineOut'

const neutralInput = { pitch: 0, bank: 0, thrust: 0, directional: 0 }

function advanceFor(
  initial: EngineOutState,
  seconds: number,
  input = neutralInput,
): {
  state: EngineOutState
  checkpointReached?: string
  failureReason?: string
  completed?: boolean
  traits?: string[]
} {
  const advance = (
    engineOutModule as unknown as {
      advanceEngineOut?: (
        state: EngineOutState,
        input: typeof neutralInput,
        elapsedSeconds: number,
      ) => {
        state: EngineOutState
        checkpointReached?: string
        failureReason?: string
        completed?: boolean
        traits?: string[]
      }
    }
  ).advanceEngineOut

  expect(advance).toBeTypeOf('function')
  if (!advance) return { state: initial }

  let transition = { state: initial } as {
    state: EngineOutState
    checkpointReached?: string
    failureReason?: string
    completed?: boolean
    traits?: string[]
  }
  let checkpointReached: string | undefined
  let failureReason: string | undefined
  let completed = false
  let traits: string[] | undefined
  const ticks = Math.ceil(seconds * 60)
  for (let tick = 0; tick < ticks; tick += 1) {
    transition = advance(transition.state, input, 1 / 60)
    checkpointReached = transition.checkpointReached ?? checkpointReached
    failureReason = transition.failureReason ?? failureReason
    completed = transition.completed === true || completed
    traits = transition.traits ?? traits
  }
  return { state: transition.state, checkpointReached, failureReason, completed, traits }
}

describe('Engine-Out Handling simulation', () => {
  it('starts Recognition in stable cruise with a symmetric training setup', () => {
    const createState = (
      engineOutModule as unknown as {
        createEngineOutStateAtCheckpoint?: (checkpoint: 'recognition') => {
          phase: string
          checkpoint: string
          stageElapsedSeconds: number
          unsafeSeconds: number
          aircraft: {
            pitch: number
            bank: number
            energy: number
            directionalError: number
            leftEnginePower: number
            rightEnginePower: number
          }
          attempts: Record<string, number>
        }
      }
    ).createEngineOutStateAtCheckpoint

    expect(createState).toBeTypeOf('function')
    if (!createState) return

    expect(createState('recognition')).toMatchObject({
      phase: 'flying',
      checkpoint: 'recognition',
      stageElapsedSeconds: 0,
      unsafeSeconds: 0,
      aircraft: {
        pitch: 0,
        bank: 0,
        energy: 0.5,
        directionalError: 0,
        leftEnginePower: 0.72,
        rightEnginePower: 0.72,
      },
      attempts: { recognition: 0, stabilization: 0, diversion: 0 },
    })
  })

  it('caps a suspended-frame update so it cannot skip a scenario stage', () => {
    const transition = advanceEngineOut(
      createEngineOutStateAtCheckpoint('recognition'),
      neutralInput,
      30,
    )

    expect(transition.state.checkpoint).toBe('recognition')
    expect(transition.state.stageElapsedSeconds).toBeCloseTo(0.25, 5)
  })

  it('produces the same authoritative frame regardless of render-time chunking', () => {
    const input = { pitch: 0.2, bank: 0.3, thrust: 0.1, directional: 0.5 }
    const initial = createEngineOutStateAtCheckpoint('stabilization')
    const oneChunk = advanceEngineOut(initial, input, 0.1).state
    let fixedTicks = initial
    for (let tick = 0; tick < 6; tick += 1) {
      fixedTicks = advanceEngineOut(fixedTicks, input, 1 / 60).state
    }

    expect(oneChunk.stageElapsedSeconds).toBeCloseTo(fixedTicks.stageElapsedSeconds, 7)
    expect(oneChunk.aircraft.pitch).toBeCloseTo(fixedTicks.aircraft.pitch, 7)
    expect(oneChunk.aircraft.bank).toBeCloseTo(fixedTicks.aircraft.bank, 7)
    expect(oneChunk.aircraft.energy).toBeCloseTo(fixedTicks.aircraft.energy, 7)
    expect(oneChunk.aircraft.directionalError).toBeCloseTo(
      fixedTicks.aircraft.directionalError,
      7,
    )
    expect(oneChunk.aircraft.headingError).toBeCloseTo(fixedTicks.aircraft.headingError, 7)
  })

  it('smoothly reduces simulated left-engine power before entering Stabilization', () => {
    const halfway = advanceFor(createEngineOutStateAtCheckpoint('recognition'), 5)

    expect(halfway.state.checkpoint).toBe('recognition')
    expect(halfway.state.aircraft.leftEnginePower).toBeGreaterThan(0.45)
    expect(halfway.state.aircraft.leftEnginePower).toBeLessThan(0.55)
    expect(halfway.state.aircraft.rightEnginePower).toBeCloseTo(0.72, 3)

    const finished = advanceFor(halfway.state, 5.1)

    expect(finished.state.checkpoint).toBe('stabilization')
    expect(finished.state.aircraft.leftEnginePower).toBeCloseTo(0.28, 2)
    expect(finished.checkpointReached).toBe('stabilization')
  })

  it('keeps player control active while the Recognition reduction develops', () => {
    const controlled = advanceFor(
      createEngineOutStateAtCheckpoint('recognition'),
      1,
      { pitch: 0.4, bank: -0.3, thrust: 0.2, directional: 0.2 },
    )

    expect(controlled.state.aircraft.pitch).toBeGreaterThan(0)
    expect(controlled.state.aircraft.bank).toBeLessThan(0)
    expect(controlled.state.aircraft.energy).toBeGreaterThan(0.5)
    expect(controlled.state.aircraft.directionalError).not.toBe(0)
  })

  it('clamps player axes while responding continuously during Stabilization', () => {
    const transition = advanceFor(
      createEngineOutStateAtCheckpoint('stabilization'),
      2,
      { pitch: 99, bank: 99, thrust: 99, directional: 99 },
    )

    expect(transition.state.aircraft.pitch).toBeGreaterThan(12)
    expect(transition.state.aircraft.pitch).toBeLessThanOrEqual(20)
    expect(transition.state.aircraft.bank).toBeGreaterThan(25)
    expect(transition.state.aircraft.bank).toBeLessThanOrEqual(40)
    expect(transition.state.aircraft.energy).toBeGreaterThan(0.65)
    expect(transition.state.aircraft.energy).toBeLessThanOrEqual(0.85)
    expect(transition.state.aircraft.directionalError).toBeGreaterThan(0.45)
    expect(transition.state.aircraft.directionalError).toBeLessThanOrEqual(1)
  })

  it('requires directional balance to counter the simulated power asymmetry', () => {
    const unbalanced = advanceFor(createEngineOutStateAtCheckpoint('stabilization'), 3)
    const balanced = advanceFor(
      createEngineOutStateAtCheckpoint('stabilization'),
      3,
      { ...neutralInput, directional: 0.6 },
    )

    expect(Math.abs(unbalanced.state.aircraft.directionalError)).toBeGreaterThan(0.45)
    expect(Math.abs(balanced.state.aircraft.directionalError)).toBeLessThan(0.2)
  })

  it('turns uncorrected asymmetry into visible heading drift', () => {
    const unbalanced = advanceFor(createEngineOutStateAtCheckpoint('stabilization'), 3)
    const balanced = advanceFor(
      createEngineOutStateAtCheckpoint('stabilization'),
      3,
      { ...neutralInput, directional: 0.46 },
    )

    expect(unbalanced.state.aircraft.headingError).toBeLessThan(-1)
    expect(Math.abs(balanced.state.aircraft.headingError)).toBeLessThan(
      Math.abs(unbalanced.state.aircraft.headingError),
    )
  })

  it('pauses Stabilization after five cumulative unsafe seconds with focused feedback', () => {
    const initial = createEngineOutStateAtCheckpoint('stabilization')
    const highPitch: EngineOutState = {
      ...initial,
      aircraft: { ...initial.aircraft, pitch: 13 },
    }
    const unsafeInput = { ...neutralInput, pitch: 0.65, directional: 0.46 }

    const beforeLimit = advanceFor(highPitch, 4.9, unsafeInput)
    expect(beforeLimit.state.phase).toBe('flying')
    expect(beforeLimit.state.unsafeSeconds).toBeGreaterThan(4.8)

    const failed = advanceFor(beforeLimit.state, 0.2, unsafeInput)
    expect(failed.state.phase).toBe('checkpointFailed')
    expect(failed.failureReason).toBe('attitude')
  })

  it('retries only the failed Stabilization checkpoint', () => {
    const initial = createEngineOutStateAtCheckpoint('stabilization')
    const failed = advanceFor(
      {
        ...initial,
        unsafeSeconds: 4.99,
        aircraft: { ...initial.aircraft, energy: 0.8 },
      },
      0.1,
      { ...neutralInput, thrust: 1, directional: 0.46 },
    ).state
    const restart = (
      engineOutModule as unknown as {
        restartEngineOutCheckpoint?: (state: EngineOutState) => EngineOutState
      }
    ).restartEngineOutCheckpoint

    expect(restart).toBeTypeOf('function')
    if (!restart) return

    const retried = restart(failed)
    expect(retried.phase).toBe('flying')
    expect(retried.checkpoint).toBe('stabilization')
    expect(retried.stageElapsedSeconds).toBe(0)
    expect(retried.unsafeSeconds).toBe(0)
    expect(retried.attempts).toEqual({
      recognition: 0,
      stabilization: 1,
      diversion: 0,
    })
    expect(retried.aircraft).toMatchObject({
      pitch: 0,
      bank: 0,
      energy: 0.5,
      leftEnginePower: 0.28,
      rightEnginePower: 0.72,
    })
  })

  it('advances a stable fifty-second Stabilization segment to Diversion', () => {
    const balancedInput = { ...neutralInput, directional: 0.46 }
    const beforeGate = advanceFor(
      createEngineOutStateAtCheckpoint('stabilization'),
      49.9,
      balancedInput,
    )

    expect(beforeGate.state.phase).toBe('flying')
    expect(beforeGate.state.checkpoint).toBe('stabilization')

    const passed = advanceFor(beforeGate.state, 0.2, balancedInput)
    expect(passed.state.checkpoint).toBe('diversion')
    expect(passed.checkpointReached).toBe('diversion')
    expect(passed.state.attempts).toEqual(beforeGate.state.attempts)
  })

  it('completes Diversion by steering a stable aircraft into SAFE RETURN', () => {
    const completed = advanceFor(
      createEngineOutStateAtCheckpoint('diversion'),
      60,
      { ...neutralInput, bank: 0.4, directional: 0.46 },
    )

    expect(completed.state.phase).toBe('complete')
    expect(completed.completed).toBe(true)
    expect(completed.state.corridorProgress).toBeGreaterThanOrEqual(1)
    expect(completed.traits).toEqual([
      'directionalControl',
      'energyDiscipline',
      'calmDiversion',
    ])
  })

  it('retries Diversion locally after five seconds steering away from SAFE RETURN', () => {
    const initial = createEngineOutStateAtCheckpoint('diversion')
    const failed = advanceFor(
      {
        ...initial,
        aircraft: { ...initial.aircraft, bank: -10 },
      },
      5.1,
      { ...neutralInput, bank: -0.4, directional: 0.46 },
    )

    expect(failed.state.phase).toBe('checkpointFailed')
    expect(failed.failureReason).toBe('corridor')
    expect(failed.state.checkpoint).toBe('diversion')
  })

  it('withholds Calm Diversion after a Diversion retry', () => {
    const initial = createEngineOutStateAtCheckpoint('diversion')
    const failed = advanceFor(
      {
        ...initial,
        unsafeSeconds: 4.99,
        aircraft: { ...initial.aircraft, bank: -10 },
      },
      0.1,
      { ...neutralInput, bank: -0.4, directional: 0.46 },
    )
    const retried = restartEngineOutCheckpoint(failed.state)
    const completed = advanceFor(
      retried,
      60,
      { ...neutralInput, bank: 0.4, directional: 0.46 },
    )

    expect(completed.state.phase).toBe('complete')
    expect(completed.traits).toEqual(['directionalControl', 'energyDiscipline'])
  })

  it('withholds Energy Discipline after recoverable energy drift', () => {
    const initial = createEngineOutStateAtCheckpoint('diversion')
    const energyDrift = advanceFor(
      {
        ...initial,
        aircraft: { ...initial.aircraft, energy: 0.72 },
      },
      2,
      { ...neutralInput, bank: 0.4, thrust: 0.63, directional: 0.46 },
    )
    const completed = advanceFor(
      energyDrift.state,
      60,
      { ...neutralInput, bank: 0.4, directional: 0.46 },
    )

    expect(completed.state.phase).toBe('complete')
    expect(completed.traits).toEqual(['directionalControl', 'calmDiversion'])
  })

  it('withholds Directional Control after recoverable directional drift', () => {
    const initial = createEngineOutStateAtCheckpoint('diversion')
    const directionalDrift = advanceFor(
      {
        ...initial,
        aircraft: { ...initial.aircraft, directionalError: -0.6 },
      },
      2,
      { ...neutralInput, bank: 0.4 },
    )
    const completed = advanceFor(
      directionalDrift.state,
      60,
      { ...neutralInput, bank: 0.4, directional: 0.46 },
    )

    expect(completed.state.phase).toBe('complete')
    expect(completed.traits).toEqual(['energyDiscipline', 'calmDiversion'])
  })
})
