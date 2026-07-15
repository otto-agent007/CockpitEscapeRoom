import { describe, expect, it } from 'vitest'
import { dc9LegacyFlow, firstOfficerFlow, lockerFlow } from './config'
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

interface LegacyV6State {
  schemaVersion: 6
  phase: GameState['phase']
  airbusAssignments: GameState['airbusAssignments']
  airbusDecoyAssignments: GameState['airbusDecoyAssignments']
  airbusClockAnswer: string
  lockerCompleted: GameState['lockerCompleted']
  lockerAttempts: GameState['lockerAttempts']
  lockerIntroCompleted: boolean
  lockerHatRevealed: boolean
  captainModeUnlocked: boolean
  captainRouteVerified: boolean
  dc9SecureSequence: GameState['dc9SecureSequence']
  captainAttempts: GameState['captainAttempts']
  routeSelections: string[]
  completedPuzzles: GameState['completedPuzzles']
  hintsUsed: number
  captainRewardUnlocked: boolean
  marsUnlocked: boolean
  statusMessage: string
}

function createLegacyV6State(overrides: Partial<LegacyV6State> = {}): LegacyV6State {
  return {
    schemaVersion: 6,
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
    statusMessage: 'Legacy schema-v6 save.',
    ...overrides,
  }
}

function createCompletedDc9Progress(): GameState['dc9'] {
  return {
    stage: 'complete',
    routeSelections: [...dc9LegacyFlow.routePuzzleAnswers],
    routeCompleted: [...dc9LegacyFlow.routePuzzleAnswers],
    routeAttempts: 0,
    homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
    homeOperationsCompleted: true,
    secureSequence: [...dc9LegacyFlow.secureSequence],
    keyRevealed: true,
    keyClaimed: true,
  }
}

function createAirbusV7State(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createInitialState(),
    phase: 'airbus',
    dc9: createCompletedDc9Progress(),
    lockerCompleted: [...lockerFlow.memoryIds],
    lockerIntroCompleted: true,
    lockerHatRevealed: true,
    completedPuzzles: ['captain', 'locker'],
    ...overrides,
  }
}

