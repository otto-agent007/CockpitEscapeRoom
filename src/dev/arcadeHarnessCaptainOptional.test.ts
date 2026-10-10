import { afterEach, describe, expect, it, vi } from 'vitest'

// Isolate synthetic clips inside this test module, including after real adoption.
vi.mock('../game/marsArcadeAnimations.json', async () => {
  const actual = await vi.importActual<{ default: typeof animationFixture }>('../game/marsArcadeAnimations.json')
  const file = structuredClone(actual.default)
  const idle = file.animations.find(clip => clip.fighter === 'captain' && clip.animation === 'idle')!
  file.animations = file.animations.filter(clip => clip.fighter !== 'captain' ||
    !['hit', 'heavy-block', 'jump', 'victory', 'knockout'].includes(clip.animation))
  for (const [animation, loop, poses, holds] of [
    ['hit', 'by-stun', ['impact', 'stagger', 'recover'], [3, 10, 9]],
    ['heavy-block', 'by-stun', ['compress', 'settle', 'guard-ready'], [5, 6, 3]],
    ['jump', 'once', ['rise', 'apex', 'fall'], [8, 8, 8]],
    ['victory', 'hold-last', ['prepare', 'raise', 'salute'], [10, 8, 12]],
    ['knockout', 'hold-last', ['off-balance', 'sit-down', 'seated'], [12, 12, 12]],
  ] as const) {
    file.animations.push({ fighter: 'captain', animation, loop, reviewed: false,
      frames: poses.map((pose, index) => ({ ...idle.frames[0]!, pose, hold: holds[index]! })) })
  }
  return { default: file }
})

import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT } from '../game/marsArcade'
import { marsArcadeDefaultTuning, marsArcadeFighter, setMarsArcadeTuning } from '../game/marsArcadeFighters'
import { marsArcadeRulesFrame, setMarsArcadeClipOverride } from '../game/marsArcadePose'
import { selectArcadeSprite } from './arcadeHarnessSprites'
import animationFixture from '../game/marsArcadeAnimations.json'

afterEach(() => {
  setMarsArcadeTuning(null)
  for (const name of ['hit', 'heavy-block', 'jump', 'victory', 'knockout']) setMarsArcadeClipOverride('captain', name, null)
})

