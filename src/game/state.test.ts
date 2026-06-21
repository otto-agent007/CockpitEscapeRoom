import { describe, expect, it } from 'vitest'
import { createInitialState, gameReducer, type GameState } from './state'

describe('gameReducer', () => {
  it('starts the player in the power puzzle', () => {
    const state = gameReducer(createInitialState('crew'), { type: 'START' })
    expect(state.phase).toBe('power')
  })

  it('resets only the current switch sequence after a wrong answer', () => {
    let state = gameReducer(createInitialState('captain'), { type: 'START' })
    state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId: 'battery' })
    state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId: 'cabin' })

    expect(state.phase).toBe('power')
    expect(state.switchSequence).toEqual([])
    expect(state.completedPuzzles).toEqual([])
  })

  it('advances to the route puzzle after the correct fictional sequence', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId: 'battery' })
    state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId: 'navigation' })
    state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId: 'cabin' })

    expect(state.phase).toBe('route')
    expect(state.completedPuzzles).toContain('power')
  })

  it('preserves restored power when the route answer is wrong', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    for (const switchId of ['battery', 'navigation', 'cabin'] as const) {
      state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId })
    }
    for (const code of ['LIT', 'LAX', 'AMS']) {
      state = gameReducer(state, { type: 'TOGGLE_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_ROUTE' })

    expect(state.phase).toBe('route')
    expect(state.completedPuzzles).toEqual(['power'])
    expect(state.routeSelections).toEqual([])
  })

  it('unlocks the red Model Y reward only after Captain Mode completion', () => {
    let state = gameReducer(createInitialState('captain'), { type: 'START' })
    for (const switchId of ['battery', 'navigation', 'cabin'] as const) {
      state = gameReducer(state, { type: 'ACTIVATE_SWITCH', switchId })
    }
    for (const code of ['BHM', 'LIT', 'JAN']) {
      state = gameReducer(state, { type: 'TOGGLE_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_ROUTE' })

    expect(state.phase).toBe('complete')
    expect(state.completedPuzzles).toEqual(['power', 'route'])
    expect(state.captainRewardUnlocked).toBe(true)
  })

  it('unlocks and exits the Mars Easter egg without losing completion', () => {
    let state: GameState = {
      ...createInitialState('captain'),
      phase: 'complete',
      completedPuzzles: ['power', 'route'],
      captainRewardUnlocked: true,
    }
    state = gameReducer(state, { type: 'UNLOCK_MARS' })
    expect(state.phase).toBe('mars')
    expect(state.marsUnlocked).toBe(true)

    state = gameReducer(state, { type: 'RETURN_TO_COMPLETE' })
    expect(state.phase).toBe('complete')
    expect(state.completedPuzzles).toEqual(['power', 'route'])
  })
})
