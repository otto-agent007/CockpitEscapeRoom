import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, firstOfficerFlow, lockerFlow } from './config'
import { createInitialState, gameReducer, type GameState } from './state'

function enterLockerFromAirbus(): GameState {
  let state = gameReducer(createInitialState(), { type: 'START' })
  for (const control of firstOfficerFlow.controlIds) {
    state = gameReducer(state, {
      type: 'ASSIGN_AIRBUS_CARD',
      control,
      card: firstOfficerFlow.controlMatch[control],
    })
  }
  state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: firstOfficerFlow.clockAnswer })
  state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })
  state = gameReducer(state, { type: 'CONTINUE_TO_LOCKER' })
  return state
}

function completeAirbusLabels(): GameState {
  let state = gameReducer(createInitialState(), { type: 'START' })
  for (const control of firstOfficerFlow.controlIds) {
    state = gameReducer(state, {
      type: 'ASSIGN_AIRBUS_CARD',
      control,
      card: firstOfficerFlow.controlMatch[control],
    })
  }
  return state
}

describe('gameReducer', () => {
  it('advances to Airbus mode after briefing start', () => {
    const state = gameReducer(createInitialState(), { type: 'START' })
    expect(state.phase).toBe('airbus')
    expect(state.statusMessage).toContain('Match the Airbus labels')
  })

  it('keeps wrong Airbus labels recoverable without losing phase', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'thrust', card: 'THRUST' })

    expect(state.phase).toBe('airbus')
    expect(state.airbusAssignments.sidestick).toBe('RADIO')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toBe('That card does not match this cockpit control. Try it somewhere else.')
  })

  it('moves an Airbus card between targets during retry', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'radio', card: 'RADIO' })

    expect(state.airbusAssignments.sidestick).toBeNull()
    expect(state.airbusAssignments.radio).toBe('RADIO')
    expect(state.phase).toBe('airbus')
  })

  it('gives immediate green feedback for a correct Airbus label', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'SIDESTICK' })

    expect(state.airbusAssignments.sidestick).toBe('SIDESTICK')
    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toContain('sidestick')
  })

  it('keeps legacy decoy assignments from completing Airbus mode', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_DECOY_CARD', decoy: 'sideConsole', card: 'CLOCK' })

    expect(state.phase).toBe('airbus')
    expect(state.airbusDecoyAssignments.sideConsole).toBe('CLOCK')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toContain('five-label check')
  })

  it('clears obsolete clock answers after an Airbus placement changes', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: '1500' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })

    expect(state.airbusClockAnswer).toBe('')
    expect(state.phase).toBe('airbus')
  })

  it('shows the Airline Transport Pilot question after all Airbus labels are correct', () => {
    const state = completeAirbusLabels()

    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toContain('Airline Transport Pilot question')
  })

  it('celebrates qualification before the player continues to the locker', () => {
    let state = completeAirbusLabels()

    state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })
    expect(state.phase).toBe('airbus')
    expect(state.statusMessage).toContain('Airline Transport Pilot answer is not yet recognized')

    state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: firstOfficerFlow.clockAnswer })
    state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })

    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual(['firstOfficer'])
    expect(state.statusMessage).toContain('milestone recognized')

    state = gameReducer(state, { type: 'CONTINUE_TO_LOCKER' })

    expect(state.phase).toBe('locker')
    expect(state.statusMessage).toContain('Locker access granted')
  })

  it.each(['1500', '1,500', '1500 hour', '1500 hours'])(
    'accepts the friendly flight-hour answer %s',
    (answer) => {
      let state = completeAirbusLabels()
      state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: answer })
      state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })

      expect(state.phase).toBe('airbus')
      expect(state.completedPuzzles).toContain('firstOfficer')
    },
  )

  it('reveals captain mode only after locker requirements are complete', () => {
    let state = enterLockerFromAirbus()

    for (const objectId of lockerFlow.requiredInteractionIds) {
      state = gameReducer(state, {
        type: 'COMPLETE_LOCKER_OBJECT',
        objectId,
        response: lockerFlow.interactions[objectId]?.answer || 'ok',
      })
    }

    expect(state.phase).toBe('locker')
    expect(state.lockerHatRevealed).toBe(true)

    state = gameReducer(state, { type: 'REVEAL_CAPTAIN_HAT' })
    expect(state.phase).toBe('captain')
    expect(state.completedPuzzles).toContain('locker')
  })

  it('preserves captain progress and only completes reward after legacy sequence', () => {
    let state = enterLockerFromAirbus()
    for (const objectId of lockerFlow.requiredInteractionIds) {
      state = gameReducer(state, {
        type: 'COMPLETE_LOCKER_OBJECT',
        objectId,
        response: lockerFlow.interactions[objectId]?.answer || 'ok',
      })
    }
    state = gameReducer(state, { type: 'REVEAL_CAPTAIN_HAT' })

    for (const switchId of dc9LegacyFlow.checklistOrder) {
      state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId })
    }
    expect(state.phase).toBe('captain')
    for (const code of ['LIT', 'JAN', 'BHM']) {
      state = gameReducer(state, { type: 'TOGGLE_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_ROUTE' })

    expect(state.phase).toBe('reward')
    expect(state.completedPuzzles).toContain('captain')
    expect(state.captainRewardUnlocked).toBe(true)
  })

  it('returns from Mars without discarding completion', () => {
    let state = createInitialState()
    state = { ...state, phase: 'reward', completedPuzzles: ['firstOfficer', 'locker', 'captain'], captainRewardUnlocked: true }
    state = gameReducer(state, { type: 'UNLOCK_MARS' })

    expect(state.phase).toBe('mars')
    expect(state.marsUnlocked).toBe(true)

    state = gameReducer(state, { type: 'RETURN_TO_REWARD' })
    expect(state.phase).toBe('reward')
    expect(state.completedPuzzles).toEqual(['firstOfficer', 'locker', 'captain'])
  })
})
