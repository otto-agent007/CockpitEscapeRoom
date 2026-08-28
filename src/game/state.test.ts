import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, airbusCaptainFlow, lockerFlow } from './config'
import { createInitialState, gameReducer, isLockerMemoryAvailable, type GameState } from './state'
import { DC9_INSTRUMENT_SCAN_ORDER } from './dc9InstrumentScan'
import { NEUTRAL_DC9_CONTROLS, type Dc9ControlState } from './dc9Input'

describe('schema-v14 canonical state', () => {
  it('starts with seat-role semantic fields and no schema-v6 compatibility fields', () => {
    const state = createInitialState() as unknown as Record<string, unknown>
    const dc9 = state.dc9 as Record<string, unknown>

    expect(state.schemaVersion).toBe(14)
    expect(state.phase).toBe('briefing')
    expect(state.airbusQualificationAnswer).toBe('')
    expect(state.airbusCaptainModeUnlocked).toBe(false)
    expect(state.airbusSimulator).toEqual({
      familiarization: 'unseen',
      cameraPhase: 'familiarization',
      location: 'qualification',
      stormLine: {
        status: 'not_started',
        checkpoint: 'stormEntry',
        attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
        bestTraits: [],
      },
      engineOut: {
        status: 'locked',
        checkpoint: 'recognition',
        attempts: { recognition: 0, stabilization: 0, diversion: 0 },
        bestTraits: [],
      },
      workload: {
        scanRange: 'near',
        selectedWeatherSector: null,
        selectedSafeReturnSide: null,
        completedTasks: [],
        attempts: {
          stormScanRange: 0,
          stormGapSelection: 0,
          engineEventAcknowledgement: 0,
          engineSafeReturnSelection: 0,
        },
      },
    })
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
    expect(state.statusMessage).toContain('right-seat control')
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

function completeStormLine(): GameState {
  let state = completeAirbusLabels()
  state = gameReducer(state, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })
  state = gameReducer(state, { type: 'START_AIRBUS_STORM_LINE' })
  state = gameReducer(state, {
    type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
    action: { type: 'cycleScanRange' },
  })
  state = {
    ...state,
    airbusSimulator: {
      ...state.airbusSimulator,
      stormLine: {
        ...state.airbusSimulator.stormLine,
        checkpoint: 'stormCore',
      },
    },
  }
  state = gameReducer(state, {
    type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
    action: { type: 'selectWeatherSector', sector: 'west' },
  })
  return gameReducer(state, {
    type: 'COMPLETE_AIRBUS_STORM_LINE',
    traits: ['weatherJudgment', 'energyManagement'],
  })
}

/** Walk every right-seat control to its stops, the way the chapter now opens. */
function completeDc9ControlCheck(state: GameState): GameState {
  const sweep: Dc9ControlState[] = [
    { ...NEUTRAL_DC9_CONTROLS, pitch: 1 },
    { ...NEUTRAL_DC9_CONTROLS, pitch: -1 },
    { ...NEUTRAL_DC9_CONTROLS, roll: -1 },
    { ...NEUTRAL_DC9_CONTROLS, roll: 1 },
    { ...NEUTRAL_DC9_CONTROLS, rudder: -1 },
    { ...NEUTRAL_DC9_CONTROLS, rudder: 1 },
    { ...NEUTRAL_DC9_CONTROLS, thrust: 1 },
    { ...NEUTRAL_DC9_CONTROLS, thrust: 0 },
  ]
  return sweep.reduce(
    (current, controls) => gameReducer(current, { type: 'APPLY_DC9_CONTROL_CHECK', controls }),
    state,
  )
}

function completeDc9InstrumentScan(state: GameState): GameState {
  return DC9_INSTRUMENT_SCAN_ORDER.reduce(
    (current, instrument) => gameReducer(current, { type: 'IDENTIFY_DC9_INSTRUMENT', instrument }),
    state,
  )
}

function enterDc9RouteRecord(): GameState {
  const started = completeDc9ControlCheck(gameReducer(createInitialState(), { type: 'START' }))
  return gameReducer(started, { type: 'OPEN_DC9_ROUTE_RECORD' })
}

function enterDc9HomeOperations(): GameState {
  let state = enterDc9RouteRecord()
  for (const code of dc9LegacyFlow.routePuzzleAnswers) {
    state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
  }
  state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })
  state = gameReducer(state, {
    type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
    checkpoint: 'initialClimb',
  })
  return gameReducer(state, { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' })
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
    expect(dc9LegacyFlow.homeOperationsPages[1]).toBe(
      'The home crew — Momma Cheryl kept three kids fed, prepared, and on schedule while travel carried Pop T away and home again.',
    )
    expect(dc9LegacyFlow.homeOperationsPages[3]).toBe(
      'The invisible record — School-clothes shopping, changing schedules, household needs, and unexpected problems were handled.',
    )
    expect(dc9LegacyFlow.keyEngravings).toEqual({
      front: "THE CAPTAIN'S KEY",
      reverse: 'POP T & MOMMA CHERYL',
    })
    expect(dc9LegacyFlow.atpQuestion).toContain('Airline Transport Pilot')
    expect(airbusCaptainFlow).not.toHaveProperty('clockQuestion')
  })
})

