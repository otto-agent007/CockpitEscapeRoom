import { describe, expect, it } from 'vitest'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from './config'
import { DC9_CONTROL_CHECK_ITEM_IDS } from './dc9ControlCheck'
import { DC9_INSTRUMENT_SCAN_ORDER } from './dc9InstrumentScan'
import { createInitialDc9DepartureProgress } from './dc9MemphisDeparture'
import { createInitialState, type GameState } from './state'
import { loadGameState, saveGameState, STORAGE_KEY } from './storage'

function createMemoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
    removeItem(key: string) {
      values.delete(key)
    },
  }
}

function completedDc9(secureAttempts = 0, routeAttempts = 0): GameState['dc9'] {
  return {
    stage: 'complete',
    controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
    instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
    departure: {
      checkpoint: 'complete',
      completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation', 'initialClimb', 'complete'],
      attempts: {},
      hintLevel: 0,
      completed: true,
    },
    routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
    routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
    routeAttempts,
    homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
    homeOperationsCompleted: true,
    secureSequence: [...dc9LegacyFlow.secureSequence],
    secureAttempts,
    keyRevealed: true,
    keyClaimed: true,
  }
}

function legacyCommon(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    phase: 'briefing',
    airbusAssignments: {
      sidestick: null,
      thrust: null,
      gear: null,
      radio: null,
      altitude: null,
    },
    airbusDecoyAssignments: {
      leftPanelKnobs: null,
      rightDisplay: null,
      sideConsole: null,
      windshieldLights: null,
    },
    airbusClockAnswer: '',
    lockerCompleted: [],
    lockerAttempts: { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: false,
    lockerHatRevealed: false,
    captainModeUnlocked: false,
    captainRouteVerified: false,
    dc9SecureSequence: [],
    captainAttempts: { route: 0, secure: 0 },
    routeSelections: [],
    completedPuzzles: [],
    hintsUsed: 0,
    captainRewardUnlocked: false,
    marsUnlocked: false,
    statusMessage: 'Legacy save.',
    ...overrides,
  }
}

function legacyV7(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schemaVersion: 7,
    ...legacyCommon(),
    dc9: {
      stage: 'intro',
      routeSelections: [],
      routeCompleted: [],
      routeAttempts: 0,
      homePage: 0,
      homeOperationsCompleted: false,
      secureSequence: [],
      keyRevealed: false,
      keyClaimed: false,
    },
    ...overrides,
  }
}

function loadRaw(raw: Record<string, unknown>): GameState {
  return loadGameState(createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(raw) }))
}

function canonicalV8(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const state: Record<string, unknown> = { ...createInitialState() }
  delete state.airbusSimulator
  return {
    ...state,
    schemaVersion: 8,
    ...overrides,
  }
}

function canonicalV9(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ...createInitialState(),
    schemaVersion: 9,
    ...overrides,
  }
}

function canonicalV10(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const state = createInitialState()
  return {
    ...state,
    schemaVersion: 10,
    airbusSimulator: {
      familiarization: state.airbusSimulator.familiarization,
      cameraPhase: state.airbusSimulator.cameraPhase,
      stormLine: state.airbusSimulator.stormLine,
    },
    ...overrides,
  }
}

function canonicalV11(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const state = createInitialState()
  const airbusSimulator = { ...state.airbusSimulator } as Record<string, unknown>
  delete airbusSimulator.workload
  return {
    ...state,
    schemaVersion: 11,
    phase: 'airbus',
    airbusAssignments: { ...airbusCaptainFlow.controlMatch },
    airbusSimulator: {
      ...airbusSimulator,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
    },
    ...overrides,
  }
}

function v13Dc9(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  const state = createInitialState()
  const dc9 = { ...state.dc9 } as Record<string, unknown>
  delete dc9.departure
  return {
    ...state,
    schemaVersion: 13,
    phase: 'dc9',
    dc9: { ...dc9, ...overrides },
  }
}

