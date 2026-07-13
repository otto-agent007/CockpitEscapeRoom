import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, firstOfficerFlow } from './config'
import { createInitialState, gameReducer, isLockerMemoryAvailable, type GameState } from './state'

function enterLockerFromAirbus(completeIntro = true): GameState {
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
  if (completeIntro) state = gameReducer(state, { type: 'COMPLETE_LOCKER_INTRO' })
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
    expect(state.lockerIntroCompleted).toBe(false)

    state = gameReducer(state, { type: 'COMPLETE_LOCKER_INTRO' })
    expect(state.lockerIntroCompleted).toBe(true)
    expect(state.statusMessage).toBe('Begin with the pilot watch.')
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

  it('blocks locker memories until the intro settles, then unlocks only the watch', () => {
    let state = enterLockerFromAirbus(false)
    const beforeIntro = state

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    expect(state).toEqual(beforeIntro)

    state = gameReducer(state, { type: 'COMPLETE_LOCKER_INTRO' })
    const beforeOutOfOrderAttempt = state
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: 'Muñoz' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1000 hours' })
    expect(state).toEqual(beforeOutOfOrderAttempt)

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    expect(state.lockerCompleted).toEqual(['watch'])
    expect(isLockerMemoryAvailable(state, 'baseball')).toBe(true)
    expect(isLockerMemoryAvailable(state, 'chargingBull')).toBe(false)
    expect(state.lockerHatRevealed).toBe(false)
    expect(state.captainModeUnlocked).toBe(false)
    expect(state.statusMessage).toContain('manage jet lag')
  })

  it('advances through the baseball, Bull, and Wings sequence without allowing out-of-order actions', () => {
    let state = enterLockerFromAirbus()
    const beforeOutOfOrderAdvance = state
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1000 hours' })
    expect(state).toEqual(beforeOutOfOrderAdvance)

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: 'Anthony Munoz' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball'])
    expect(isLockerMemoryAvailable(state, 'chargingBull')).toBe(true)
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'chargingBull', response: 'Albert Einstein' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull'])
    expect(isLockerMemoryAvailable(state, 'wings')).toBe(true)

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1000 hours' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull', 'wings'])
    expect(state.lockerHatRevealed).toBe(true)
    expect(isLockerMemoryAvailable(state, 'wings')).toBe(true)
    expect(gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1000' }).lockerCompleted).toEqual(state.lockerCompleted)
  })

  it('keeps completed memories while repeated wrong answers advance a fair clue', () => {
    let state: GameState = { ...enterLockerFromAirbus(), lockerCompleted: ['wings'] }
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Brain fog' })
    expect(state.lockerCompleted).toEqual(['wings'])
    expect(state.statusMessage).toContain('crossing several time zones')

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Motion sickness' })
    expect(state.lockerCompleted).toEqual(['wings'])
    expect(state.lockerAttempts.watch).toBe(2)
    expect(state.statusMessage).toContain('body clock falling out of sync')
  })

  it.each(['jet lag', 'Jet Lag', 'JET-LAG'])('accepts watch answer %s', (answer) => {
    const state = gameReducer(enterLockerFromAirbus(), { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: answer })
    expect(state.lockerCompleted).toContain('watch')
  })

  it.each(['Anthony Muñoz', 'Anthony Munoz', 'Muñoz', 'Munoz'])('accepts baseball answer %s after the watch', (answer) => {
    let state = gameReducer(enterLockerFromAirbus(), { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: answer })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball'])
  })

  it('keeps the baseball milestone while repeated Bull misses reveal the progressive clue', () => {
    let state = gameReducer(enterLockerFromAirbus(), { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: 'Anthony Muñoz' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'chargingBull', response: 'Warren Buffett' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball'])
    expect(state.statusMessage).toContain('physicist often associated')
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'chargingBull', response: 'Benjamin Franklin' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball'])
    expect(state.lockerAttempts.chargingBull).toBe(2)
    expect(state.statusMessage).toContain('correct choice is the physicist')
  })

  it.each(['1000', '1,000', '1000 hour', '1000 hours', '1,000 hours'])(
    'accepts Wings experience answer %s after the Bull',
    (answer) => {
      let state = gameReducer(enterLockerFromAirbus(), { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
      state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: 'Anthony Muñoz' })
      state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'chargingBull', response: 'Albert Einstein' })
      state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: answer })

      expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull', 'wings'])
      expect(state.lockerHatRevealed).toBe(true)
    },
  )

  it('preserves prior memories while repeated Wings misses reveal the progressive clue', () => {
    let state = gameReducer(enterLockerFromAirbus(), { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: 'Jet lag' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'baseball', response: 'Anthony Muñoz' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'chargingBull', response: 'Albert Einstein' })
    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '500 hours' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull'])
    expect(state.statusMessage).toContain('Part 121 experience milestone')

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1500 hours' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull'])
    expect(state.lockerAttempts.wings).toBe(2)
    expect(state.statusMessage).toContain('four-digit hour milestone below the 1,500-hour ATP')
    expect(state.statusMessage).not.toContain('one thousand')
  })

  it('preserves captain progress and only completes reward after legacy sequence', () => {
    let state: GameState = {
      ...enterLockerFromAirbus(),
      lockerCompleted: ['watch', 'baseball', 'wings', 'chargingBull'],
      lockerHatRevealed: true,
    }
    state = gameReducer(state, { type: 'CLAIM_CAPTAIN_HAT' })
    state = gameReducer(state, { type: 'CONTINUE_TO_CAPTAIN' })

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
