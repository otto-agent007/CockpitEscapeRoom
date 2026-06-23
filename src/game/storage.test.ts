import { describe, expect, it } from 'vitest'
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
})