describe('DC-9 Final Flight Log reducer', () => {
  it('starts in the DC-9 and advances from the route record through Memphis departure to Home Operations', () => {
    let state = gameReducer(createInitialState(), { type: 'START' })
    expect(state.phase).toBe('dc9')
    expect(state.dc9.stage).toBe('controlCheck')

    state = completeDc9ControlCheck(state)
    expect(state.dc9.stage).toBe('intro')

    state = gameReducer(state, { type: 'OPEN_DC9_ROUTE_RECORD' })
    expect(state.dc9.stage).toBe('routeRecord')

    for (const code of ['DTW', 'MSP', 'STL']) {
      state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })

    expect(state.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
    expect(state.dc9.stage).toBe('memphisDeparture')

    state = gameReducer(state, {
      type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
      checkpoint: 'initialClimb',
    })
    state = gameReducer(state, { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' })
    expect(state.dc9.departure.completed).toBe(true)
    expect(state.dc9.stage).toBe('homeOperations')
  })

  it('guards Memphis departure actions by stage and checkpoint', () => {
    const routeRecord = enterDc9RouteRecord()
    expect(gameReducer(routeRecord, {
      type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
      checkpoint: 'initialClimb',
    })).toBe(routeRecord)

    let departure = routeRecord
    for (const code of dc9LegacyFlow.routePuzzleAnswers) {
      departure = gameReducer(departure, { type: 'TOGGLE_DC9_ROUTE', code })
    }
    departure = gameReducer(departure, { type: 'SUBMIT_DC9_ROUTES' })
    expect(gameReducer(departure, {
      type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
      checkpoint: 'complete',
    })).toBe(departure)
    expect(gameReducer(departure, { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' })).toBe(departure)
  })

  it('records only the active Memphis departure beat and restores without losing routes', () => {
    let state = enterDc9RouteRecord()
    for (const code of dc9LegacyFlow.routePuzzleAnswers) {
      state = gameReducer(state, { type: 'TOGGLE_DC9_ROUTE', code })
    }
    state = gameReducer(state, { type: 'SUBMIT_DC9_ROUTES' })
    state = gameReducer(state, {
      type: 'SAVE_DC9_DEPARTURE_CHECKPOINT',
      checkpoint: 'taxiTurn',
    })
    const beforeWrongBeat = state
    expect(gameReducer(state, {
      type: 'RECORD_DC9_DEPARTURE_MISTAKE',
      beat: 'rampRelease',
    })).toBe(beforeWrongBeat)

    state = gameReducer(state, {
      type: 'RECORD_DC9_DEPARTURE_MISTAKE',
      beat: 'taxi',
    })
    expect(state.dc9.departure.attempts).toEqual({ taxi: 1 })
    const routes = [...state.dc9.routeCompleted]
    state = gameReducer(state, { type: 'RESTORE_DC9_DEPARTURE_CHECKPOINT' })
    expect(state.dc9.routeCompleted).toEqual(routes)
    expect(state.dc9.departure.checkpoint).toBe('taxiTurn')
  })

  it('resets Memphis departure to the ramp start', () => {
    const initial = createInitialState()
    const reset = gameReducer({
      ...initial,
      phase: 'dc9',
      dc9: {
        ...initial.dc9,
        stage: 'memphisDeparture',
        departure: {
          checkpoint: 'initialClimb',
          completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation'],
          attempts: { taxi: 2 },
          hintLevel: 2,
          completed: false,
        },
      },
    }, { type: 'RESET' })

    expect(reset.dc9.departure).toEqual({
      checkpoint: 'rampStart',
      completedBeats: [],
      attempts: {},
      hintLevel: 0,
      completed: false,
    })
  })

  it('stamps familiar routes permanently while a wrong submission advances support', () => {
    let state = enterDc9RouteRecord()
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
    expect(state.dc9.stage).toBe('instrumentScan')

    state = completeDc9InstrumentScan(state)
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
    state = completeDc9InstrumentScan(state)
    for (const controlId of dc9LegacyFlow.secureSequence) {
      state = gameReducer(state, { type: 'ACTIVATE_DC9_CONTROL', controlId })
    }
    state = gameReducer(state, { type: 'SET_ATP_QUALIFICATION_ANSWER', value: '1,500' })
    state = gameReducer(state, { type: 'SUBMIT_DC9_ATP_QUALIFICATION' })
    state = gameReducer(state, { type: 'OPEN_CAPTAINS_KEY' })
    expect(state.dc9.keyRevealed).toBe(true)
    expect(state.statusMessage).toBe("The Captain's Key is ready. Take it to open the Captain's Locker.")
    expect(state.statusMessage).not.toContain('Momma Cheryl')

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

  it('opens Storm Line after the five correct labels without unlocking the reward', () => {
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
    expect(state.completedPuzzles).toEqual(['dc9', 'locker'])
    expect(state.airbusSimulator.familiarization).toBe('completed')
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
    expect(state.dc9.stage).toBe('controlCheck')
    expect(state.statusMessage).toContain('right-seat control')
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

  it('opens Storm Line without completing Airbus after all five labels are correct', () => {
    const state = completeAirbusLabels()

    expect(state.phase).toBe('airbus')
    expect(state.completedPuzzles).toEqual([])
    expect(state.airbusSimulator.familiarization).toBe('completed')
    expect(state.airbusSimulator.cameraPhase).toBe('qualified')
    expect(state.airbusSimulator.stormLine.status).toBe('not_started')
    expect(state.statusMessage).toContain('Storm Line simulator ready')
  })

  it('does not begin the Storm Line transition before every label is correct', () => {
    const initial = { ...createInitialState(), phase: 'airbus' as const }
    const next = gameReducer(initial, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })

    expect(next).toBe(initial)
  })

  it('does not begin Engine-Out Handling before Storm Line is complete', () => {
    const initial = completeAirbusLabels()
    const next = gameReducer(initial, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })

    expect(next).toBe(initial)
  })

  it('selects only scenarios that are unlocked from the hub', () => {
    const qualified = completeAirbusLabels()
    const lockedSelection = gameReducer(qualified, {
      type: 'SELECT_AIRBUS_SCENARIO',
      scenario: 'engineOut',
    })
    const stormSelection = gameReducer(qualified, {
      type: 'SELECT_AIRBUS_SCENARIO',
      scenario: 'stormLine',
    })

    expect(lockedSelection).toBe(qualified)
    expect(stormSelection.airbusSimulator.location).toBe('stormLine')
  })

  it('returns a selected scenario briefing to the hub without erasing progress', () => {
    let state = completeAirbusLabels()
    state = gameReducer(state, { type: 'SELECT_AIRBUS_SCENARIO', scenario: 'stormLine' })
    const next = gameReducer(state, { type: 'RETURN_TO_AIRBUS_SCENARIO_HUB' })

    expect(next.airbusSimulator.location).toBe('hub')
    expect(next.airbusSimulator.stormLine.status).toBe('not_started')
    expect(next.airbusSimulator.engineOut.status).toBe('locked')
  })

  it('moves from qualification through the camera transition into Storm Flight View', () => {
    let state = completeAirbusLabels()

    state = gameReducer(state, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })
    expect(state.airbusSimulator.cameraPhase).toBe('transitioning')
    expect(state.airbusSimulator.stormLine.status).toBe('not_started')

    state = gameReducer(state, { type: 'START_AIRBUS_STORM_LINE' })
    expect(state.airbusSimulator.cameraPhase).toBe('storm')
    expect(state.airbusSimulator.stormLine.status).toBe('in_progress')
  })

  it('returns to the scenario hub and unlocks Engine-Out after Storm Line reaches clear air', () => {
    let state = completeAirbusLabels()
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })
    state = gameReducer(state, { type: 'START_AIRBUS_STORM_LINE' })
    state = gameReducer(state, {
      type: 'SAVE_AIRBUS_STORM_CHECKPOINT',
      checkpoint: 'clearAir',
      attempts: { stormEntry: 1, stormCore: 0, clearAir: 0 },
    })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        workload: {
          ...state.airbusSimulator.workload,
          completedTasks: ['stormScanRange', 'stormGapSelection'],
        },
      },
    }
    state = gameReducer(state, {
      type: 'COMPLETE_AIRBUS_STORM_LINE',
      traits: ['weatherJudgment', 'energyManagement'],
    })

    expect(state.completedPuzzles).toEqual([])
    expect(state.airbusSimulator.location).toBe('hub')
    expect(state.airbusSimulator.stormLine).toEqual({
      status: 'completed',
      checkpoint: 'clearAir',
      attempts: { stormEntry: 1, stormCore: 0, clearAir: 0 },
      bestTraits: ['weatherJudgment', 'energyManagement'],
    })
    expect(state.airbusSimulator.engineOut.status).toBe('not_started')
    expect(state.statusMessage).toContain('Engine-Out Handling unlocked')
  })

  it('begins Engine-Out Handling from the hub after Storm Line is complete', () => {
    let state = completeStormLine()
    state = gameReducer(state, { type: 'SELECT_AIRBUS_SCENARIO', scenario: 'engineOut' })
    const next = gameReducer(state, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })

    expect(next.airbusSimulator.location).toBe('engineOut')
    expect(next.airbusSimulator.engineOut.status).toBe('in_progress')
    expect(next.airbusSimulator.cameraPhase).toBe('storm')
    expect(next.statusMessage).toContain('deliberate cruise training exercise')
  })

  it('replays a completed Storm Line through the focused camera transition', () => {
    let state = completeStormLine()
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        stormLine: {
          ...state.airbusSimulator.stormLine,
          checkpoint: 'clearAir',
          attempts: { stormEntry: 1, stormCore: 2, clearAir: 1 },
        },
      },
    }
    state = gameReducer(state, { type: 'SELECT_AIRBUS_SCENARIO', scenario: 'stormLine' })
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })

    expect(state.airbusSimulator.cameraPhase).toBe('transitioning')
    expect(state.airbusSimulator.stormLine.checkpoint).toBe('stormEntry')
    expect(state.airbusSimulator.stormLine.attempts).toEqual({
      stormEntry: 0,
      stormCore: 0,
      clearAir: 0,
    })

    state = gameReducer(state, { type: 'START_AIRBUS_STORM_LINE' })
    expect(state.airbusSimulator.location).toBe('stormLine')
    expect(state.airbusSimulator.stormLine.status).toBe('in_progress')
  })

  it('completes Airbus only after Engine-Out Handling is complete', () => {
    let state = completeStormLine()
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })
    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'acknowledgeEngineEvent' },
    })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        engineOut: {
          ...state.airbusSimulator.engineOut,
          checkpoint: 'diversion',
        },
      },
    }
    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'selectSafeReturn', side: 'right' },
    })
    state = gameReducer(state, {
      type: 'COMPLETE_AIRBUS_ENGINE_OUT',
      traits: ['directionalControl', 'calmDiversion'],
    })

    expect(state.completedPuzzles).toEqual(['airbus'])
    expect(state.rewardUnlocked).toBe(false)
    expect(state.airbusSimulator.location).toBe('hub')
    expect(state.airbusSimulator.engineOut).toEqual({
      status: 'completed',
      checkpoint: 'diversion',
      attempts: { recognition: 0, stabilization: 0, diversion: 0 },
      bestTraits: ['directionalControl', 'calmDiversion'],
    })
    expect(state.statusMessage).toContain('POP T CAPTAIN MODE COMPLETE')
  })

  it('saves only durable Engine-Out checkpoint progress during the exercise', () => {
    let state = completeStormLine()
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })
    state = gameReducer(state, {
      type: 'SAVE_AIRBUS_ENGINE_OUT_CHECKPOINT',
      checkpoint: 'stabilization',
      attempts: { recognition: 0, stabilization: 2, diversion: 0 },
    })

    expect(state.airbusSimulator.engineOut.checkpoint).toBe('stabilization')
    expect(state.airbusSimulator.engineOut.attempts).toEqual({
      recognition: 0,
      stabilization: 2,
      diversion: 0,
    })
    expect(state.statusMessage).toContain('Stabilization checkpoint recorded')
  })

  it('preserves the best Engine-Out traits and one Airbus completion across replay', () => {
    let state = completeStormLine()
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        workload: {
          ...state.airbusSimulator.workload,
          completedTasks: [
            ...state.airbusSimulator.workload.completedTasks,
            'engineEventAcknowledgement',
            'engineSafeReturnSelection',
          ],
        },
      },
    }
    state = gameReducer(state, {
      type: 'COMPLETE_AIRBUS_ENGINE_OUT',
      traits: ['directionalControl'],
    })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        engineOut: {
          ...state.airbusSimulator.engineOut,
          checkpoint: 'diversion',
          attempts: { recognition: 0, stabilization: 2, diversion: 1 },
        },
      },
    }
    state = gameReducer(state, { type: 'SELECT_AIRBUS_SCENARIO', scenario: 'engineOut' })
    state = gameReducer(state, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })

    expect(state.airbusSimulator.engineOut.checkpoint).toBe('recognition')
    expect(state.airbusSimulator.engineOut.attempts).toEqual({
      recognition: 0,
      stabilization: 0,
      diversion: 0,
    })
    expect(state.airbusSimulator.engineOut.bestTraits).toEqual(['directionalControl'])
    expect(state.airbusSimulator.workload.completedTasks).toEqual([
      'stormScanRange',
      'stormGapSelection',
    ])

    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'acknowledgeEngineEvent' },
    })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        engineOut: {
          ...state.airbusSimulator.engineOut,
          checkpoint: 'diversion',
        },
      },
    }
    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'selectSafeReturn', side: 'right' },
    })

    state = gameReducer(state, {
      type: 'COMPLETE_AIRBUS_ENGINE_OUT',
      traits: ['energyDiscipline', 'directionalControl'],
    })

    expect(state.completedPuzzles).toEqual(['airbus'])
    expect(state.airbusSimulator.engineOut.bestTraits).toEqual([
      'directionalControl',
      'energyDiscipline',
    ])
  })

  it('applies only the active cockpit workload and strengthens safe coaching', () => {
    const qualified = completeAirbusLabels()
    const ignored = gameReducer(qualified, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'cycleScanRange' },
    })
    expect(ignored).toBe(qualified)

    let state = gameReducer(qualified, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })
    state = gameReducer(state, { type: 'START_AIRBUS_STORM_LINE' })
    state = {
      ...state,
      airbusSimulator: {
        ...state.airbusSimulator,
        workload: {
          ...state.airbusSimulator.workload,
          scanRange: 'far',
        },
      },
    }
    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'cycleScanRange' },
    })
    expect(state.airbusSimulator.workload.scanRange).toBe('near')
    expect(state.airbusSimulator.workload.attempts.stormScanRange).toBe(1)
    expect(state.statusMessage).toContain('weather scan')

    state = gameReducer(state, {
      type: 'APPLY_AIRBUS_WORKLOAD_ACTION',
      action: { type: 'cycleScanRange' },
    })
    expect(state.airbusSimulator.workload.scanRange).toBe('mid')
    expect(state.airbusSimulator.workload.completedTasks).toEqual(['stormScanRange'])
    expect(state.statusMessage).toContain('MID')
  })

  it('guards scenario completion until the required captain tasks are complete', () => {
    let storm = completeAirbusLabels()
    storm = gameReducer(storm, { type: 'BEGIN_AIRBUS_STORM_TRANSITION' })
    storm = gameReducer(storm, { type: 'START_AIRBUS_STORM_LINE' })
    expect(gameReducer(storm, {
      type: 'COMPLETE_AIRBUS_STORM_LINE',
      traits: [],
    })).toBe(storm)

    let engine = completeStormLine()
    engine = gameReducer(engine, { type: 'BEGIN_AIRBUS_ENGINE_OUT' })
    expect(gameReducer(engine, {
      type: 'COMPLETE_AIRBUS_ENGINE_OUT',
      traits: [],
    })).toBe(engine)
  })

  it.each(['1500', '1,500', '1500 hour', '1500 hours'])('accepts the DC-9 ATP answer %s', (answer) => {
    let state = enterDc9HomeOperations()
    state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
    state = gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })
    state = completeDc9InstrumentScan(state)
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

