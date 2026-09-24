import { afterEach, describe, expect, it } from 'vitest'

import { MARS_ARCADE_TIMING, advanceMarsArcade, createMarsArcadeRound } from './marsArcade'
import {
  MARS_ARCADE_FIGHTERS,
  marsArcadeDefaultTuning,
  marsArcadeFighter,
  marsArcadeGravity,
  marsArcadeTuningInForce,
  setMarsArcadeTuning,
} from './marsArcadeFighters'
import { MARS_ARCADE_SHIPPED_TUNING, applyShippedMarsArcadeTuning, parseMarsArcadeTuning } from './marsArcadeTuning'
import shipped from './marsArcadeTuning.json'

afterEach(() => setMarsArcadeTuning(null))

describe('the shipped tuning file', () => {
  it('parses and covers every fighter, move and field', () => {
    const tuning = parseMarsArcadeTuning(shipped)
    for (const id of ['booster', 'oracle', 'captain'] as const) {
      expect(Object.keys(tuning.fighters[id].moves).sort()).toEqual(['heavy', 'light', 'special'])
    }
    expect(MARS_ARCADE_SHIPPED_TUNING).toEqual(tuning)
  })

  it('is, as shipped, exactly the baked content: applying it changes no number', () => {
    // The file exists so the playground can diverge from the content deliberately.
    // Until the owner does, the cabinet must play the numbers the tests were written
    // against, and this is the check that the file has not drifted by accident.
    expect(MARS_ARCADE_SHIPPED_TUNING).toEqual(marsArcadeDefaultTuning())
    const before = structuredClone(marsArcadeFighter('booster'))
    applyShippedMarsArcadeTuning()
    expect(marsArcadeFighter('booster')).toEqual(before)
    expect(marsArcadeGravity()).toBe(0.28)
  })
})

describe('tuning in force', () => {
  it('overrides walk speed, jump, health, gravity and move numbers, and resets to the content', () => {
    const tuning = marsArcadeDefaultTuning()
    tuning.fighters.oracle.walkSpeed = 2.5
    tuning.fighters.oracle.health = 150
    tuning.fighters.oracle.moves.light.damage = 9
    tuning.stage.gravity = 0.5
    setMarsArcadeTuning(tuning)
    expect(marsArcadeFighter('oracle').walkSpeed).toBe(2.5)
    expect(marsArcadeFighter('oracle').health).toBe(150)
    expect(marsArcadeFighter('oracle').moves.light.damage).toBe(9)
    // Reach is art-bound and not part of the tuning.
    expect(marsArcadeFighter('oracle').moves.light.reach).toBe(MARS_ARCADE_FIGHTERS.oracle.moves.light.reach)
    expect(marsArcadeGravity()).toBe(0.5)
    expect(marsArcadeTuningInForce().fighters.oracle.walkSpeed).toBe(2.5)
    setMarsArcadeTuning(null)
    expect(marsArcadeFighter('oracle').walkSpeed).toBe(MARS_ARCADE_FIGHTERS.oracle.walkSpeed)
    expect(marsArcadeGravity()).toBe(0.28)
  })

  it('reaches the fight loop: a tuned fighter walks at the tuned speed and starts with the tuned health', () => {
    const tuning = marsArcadeDefaultTuning()
    tuning.fighters.booster.walkSpeed = 3
    tuning.fighters.booster.health = 60
    setMarsArcadeTuning(tuning)
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    expect(state.fighters[0].health).toBe(60)
    const x = state.fighters[0].x
    const next = advanceMarsArcade(state, [{ move: 1, jump: false, light: false, heavy: false, special: false }, { move: 0, jump: false, light: false, heavy: false, special: false }], MARS_ARCADE_TIMING.frameSeconds).state
    expect(next.fighters[0].x - x).toBeCloseTo(3)
  })

  it('never lets the content leak tuned numbers', () => {
    const tuning = marsArcadeDefaultTuning()
    tuning.fighters.captain.moves.heavy.damage = 99
    setMarsArcadeTuning(tuning)
    expect(MARS_ARCADE_FIGHTERS.captain.moves.heavy.damage).not.toBe(99)
  })
})

describe('parsing refuses what the playground must never write', () => {
  const broken = (mutate: (tuning: ReturnType<typeof marsArcadeDefaultTuning>) => void) => {
    const tuning = structuredClone(marsArcadeDefaultTuning()) as unknown as Record<string, unknown>
    mutate(tuning as unknown as ReturnType<typeof marsArcadeDefaultTuning>)
    return tuning
  }

  it('a negative walk speed, a NaN damage, a missing move, an old version', () => {
    expect(() => parseMarsArcadeTuning(broken((t) => { t.fighters.booster.walkSpeed = -1 }))).toThrow(/walkSpeed/)
    expect(() => parseMarsArcadeTuning(broken((t) => { t.fighters.booster.moves.light.damage = Number.NaN }))).toThrow(/damage/)
    expect(() => parseMarsArcadeTuning(broken((t) => { delete (t.fighters.oracle.moves as Partial<typeof t.fighters.oracle.moves>).heavy }))).toThrow(/moves.heavy/)
    expect(() => parseMarsArcadeTuning({ ...marsArcadeDefaultTuning(), version: 0 })).toThrow(/version 0/)
  })
})