describe('schema-v11 to schema-v14 Airbus workload migration', () => {
  it.each([
    ['stormEntry', []],
    ['stormCore', ['stormScanRange']],
    ['clearAir', ['stormScanRange', 'stormGapSelection']],
  ] as const)('derives earned Storm tasks at %s', (checkpoint, completedTasks) => {
    const migrated = loadRaw(canonicalV11({
      airbusSimulator: {
        ...(canonicalV11().airbusSimulator as Record<string, unknown>),
        cameraPhase: 'storm',
        location: 'stormLine',
        stormLine: {
          status: 'in_progress',
          checkpoint,
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
        engineOut: {
          status: 'locked',
          checkpoint: 'recognition',
          attempts: { recognition: 0, stabilization: 0, diversion: 0 },
          bestTraits: [],
        },
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.airbusSimulator.workload.completedTasks).toEqual(completedTasks)
  })

  it.each([
    ['recognition', ['stormScanRange', 'stormGapSelection']],
    ['stabilization', ['stormScanRange', 'stormGapSelection', 'engineEventAcknowledgement']],
    ['diversion', ['stormScanRange', 'stormGapSelection', 'engineEventAcknowledgement']],
  ] as const)('derives earned Engine-Out tasks at %s', (checkpoint, completedTasks) => {
    const migrated = loadRaw(canonicalV11({
      airbusSimulator: {
        ...(canonicalV11().airbusSimulator as Record<string, unknown>),
        cameraPhase: 'storm',
        location: 'engineOut',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
        engineOut: {
          status: 'in_progress',
          checkpoint,
          attempts: { recognition: 0, stabilization: 0, diversion: 0 },
          bestTraits: [],
        },
      },
    }))

    expect(migrated.airbusSimulator.workload.completedTasks).toEqual(completedTasks)
  })

  it('preserves old completed reward saves with every workload task earned', () => {
    const migrated = loadRaw(canonicalV11({
      phase: 'reward',
      completedPuzzles: ['dc9', 'locker', 'airbus'],
      rewardUnlocked: true,
      airbusSimulator: {
        ...(canonicalV11().airbusSimulator as Record<string, unknown>),
        familiarization: 'completed',
        cameraPhase: 'qualified',
        location: 'hub',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
        engineOut: {
          status: 'completed',
          checkpoint: 'diversion',
          attempts: { recognition: 0, stabilization: 0, diversion: 0 },
          bestTraits: [],
        },
      },
    }))

    expect(migrated.airbusSimulator.workload.completedTasks).toEqual([
      'stormScanRange',
      'stormGapSelection',
      'engineEventAcknowledgement',
      'engineSafeReturnSelection',
    ])
  })
})

describe('schema-v10 to schema-v14 Airbus scenario migration', () => {
  it('opens the hub with Storm ready and Engine-Out locked for a qualified save', () => {
    const migrated = loadRaw(canonicalV10({
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        familiarization: 'completed',
        cameraPhase: 'qualified',
        stormLine: {
          status: 'not_started',
          checkpoint: 'stormEntry',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.airbusSimulator.location).toBe('hub')
    expect(migrated.airbusSimulator.stormLine.status).toBe('not_started')
    expect(migrated.airbusSimulator.engineOut.status).toBe('locked')
  })

  it('preserves an in-progress Storm checkpoint and attempts', () => {
    const migrated = loadRaw(canonicalV10({
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        familiarization: 'completed',
        cameraPhase: 'storm',
        stormLine: {
          status: 'in_progress',
          checkpoint: 'stormCore',
          attempts: { stormEntry: 2, stormCore: 1, clearAir: 0 },
          bestTraits: ['calmControl'],
        },
      },
    }))

    expect(migrated.airbusSimulator.location).toBe('stormLine')
    expect(migrated.airbusSimulator.stormLine).toEqual({
      status: 'in_progress',
      checkpoint: 'stormCore',
      attempts: { stormEntry: 2, stormCore: 1, clearAir: 0 },
      bestTraits: ['calmControl'],
    })
    expect(migrated.airbusSimulator.engineOut.status).toBe('locked')
  })

  it('returns a completed Storm save to the hub with Engine-Out ready', () => {
    const migrated = loadRaw(canonicalV10({
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        familiarization: 'completed',
        cameraPhase: 'storm',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 1, stormCore: 0, clearAir: 0 },
          bestTraits: ['weatherJudgment'],
        },
      },
    }))

    expect(migrated.completedPuzzles).not.toContain('airbus')
    expect(migrated.airbusSimulator.location).toBe('hub')
    expect(migrated.airbusSimulator.stormLine.status).toBe('completed')
    expect(migrated.airbusSimulator.engineOut.status).toBe('not_started')
  })
})

describe('canonical schema-v14 Airbus scenario recovery', () => {
  it('restores the focused captain camera for an in-progress Engine-Out exercise', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        ...state.airbusSimulator,
        familiarization: 'completed',
        cameraPhase: 'qualified',
        location: 'engineOut',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: ['weatherJudgment'],
        },
        engineOut: {
          status: 'in_progress',
          checkpoint: 'recognition',
          attempts: { recognition: 0, stabilization: 0, diversion: 0 },
          bestTraits: [],
        },
      },
    })

    expect(loaded.airbusSimulator.location).toBe('engineOut')
    expect(loaded.airbusSimulator.cameraPhase).toBe('storm')
    expect(loaded.airbusSimulator.engineOut.status).toBe('in_progress')
  })

  it('resets malformed Engine-Out progress to the hub without erasing Storm completion', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        ...state.airbusSimulator,
        familiarization: 'completed',
        cameraPhase: 'qualified',
        location: 'engineOut',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 1, stormCore: 2, clearAir: 0 },
          bestTraits: ['weatherJudgment'],
        },
        engineOut: {
          status: 'in_progress',
          checkpoint: 'diversion',
          attempts: { recognition: 0, stabilization: -1, diversion: 4 },
          bestTraits: ['directionalControl'],
        },
      },
    })

    expect(loaded.airbusSimulator.location).toBe('hub')
    expect(loaded.airbusSimulator.stormLine).toEqual({
      status: 'completed',
      checkpoint: 'clearAir',
      attempts: { stormEntry: 1, stormCore: 2, clearAir: 0 },
      bestTraits: ['weatherJudgment'],
    })
    expect(loaded.airbusSimulator.engineOut).toEqual({
      status: 'not_started',
      checkpoint: 'recognition',
      attempts: { recognition: 0, stabilization: 0, diversion: 0 },
      bestTraits: [],
    })
  })

  it('does not trust an Engine-Out completion without canonical Airbus completion', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        ...state.airbusSimulator,
        familiarization: 'completed',
        location: 'hub',
        stormLine: {
          ...state.airbusSimulator.stormLine,
          status: 'completed',
        },
        engineOut: {
          ...state.airbusSimulator.engineOut,
          status: 'completed',
          checkpoint: 'diversion',
          bestTraits: ['calmDiversion'],
        },
      },
    })

    expect(loaded.completedPuzzles).not.toContain('airbus')
    expect(loaded.airbusSimulator.location).toBe('hub')
    expect(loaded.airbusSimulator.engineOut).toEqual({
      status: 'not_started',
      checkpoint: 'recognition',
      attempts: { recognition: 0, stabilization: 0, diversion: 0 },
      bestTraits: [],
    })
  })
})

