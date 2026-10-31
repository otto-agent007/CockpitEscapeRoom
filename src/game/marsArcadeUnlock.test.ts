import { describe, expect, it } from 'vitest'
import { loadMarsArcadeUnlock, saveMarsArcadeUnlock, MARS_ARCADE_UNLOCK_KEY } from './marsArcadeUnlock'
import { clearGameState, STORAGE_KEY } from './storage'

describe('earned Mars arcade access', () => {
  it('stays locked with no completion record', () => {
    expect(loadMarsArcadeUnlock({ getItem: () => null })).toBe(false)
  })
  it.each(['broken', 'true', '{}', '{"version":2,"completedOnce":true}', '{"version":1,"completedOnce":"true"}', '{"version":1,"completedOnce":false}'])('rejects corrupt or unsupported record %s', raw => {
    expect(loadMarsArcadeUnlock({ getItem: () => raw })).toBe(false)
  })
  it('stores a versioned achievement independently of chapter saves', () => {
    const values = new Map<string, string>()
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) }, removeItem: (key: string) => { values.delete(key) } }
    expect(saveMarsArcadeUnlock(storage)).toBe(true)
    expect(JSON.parse(values.get(MARS_ARCADE_UNLOCK_KEY)!)).toEqual({ version: 1, completedOnce: true })
    values.set(STORAGE_KEY, '{}')
    clearGameState(storage)
    expect(values.has(STORAGE_KEY)).toBe(false)
    expect(loadMarsArcadeUnlock(storage)).toBe(true)
  })
  it('handles denied storage without breaking the game', () => {
    expect(loadMarsArcadeUnlock({ getItem: () => { throw new Error('denied') } })).toBe(false)
    expect(saveMarsArcadeUnlock({ setItem: () => { throw new Error('full') } })).toBe(false)
  })
})
