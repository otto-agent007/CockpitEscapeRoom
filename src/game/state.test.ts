import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, airbusCaptainFlow, lockerFlow } from './config'
import { createInitialState, gameReducer, isLockerMemoryAvailable, type GameState } from './state'

describe('schema-v8 canonical state', () => {
  it('starts with seat-role semantic fields and no schema-v6 compatibility fields', () => {
    const state = createInitialState() as unknown as Record<string, unknown>
    const dc9 = state.dc9 as Record<string, unknown>

    expect(state.schemaVersion).toBe(8)
    expect(state.phase).toBe('briefing')
    expect(state.airbusQualificationAnswer).toBe('')
    expect(state.airbusCaptainModeUnlocked).toBe(false)
    expect(state.rewardUnlocked).toBe(false)
    expect(dc9.secureAttempts).toBe(0)
    expect(state).not.toHaveProperty('airbusClockAnswer')
    expect(state).not.toHaveProperty('captainModeUnlocked')
    expect(state).not.toHaveProperty('captainRouteVerified')
    expect(state).not.toHaveProperty('dc9SecureSequence')
    expect(state).not.toHaveProperty('captainAttempts')
    expect(state).not.toHaveProperty('routeSelections')
    expect(state).not.toHaveProperty('captainRewardUnlocked')
  })

  it('starts the Final Flight Log in the canonical dc9 phase from the right seat', () => {
    const state = gameReducer(createInitialState(), { type: 'START' }) as unknown as Record<string, unknown>

    expect(state.phase).toBe('dc9')
    expect(state.statusMessage).toContain('first-officer yoke')
  })
})

function enterLockerFromAirbus(completeIntro = true): GameState {
  let state: GameState = { ...createInitialState(), phase: 'locker' }
  if (completeIntro) state = gameReducer(state, { type: 'COMPLETE_LOCKER_INTRO' })
  return state
}

function completeAirbusLabels(): GameState {
  let state: GameState = { ...createInitialState(), phase: 'airbus' }
  for (const control of airbusCaptainFlow.controlIds) {
    state = gameReducer(state, {
      type: 'ASSIGN_AIRBUS_CARD',
      control,
      card: airbusCaptainFlow.controlMatch[control],
    })
  }
  return state
}

function enterDc9HomeOperations(): GameState {
  let state = gameReducer(createInitialState(), { type: 'START' })
  state = gameReducer(state, { type: 'OPEN_DC9_ROUTE_RECORD' })
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
  }
  return gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })
}

describe('DC-9 Final Flight Log configuration', () => {
  it('uses the approved routes, hint ladder, recognition record, and key engravings', () => {
    expect(dc9LegacyFlow.routePuzzleAnswers).toEqual(['DTW', 'MSP', 'STL'])
    expect(dc9LegacyFlow.routeHints).toEqual([
      'Two were Northwest hubs and one was a familiar Midwestern stop.',
      'Think Michigan, Minnesota, and Missouri.',
    ])
    expect(dc9LegacyFlow.homeOperationsPages.join(' ')).toContain('Momma Cheryl')
    expect(dc9LegacyFlow.homeOperationsPages.join(' ')).not.toMatch(/quiz|answer|correct/i)
    expect(dc9LegacyFlow.keyEngravings).toEqual({
      front: "THE CAPTAIN'S KEY",
      reverse: 'POP T & MOMMA CHERYL',
    })
    expect(dc9LegacyFlow.atpQuestion).toContain('Airline Transport Pilot')
    expect(airbusCaptainFlow).not.toHaveProperty('clockQuestion')
  })
})

