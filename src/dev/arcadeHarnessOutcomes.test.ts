import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound } from '../game/marsArcade'
import { ARCADE_ANCHOR_SOURCES, ARCADE_SPRITE_SOURCES, selectArcadeSprite } from './arcadeHarnessSprites'

const recoils = {
  booster: '/booster/normalised-sleek-ready/recoil/recoil-00.png',
  oracle: '/oracle/normalised-exchange-ready/recoil/recoil-00.png',
} as const

describe('Booster and Oracle round outcome presentation', () => {
  it.each([
    ['booster', 'booster', 0], ['booster', 'booster', 1],
    ['booster', 'oracle', 0], ['booster', 'oracle', 1],
    ['oracle', 'booster', 0], ['oracle', 'oracle', 1],
  ] as const)('%s vs %s plays all winner/loser beats on side %i without changing the frozen game', (left, right, side) => {
    const state = createMarsArcadeRound(left, right)
    const id = state.fighters[side].id as keyof typeof recoils
    state.phase = 'ko'
    for (const winner of [0, 1] as const) {
      state.winner = winner
      state.fighters[winner].health = 100
      state.fighters[winner === 0 ? 1 : 0].health = 0
      for (const [frame, index] of [[0, '00'], [11, '00'], [12, '01'], [23, '01'], [24, '02'], [600, '02']] as const) {
        const before = structuredClone(state)
        const pose = selectArcadeSprite(state, side, false, frame)
        const clip = side === winner ? 'win' : 'ko'
        const expected = clip === 'ko' && index === '00' ? recoils[id] :
          '/' + id + '/normalised-outcomes-ready/' + clip + '/' + clip + '-' + index + '.png'
        expect(pose.src).toContain(expected)
        expect(pose.placeholder).toBe(false)
        expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
        expect(state).toEqual(before)
      }
    }
  })

  it.each(['booster', 'oracle'] as const)('%s settles immediately with reduced motion and does not invent a knockout on timeout', id => {
    const state = createMarsArcadeRound(id, id)
    state.phase = 'timeOver'
    state.winner = 0
    expect(selectArcadeSprite(state, 0, true, 0).src).toContain('/' + id + '/normalised-outcomes-ready/win/win-02.png')
    expect(selectArcadeSprite(state, 1, false, 100).src).toBe(ARCADE_ANCHOR_SOURCES[id])
    state.winner = null
    for (const side of [0, 1] as const) expect(selectArcadeSprite(state, side, true, 100).src).toContain('/anchor/')
    state.phase = 'ko'
    for (const side of [0, 1] as const) {
      state.fighters[side].health = 0
      expect(selectArcadeSprite(state, side, true, 0).src).toContain('/' + id + '/normalised-outcomes-ready/ko/ko-02.png')
    }
  })

  it('never reuses terminal poses in combat or for unauthored fighters', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    for (const side of [0, 1] as const) expect(selectArcadeSprite(state, side, false, 100).src).not.toContain('/normalised-outcomes-ready/')
    state.phase = 'ko'; state.winner = 1
    state.fighters[1].id = 'captain'
    expect(selectArcadeSprite(state, 1, false, 100).placeholder).toBe(true)
  })

  it('settles an airborne result onto the floor without editing frozen fighter coordinates', () => {
    const state = createMarsArcadeRound('booster', 'booster')
    state.phase = 'ko'; state.winner = 1
    state.fighters[0].health = 0
    state.fighters[0].y = 30
    expect(selectArcadeSprite(state, 0, false, 0).renderY).toBe(30)
    expect(selectArcadeSprite(state, 0, false, 12).renderY).toBe(15)
    expect(selectArcadeSprite(state, 0, false, 24).renderY).toBe(0)
    expect(selectArcadeSprite(state, 0, true, 0).renderY).toBe(0)
    expect(state.fighters[0].y).toBe(30)
  })
})