describe('schema-v9 to schema-v14 mandatory qualification migration', () => {
  it('promotes a skipped save with all correct assignments to the qualified camera phase', () => {
    const migrated = loadRaw(canonicalV9({
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        familiarization: 'skipped',
        stormLine: {
          status: 'not_started',
          checkpoint: 'stormEntry',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.airbusSimulator.familiarization).toBe('completed')
    expect(migrated.airbusSimulator.cameraPhase).toBe('qualified')
    expect(migrated.airbusSimulator.stormLine.status).toBe('not_started')
  })

  it('relocks a skipped save whose assignments do not prove qualification', () => {
    const migrated = loadRaw(canonicalV9({
      phase: 'airbus',
      airbusAssignments: {
        sidestick: 'SIDESTICK',
        thrust: null,
        gear: null,
        radio: null,
        altitude: null,
      },
      airbusSimulator: {
        familiarization: 'skipped',
        stormLine: {
          status: 'in_progress',
          checkpoint: 'stormCore',
          attempts: { stormEntry: 2, stormCore: 1, clearAir: 0 },
          bestTraits: ['calmControl'],
        },
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.airbusSimulator).toEqual({
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
  })

  it('preserves an earned Airbus completion while retiring the skipped value', () => {
    const migrated = loadRaw(canonicalV9({
      phase: 'reward',
      completedPuzzles: ['dc9', 'locker', 'airbus'],
      rewardUnlocked: true,
      airbusSimulator: {
        familiarization: 'skipped',
        stormLine: {
          status: 'completed',
          checkpoint: 'clearAir',
          attempts: { stormEntry: 2, stormCore: 3, clearAir: 1 },
          bestTraits: ['weatherJudgment'],
        },
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.completedPuzzles).toContain('airbus')
    expect(migrated.rewardUnlocked).toBe(true)
    expect(migrated.airbusSimulator.familiarization).toBe('completed')
    expect(migrated.airbusSimulator.cameraPhase).toBe('qualified')
    expect(migrated.airbusSimulator.location).toBe('hub')
    expect(migrated.airbusSimulator.stormLine.status).toBe('completed')
    expect(migrated.airbusSimulator.engineOut.status).toBe('completed')
  })
})

describe('schema-v7 through schema-v14 migration', () => {
  it('preserves completed DC-9 route and secure attempt history', () => {
    const dc9 = completedDc9(4, 5)
    const legacyDc9: Record<string, unknown> = { ...dc9 }
    delete legacyDc9.secureAttempts
    const migrated = loadRaw(legacyV7({
      phase: 'locker',
      completedPuzzles: ['captain'],
      captainAttempts: { route: 5, secure: 4 },
      dc9: legacyDc9,
    }))

    expect(migrated.dc9.routeAttempts).toBe(5)
    expect(migrated.dc9.secureAttempts).toBe(4)
  })

  it.each([
    ['briefing', 'briefing', []],
    ['captain', 'dc9', []],
    ['locker', 'locker', ['captain']],
    ['airbus', 'airbus', ['captain', 'locker']],
    ['reward', 'reward', ['captain', 'locker', 'firstOfficer']],
    ['mars', 'mars', ['captain', 'locker', 'firstOfficer']],
  ] as const)('maps phase %s to %s without losing its valid journey boundary', (legacyPhase, phase, completedPuzzles) => {
    const migrated = loadRaw(legacyV7({
      phase: legacyPhase,
      completedPuzzles,
      captainModeUnlocked: completedPuzzles.some((id) => id === 'locker'),
      captainRewardUnlocked: legacyPhase === 'reward' || legacyPhase === 'mars',
      marsUnlocked: legacyPhase === 'mars',
      dc9: completedPuzzles.some((id) => id === 'captain') ? completedDc9() : legacyV7().dc9,
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.phase).toBe(phase)
  })

  it('renames puzzle and state semantics while preserving in-progress DC-9 data', () => {
    const migrated = loadRaw(legacyV7({
      phase: 'captain',
      completedPuzzles: ['firstOfficer', 'locker'],
      airbusClockAnswer: '1500 hours',
      captainModeUnlocked: true,
      captainRouteVerified: true,
      dc9SecureSequence: ['apuBuses'],
      captainAttempts: { route: 3, secure: 2 },
      routeSelections: ['DTW', 'MSP', 'STL'],
      dc9: {
        stage: 'shutdown',
        routeSelections: ['DTW', 'MSP', 'STL'],
        routeCompleted: ['DTW', 'MSP', 'STL'],
        routeAttempts: 3,
        homePage: 4,
        homeOperationsCompleted: true,
        secureSequence: ['apuBuses'],
        keyRevealed: false,
        keyClaimed: false,
      },
    }))

    expect(migrated.completedPuzzles).toEqual(['airbus', 'locker'])
    expect(migrated.airbusQualificationAnswer).toBe('1500 hours')
    expect(migrated.airbusCaptainModeUnlocked).toBe(true)
    expect(migrated.rewardUnlocked).toBe(false)
    expect(migrated.dc9).toMatchObject({
      stage: 'shutdown',
      routeSelections: ['DTW', 'MSP', 'STL'],
      routeCompleted: ['DTW', 'MSP', 'STL'],
      routeAttempts: 3,
      homePage: 4,
      homeOperationsCompleted: true,
      secureSequence: ['apuBuses'],
      secureAttempts: 2,
    })
    expect(migrated).not.toHaveProperty('airbusClockAnswer')
    expect(migrated).not.toHaveProperty('captainModeUnlocked')
    expect(migrated).not.toHaveProperty('captainRouteVerified')
    expect(migrated).not.toHaveProperty('dc9SecureSequence')
    expect(migrated).not.toHaveProperty('captainAttempts')
    expect(migrated).not.toHaveProperty('routeSelections')
    expect(migrated).not.toHaveProperty('captainRewardUnlocked')
  })

  it('preserves in-progress Airbus assignments and qualification answer', () => {
    const migrated = loadRaw(legacyV7({
      phase: 'airbus',
      completedPuzzles: ['captain', 'locker'],
      captainModeUnlocked: true,
      dc9: completedDc9(),
      airbusAssignments: {
        sidestick: 'SIDESTICK',
        thrust: 'THRUST',
        gear: null,
        radio: null,
        altitude: null,
      },
      airbusClockAnswer: '1,500',
    }))

    expect(migrated.phase).toBe('airbus')
    expect(migrated.airbusAssignments.sidestick).toBe('SIDESTICK')
    expect(migrated.airbusAssignments.thrust).toBe('THRUST')
    expect(migrated.airbusQualificationAnswer).toBe('1,500')
  })

  it('preserves reward and Mars state with canonical puzzle IDs', () => {
    const migrated = loadRaw(legacyV7({
      phase: 'mars',
      completedPuzzles: ['captain', 'locker', 'firstOfficer'],
      captainModeUnlocked: true,
      captainRewardUnlocked: true,
      marsUnlocked: true,
      dc9: completedDc9(2),
    }))

    expect(migrated.phase).toBe('mars')
    expect(migrated.completedPuzzles).toEqual(['dc9', 'locker', 'airbus'])
    expect(migrated.rewardUnlocked).toBe(true)
    expect(migrated.marsUnlocked).toBe(true)
  })

  it('normalizes corrupt schema-v7 DC-9 progress to a recoverable boundary', () => {
    const migrated = loadRaw(legacyV7({
      phase: 'captain',
      dc9: {
        stage: 'shutdown',
        routeSelections: ['INVALID'],
        routeCompleted: ['DTW', 'DTW'],
        routeAttempts: -4,
        homePage: 99,
        homeOperationsCompleted: false,
        secureSequence: ['battery', 'apuBuses'],
        keyRevealed: true,
        keyClaimed: true,
      },
    }))

    expect(migrated.phase).toBe('dc9')
    expect(migrated.dc9).toMatchObject({
      stage: 'routeRecord',
      routeSelections: [],
      routeCompleted: ['DTW'],
      routeAttempts: 0,
      secureSequence: [],
      secureAttempts: 0,
      keyClaimed: false,
    })
  })
})

describe('schema-v3 through schema-v6 migration chain', () => {
  it('keeps completed schema-v6 reward and Mars progress complete', () => {
    const migrated = loadRaw({
      schemaVersion: 6,
      ...legacyCommon({
        phase: 'mars',
        captainRouteVerified: true,
        dc9SecureSequence: [...dc9LegacyFlow.secureSequence],
        completedPuzzles: ['firstOfficer', 'locker', 'captain'],
        captainRewardUnlocked: true,
        marsUnlocked: true,
      }),
    })

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.phase).toBe('mars')
    expect(migrated.dc9.stage).toBe('complete')
    expect(migrated.completedPuzzles).toEqual(['airbus', 'locker', 'dc9'])
    expect(migrated.rewardUnlocked).toBe(true)
    expect(migrated.marsUnlocked).toBe(true)
  })

  it('moves a route-verified schema-v6 save to DC-9 Home Operations', () => {
    const migrated = loadRaw({
      schemaVersion: 6,
      ...legacyCommon({
        phase: 'captain',
        captainRouteVerified: true,
        captainAttempts: { route: 2, secure: 0 },
        routeSelections: ['BTR', 'STL', 'TYS'],
        completedPuzzles: ['firstOfficer', 'locker'],
      }),
    })

    expect(migrated.phase).toBe('dc9')
    expect(migrated.dc9.stage).toBe('homeOperations')
    expect(migrated.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
    expect(migrated.dc9.routeAttempts).toBe(2)
  })

  it('migrates schema-v3 locker data without erasing prior Airbus progress', () => {
    const migrated = loadRaw({
      schemaVersion: 3,
      ...legacyCommon({
        phase: 'locker',
        lockerCompleted: ['watch', 'nameplate'],
        completedPuzzles: ['firstOfficer'],
      }),
      lockerAttempts: undefined,
    })

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.phase).toBe('dc9')
    expect(migrated.lockerCompleted).toEqual(['watch'])
    expect(migrated.lockerAttempts).toEqual({ watch: 0, baseball: 0, chargingBull: 0, wings: 0 })
    expect(migrated.completedPuzzles).toEqual(['airbus'])
  })

  it('migrates schema-v4 locker data as an already-seen intro', () => {
    const migrated = loadRaw({
      schemaVersion: 4,
      ...legacyCommon({
        phase: 'locker',
        lockerCompleted: ['watch'],
        completedPuzzles: ['firstOfficer'],
      }),
      lockerIntroCompleted: undefined,
    })

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.phase).toBe('dc9')
    expect(migrated.lockerIntroCompleted).toBe(true)
    expect(migrated.completedPuzzles).toEqual(['airbus'])
  })

  it('preserves schema-v5 locker attempts created before later questions', () => {
    const migrated = loadRaw({
      schemaVersion: 5,
      ...legacyCommon({
        phase: 'locker',
        lockerCompleted: ['watch', 'baseball'],
        lockerAttempts: { watch: 1, baseball: 2 },
      }),
    })

    expect(migrated.lockerAttempts).toEqual({ watch: 1, baseball: 2, chargingBull: 0, wings: 0 })
    expect(migrated.lockerCompleted).toEqual(['watch', 'baseball'])
  })

  it.each(['reward', 'mars'] as const)('preserves schema-v5 %s completion and reward state', (phase) => {
    const migrated = loadRaw({
      schemaVersion: 5,
      ...legacyCommon({
        phase,
        completedPuzzles: ['firstOfficer', 'locker', 'captain'],
        captainRewardUnlocked: true,
        marsUnlocked: phase === 'mars',
      }),
    })

    expect(migrated.phase).toBe(phase)
    expect(migrated.completedPuzzles).toEqual(['airbus', 'locker', 'dc9'])
    expect(migrated.rewardUnlocked).toBe(true)
    expect(migrated.dc9.secureSequence).toEqual([...dc9LegacyFlow.secureSequence])
  })
})

describe('schema-v8 to schema-v14 Airbus simulator migration', () => {
  it('preserves an incomplete familiarization without inventing Storm Line progress', () => {
    const migrated = loadRaw(canonicalV8({
      phase: 'airbus',
      airbusAssignments: {
        sidestick: 'SIDESTICK',
        thrust: 'THRUST',
        gear: null,
        radio: null,
        altitude: null,
      },
    }))

    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.phase).toBe('airbus')
    expect(migrated.airbusSimulator.familiarization).toBe('unseen')
    expect(migrated.airbusSimulator.stormLine.status).toBe('not_started')
  })

  it('preserves completed Airbus and reward saves without relocking the journey', () => {
    const migrated = loadRaw(canonicalV8({
      phase: 'reward',
      completedPuzzles: ['dc9', 'locker', 'airbus'],
      rewardUnlocked: true,
    }))

    expect(migrated.phase).toBe('reward')
    expect(migrated.rewardUnlocked).toBe(true)
    expect(migrated.airbusSimulator.familiarization).toBe('completed')
    expect(migrated.airbusSimulator.stormLine.status).toBe('completed')
  })
})

describe('schema-v13 to schema-v14 Memphis departure migration', () => {
  it('keeps a route-record save at the route record with canonical initial departure progress', () => {
    const loaded = loadRaw(v13Dc9({
      stage: 'routeRecord',
      routeSelections: ['DTW'],
      routeCompleted: ['DTW'],
      routeAttempts: 1,
    }))

    expect(loaded.schemaVersion).toBe(14)
    expect(loaded.dc9.stage).toBe('routeRecord')
    expect(loaded.dc9.departure).toEqual(createInitialDc9DepartureProgress())
  })

  it.each([
    ['homeOperations', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
    }],
    ['instrumentScan', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
    }],
    ['shutdown', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
    }],
    ['qualification', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      stage: 'qualification',
    }],
    ['keyReveal', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      stage: 'keyReveal',
    }],
    ['complete', {
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      keyRevealed: true,
      keyClaimed: true,
      stage: 'complete',
    }],
  ] as const)('moves a v13 %s save forward without inserting unfinished departure', (stage, dc9) => {
    const loaded = loadRaw(v13Dc9(dc9))

    expect(loaded.dc9.stage).toBe(stage)
    expect(loaded.dc9.departure).toMatchObject({ checkpoint: 'complete', completed: true })
  })

  it('reloads a current Memphis departure checkpoint when its durable progress is valid', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'dc9',
      dc9: {
        ...state.dc9,
        stage: 'memphisDeparture',
        controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
        routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
        routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
        departure: {
          checkpoint: 'taxiTurn',
          completedBeats: ['rampRelease'],
          attempts: { taxi: 2 },
          hintLevel: 2,
          completed: false,
        },
      },
    })

    expect(loaded.dc9.stage).toBe('memphisDeparture')
    expect(loaded.dc9.departure).toEqual({
      checkpoint: 'taxiTurn',
      completedBeats: ['rampRelease'],
      attempts: { taxi: 2 },
      hintLevel: 2,
      completed: false,
    })
  })

  it.each([
    { checkpoint: 'sideways' },
    { checkpoint: 'taxiTurn', completedBeats: ['rampRelease'], attempts: { taxi: -1 }, hintLevel: 1, completed: false },
    { checkpoint: 'taxiTurn', completedBeats: ['taxi'], attempts: {}, hintLevel: 0, completed: false },
    { checkpoint: 'taxiTurn', completedBeats: ['rampRelease'], attempts: {}, hintLevel: 4, completed: false },
  ])('normalizes malformed current departure data safely: %o', (departure) => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'dc9',
      dc9: {
        ...state.dc9,
        stage: 'memphisDeparture',
        controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
        routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
        routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
        departure,
      },
    })

    expect(loaded.dc9.stage).toBe('memphisDeparture')
    expect(loaded.dc9.departure).toEqual(createInitialDc9DepartureProgress())
  })

  it.each([
    ['controlCheck', {}, {}],
    ['intro', { controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS] }, {}],
    ['routeRecord', {
      controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
      routeSelections: ['DTW'],
      routeCompleted: ['DTW'],
    }, {}],
  ] as const)('rejects valid-shaped late departure progress before %s is reached', (stage, dc9, departure) => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'dc9',
      dc9: {
        ...state.dc9,
        stage,
        ...dc9,
        departure: {
          checkpoint: 'initialClimb',
          completedBeats: ['rampRelease', 'taxi', 'holdShort', 'lineup', 'takeoffRoll', 'rotation'],
          attempts: { taxi: 2 },
          hintLevel: 2,
          completed: false,
          ...departure,
        },
      },
    })

    expect(loaded.dc9.stage).toBe(stage)
    expect(loaded.dc9.departure).toEqual(createInitialDc9DepartureProgress())
  })

  it('requires a complete route record before retaining a current Memphis departure checkpoint', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'dc9',
      dc9: {
        ...state.dc9,
        stage: 'memphisDeparture',
        controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
        routeSelections: ['DTW'],
        routeCompleted: ['DTW'],
        departure: {
          checkpoint: 'taxiTurn',
          completedBeats: ['rampRelease'],
          attempts: { taxi: 1 },
          hintLevel: 1,
          completed: false,
        },
      },
    })

    expect(loaded.dc9.stage).toBe('routeRecord')
    expect(loaded.dc9.departure).toEqual(createInitialDc9DepartureProgress())
  })

  it.each([
    ['homeOperations', {}],
    ['instrumentScan', { homeOperationsCompleted: true }],
    ['shutdown', {
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
    }],
    ['qualification', {
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      stage: 'qualification',
    }],
    ['keyReveal', {
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      stage: 'keyReveal',
    }],
    ['complete', {
      homeOperationsCompleted: true,
      instrumentScan: { identified: [...DC9_INSTRUMENT_SCAN_ORDER], attempts: 0 },
      secureSequence: [...dc9LegacyFlow.secureSequence],
      keyRevealed: true,
      keyClaimed: true,
      stage: 'complete',
    }],
  ] as const)('forces completed departure progress for current %s saves', (stage, dc9) => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      phase: 'dc9',
      dc9: {
        ...state.dc9,
        stage,
        routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
        routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
        departure: createInitialDc9DepartureProgress(),
        ...dc9,
      },
    })

    expect(loaded.dc9.departure).toMatchObject({ checkpoint: 'complete', completed: true })
  })

  it.each(['reward', 'mars'] as const)('preserves a v13 completed %s save', (phase) => {
    const loaded = loadRaw({
      ...v13Dc9(completedDc9() as unknown as Record<string, unknown>),
      phase,
      completedPuzzles: ['dc9', 'locker', 'airbus'],
      rewardUnlocked: true,
      marsUnlocked: phase === 'mars',
    })

    expect(loaded.phase).toBe(phase)
    expect(loaded.rewardUnlocked).toBe(true)
    expect(loaded.marsUnlocked).toBe(phase === 'mars')
    expect(loaded.dc9.departure.completed).toBe(true)
  })
})

