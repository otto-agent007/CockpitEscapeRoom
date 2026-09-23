import { describe, expect, it } from 'vitest'
import { advanceMarsArcade, createMarsArcadeRound, NEUTRAL_MARS_ARCADE_INPUT } from '../game/marsArcade'
import { ARCADE_SPRITE_SOURCES, selectArcadeSprite } from './arcadeHarnessSprites'

describe('movement artwork', () => {
  it('cycles forward footwork without borrowing the backward guard poses', () => {
    const state = createMarsArcadeRound('oracle', 'oracle')
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      const fighter = state.fighters[side]
      Object.assign(fighter, { activity: 'walk', blocking: false })
      for (const [frame, suffix] of [[0, '00'], [6, '01'], [12, '00']] as const) {
        state.frame = frame
        const pose = selectArcadeSprite(state, side, reduced)
        expect(pose.src).toContain(`/walk-forward/walk-forward-${suffix}.png`)
        expect(pose.placeholder).toBe(false)
        expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
      }
      fighter.blocking = true
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/walk-back/')
      fighter.activity = 'blockstun'
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/block/')
    }
  })

  it('cycles Booster through four forward and four backward drawings, each in its own set', () => {
    const state = createMarsArcadeRound('booster', 'booster')
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      const fighter = state.fighters[side]
      for (const [blocking, clip] of [[false, 'walk-forward'], [true, 'walk-back']] as const) {
        Object.assign(fighter, { activity: 'walk', blocking })
        const cycle: string[] = []
        for (let frame = 0; frame < 30; frame += 1) {
          state.frame = frame
          const pose = selectArcadeSprite(state, side, reduced)
          expect(pose.src).toContain(`/booster/normalised-walk-ready/${clip}/`)
          expect(pose.placeholder).toBe(false)
          expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
          cycle.push(pose.src)
        }
        // Four drawings, in order, looping: 00 01 02 03 00 ...
        const order = cycle.filter((src, i) => i === 0 || src !== cycle[i - 1]).map(src => src.slice(-6, -4))
        expect(order.slice(0, 5)).toEqual(['00', '01', '02', '03', '00'])
      }
    }
  })

  it.each(['booster', 'oracle'] as const)('%s selects jump phases from velocity, preserving reactions and landing', id => {
    const state = createMarsArcadeRound(id, id)
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      const fighter = state.fighters[side]
      Object.assign(fighter, { activity: 'airborne', y: 20, blocking: false })
      for (const [velocityY, suffix] of [[4, '00'], [0.61, '00'], [0.6, '01'], [0, '01'], [-0.6, '01'], [-0.61, '02'], [-4, '02']] as const) {
        fighter.velocityY = velocityY
        const before = structuredClone(state)
        const pose = selectArcadeSprite(state, side, reduced)
        expect(pose.src).toContain(`/${id}/normalised-movement-ready/airborne/airborne-${suffix}.png`)
        expect(pose.placeholder).toBe(false)
        expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
        expect(state).toEqual(before)
      }
      fighter.activity = 'hitstun'
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/recoil/')
      Object.assign(fighter, { activity: 'idle', y: 0, velocityY: 0 })
      expect(selectArcadeSprite(state, side, reduced).src).toContain('/anchor/')
    }
    state.phase = 'ko'
    state.fighters[0].activity = 'airborne'
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })

  it.each(['booster', 'oracle'] as const)('%s actual jump draws all phases and returns to grounded art', id => {
    let state = createMarsArcadeRound(id, 'captain')
    state.phase = 'fight'
    const drawn = new Set<string>()
    for (let tick = 0; tick < 60; tick++) {
      state = advanceMarsArcade(state, [
        { ...NEUTRAL_MARS_ARCADE_INPUT, jump: tick === 0 }, NEUTRAL_MARS_ARCADE_INPUT,
      ], 1 / 60).state
      drawn.add(selectArcadeSprite(state, 0, false).src)
    }
    for (const suffix of ['00', '01', '02']) {
      expect([...drawn].some(src => src.includes(`/airborne/airborne-${suffix}.png`))).toBe(true)
    }
    expect(state.fighters[0].activity).toBe('idle')
    expect(state.fighters[0].y).toBe(0)
    expect(selectArcadeSprite(state, 0, false).src).not.toContain('/airborne/')
    state.fighters[1].activity = 'airborne'
    expect(selectArcadeSprite(state, 1, false).placeholder).toBe(true)
  })
})
