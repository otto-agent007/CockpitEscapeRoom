import { afterEach, describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, MARS_ARCADE_TIMING, NEUTRAL_MARS_ARCADE_INPUT, type MarsArcadeInput } from './marsArcade'
import { marsArcadeDefaultTuning, setMarsArcadeTuning } from './marsArcadeFighters'
import { parseMarsArcadeTuning } from './marsArcadeTuning'

afterEach(() => setMarsArcadeTuning(null))

describe('Captain palm jab replacing composure', () => {
  it('hits after six startup frames, causes five damage once, and earns hit meter rather than free composure', () => {
    setMarsArcadeTuning({ ...marsArcadeDefaultTuning(), rules: { useBounds: false, hitstop: false } })
    let state = createMarsArcadeRound('captain', 'booster')
    state.phase = 'fight'; state.fighters[0].x = -14; state.fighters[1].x = 14
    const input: [MarsArcadeInput, MarsArcadeInput] = [{ ...NEUTRAL_MARS_ARCADE_INPUT, light: true }, NEUTRAL_MARS_ARCADE_INPUT]
    for (let tick = 1; tick <= 20; tick++) {
      const result = advanceMarsArcade(state, input, MARS_ARCADE_TIMING.frameSeconds)
      state = result.state
      expect(result.events.some(event => event.type === 'composure')).toBe(false)
      expect(state.fighters[1].health).toBe(tick <= 6 ? 100 : 95)
      expect(result.events.filter(event => event.type === 'hit')).toHaveLength(tick === 7 ? 1 : 0)
      expect(state.fighters[0].meter).toBe(tick <= 6 ? 0 : 6)
    }
    expect(state.fighters[0].activity).toBe('idle')
  })

  it('migrates old composure tuning to a damaging jab while preserving other edits and rule choices', () => {
    const old = structuredClone(marsArcadeDefaultTuning())
    old.version = 2
    old.fighters.captain.moves.light = { damage: 0, chipDamage: 0, guardDamage: 0, knockback: 0, hitstunFrames: 0, blockstunFrames: 0, hitstopFrames: 2 }
    old.fighters.booster.walkSpeed = 1.8; old.fighters.oracle.moves.heavy.damage = 17
    old.rules = { useBounds: true, hitstop: false }
    const migrated = parseMarsArcadeTuning(old)
    expect(migrated.version).toBe(3)
    expect(migrated.fighters.captain.moves.light).toEqual({ damage: 5, chipDamage: 1, guardDamage: 6, knockback: 2, hitstunFrames: 14, blockstunFrames: 10, hitstopFrames: 2 })
    expect(migrated.fighters.booster).toEqual(old.fighters.booster)
    expect(migrated.fighters.oracle).toEqual(old.fighters.oracle)
    expect(migrated.fighters.captain.moves.heavy).toEqual(old.fighters.captain.moves.heavy)
    expect(migrated.rules).toEqual(old.rules)
    expect(old.fighters.captain.moves.light.damage).toBe(0)
  })

  it('validates legacy Captain values before migration and preserves deliberate zero damage in the new schema', () => {
    const old = structuredClone(marsArcadeDefaultTuning()); old.version = 2
    old.fighters.captain.moves.light.damage = -1
    expect(() => parseMarsArcadeTuning(old)).toThrow(/captain.light.damage/)
    const current = structuredClone(marsArcadeDefaultTuning()); current.version = 3
    current.fighters.captain.moves.light.damage = 0
    expect(parseMarsArcadeTuning(current).fighters.captain.moves.light.damage).toBe(0)
  })
})
