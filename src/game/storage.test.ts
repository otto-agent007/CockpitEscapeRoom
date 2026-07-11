import { describe, expect, it } from 'vitest'
import { firstOfficerFlow } from './config'
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

describe('game storage', () => {
  it('round-trips valid saved progress', () => {
    const storage = createMemoryStorage()
    const state: GameState = { ...createInitialState(), phase: 'airbus', captainRewardUnlocked: true }
    saveGameState(state, storage)
    expect(loadGameState(storage)).toEqual(state)
  })

  it('clears stale Airbus clock answers when loading saved progress', () => {
    const storage = createMemoryStorage()
    const state: GameState = { ...createInitialState(), phase: 'airbus', airbusClockAnswer: '1500' }
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({ ...state, airbusClockAnswer: '' })
  })

  it('keeps completed Airbus label saves at the Airline Transport Pilot question with a blank answer', () => {
    const storage = createMemoryStorage()
    const state: GameState = {
      ...createInitialState(),
      phase: 'airbus',
      airbusAssignments: {
        sidestick: firstOfficerFlow.controlMatch.sidestick,
        thrust: firstOfficerFlow.controlMatch.thrust,
        gear: firstOfficerFlow.controlMatch.gear,
        radio: firstOfficerFlow.controlMatch.radio,
        altitude: firstOfficerFlow.controlMatch.altitude,
      },
      airbusClockAnswer: '1500',
    }
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({
      ...state,
      airbusClockAnswer: '',
    })
  })

  it('resumes the First-Officer celebration after reload', () => {
    const storage = createMemoryStorage()
    const state: GameState = {
      ...createInitialState(),
      phase: 'airbus',
      completedPuzzles: ['firstOfficer'],
      airbusClockAnswer: '1500',
    }
    saveGameState(state, storage)

    expect(loadGameState(storage)).toEqual({ ...state, airbusClockAnswer: '' })
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
    expect(migrated.schemaVersion).toBe(5)
    expect(migrated.lockerCompleted).toEqual(['watch'])
    expect(migrated.lockerAttempts).toEqual({ watch: 0, baseball: 0 })
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
    expect(migrated.schemaVersion).toBe(5)
    expect(migrated.lockerIntroCompleted).toBe(true)
    expect(migrated.lockerCompleted).toEqual(['watch'])
    expect(migrated.completedPuzzles).toEqual(['firstOfficer'])
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

    expect(loadGameState(storage).lockerCompleted).toEqual(['watch', 'baseball', 'wings', 'chargingBull'])
  })
})
