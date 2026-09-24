import { describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT } from '../game/marsArcade'
import { ARCADE_SPRITE_SOURCES, selectArcadeSprite } from './arcadeHarnessSprites'

describe('heavy attack artwork', () => {
  it.each([
    ['booster', [[0, 'startup'], [4, 'startup'], [5, 'swing'], [7, 'swing'], [8, 'drive'], [10, 'drive'], [11, 'active'], [14, 'active'], [15, 'retract'], [18, 'retract'], [19, 'recovery'], [23, 'recovery'], [24, 'settle'], [28, 'settle'], [29, 'guard'], [32, 'guard']]],
    ['oracle', [[0, 'startup'], [9, 'startup'], [10, 'sweep'], [12, 'sweep'], [13, 'active'], [15, 'active'], [16, 'recovery'], [27, 'recovery'], [28, 'settle'], [35, 'settle']]],
  ] as const)('%s changes heavy poses at actual move boundaries without changing state', (id, cases) => {
    const state = createMarsArcadeRound(id, id)
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      const fighter = state.fighters[side]
      Object.assign(fighter, { activity: 'attack', activeButton: 'heavy' })
      for (const [frame, phase] of cases) {
        fighter.moveFrame = frame
        const before = structuredClone(state)
        const pose = selectArcadeSprite(state, side, reduced)
        const folder = id === 'oracle' && ['sweep', 'settle'].includes(phase) ? 'normalised-heavy-motion-ready' :
          phase === 'drive' || phase === 'settle' ? 'normalised-heavy-drive-ready' :
          phase === 'retract' ? 'normalised-heavy-recovery-v1' :
          id === 'booster' ? 'normalised-heavy-continuity-ready' : 'normalised-heavy-ready'
        const expected = phase === 'guard' ? '/booster/normalised-sleek-ready/block/block-00.png' :
          '/' + id + '/' + folder + '/heavy-' + phase + '/heavy-' + phase + '-00.png'
        expect(pose.src).toContain(expected)
        expect(pose.placeholder).toBe(false)
        expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
        expect(state).toEqual(before)
      }
      fighter.activity = 'hitstun'
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/recoil/')
      fighter.activity = 'blockstun'
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/block/')
      Object.assign(fighter, { activity: 'idle', activeButton: null })
      expect(selectArcadeSprite(state, side, reduced).src).not.toContain('/heavy-')
    }
    state.phase = 'ko'
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'heavy' })
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })

  it.each(['booster', 'oracle'] as const)('%s real heavy attack draws every phase and settles back to idle', id => {
    let state = createMarsArcadeRound(id, 'captain')
    state.phase = 'fight'
    const drawn = new Set<string>()
    for (let frame = 0; frame < 50; frame++) {
      state = advanceMarsArcade(state, [
        { ...NEUTRAL_MARS_ARCADE_INPUT, heavy: frame === 0 }, NEUTRAL_MARS_ARCADE_INPUT,
      ], 1 / 60).state
      drawn.add(selectArcadeSprite(state, 0, false).src)
    }
    const phases = id === 'booster' ? ['startup', 'swing', 'drive', 'active', 'retract', 'recovery', 'settle']
      : ['startup', 'sweep', 'active', 'recovery', 'settle']
    for (const phase of phases) {
      expect([...drawn].some(src => src.includes('/heavy-' + phase + '/'))).toBe(true)
    }
    expect(state.fighters[0].activity).toBe('idle')
    expect(state.fighters[1].health).toBe(100) // Out of range, despite visible attack.
    state.fighters[1].activity = 'attack'
    state.fighters[1].activeButton = 'heavy'
    expect(selectArcadeSprite(state, 1, false).placeholder).toBe(true)
  })
})