describe('canonical schema-v14 storage', () => {
  it('round-trips completed DC-9 attempt history', () => {
    const storage = createMemoryStorage()
    const state: GameState = {
      ...createInitialState(),
      phase: 'locker',
      dc9: completedDc9(3, 6),
      completedPuzzles: ['dc9'],
    }

    saveGameState(state, storage)

    expect(loadGameState(storage).dc9).toMatchObject({ routeAttempts: 6, secureAttempts: 3 })
  })

  it('round-trips valid in-progress Airbus Captain Mode state', () => {
    const storage = createMemoryStorage()
    const state: GameState = {
      ...createInitialState(),
      phase: 'airbus',
      dc9: completedDc9(),
      lockerCompleted: [...lockerFlow.memoryIds],
      lockerIntroCompleted: true,
      lockerHatRevealed: true,
      airbusCaptainModeUnlocked: true,
      completedPuzzles: ['dc9', 'locker'],
      airbusAssignments: {
        sidestick: airbusCaptainFlow.controlMatch.sidestick,
        thrust: airbusCaptainFlow.controlMatch.thrust,
        gear: null,
        radio: null,
        altitude: null,
      },
      airbusQualificationAnswer: '1500',
    }

    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual(state)
  })

  it('normalizes corrupt schema-v12 workload fields while migrating to v14 without inventing completion', () => {
    const state = createInitialState()
    const loaded = loadRaw({
      ...state,
      schemaVersion: 12,
      phase: 'airbus',
      airbusAssignments: { ...airbusCaptainFlow.controlMatch },
      airbusSimulator: {
        ...state.airbusSimulator,
        familiarization: 'completed',
        cameraPhase: 'storm',
        location: 'stormLine',
        stormLine: {
          status: 'in_progress',
          checkpoint: 'stormEntry',
          attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
          bestTraits: [],
        },
        workload: {
          scanRange: 'planet',
          selectedWeatherSector: 'north',
          selectedSafeReturnSide: 'up',
          completedTasks: ['inventedTask', 'stormGapSelection'],
          attempts: {
            stormScanRange: -4,
            stormGapSelection: 'many',
            engineEventAcknowledgement: 2,
            engineSafeReturnSelection: 3,
          },
        },
      },
    })

    expect(loaded.airbusSimulator.workload).toEqual({
      scanRange: 'near',
      selectedWeatherSector: null,
      selectedSafeReturnSide: null,
      completedTasks: [],
      attempts: {
        stormScanRange: 0,
        stormGapSelection: 0,
        engineEventAcknowledgement: 2,
        engineSafeReturnSelection: 3,
      },
    })
    expect(loaded.completedPuzzles).not.toContain('airbus')
  })

  it('normalizes corrupt schema-v9 simulator fields to a safe durable checkpoint', () => {
    const saved = {
      ...createInitialState(),
      phase: 'airbus',
      airbusSimulator: {
        familiarization: 'unknown',
        stormLine: {
          status: 'flying-now',
          checkpoint: 'midair',
          attempts: { stormEntry: -4, stormCore: 'many', clearAir: 2 },
          bestTraits: ['weatherJudgment', 'inventedTrait'],
        },
      },
    }

    const loaded = loadRaw(saved)

    expect(loaded.airbusSimulator).toEqual({
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
  })

  it('writes only canonical state fields', () => {
    const storage = createMemoryStorage()
    saveGameState(createInitialState(), storage)
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>

    expect(saved.schemaVersion).toBe(14)
    expect(saved).toHaveProperty('airbusSimulator')
    expect(saved).toHaveProperty('airbusQualificationAnswer')
    expect(saved).toHaveProperty('airbusCaptainModeUnlocked')
    expect(saved).toHaveProperty('rewardUnlocked')
    expect(saved).not.toHaveProperty('airbusClockAnswer')
    expect(saved).not.toHaveProperty('captainModeUnlocked')
    expect(saved).not.toHaveProperty('captainRouteVerified')
    expect(saved).not.toHaveProperty('dc9SecureSequence')
    expect(saved).not.toHaveProperty('captainAttempts')
    expect(saved).not.toHaveProperty('routeSelections')
    expect(saved).not.toHaveProperty('captainRewardUnlocked')
  })

  it('recovers safely from corrupt saved data', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not-json' })
    expect(loadGameState(storage)).toEqual(createInitialState())
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('rejects unsupported schemas', () => {
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ ...createInitialState(), schemaVersion: 1 }),
    })
    expect(loadGameState(storage)).toEqual(createInitialState())
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })
})

