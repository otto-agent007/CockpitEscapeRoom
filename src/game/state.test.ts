import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, firstOfficerFlow, lockerFlow } from './config'
import { createInitialState, gameReducer } from './state'

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
  })

  it('enters locker flow only after all Airbus tasks are correct', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    for (const control of firstOfficerFlow.controlIds) {
      state = gameReducer(state, {
        type: 'ASSIGN_AIRBUS_CARD',
        control,
        card: firstOfficerFlow.controlMatch[control],
      })
    }
    state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: '1500' })
    state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })

    expect(state.phase).toBe('locker')
    expect(state.completedPuzzles).toEqual(['firstOfficer'])
    expect(state.statusMessage).toContain('Locker access granted')
  })

  it('reveals captain mode only after locker requirements are complete', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    for (const control of firstOfficerFlow.controlIds) {
      state = gameReducer(state, {
        type: 'ASSIGN_AIRBUS_CARD',
        control,
        card: firstOfficerFlow.controlMatch[control],
      })
    }
    state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: '1500' })
    state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })

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
    let state = gameReducer(createInitialState(), { type: 'START' })
    for (const control of firstOfficerFlow.controlIds) {
      state = gameReducer(state, {
        type: 'ASSIGN_AIRBUS_CARD',
        control,
        card: firstOfficerFlow.controlMatch[control],
      })
    }
    state = gameReducer(state, { type: 'SET_AIRBUS_CLOCK_ANSWER', value: '1500' })
    state = gameReducer(state, { type: 'SUBMIT_AIRBUS_CLOCK' })
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