describe('optional Captain animation support', () => {
  it.each([false, true])('records the real incoming heavy stun without changing damage; blocked=%s', (blocked) => {
    const tuning = marsArcadeDefaultTuning()
    setMarsArcadeTuning({ ...tuning, rules: { ...tuning.rules, hitstop: false } })
    const previous = createMarsArcadeRound('booster', 'captain'); previous.phase = 'fight'
    previous.fighters[0].x = -12; previous.fighters[1].x = 12
    const move = marsArcadeFighter('booster').moves.heavy
    Object.assign(previous.fighters[0], { activity: 'attack', activeButton: 'heavy', moveFrame: move.startupFrames - 1 })
    previous.fighters[1].blocking = blocked
    const state = advanceMarsArcade(previous, [NEUTRAL_MARS_ARCADE_INPUT, { ...NEUTRAL_MARS_ARCADE_INPUT, move: blocked ? 1 : 0 }], 1 / 60).state
    const defender = state.fighters[1]
    expect(defender.health).toBe(100 - (blocked ? move.chipDamage : move.damage))
    expect(defender.stunOrigin).toEqual({ moveId: move.id, button: 'heavy', duration: blocked ? move.blockstunFrames : move.hitstunFrames })
    expect(previous.fighters[1].stunOrigin).toBeUndefined()
    expect(selectArcadeSprite(state, 1, false).frame?.pose).toBe(blocked ? 'compress' : 'impact')
  })

  it('shares editable hit holds with rules on both sides and freezes them through real hit stop', () => {
    const state = createMarsArcadeRound('captain', 'captain'); state.phase = 'fight'
    for (const side of [0, 1] as const) {
      const fighter = state.fighters[side]
      Object.assign(fighter, { activity: 'hitstun', stunFrames: 22, stunOrigin: { moveId: 'booster.heavy', button: 'heavy', duration: 22 } })
      for (const [remaining, pose] of [[22, 'impact'], [19, 'stagger'], [9, 'recover']] as const) {
        fighter.stunFrames = remaining
        for (const reduced of [false, true]) {
          expect(selectArcadeSprite(state, side, reduced).frame?.pose).toBe(pose)
          expect(marsArcadeRulesFrame(state, side)?.pose).toBe(pose)
        }
      }
      fighter.stunFrames = 22
    }
    state.hitstop = { frames: 2, framesRemaining: 2, defenders: [0, 1] }
    const frozen = advanceMarsArcade(state, [NEUTRAL_MARS_ARCADE_INPUT, NEUTRAL_MARS_ARCADE_INPUT], 1 / 60).state
    for (const side of [0, 1] as const) {
      expect(frozen.fighters[side].stunFrames).toBe(22)
      expect(frozen.fighters[side].stunOrigin).toEqual(state.fighters[side].stunOrigin)
      expect(frozen.fighters[side].stunOrigin).not.toBe(state.fighters[side].stunOrigin)
      expect(selectArcadeSprite(frozen, side, false).frame?.pose).toBe('impact')
    }
  })

  it('retains the zero-stun impact pose during hit stop and clears finished stun metadata', () => {
    for (const side of [0, 1] as const) {
      const state = createMarsArcadeRound('captain', 'captain'); state.phase = 'fight'
      Object.assign(state.fighters[side], { activity: 'hitstun', stunFrames: 0 })
      state.hitstop = { frames: 2, framesRemaining: 2, defenders: [side] }
      for (const reduced of [false, true]) {
        expect(selectArcadeSprite(state, side, reduced).frame?.pose).toBe('impact')
        expect(marsArcadeRulesFrame(state, side)?.pose).toBe('impact')
      }
      state.hitstop = null
      Object.assign(state.fighters[side], { stunFrames: 1, stunOrigin: { moveId: 'prior-heavy', button: 'heavy', duration: 22 } })
      const next = advanceMarsArcade(state, [NEUTRAL_MARS_ARCADE_INPUT, NEUTRAL_MARS_ARCADE_INPUT], 1 / 60).state
      expect(next.fighters[side].stunOrigin).toBeUndefined()
      expect(state.fighters[side].stunOrigin).toBeDefined()
    }
  })

  it('selects jump poses by velocity on either side with matching rules boxes', () => {
    const state = createMarsArcadeRound('captain', 'captain'); state.phase = 'fight'
    for (const side of [0, 1] as const) for (const [velocityY, pose] of [[2, 'rise'], [0, 'apex'], [-2, 'fall']] as const) {
      Object.assign(state.fighters[side], { activity: 'airborne', y: 20, velocityY })
      expect(selectArcadeSprite(state, side, false).frame?.pose).toBe(pose)
      expect(marsArcadeRulesFrame(state, side)?.pose).toBe(pose)
    }
  })

  it('plays optional grounded outcomes and final reduced poses without changing terminal combat', () => {
    for (const won of [false, true]) for (const side of [0, 1] as const) {
      const state = createMarsArcadeRound('captain', 'captain'); state.phase = 'ko'; state.winner = won ? side : side === 0 ? 1 : 0
      state.fighters[side].y = 20
      state.fighters[side === 0 ? 1 : 0].health = won ? 0 : 100
      if (!won) state.fighters[side].health = 0
      const before = structuredClone(state)
      const first = selectArcadeSprite(state, side, false, 0)
      expect(first.frame?.pose).toBe(won ? 'prepare' : 'off-balance')
      expect(first.renderY).toBe(20)
      const final = selectArcadeSprite(state, side, true, 0)
      expect(final.frame?.pose).toBe(won ? 'salute' : 'seated')
      expect(final.renderY).toBe(0)
      expect(marsArcadeRulesFrame(state, side)).toBeNull()
      expect(state).toEqual(before)
    }
  })

  it('keeps explicit missing-art fallback while optional clips are absent', async () => {
    const previous = animationFixture.animations
    animationFixture.animations = previous.filter(clip => clip.fighter !== 'captain' ||
      !['hit', 'heavy-block', 'jump', 'victory', 'knockout'].includes(clip.animation))
    vi.resetModules()
    try {
      const { selectArcadeSprite: withoutClips } = await import('./arcadeHarnessSprites')
      const state = createMarsArcadeRound('captain', 'booster'); state.phase = 'fight'
      state.fighters[0].activity = 'airborne'
      expect(withoutClips(state, 0, false).placeholder).toBe(true)
      state.phase = 'ko'; state.winner = 0
      expect(withoutClips(state, 0, false).placeholder).toBe(true)
      state.phase = 'timeOver'; state.winner = 1
      expect(withoutClips(state, 0, false).label).toBe('round over — resting')
    } finally {
      animationFixture.animations = previous
      vi.resetModules()
    }
  })
})
