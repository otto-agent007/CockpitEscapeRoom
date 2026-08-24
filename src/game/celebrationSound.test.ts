import { describe, expect, it } from 'vitest'
import {
  CELEBRATION_SOUND_FILE,
  CELEBRATION_SOUND_STORAGE_KEY,
  CELEBRATION_SOUND_VOLUME,
  readCelebrationMuted,
  writeCelebrationMuted,
} from './celebrationSound'

function memoryStorage(initial?: string) {
  const store = new Map<string, string>()
  if (initial !== undefined) store.set(CELEBRATION_SOUND_STORAGE_KEY, initial)
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value) },
    raw: () => store.get(CELEBRATION_SOUND_STORAGE_KEY),
  }
}

describe('celebration sound preference', () => {
  it('plays by default', () => {
    expect(readCelebrationMuted(memoryStorage())).toBe(false)
  })

  it('round-trips the muted choice', () => {
    const storage = memoryStorage()
    writeCelebrationMuted(storage, true)
    expect(readCelebrationMuted(storage)).toBe(true)
    writeCelebrationMuted(storage, false)
    expect(readCelebrationMuted(storage)).toBe(false)
  })

  it('treats anything unreadable as not muted, so a bad value cannot silence the game', () => {
    for (const stored of ['', 'not json', '[]', 'null', '"muted"', '{"muted":"yes"}', '{"muted":1}', '{}']) {
      expect(readCelebrationMuted(memoryStorage(stored)), stored).toBe(false)
    }
  })

  it('survives a storage that refuses to read or write', () => {
    const hostile = {
      getItem: () => { throw new Error('blocked') },
      setItem: () => { throw new Error('quota') },
    }
    expect(readCelebrationMuted(hostile)).toBe(false)
    expect(() => writeCelebrationMuted(hostile, true)).not.toThrow()
  })

  it('keeps the preference outside the game-state key, so Restart does not unmute', () => {
    expect(CELEBRATION_SOUND_STORAGE_KEY).not.toBe('cockpit-escape-room:game-state:v1')
  })

  it('plays the shipped file back under unity', () => {
    expect(CELEBRATION_SOUND_FILE).toBe('audio/key-celebration.mp3')
    expect(CELEBRATION_SOUND_VOLUME).toBeGreaterThan(0)
    expect(CELEBRATION_SOUND_VOLUME).toBeLessThan(1)
  })
})