describe('schema-v12 to schema-v14 DC-9 right-seat migration', () => {
  /** A v12 save has no controlCheck or instrumentScan fields at all. */
  function v12Dc9(dc9: Record<string, unknown>): Record<string, unknown> {
    const state = { ...createInitialState(), schemaVersion: 12, phase: 'dc9' } as Record<string, unknown>
    delete (state.dc9 as Record<string, unknown>).controlCheck
    delete (state.dc9 as Record<string, unknown>).instrumentScan
    return { ...state, dc9: { ...(state.dc9 as Record<string, unknown>), ...dc9 } }
  }

  it('puts an untouched v12 opening into the new control check', () => {
    const migrated = loadRaw(v12Dc9({ stage: 'intro' }))
    expect(migrated.schemaVersion).toBe(14)
    expect(migrated.dc9.stage).toBe('controlCheck')
    expect(migrated.dc9.controlCheck).toEqual([])
  })

  it('does not send a player who already reached the route record back to the yoke sweep', () => {
    const migrated = loadRaw(v12Dc9({ stage: 'routeRecord', routeSelections: ['DTW'], routeAttempts: 1 }))
    expect(migrated.dc9.stage).toBe('routeRecord')
    expect(migrated.dc9.controlCheck).toHaveLength(DC9_CONTROL_CHECK_ITEM_IDS.length)
  })

  it('offers the new instrument scan to a v12 save that had only reached the shutdown', () => {
    const migrated = loadRaw(v12Dc9({
      stage: 'shutdown',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      homePage: 4,
    }))
    expect(migrated.dc9.stage).toBe('instrumentScan')
    expect(migrated.dc9.instrumentScan).toEqual({ identified: [], attempts: 0 })
  })

  it('leaves a part-secured v12 cockpit alone rather than rewinding it', () => {
    const migrated = loadRaw(v12Dc9({
      stage: 'shutdown',
      routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
      routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
      homeOperationsCompleted: true,
      homePage: 4,
      secureSequence: ['apuBuses'],
    }))
    expect(migrated.dc9.stage).toBe('shutdown')
    expect(migrated.dc9.secureSequence).toEqual(['apuBuses'])
    expect(migrated.dc9.instrumentScan.identified).toHaveLength(DC9_INSTRUMENT_SCAN_ORDER.length)
  })

  it('round-trips a v13 save paused part-way through the control check', () => {
    const storage = createMemoryStorage()
    const state: GameState = {
      ...createInitialState(),
      phase: 'dc9',
      dc9: {
        ...createInitialState().dc9,
        stage: 'controlCheck',
        controlCheck: ['yokeAft', 'wheelLeft'],
      },
    }
    saveGameState(state, storage)
    expect(loadGameState(storage).dc9).toMatchObject({
      stage: 'controlCheck',
      controlCheck: ['yokeAft', 'wheelLeft'],
    })
  })

  it('round-trips a v13 save paused part-way through the instrument scan', () => {
    const storage = createMemoryStorage()
    const base = createInitialState()
    const state: GameState = {
      ...base,
      phase: 'dc9',
      dc9: {
        ...base.dc9,
        stage: 'instrumentScan',
        controlCheck: [...DC9_CONTROL_CHECK_ITEM_IDS],
        instrumentScan: { identified: ['airspeed', 'attitude'], attempts: 2 },
        routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
        routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
        homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
        homeOperationsCompleted: true,
      },
    }
    saveGameState(state, storage)
    expect(loadGameState(storage).dc9).toMatchObject({
      stage: 'instrumentScan',
      instrumentScan: { identified: ['airspeed', 'attitude'], attempts: 2 },
    })
  })

  it('discards a corrupt control check without losing the chapter', () => {
    const migrated = loadRaw({
      ...createInitialState(),
      phase: 'dc9',
      dc9: { ...createInitialState().dc9, stage: 'controlCheck', controlCheck: ['thrustClosed', 'nope'] },
    })
    expect(migrated.dc9.stage).toBe('controlCheck')
    expect(migrated.dc9.controlCheck).toEqual([])
  })
})
