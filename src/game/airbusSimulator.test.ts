import { describe, expect, it } from 'vitest'
import {
  advanceStormLine,
  createStormLineState,
  createStormLineStateAtCheckpoint,
  normalizeFlightInput,
  restartStormLineCheckpoint,
  STORM_ENTRY_GATE_LATERAL,
} from './airbusSimulator'

describe('normalizeFlightInput', () => {
  it('clamps every control axis so a noisy input device cannot exceed the flight envelope', () => {
    expect(normalizeFlightInput({ pitch: 1.4, bank: -2, thrust: 0.25 })).toEqual({
      pitch: 1,
      bank: -1,
      thrust: 0.25,
    })
  })
})

describe('Storm Line flight model', () => {
  it('restores only a durable checkpoint and prior attempt counts after reload', () => {
    const restored = createStormLineStateAtCheckpoint('stormCore', {
      stormEntry: 1,
      stormCore: 2,
      clearAir: 0,
    })

    expect(restored).toMatchObject({
      phase: 'flying',
      checkpoint: 'stormCore',
      elapsedSeconds: 45,
      checkpointElapsedSeconds: 0,
      attempts: { stormEntry: 1, stormCore: 2, clearAir: 0 },
      aircraft: { lateralPosition: -0.7, energy: 0.5 },
    })
  })

  it('responds continuously to pitch, bank, and thrust input', () => {
    const initial = createStormLineState()
    const next = advanceStormLine(initial, { pitch: 1, bank: -1, thrust: 1 }, 1)

    expect(next.aircraft.pitch).toBeGreaterThan(0)
    expect(next.aircraft.bank).toBeLessThan(0)
    expect(next.aircraft.energy).toBeGreaterThan(0.5)
    expect(next.elapsedSeconds).toBeCloseTo(1, 5)
  })

  it('produces identical turbulence for identical state, seed, and input', () => {
    const first = advanceStormLine(createStormLineState(27), { pitch: 0.2, bank: 0.1, thrust: 0 }, 2)
    const second = advanceStormLine(createStormLineState(27), { pitch: 0.2, bank: 0.1, thrust: 0 }, 2)

    expect(second).toEqual(first)
  })

  it('advances through the stable western gap and records weather judgment', () => {
    const initial = createStormLineState()
    const choosingGap = {
      ...initial,
      elapsedSeconds: 44.95,
      checkpointElapsedSeconds: 44.95,
      aircraft: { ...initial.aircraft, lateralPosition: -0.7 },
    }

    const next = advanceStormLine(choosingGap, { pitch: 0, bank: 0, thrust: 0 }, 0.1)

    expect(next.phase).toBe('flying')
    expect(next.checkpoint).toBe('stormCore')
    expect(next.metrics.weatherJudgment).toBe(true)
  })

  it('accepts a shallow but committed west offset at the entry gate', () => {
    const initial = createStormLineState()
    const nearGap = {
      ...initial,
      elapsedSeconds: 44.95,
      checkpointElapsedSeconds: 44.95,
      aircraft: { ...initial.aircraft, lateralPosition: STORM_ENTRY_GATE_LATERAL - 0.05 },
    }

    const next = advanceStormLine(nearGap, { pitch: 0, bank: 0, thrust: 0 }, 0.1)

    expect(next.phase).toBe('flying')
    expect(next.checkpoint).toBe('stormCore')
    expect(next.metrics.weatherJudgment).toBe(true)
  })

  it('still fails the entry gate just right of the published threshold', () => {
    const initial = createStormLineState()
    const shortOfGap = {
      ...initial,
      elapsedSeconds: 44.95,
      checkpointElapsedSeconds: 44.95,
      aircraft: { ...initial.aircraft, lateralPosition: STORM_ENTRY_GATE_LATERAL + 0.05 },
    }

    const next = advanceStormLine(shortOfGap, { pitch: 0, bank: 0, thrust: 0 }, 0.1)

    expect(next.phase).toBe('checkpointFailed')
    expect(next.failureReason).toBe('corridor')
  })

  it('freezes and coaches an unsafe storm-gap choice', () => {
    const initial = createStormLineState()
    const choosingGap = {
      ...initial,
      elapsedSeconds: 44.95,
      checkpointElapsedSeconds: 44.95,
      aircraft: { ...initial.aircraft, lateralPosition: 0 },
    }

    const next = advanceStormLine(choosingGap, { pitch: 0, bank: 0, thrust: 0 }, 0.1)

    expect(next.phase).toBe('checkpointFailed')
    expect(next.failureReason).toBe('corridor')
    expect(next.checkpoint).toBe('stormEntry')
  })

  it('rewinds only the failed checkpoint and increments its attempt count', () => {
    const initial = createStormLineState()
    const failed = {
      ...initial,
      phase: 'checkpointFailed' as const,
      checkpoint: 'stormCore' as const,
      elapsedSeconds: 102,
      checkpointElapsedSeconds: 57,
      failureReason: 'attitude' as const,
      aircraft: { ...initial.aircraft, pitch: 24, bank: 51, energy: 0.28 },
    }

    const restarted = restartStormLineCheckpoint(failed)

    expect(restarted.phase).toBe('flying')
    expect(restarted.checkpoint).toBe('stormCore')
    expect(restarted.elapsedSeconds).toBe(45)
    expect(restarted.checkpointElapsedSeconds).toBe(0)
    expect(restarted.attempts.stormCore).toBe(1)
    expect(restarted.aircraft).toMatchObject({ pitch: 0, bank: 0, energy: 0.5 })
  })

  it('fails the active checkpoint after five seconds outside the attitude envelope', () => {
    const initial = createStormLineStateAtCheckpoint('stormCore')
    const unstable = {
      ...initial,
      aircraft: { ...initial.aircraft, pitch: 24, pitchRate: 0 },
    }

    const failed = advanceStormLine(unstable, { pitch: 0, bank: 0, thrust: 0 }, 5)

    expect(failed.phase).toBe('checkpointFailed')
    expect(failed.failureReason).toBe('attitude')
    expect(failed.checkpoint).toBe('stormCore')
  })

  it('completes in clear air and awards earned Captain traits', () => {
    const initial = createStormLineState()
    const recovering = {
      ...initial,
      checkpoint: 'clearAir' as const,
      elapsedSeconds: 164.95,
      checkpointElapsedSeconds: 29.95,
      metrics: {
        smoothnessPenalty: 5,
        energyDeviationSeconds: 2,
        weatherJudgment: true,
      },
    }

    const complete = advanceStormLine(recovering, { pitch: 0, bank: 0, thrust: 0 }, 0.1)

    expect(complete.phase).toBe('complete')
    expect(complete.traits).toEqual(['calmControl', 'weatherJudgment', 'energyManagement'])
  })
})
