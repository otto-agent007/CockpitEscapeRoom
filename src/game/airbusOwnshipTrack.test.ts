import { describe, expect, it } from 'vitest'
import { createEngineOutStateAtCheckpoint } from './airbusEngineOut'
import {
  engineOutOwnshipTrack,
  MAX_AIRBUS_CLOSURE_NM,
  stormLineOwnshipTrack,
} from './airbusOwnshipTrack'
import { createStormLineStateAtCheckpoint } from './airbusSimulator'

function stormAt(checkpoint: 'stormEntry' | 'stormCore', overrides: {
  lateralPosition?: number
  trackDistanceNm?: number
} = {}) {
  const state = createStormLineStateAtCheckpoint(checkpoint)
  return {
    ...state,
    aircraft: {
      ...state.aircraft,
      lateralPosition: overrides.lateralPosition ?? state.aircraft.lateralPosition,
      trackDistanceNm: overrides.trackDistanceNm ?? state.aircraft.trackDistanceNm,
    },
  }
}

describe('Airbus ownship track', () => {
  it('starts every storm checkpoint pointing straight down the authored course', () => {
    // Each checkpoint must open with the authored gap exactly where it was
    // designed to be, or the WEST answer stops matching the picture.
    expect(stormLineOwnshipTrack(stormAt('stormEntry')).headingOffsetDegrees).toBe(0)
    expect(stormLineOwnshipTrack(stormAt('stormCore')).headingOffsetDegrees).toBe(0)
  })

  it('turns cross-track travel into a signed heading the weather field can rotate by', () => {
    const left = stormLineOwnshipTrack(stormAt('stormEntry', { lateralPosition: -0.4 }))
    const right = stormLineOwnshipTrack(stormAt('stormEntry', { lateralPosition: 0.4 }))

    expect(left.headingOffsetDegrees).toBeLessThan(0)
    expect(right.headingOffsetDegrees).toBeGreaterThan(0)
    expect(left.headingOffsetDegrees).toBeCloseTo(-right.headingOffsetDegrees, 8)
  })

  it('measures storm-core heading against the corridor it starts on, not the centreline', () => {
    const onCorridor = stormLineOwnshipTrack(stormAt('stormCore', { lateralPosition: -0.7 }))
    const driftedRight = stormLineOwnshipTrack(stormAt('stormCore', { lateralPosition: -0.2 }))

    expect(onCorridor.headingOffsetDegrees).toBe(0)
    expect(driftedRight.headingOffsetDegrees).toBeGreaterThan(0)
  })

  it('clamps heading and closure so a departure cannot spin or empty the picture', () => {
    const extreme = stormLineOwnshipTrack(
      stormAt('stormEntry', { lateralPosition: -40, trackDistanceNm: 500 }),
    )

    expect(extreme.headingOffsetDegrees).toBe(-45)
    expect(extreme.closureNm).toBe(MAX_AIRBUS_CLOSURE_NM)
  })

  it('never reports negative closure from a corrupt or rewound state', () => {
    const rewound = stormLineOwnshipTrack(stormAt('stormCore', { trackDistanceNm: -12 }))

    expect(rewound.closureNm).toBe(0)
  })

  it('uses the Engine-Out heading error as its own ownship rotation', () => {
    const state = createEngineOutStateAtCheckpoint('stabilization')
    const drifted = { ...state, aircraft: { ...state.aircraft, headingError: 9 } }

    expect(engineOutOwnshipTrack(drifted).headingOffsetDegrees).toBe(9)
    expect(engineOutOwnshipTrack(state).closureNm).toBeGreaterThanOrEqual(0)
  })
})
