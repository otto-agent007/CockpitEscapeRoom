import { describe, expect, it } from 'vitest'
import { deriveEngineOutRouteGuidance, deriveStormRouteGuidance } from './airbusRouteGuidance'
import {
  createEngineOutStateAtCheckpoint,
  type EngineOutCheckpoint,
  type EngineOutState,
} from './airbusEngineOut'
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

  it('labels the storm meter west and east', () => {
    const guidance = deriveStormRouteGuidance(entryState(0, 10))
    expect(guidance?.meter.leftLabel).toBe('W')
    expect(guidance?.meter.rightLabel).toBe('E')
  })
})

function engineState(
  checkpoint: EngineOutCheckpoint,
  aircraft: Partial<EngineOutState['aircraft']>,
): EngineOutState {
  const state = createEngineOutStateAtCheckpoint(checkpoint)
  return {
    ...state,
    aircraft: { ...state.aircraft, ...aircraft },
  }
}

describe('deriveEngineOutRouteGuidance', () => {
  it('returns null when the exercise is not flying', () => {
    const failed: EngineOutState = {
      ...engineState('stabilization', {}),
      phase: 'checkpointFailed',
    }
    expect(deriveEngineOutRouteGuidance(failed)).toBeNull()
  })

  it('asks for acknowledgement while the drift is still small', () => {
    const guidance = deriveEngineOutRouteGuidance(engineState('recognition', { directionalError: -0.05 }))
    expect(guidance?.tone).toBe('settled')
    expect(guidance?.message).toContain('upper ECAM')
  })

  it('names the left pull and the right-balance correction as the reduction bites', () => {
    const guidance = deriveEngineOutRouteGuidance(engineState('recognition', { directionalError: -0.3 }))
    expect(guidance?.tone).toBe('action')
    expect(guidance?.message).toContain('Balance right')
    expect(guidance?.meter.leftLabel).toBe('L')
    expect(guidance?.meter.position).toBeLessThan(0.5)
  })

  it('escalates at the directional limit in both directions', () => {
    const leftLimit = deriveEngineOutRouteGuidance(engineState('stabilization', { directionalError: -0.5 }))
    expect(leftLimit?.tone).toBe('urgent')
    expect(leftLimit?.message).toContain('more right balance')
    const rightLimit = deriveEngineOutRouteGuidance(engineState('stabilization', { directionalError: 0.5 }))
    expect(rightLimit?.tone).toBe('urgent')
    expect(rightLimit?.message).toContain('ease it off')
  })

  it('holds quietly when balanced in stabilization', () => {
    const guidance = deriveEngineOutRouteGuidance(engineState('stabilization', { directionalError: -0.1 }))
    expect(guidance?.tone).toBe('hold')
    expect(guidance?.meter.bandStart).toBeCloseTo((1 - 0.45) / 2, 5)
    expect(guidance?.meter.bandEnd).toBeCloseTo((1 + 0.45) / 2, 5)
  })

  it('directs the diversion turn to the right of level', () => {
    const leftBank = deriveEngineOutRouteGuidance(engineState('diversion', { bank: -8 }))
    expect(leftBank?.tone).toBe('urgent')
    expect(leftBank?.message).toContain('SAFE RETURN is to the right')
    const shallow = deriveEngineOutRouteGuidance(engineState('diversion', { bank: 3 }))
    expect(shallow?.tone).toBe('action')
    expect(shallow?.message).toContain('gentle right bank')
    const onArc = deriveEngineOutRouteGuidance(engineState('diversion', { bank: 18 }))
    expect(onArc?.tone).toBe('settled')
    expect(onArc?.message).toContain('hold this bank')
    const steep = deriveEngineOutRouteGuidance(engineState('diversion', { bank: 27 }))
    expect(steep?.tone).toBe('urgent')
    expect(steep?.message).toContain('ease back')
  })

  it('prioritizes a building drift over bank coaching during the diversion', () => {
    const guidance = deriveEngineOutRouteGuidance(
      engineState('diversion', { bank: 18, directionalError: -0.4 }),
    )
    expect(guidance?.tone).toBe('urgent')
    expect(guidance?.message).toContain('right balance while you turn')
  })

  it('maps the diversion bank band onto the meter', () => {
    const guidance = deriveEngineOutRouteGuidance(engineState('diversion', { bank: 16 }))
    expect(guidance?.meter.bandStart).toBeCloseTo((8 + 30) / 60, 5)
    expect(guidance?.meter.bandEnd).toBeCloseTo((24 + 30) / 60, 5)
    expect(guidance?.meter.position).toBeCloseTo((16 + 30) / 60, 5)
  })
})