describe('DC-9 Final Flight Log reducer', () => {
  it('starts in the DC-9 and advances from the route record to Home Operations', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    expect(state.phase).toBe('dc9')
    expect(state.dc9.stage).toBe('intro')

    state = gameReducer(state, { type: 'OPEN_DC9_ROUTE_RECORD' })
    expect(state.dc9.stage).toBe('routeRecord')

    for (const code of ['DTW', 'MSP', 'STL']) {
      state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })

    expect(state.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
    expect(state.dc9.stage).toBe('homeOperations')
  })

  it('stamps familiar routes permanently while a wrong submission advances support', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    state = gameReducer(state, { type: 'OPEN_DC9_ROUTE_RECORD' })
    for (const code of ['DTW', 'BTR', 'TYS']) {
      state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })

    expect(state.dc9.routeAttempts).toBe(1)
    expect(state.dc9.routeCompleted).toEqual(['DTW'])
    expect(state.dc9.routeSelections).toEqual(['DTW'])
    expect(state.dc9.stage).toBe('routeRecord')
  })

  it('completes the recognition record before beginning a forgiving shutdown', () => {
    let state = enterDc9HomeOperations()
    state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
    state = gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })

    expect(state.dc9.homeOperationsCompleted).toBe(true)
    expect(state.dc9.stage).toBe('shutdown')

    state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'battery' })
    expect(state.dc9.secureSequence).toEqual([])
    expect(state.dc9.secureAttempts).toBe(1)

    state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'apuBuses' })
    expect(state.dc9.secureSequence).toEqual(['apuBuses'])

    state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'battery' })
    expect(state.dc9.secureSequence).toEqual(['apuBuses'])

    state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'apuMaster' })
    state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId: 'battery' })
    expect(state.dc9.secureSequence).toEqual(['apuBuses', 'apuMaster', 'battery'])
    expect(state.dc9.stage).toBe('qualification')

    state = gameReducer(state, { type: 'SUBMIT_DC9_ATP_QUALIFICATION' })
    expect(state.dc9.stage).toBe('qualification')
    expect(state.statusMessage).toContain('not yet recognized')
    expect(state.dc9.secureSequence).toEqual(['apuBuses', 'apuMaster', 'battery'])

    state = gameReducer(state, { type: 'SET_ATP_QUALIFICATION_ANSWER', value: '1500 hours' })
    state = gameReducer(state, { type: 'SUBMIT_DC9_ATP_QUALIFICATION' })
    expect(state.dc9.stage).toBe('keyReveal')
    expect(state.statusMessage).toContain('milestone recognized')
  })

  it('claims The Captain\'s Key and continues from the locker to Airbus', () => {
    let state = enterDc9HomeOperations()
    state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
    state = gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })
    for (const controlId of dc9LegacyFlow.secureSequence) {
      state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId })
    }
    state = gameReducer(state, { type: 'SET_ATP_QUALIFICATION_ANSWER', value: '1,500' })
    state = gameReducer(state, { type: 'SUBMIT_DC9_ATP_QUALIFICATION' })
    state = gameReducer(state, { type: 'OPEN_CAPTAINS_KEY' })
    expect(state.dc9.keyRevealed).toBe(true)

    state = gameReducer(state, { type: 'CLAIM_CAPTAINS_KEY' })
    expect(state.dc9.keyClaimed).toBe(true)
    expect(state.dc9.stage).toBe('complete')
    expect(state.phase).toBe('locker')
    expect(state.completedPuzzles).toContain('dc9')

    state = gameReducer(state, { type: 'COMPLETE_LOCKER_INTRO' })
    state = {
      ...state,
      lockerCompleted: [...lockerFlow.memoryIds],
      lockerHatRevealed: true,
    }
    state = gameReducer(state, { type: 'CLAIM_CAPTAIN_HAT' })
    state = gameReducer(state, { type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' })
    expect(state.phase).toBe('airbus')
  })

  it('preserves migrated Airbus completion when leaving the locker', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: 'locker',
      completedPuzzles: ['dc9', 'locker', 'airbus'],
      rewardUnlocked: false,
    }

    const next = gameReducer(state, { type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' })

    expect(next.phase).toBe('reward')
    expect(next.rewardUnlocked).toBe(true)
    expect(next.statusMessage).toContain('already complete')
  })

  it('completes Airbus after the five correct labels before the reward handoff', () => {
    let state: GameState = {
      ...createInitialState(),
      phase: 'airbus',
      dc9: {
        ...createInitialState().dc9,
        stage: 'complete',
        routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
        routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
        homePage: 4,
        homeOperationsCompleted: true,
        secureSequence: [...dc9LegacyFlow.secureSequence],
        keyRevealed: true,
        keyClaimed: true,
      },
      completedPuzzles: ['dc9', 'locker'],
    }
    for (const control of airbusCaptainFlow.controlIds) {
      state = gameReducer(state, {
        type: 'ASSIGN_AIRBUS_CARD',
        control,
        card: airbusCaptainFlow.controlMatch[control],
      })
    }
    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual(['dc9', 'locker', 'airbus'])
    expect(state.rewardUnlocked).toBe(false)
  })

  it('continues from the existing Airbus completion celebration to the reward', () => {
    const state: GameState = {
      ...createInitialState(),
      phase: 'airbus',
      completedPuzzles: ['dc9', 'locker', 'airbus'],
    }

    const next = gameReducer(state, { type: 'CONTINUE_FROM_AIRBUS_TO_REWARD' })

    expect(next.phase).toBe('reward')
    expect(next.rewardUnlocked).toBe(true)
  })
})