describe('game storage', () => {
  it('keeps completed schema-v6 reward and Mars progress complete', () => {
    const legacy = createLegacyV6State({
      phase: 'mars',
      captainRouteVerified: true,
      dc9SecureSequence: [...dc9LegacyFlow.secureSequence],
      completedPuzzles: ['firstOfficer', 'locker', 'captain'],
      captainRewardUnlocked: true,
      marsUnlocked: true,
    })
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.schemaVersion).toBe(7)
    expect(migrated.phase).toBe('mars')
    expect(migrated.dc9.stage).toBe('complete')
    expect(migrated.dc9.keyRevealed).toBe(true)
    expect(migrated.dc9.keyClaimed).toBe(true)
    expect(migrated.captainRewardUnlocked).toBe(true)
    expect(migrated.marsUnlocked).toBe(true)
  })

  it('moves a route-verified schema-v6 Captain save to Home Operations', () => {
    const legacy = createLegacyV6State({
      phase: 'captain',
      captainRouteVerified: true,
      routeSelections: ['BTR', 'STL', 'TYS'],
      completedPuzzles: ['firstOfficer', 'locker'],
    })
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.schemaVersion).toBe(7)
    expect(migrated.phase).toBe('captain')
    expect(migrated.dc9.stage).toBe('homeOperations')
    expect(migrated.dc9.routeCompleted).toEqual(['DTW', 'MSP', 'STL'])
    expect(migrated.dc9.homeOperationsCompleted).toBe(false)
  })

  it.each(['airbus', 'locker'] as const)('restarts a pre-Captain schema-v6 %s save at the new opening', (phase) => {
    const legacy = createLegacyV6State({
      phase,
      completedPuzzles: phase === 'locker' ? ['firstOfficer'] : [],
      lockerIntroCompleted: phase === 'locker',
    })
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.phase).toBe('captain')
    expect(migrated.dc9.stage).toBe('intro')
    expect(migrated.dc9.routeCompleted).toEqual([])
    expect(migrated.completedPuzzles).toEqual(legacy.completedPuzzles)
  })

  it('normalizes corrupt schema-v7 DC-9 progress to a recoverable boundary', () => {
    const corrupt = {
      ...createInitialState(),
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
    }
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(corrupt) })

    const normalized = loadGameState(storage)
    expect(normalized.phase).toBe('captain')
    expect(normalized.dc9.stage).toBe('routeRecord')
    expect(normalized.dc9.routeSelections).toEqual([])
    expect(normalized.dc9.routeCompleted).toEqual(['DTW'])
    expect(normalized.dc9.routeAttempts).toBe(0)
    expect(normalized.dc9.secureSequence).toEqual([])
    expect(normalized.dc9.keyClaimed).toBe(false)
  })

  it('round-trips valid saved progress', () => {
    const storage = createMemoryStorage()
    const state = createAirbusV7State()
    saveGameState(state, storage)
    expect(loadGameState(storage)).toEqual(state)
  })

  it('clears stale Airbus clock answers when loading saved progress', () => {
    const storage = createMemoryStorage()
    const state = createAirbusV7State({ airbusClockAnswer: '1500' })
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({ ...state, airbusClockAnswer: '' })
  })

  it('keeps completed Airbus label saves at the Airline Transport Pilot question with a blank answer', () => {
    const storage = createMemoryStorage()
    const state = createAirbusV7State({
      airbusAssignments: {
        sidestick: firstOfficerFlow.controlMatch.sidestick,
        thrust: firstOfficerFlow.controlMatch.thrust,
        gear: firstOfficerFlow.controlMatch.gear,
        radio: firstOfficerFlow.controlMatch.radio,
        altitude: firstOfficerFlow.controlMatch.altitude,
      },
      airbusClockAnswer: '1500',
    })
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({
      ...state,
      airbusClockAnswer: '',
    })
  })

  it('moves completed First-Officer progress forward to the reward after reload', () => {
    const storage = createMemoryStorage()
    const state = createAirbusV7State({
      completedPuzzles: ['captain', 'locker', 'firstOfficer'],
      airbusClockAnswer: '1500',
    })
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({
      ...state,
      phase: 'reward',
      captainRewardUnlocked: true,
      airbusClockAnswer: '1500',
    })
  })

  it('recovers safely from corrupt saved data', () => {
    const storage = createMemoryStorage({ [STORAGE_KEY]: '{not-json' })
    expect(loadGameState(storage)).toEqual(createInitialState())
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('rejects an outdated schema', () => {
    const storage = createMemoryStorage({
      [STORAGE_KEY]: JSON.stringify({ ...createInitialState(), schemaVersion: 1 }),
    })
    expect(loadGameState(storage)).toEqual(createInitialState())
  })

  it('migrates an in-progress schema-v3 locker without erasing First-Officer progress', () => {
    const legacy = {
      ...createInitialState(),
      schemaVersion: 3,
      phase: 'locker',
      lockerCompleted: ['watch', 'nameplate'],
      completedPuzzles: ['firstOfficer'],
    }
    delete (legacy as Partial<GameState>).lockerAttempts
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.schemaVersion).toBe(7)
    expect(migrated.phase).toBe('captain')
    expect(migrated.lockerCompleted).toEqual(['watch'])
    expect(migrated.lockerAttempts).toEqual({ watch: 0, baseball: 0, chargingBull: 0, wings: 0 })
    expect(migrated.lockerIntroCompleted).toBe(true)
    expect(migrated.completedPuzzles).toEqual(['firstOfficer'])
  })

  it('migrates a schema-v4 locker as an already-seen intro without losing progress', () => {
    const legacy = {
      ...createInitialState(),
      schemaVersion: 4,
      phase: 'locker',
      lockerCompleted: ['watch'],
      completedPuzzles: ['firstOfficer'],
    }
    delete (legacy as Partial<GameState>).lockerIntroCompleted
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.schemaVersion).toBe(7)
    expect(migrated.phase).toBe('captain')
    expect(migrated.lockerIntroCompleted).toBe(true)
    expect(migrated.lockerCompleted).toEqual(['watch'])
    expect(migrated.completedPuzzles).toEqual(['firstOfficer'])
  })

  it('preserves schema-v5 saves created before the Bull question was added', () => {
    const legacy = { ...createInitialState(), phase: 'locker', lockerCompleted: ['watch', 'baseball'], lockerAttempts: { watch: 1, baseball: 2 } }
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    expect(loadGameState(storage).lockerAttempts).toEqual({ watch: 1, baseball: 2, chargingBull: 0, wings: 0 })
    expect(loadGameState(storage).lockerCompleted).toEqual(['watch', 'baseball'])
  })

  it('preserves schema-v5 completion created before the Wings question was added', () => {
    const legacy = {
      ...createInitialState(),
      phase: 'locker',
      lockerCompleted: ['watch', 'baseball', 'chargingBull', 'wings'],
      lockerHatRevealed: true,
      lockerAttempts: { watch: 1, baseball: 2, chargingBull: 1 },
    }
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.lockerAttempts).toEqual({ watch: 1, baseball: 2, chargingBull: 1, wings: 0 })
    expect(migrated.lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull', 'wings'])
    expect(migrated.lockerHatRevealed).toBe(true)
  })

  it('migrates an in-progress schema-v5 Captain save back to route verification', () => {
    const legacy = {
      ...createInitialState(),
      schemaVersion: 5,
      phase: 'captain',
      switchSequence: ['battery', 'navigation'],
      routeSelections: ['BTR', 'LAX', 'obsolete'],
    }
    delete (legacy as Partial<GameState>).captainRouteVerified
    delete (legacy as Partial<GameState>).dc9SecureSequence
    delete (legacy as Partial<GameState>).captainAttempts
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.schemaVersion).toBe(7)
    expect(migrated.phase).toBe('captain')
    expect(migrated.captainRouteVerified).toBe(false)
    expect(migrated.dc9SecureSequence).toEqual([])
    expect(migrated.routeSelections).toEqual(['BTR'])
    expect(migrated.dc9.stage).toBe('routeRecord')
  })

  it.each(['reward', 'mars'] as const)('preserves schema-v5 %s completion and reward state', (phase) => {
    const legacy = {
      ...createInitialState(),
      schemaVersion: 5,
      phase,
      completedPuzzles: ['firstOfficer', 'locker', 'captain'],
      captainRewardUnlocked: true,
      marsUnlocked: phase === 'mars',
      switchSequence: ['battery', 'navigation', 'cabin'],
    }
    delete (legacy as Partial<GameState>).captainRouteVerified
    delete (legacy as Partial<GameState>).dc9SecureSequence
    delete (legacy as Partial<GameState>).captainAttempts
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    const migrated = loadGameState(storage)
    expect(migrated.phase).toBe(phase)
    expect(migrated.completedPuzzles).toContain('captain')
    expect(migrated.captainRewardUnlocked).toBe(true)
    expect(migrated.dc9SecureSequence).toEqual([...dc9LegacyFlow.secureSequence])
  })

  it('preserves a schema-v3 unlocked hat as completed new locker memories', () => {
    const legacy = {
      ...createInitialState(),
      schemaVersion: 3,
      phase: 'locker',
      lockerCompleted: ['watch', 'baseball', 'nameplate', 'routeStrip', 'checklist'],
      lockerHatRevealed: true,
    }
    delete (legacy as Partial<GameState>).lockerAttempts
    const storage = createMemoryStorage({ [STORAGE_KEY]: JSON.stringify(legacy) })

    expect(loadGameState(storage).lockerCompleted).toEqual(['watch', 'baseball', 'chargingBull', 'wings'])
  })
})
