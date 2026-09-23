import { describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT as neutral, type MarsArcadeSide } from '../game/marsArcade'
import { updateHeavyReactions, type HeavyReactions } from './arcadeHarnessReactions'
import { selectArcadeSprite, ARCADE_SPRITE_SOURCES } from './arcadeHarnessSprites'

function block(side: MarsArcadeSide, button: 'heavy' | 'light' = 'heavy', crush = false) {
  let state = createMarsArcadeRound(side === 0 ? 'booster' : 'oracle', side === 0 ? 'oracle' : 'booster')
  state.phase = 'fight'
  const defender = side === 0 ? 1 : 0
  state.fighters[0].x = side === 0 ? 216 : -240
  state.fighters[1].x = state.fighters[0].x + 24
  if (crush) state.fighters[defender].guard = 1
  let reactions: HeavyReactions = [null, null]
  const seen = new Set<string>()
  const health = state.fighters[defender].health
  const guard = state.fighters[defender].guard
  for (let frame = 0; frame < 20; frame++) {
    const inputs = [{ ...neutral }, { ...neutral }]
    inputs[side]![button] = frame === 0
    inputs[defender]!.move = side === 0 ? 1 : -1
    const transition = advanceMarsArcade(state, [inputs[0]!, inputs[1]!], 1 / 60)
    reactions = updateHeavyReactions(reactions, state, transition.state, transition.events)
    state = transition.state
    seen.add(selectArcadeSprite(state, defender, false, 0, reactions[defender]).label)
    if (transition.events.some(e => e.type === 'blocked' || e.type === 'hit')) return { state, reactions, seen, health, guard }
  }
  throw new Error('native rules fixture did not connect')
}

describe('Oracle blocked-heavy presentation', () => {
  it.each([0, 1] as const)('braces then compresses and settles on side %i within original blockstun', side => {
    const fixture = block(side)
    const { seen, health, guard } = fixture
    let { state, reactions } = fixture
    const defender = side === 0 ? 1 : 0
    expect(seen.has('heavy block — brace')).toBe(true)
    expect(health - state.fighters[defender].health).toBe(3)
    expect(guard - state.fighters[defender].guard).toBe(16)
    expect(state.fighters[defender].stunFrames).toBe(14)
    const sources = new Set<string>()
    for (let frame = 0; frame < 14; frame++) {
      const before = structuredClone(state)
      const pose = selectArcadeSprite(state, defender, false, 0, reactions[defender])
      expect(state).toEqual(before)
      expect(pose.label).not.toContain('heavy hit')
      expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
      expect(selectArcadeSprite(state, defender, true, 0, reactions[defender]).src).toBe(pose.src)
      sources.add(pose.src)
      seen.add(pose.label)
      const transition = advanceMarsArcade(state, [neutral, neutral], 1 / 60)
      reactions = updateHeavyReactions(reactions, state, transition.state, transition.events)
      state = transition.state
    }
    expect([...seen]).toEqual(['heavy block — brace', 'heavy block — compress', 'heavy block — settle', 'heavy block — guard'])
    expect(sources.size).toBe(3)
    expect(state.fighters[defender].activity).toBe('idle')
    expect(reactions[defender]).toBeNull()
  })

  it('keeps light blocks static and guard crush on the clean-hit path', () => {
    const light = block(0, 'light')
    expect(light.reactions).toEqual([null, null])
    expect(selectArcadeSprite(light.state, 1, false, 0, light.reactions[1]).label).toBe('raised guard')
    const crush = block(0, 'heavy', true)
    expect(crush.health - crush.state.fighters[1].health).toBe(13)
    expect(selectArcadeSprite(crush.state, 1, false, 0, crush.reactions[1]).label).toBe('heavy hit — impact')
  })

  it('does not brace for a distant heavy or retain block reaction after reset', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'heavy', moveFrame: 2 })
    state.fighters[1].blocking = true
    expect(selectArcadeSprite(state, 1, false).label).toBe('raised guard')
    const blocked = block(0)
    expect(updateHeavyReactions(blocked.reactions, blocked.state, createMarsArcadeRound('booster', 'oracle'), [])).toEqual([null, null])
  })
})