describe('gameReducer', () => {
  it('advances to the DC-9 opening after briefing start', () => {
    const state = gameReducer(createInitialState(), { type: 'START' })
    expect(state.phase).toBe('dc9')
    expect(state.statusMessage).toContain('route strip')
  })

  it('keeps wrong Airbus labels recoverable without losing phase', () => {
    let state: GameState = { ...createInitialState(), phase: 'airbus' }
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'thrust', card: 'THRUST' })

    expect(state.phase).toBe('airbus')
    expect(state.airbusAssignments.sidestick).toBe('RADIO')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toBe('That card does not match this cockpit control. Try it somewhere else.')
  })

  it('moves an Airbus card between targets during retry', () => {
    let state: GameState = { ...createInitialState(), phase: 'airbus' }
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'radio', card: 'RADIO' })

    expect(state.airbusAssignments.sidestick).toBeNull()
    expect(state.airbusAssignments.radio).toBe('RADIO')
    expect(state.phase).toBe('airbus')
  })

  it('gives immediate green feedback for a correct Airbus label', () => {
    let state: GameState = { ...createInitialState(), phase: 'airbus' }
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'SIDESTICK' })

    expect(state.airbusAssignments.sidestick).toBe('SIDESTICK')
    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toContain('sidestick')
  })

  it('keeps legacy decoy assignments from completing Airbus mode', () => {
    let state: GameState = { ...createInitialState(), phase: 'airbus' }
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_DECOY_CARD', decoy: 'sideConsole', card: 'CLOCK' })

    expect(state.phase).toBe('airbus')
    expect(state.airbusDecoyAssignments.sideConsole).toBe('CLOCK')
    expect(state.completedPuzzles).toEqual([])
    expect(state.statusMessage).toContain('five-label check')
  })

  it('does not disturb the DC-9 ATP answer when an Airbus placement changes', () => {
    let state: GameState = { ...createInitialState(), phase: 'airbus', airbusQualificationAnswer: '1500' }
    state = gameReducer(state, { type: 'ASSIGN_AIRBUS_CARD', control: 'sidestick', card: 'RADIO' })

    expect(state.airbusQualificationAnswer).toBe('1500')
    expect(state.phase).toBe('airbus')
  })

  it('completes Airbus immediately after all five labels are correct', () => {
    const state = completeAirbusLabels()

    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual(['airbus'])
    expect(state.statusMessage).toContain('POP T CAPTAIN MODE COMPLETE')
    expect(state.statusMessage).toContain('Captain knowledge logged')
  })

  it.each(['1500', '1,500', '1500 hour', '1500 hours'])('accepts the DC-9 ATP answer %s', (answer) => {
    let state = enterDc9HomeOperations()
    state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
    state = gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })
    for (const controlId of dc9LegacyFlow.secureSequence) {
      state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId })
    }
    state = gameReducer(state, { type: 'SET_ATP_QUALIFICATION_ANSWER', value: answer })
    state = gameReducer(state, { type: 'SUBMIT_DC9_ATP_QUALIFICATION' })

    expect(state.phase).toBe('dc9')
    expect(state.dc9.stage).toBe('keyReveal')
  })

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
    expect(state.airbusCaptainModeUnlocked).toBe(false)
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
    expect(state.statusMessage).toBe('Think in flight hours: it’s a round-number milestone between 500 and 1,500.')

    state = gameReducer(state, { type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'wings', response: '1500 hours' })
    expect(state.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull'])
    expect(state.lockerAttempts.wings).toBe(2)
    expect(state.statusMessage).toBe('It’s a four-digit milestone below the 1,500-hour ATP requirement.')
  })

  it('returns from Mars without discarding completion', () => {
    let state = createInitialState()
    state = { ...state, phase: 'reward', completedPuzzles: ['airbus', 'locker', 'dc9'], rewardUnlocked: true }
    state = gameReducer(state, { type: 'UNLOCK_MARS' })

    expect(state.phase).toBe('mars')
    expect(state.marsUnlocked).toBe(true)

    state = gameReducer(state, { type: 'RETURN_TO_REWARD' })
    expect(state.phase).toBe('reward')
    expect(state.completedPuzzles).toEqual(['airbus', 'locker', 'dc9'])
  })
})
