import { describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT as neutral, type MarsArcadeSide } from '../game/marsArcade'
import { updateHeavyReactions, type HeavyReactions } from './arcadeHarnessReactions'
import { selectArcadeSprite, ARCADE_SPRITE_SOURCES } from './arcadeHarnessSprites'

function hit(side: MarsArcadeSide, button: 'heavy' | 'light' = 'heavy', corner = false, attackerId: 'booster' | 'oracle' = 'booster', startingHealth = 100) {
  const defenderId = attackerId === 'booster' ? 'oracle' : 'booster'
  let state = createMarsArcadeRound(side === 0 ? attackerId : defenderId, side === 0 ? defenderId : attackerId)
  state.fighters[side === 0 ? 1 : 0].health = startingHealth
  state.phase = 'fight'
  state.fighters[0].x = corner ? (side === 0 ? 216 : -240) : -12
  state.fighters[1].x = state.fighters[0].x + 24
  let reactions: HeavyReactions = [null, null]
  for (let i = 0; i < 20; i++) {
    const inputs = [{ ...neutral }, { ...neutral }]
    inputs[side]![button] = i === 0
    const transition = advanceMarsArcade(state, [inputs[0]!, inputs[1]!], 1 / 60)
    reactions = updateHeavyReactions(reactions, state, transition.state, transition.events)
    state = transition.state
    if (transition.events.some(e => e.type === 'hit')) return { state, reactions }
  }
  throw new Error('native rules fixture did not hit')
}

describe('heavy hit presentation', () => {
  it.each([
    { side: 0, attacker: 'booster' }, { side: 1, attacker: 'booster' },
    { side: 0, attacker: 'oracle' }, { side: 1, attacker: 'oracle' },
  ] as const)('connects $attacker heavy reaction from side $side without changing rules', ({ side, attacker }) => {
    let { state, reactions } = hit(side, 'heavy', false, attacker)
    const defender = side === 0 ? 1 : 0
    const health = state.fighters[defender].health
    expect(100 - health).toBe(attacker === 'oracle' ? 11 : 13)
    const duration = state.fighters[defender].stunFrames
    const sources = new Set<string>()
    const x = state.fighters[defender].x
    const seen = new Set<string>()
    let previousDistance = Infinity
    for (let frame = 0; frame <= duration; frame++) {
      const before = structuredClone(state)
      const pose = selectArcadeSprite(state, defender, false, 0, reactions[defender])
      expect(state).toEqual(before)
      expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
      expect(state.fighters[defender].health).toBe(health)
      expect(state.fighters[defender].x).toBe(x)
      const distance = Math.abs((pose.renderX ?? x) - x)
      expect(distance).toBeLessThanOrEqual(previousDistance)
      previousDistance = distance
      seen.add(pose.label)
      if (state.fighters[defender].activity === 'hitstun') sources.add(pose.src)
      if (frame === 0) expect(distance).toBeGreaterThan(0)
      if (frame >= 8) expect(distance).toBe(0)
      const reduced = selectArcadeSprite(state, defender, true, 0, reactions[defender])
      expect(reduced.renderX ?? x).toBe(x)
      if (state.fighters[defender].activity === 'hitstun') expect(reduced.src).toBe(pose.src)
      const transition = advanceMarsArcade(state, [neutral, neutral], 1 / 60)
      reactions = updateHeavyReactions(reactions, state, transition.state, transition.events)
      state = transition.state
    }
    expect([...seen]).toEqual(['heavy hit — impact', 'heavy hit — stagger', 'heavy hit — recover', 'idle pilot'])
    expect(reactions[defender]).toBeNull()
    expect(sources.size).toBe(attacker === 'oracle' ? 3 : 2)
  })

  it('leaves light-hit recoil and corner-clamped knockback intact', () => {
    const light = hit(0, 'light')
    expect(light.reactions).toEqual([null, null])
    expect(selectArcadeSprite(light.state, 1, false, 0, light.reactions[1]).label).toBe('hit recoil')
    for (const side of [0, 1] as const) {
      const { state, reactions } = hit(side, 'heavy', true)
      const defender = side === 0 ? 1 : 0
      expect(selectArcadeSprite(state, defender, false, 0, reactions[defender]).renderX).toBe(state.fighters[defender].x)
    }
  })

  it('keeps Booster KO animation ahead of hit recovery and leaves his blocked hits unchanged', () => {
    for (const side of [0, 1] as const) {
      const defender = side === 0 ? 1 : 0
      const ko = hit(side, 'heavy', false, 'oracle', 11)
      expect(ko.state.phase).toBe('ko')
      expect(ko.reactions).toEqual([null, null])
      expect(selectArcadeSprite(ko.state, defender, false, 0, ko.reactions[defender]).label).toBe('knockout 0')
      const blocked = hit(side, 'heavy', false, 'oracle')
      blocked.state.fighters[defender].activity = 'blockstun'
      const reactions = updateHeavyReactions(blocked.reactions, blocked.state, blocked.state,
        [{ type: 'blocked', attacker: side, moveId: 'oracle.hardCutoff', chipDamage: 2 }])
      expect(reactions).toEqual([null, null])
      expect(selectArcadeSprite(blocked.state, defender, false, 0, reactions[defender]).label).toBe('raised guard')
    }
  })

  it('clears on terminal phases, reset and non-heavy hits instead of replaying stale reactions', () => {
    const { state, reactions } = hit(0)
    const reset = createMarsArcadeRound('booster', 'oracle')
    expect(updateHeavyReactions(reactions, state, reset, [])).toEqual([null, null])
    expect(updateHeavyReactions(reactions, state, { ...state, phase: 'ko' }, [])).toEqual([null, null])
    expect(updateHeavyReactions(reactions, state, state, [{ type: 'hit', attacker: 0, moveId: 'booster.padJab', damage: 5 }])).toEqual([null, null])
    const guarded = structuredClone(state)
    guarded.fighters[1].activity = 'blockstun'
    expect(updateHeavyReactions(reactions, state, guarded, [{ type: 'blocked', attacker: 0, moveId: 'booster.staticFire', chipDamage: 3 }])).toEqual([null, { kind: 'block', duration: 14, offsetX: 0 }])
  })
})
