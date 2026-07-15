import { describe, expect, it } from 'vitest'
import { airbusCaptainFlow, dc9LegacyFlow, lockerFlow } from './config'
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

describe('schema-v7 to schema-v8 migration', () => {
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

    expect(migrated.schemaVersion).toBe(8)
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

    expect(migrated.schemaVersion).toBe(8)
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

    expect(migrated.schemaVersion).toBe(8)
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

    expect(migrated.schemaVersion).toBe(8)
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

describe('canonical schema-v8 storage', () => {
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

  it('writes only canonical state fields', () => {
    const storage = createMemoryStorage()
    saveGameState(createInitialState(), storage)
    const saved = JSON.parse(storage.getItem(STORAGE_KEY) ?? '{}') as Record<string, unknown>

    expect(saved.schemaVersion).toBe(8)
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
