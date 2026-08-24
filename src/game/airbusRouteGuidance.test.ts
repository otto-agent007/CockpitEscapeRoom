import { describe, expect, it } from 'vitest'
import { deriveStormRouteGuidance } from './airbusRouteGuidance'
import {
  createStormLineState,
  createStormLineStateAtCheckpoint,
  STORM_CORRIDOR_CENTER,
  STORM_CORRIDOR_HALF_WIDTH,
  STORM_ENTRY_GATE_LATERAL,
  type StormLineState,
} from './airbusSimulator'

function entryState(lateralPosition: number, elapsedSeconds: number): StormLineState {
  const state = createStormLineState(1)
  return {
    ...state,
    elapsedSeconds,
    aircraft: { ...state.aircraft, lateralPosition },
  }
}

function coreState(lateralPosition: number): StormLineState {
  const state = createStormLineStateAtCheckpoint('stormCore')
  return {
    ...state,
    aircraft: { ...state.aircraft, lateralPosition },
  }
}

describe('deriveStormRouteGuidance', () => {
  it('returns null when the scenario is not flying', () => {
    const failed: StormLineState = { ...entryState(0, 10), phase: 'checkpointFailed' }
    const complete: StormLineState = { ...entryState(-0.7, 160), phase: 'complete' }
    expect(deriveStormRouteGuidance(failed)).toBeNull()
    expect(deriveStormRouteGuidance(complete)).toBeNull()
  })

  it('asks for a left bank early in weather entry', () => {
    const guidance = deriveStormRouteGuidance(entryState(0, 10))
    expect(guidance?.tone).toBe('action')
    expect(guidance?.message).toContain('Bank left')
  })

  it('counts down when weather entry is about to close', () => {
    const guidance = deriveStormRouteGuidance(entryState(-0.1, 35))
    expect(guidance?.tone).toBe('urgent')
    expect(guidance?.message).toContain('closes in 10s')
  })

  it('confirms the west lane once past the entry gate', () => {
    const guidance = deriveStormRouteGuidance(entryState(-0.5, 20))
    expect(guidance?.tone).toBe('settled')
    expect(guidance?.message).toContain('west lane')
  })

  it('warns before overshooting the west edge during entry', () => {
    const guidance = deriveStormRouteGuidance(entryState(-1.6, 20))
    expect(guidance?.tone).toBe('urgent')
    expect(guidance?.message).toContain('level the wings')
  })

  it('holds quietly at the corridor center', () => {
    const guidance = deriveStormRouteGuidance(coreState(STORM_CORRIDOR_CENTER))
    expect(guidance?.tone).toBe('hold')
    expect(guidance?.meter.position).toBeCloseTo(0.5, 2)
  })

  it('warns near the corridor edge and directs back toward center', () => {
    const nearRightEdge = deriveStormRouteGuidance(coreState(STORM_CORRIDOR_CENTER + 0.8))
    expect(nearRightEdge?.tone).toBe('action')
    expect(nearRightEdge?.message).toContain('ease back left')
    const nearLeftEdge = deriveStormRouteGuidance(coreState(STORM_CORRIDOR_CENTER - 0.8))
    expect(nearLeftEdge?.tone).toBe('action')
    expect(nearLeftEdge?.message).toContain('ease back right')
  })

  it('directs re-centering when outside the corridor', () => {
    const tooFarRight = deriveStormRouteGuidance(coreState(0.4))
    expect(tooFarRight?.tone).toBe('urgent')
    expect(tooFarRight?.message).toContain('bank left')
    const tooFarLeft = deriveStormRouteGuidance(coreState(-1.8))
    expect(tooFarLeft?.tone).toBe('urgent')
    expect(tooFarLeft?.message).toContain('bank right')
  })

  it('draws the entry band from the corridor west edge to the entry gate', () => {
    const guidance = deriveStormRouteGuidance(entryState(0, 10))
    const westEdge = STORM_CORRIDOR_CENTER - STORM_CORRIDOR_HALF_WIDTH
    const scale = (lateral: number) => (lateral - -2) / (0.6 - -2)
    expect(guidance?.meter.bandStart).toBeCloseTo(scale(westEdge), 5)
    expect(guidance?.meter.bandEnd).toBeCloseTo(scale(STORM_ENTRY_GATE_LATERAL), 5)
  })

  it('widens the band to the full corridor after entry', () => {
    const guidance = deriveStormRouteGuidance(coreState(STORM_CORRIDOR_CENTER))
    const scale = (lateral: number) => (lateral - -2) / (0.6 - -2)
    expect(guidance?.meter.bandStart).toBeCloseTo(
      scale(STORM_CORRIDOR_CENTER - STORM_CORRIDOR_HALF_WIDTH),
      5,
    )
    expect(guidance?.meter.bandEnd).toBeCloseTo(
      scale(STORM_CORRIDOR_CENTER + STORM_CORRIDOR_HALF_WIDTH),
      5,
    )
  })
})