describe('DC-9 right-seat control check', () => {
  const started = () => gameReducer(createInitialState(), { type: 'START' })
  const sweepTo = (state: GameState, controls: Partial<Dc9ControlState>) =>
    gameReducer(state, { type: 'APPLY_DC9_CONTROL_CHECK', controls: { ...NEUTRAL_DC9_CONTROLS, ...controls } })

  it('opens the chapter before the route record', () => {
    const state = started()
    expect(state.dc9.stage).toBe('controlCheck')
    expect(state.dc9.controlCheck).toEqual([])
  })

  it('latches a movement and counts down the rest', () => {
    const state = sweepTo(started(), { pitch: 1 })
    expect(state.dc9.controlCheck).toEqual(['yokeAft'])
    expect(state.statusMessage).toContain('Column full aft checked')
    expect(state.statusMessage).toContain('7 control movements remaining')
  })

  it('ignores a frame that reaches nothing new', () => {
    const state = sweepTo(started(), { pitch: 1 })
    expect(sweepTo(state, { pitch: 1 })).toBe(state)
    expect(sweepTo(state, { pitch: 0.4 })).toBe(state)
  })

  it('reveals the route strip once every control has been swept', () => {
    const state = completeDc9ControlCheck(started())
    expect(state.dc9.stage).toBe('intro')
    expect(state.statusMessage).toBe(dc9LegacyFlow.controlCheck.completionText)
    expect(state.dc9.controlCheck).toHaveLength(8)
  })

  it('does not accept control input outside its own stage', () => {
    const past = completeDc9ControlCheck(started())
    expect(sweepTo(past, { pitch: 1 })).toBe(past)
    const briefing = createInitialState()
    expect(sweepTo(briefing, { pitch: 1 })).toBe(briefing)
  })

  it('coaches the next movement through the hint path', () => {
    let state = started()
    expect(gameReducer(state, { type: 'USE_HINT' }).statusMessage).toContain('Pull the yoke back')
    state = sweepTo(state, { pitch: 1 })
    expect(gameReducer(state, { type: 'USE_HINT' }).statusMessage).toContain('Push the yoke all the way forward')
  })
})

describe('DC-9 instrument scan', () => {
  const atScan = () => {
    let state = enterDc9HomeOperations()
    state = gameReducer(state, { type: 'SET_HOME_OPERATIONS_PAGE', page: 4 })
    return gameReducer(state, { type: 'COMPLETE_HOME_OPERATIONS' })
  }

  it('follows the Home Operations Log and precedes the shutdown', () => {
    const state = atScan()
    expect(state.dc9.stage).toBe('instrumentScan')
    expect(state.dc9.instrumentScan).toEqual({ identified: [], attempts: 0 })
  })

  it('confirms a correct gauge and reports what it reads', () => {
    const state = gameReducer(atScan(), { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'airspeed' })
    expect(state.dc9.instrumentScan.identified).toEqual(['airspeed'])
    expect(state.statusMessage).toContain('the airspeed indicator')
    expect(state.statusMessage).toContain('in knots')
  })

  it('coaches a wrong gauge without losing progress', () => {
    let state = gameReducer(atScan(), { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'airspeed' })
    state = gameReducer(state, { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'airspeed' })
    expect(state.dc9.instrumentScan.identified).toEqual(['airspeed'])

    state = gameReducer(state, { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'epr' })
    expect(state.dc9.instrumentScan.identified).toEqual(['airspeed'])
    expect(state.dc9.instrumentScan.attempts).toBe(1)
    expect(state.statusMessage).toContain('largest dial')
  })

  it('outlines the answer after a third miss on the same gauge', () => {
    let state = atScan()
    for (let attempt = 0; attempt < 3; attempt += 1) {
      state = gameReducer(state, { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'epr' })
    }
    expect(state.statusMessage).toContain('outlined for you now')
  })

  it('opens the ceremonial shutdown when all six are identified', () => {
    const state = completeDc9InstrumentScan(atScan())
    expect(state.dc9.stage).toBe('shutdown')
    expect(state.statusMessage).toContain(dc9LegacyFlow.secureInstruction)
  })

  it('does not accept answers outside its own stage', () => {
    const before = enterDc9HomeOperations()
    expect(gameReducer(before, { type: 'IDENTIFY_DC9_INSTRUMENT', instrument: 'airspeed' })).toBe(before)
  })
})
