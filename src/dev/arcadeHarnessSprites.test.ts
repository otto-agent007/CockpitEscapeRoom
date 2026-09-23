import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound } from '../game/marsArcade'
import { ARCADE_SPRITE_SOURCES, selectArcadeSprite } from './arcadeHarnessSprites'

describe('dev-only arcade sprite pilot', () => {
  it('keeps the approved outfit through movement, attack phases and placeholder fallback', () => {
    const state = createMarsArcadeRound('booster', 'booster')
    state.phase = 'fight'
    for (const side of [0, 1] as const) {
      for (const reduced of [false, true]) {
        for (const fixture of [
          { activity: 'idle', frame: 0, moveFrame: 0, button: null },
          { activity: 'idle', frame: 18, moveFrame: 0, button: null },
          { activity: 'walk', frame: 0, moveFrame: 0, button: null },
          { activity: 'walk', frame: 6, moveFrame: 0, button: null },
          { activity: 'attack', frame: 0, moveFrame: 3, button: 'light' },
          { activity: 'attack', frame: 0, moveFrame: 4, button: 'light' },
          { activity: 'attack', frame: 0, moveFrame: 7, button: 'light' },
          { activity: 'hitstun', frame: 0, moveFrame: 0, button: null },
        ] as const) {
          state.frame = fixture.frame
          Object.assign(state.fighters[side], {
            activity: fixture.activity, moveFrame: fixture.moveFrame, activeButton: fixture.button,
          })
          const selected = selectArcadeSprite(state, side, reduced).src
          // The walk has its own set since 2026-09-23; everything else is the sleek outfit.
          expect(selected).toContain(fixture.activity === 'walk' ? '/booster/normalised-walk-ready/' : '/booster/normalised-sleek-ready/')
          expect(ARCADE_SPRITE_SOURCES).toContain(selected)
        }
      }
    }
  })

  it('plays the space laser as call it in, watch it land, pocket the phone', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    const pose = (moveFrame: number, reduced = false) => {
      Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'special', moveFrame })
      return selectArcadeSprite(state, 0, reduced)
    }
    const beats = Array.from({ length: 29 }, (_, frame) => pose(frame).src)
    // The hit frame is one frame long; the call-in pose must outlive it to be seen.
    expect(beats[0]).toContain('/call-it-in/')
    expect(beats.filter((src) => src.includes('/call-it-in/')).length).toBeGreaterThanOrEqual(8)
    expect(beats.findIndex((src) => src.includes('/watch/'))).toBeGreaterThan(0)
    expect(beats[28]).toContain('/pocket/')
    const order = [...new Set(beats.map((src) => src.split('/').at(-2)))]
    expect(order).toEqual(['call-it-in', 'watch', 'pocket'])
    for (const src of beats) expect(ARCADE_SPRITE_SOURCES).toContain(src)
    for (let frame = 0; frame < 29; frame += 1) expect(pose(frame, true).src).toBe(beats[frame])
    expect(pose(0).placeholder).toBe(false)
  })

  it('selects idle art from simulation frames, without changing the rules state', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    const before = structuredClone(state)
    const first = selectArcadeSprite(state, 0, false)
    expect(selectArcadeSprite(state, 0, false)).toEqual(first)
    expect(state).toEqual(before)
    expect(selectArcadeSprite({ ...state, frame: 18 }, 0, false).src).not.toBe(first.src)
    expect(selectArcadeSprite({ ...state, frame: 36 }, 0, false).src).toBe(first.src)
  })

  it('keeps decorative breathing static for reduced motion', () => {
    const state = createMarsArcadeRound('booster', 'booster')
    expect(selectArcadeSprite({ ...state, frame: 18 }, 0, true).src)
      .toBe(selectArcadeSprite(state, 0, true).src)
  })

  it('labels unauthored combat poses, including round outcomes, as placeholders', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    for (const activity of ['attack'] as const) {
      state.fighters[0].activity = activity
      expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
    }
    state.fighters[0].activity = 'idle'
    state.fighters[0].blocking = true
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(false)
    state.fighters[0].blocking = false
    state.phase = 'ko'
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })

  it('preserves the selected identity, and never references rejected probes', () => {
    const state = createMarsArcadeRound('oracle', 'captain')
    expect(selectArcadeSprite(state, 0, false).src).toContain('/oracle/')
    expect(selectArcadeSprite(state, 1, false).src).toContain('/captain/')
    expect(new Set(ARCADE_SPRITE_SOURCES).size).toBe(ARCADE_SPRITE_SOURCES.length)
    for (const src of ARCADE_SPRITE_SOURCES) {
      expect(src).toMatch(/^\/art-source\/arcade\//)
      expect(src).not.toMatch(/normalised-wave-1-final|generated/)
    }
  })

  it('uses distinct jab anticipation, contact and recovery drawings at engine boundaries', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'light' })
    state.fighters[0].moveFrame = 3
    const startup = selectArcadeSprite(state, 0, false)
    expect(startup.placeholder).toBe(false)
    state.fighters[0].moveFrame = 4
    const active = selectArcadeSprite(state, 0, false)
    expect(active.src).toContain('/jab/')
    expect(active.src).not.toBe(startup.src)
    state.fighters[0].moveFrame = 7
    const recovery = selectArcadeSprite(state, 0, false)
    expect(recovery.src).toContain('/recovery/')
    expect(recovery.src).not.toBe(startup.src)
    expect(recovery.src).not.toBe(active.src)
    state.fighters[0].moveFrame = 13
    expect(selectArcadeSprite(state, 0, false).src).toContain('/anchor/')
    state.fighters[0].moveFrame = 4
    expect(selectArcadeSprite(state, 0, true).src).toBe(active.src)
  })

  it('changes footwork on simulation time and returns to guard when movement stops', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    state.fighters[0].activity = 'walk'
    state.frame = 0
    const first = selectArcadeSprite(state, 0, false)
    state.frame = 6
    expect(selectArcadeSprite(state, 0, false).src).not.toBe(first.src)
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(false)
    state.fighters[0].activity = 'idle'
    expect(selectArcadeSprite(state, 0, false).src).toContain('/anchor/')
  })

  it('shows Oracle guard and recoil for the real defensive states, including reduced motion', () => {
    const state = createMarsArcadeRound('booster', 'oracle')
    state.phase = 'fight'
    const oracle = state.fighters[1]
    oracle.blocking = true
    oracle.activity = 'idle'
    expect(selectArcadeSprite(state, 1, false).src).toContain('/block/')
    oracle.activity = 'blockstun'
    expect(selectArcadeSprite(state, 1, true).src).toContain('/block/')
    oracle.activity = 'hitstun'
    oracle.blocking = false
    expect(selectArcadeSprite(state, 1, true).src).toContain('/recoil/')
    expect(selectArcadeSprite(state, 1, false).placeholder).toBe(false)
    oracle.activity = 'idle'
    expect(selectArcadeSprite(state, 1, false).src).toContain('/anchor/')
    state.phase = 'ko'
    oracle.activity = 'hitstun'
    expect(selectArcadeSprite(state, 1, false).placeholder).toBe(true)
  })

  it('cycles Sam guarded footwork only during backward movement, in both facings and reduced motion', () => {
    const state = createMarsArcadeRound('oracle', 'oracle')
    state.phase = 'fight'
    for (const side of [0, 1] as const) {
      for (const reduced of [false, true]) {
        const fighter = state.fighters[side]
        Object.assign(fighter, { activity: 'walk', blocking: true })
        state.frame = 0
        const first = selectArcadeSprite(state, side, reduced)
        expect(first.src).toContain('/walk-back/walk-back-00.png')
        expect(first.placeholder).toBe(false)
        expect(ARCADE_SPRITE_SOURCES).toContain(first.src)
        state.frame = 6
        const second = selectArcadeSprite(state, side, reduced)
        expect(second.src).toContain('/walk-back/walk-back-01.png')
        expect(second.src).not.toBe(first.src)
        expect(ARCADE_SPRITE_SOURCES).toContain(second.src)
        // Four drawings since 2026-09-23: 02 at frame 12, 03 at 18, back to 00 at 24.
        state.frame = 12
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/walk-back/walk-back-02.png')
        state.frame = 24
        expect(selectArcadeSprite(state, side, reduced).src).toBe(first.src)
        fighter.activity = 'blockstun'
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/block/')
        fighter.activity = 'hitstun'
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/recoil/')
        Object.assign(fighter, { activity: 'walk', blocking: false })
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/walk-forward/')
        fighter.activity = 'idle'
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/anchor/')
      }
    }
    state.phase = 'ko'
    Object.assign(state.fighters[0], { activity: 'walk', blocking: true })
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })

  it('selects Sam wind-up, active jab and pullback at the real move boundaries on either side', () => {
    const state = createMarsArcadeRound('oracle', 'oracle')
    state.phase = 'fight'
    for (const side of [0, 1] as const) {
      for (const reduced of [false, true]) {
        const fighter = state.fighters[side]
        Object.assign(fighter, { activity: 'attack', activeButton: 'light', blocking: false })
        for (const [moveFrame, clip] of [[0, 'anticipation'], [4, 'anticipation'], [5, 'jab'], [6, 'jab'], [7, 'recovery'], [14, 'recovery']] as const) {
          fighter.moveFrame = moveFrame
          const pose = selectArcadeSprite(state, side, reduced)
          expect(pose.src).toContain(`/oracle/normalised-counterattack-ready/${clip}/`)
          expect(pose.placeholder).toBe(false)
          expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
        }
        fighter.activeButton = 'special'
        expect(selectArcadeSprite(state, side, reduced).placeholder).toBe(true)
        Object.assign(fighter, { activity: 'idle', activeButton: null })
        expect(selectArcadeSprite(state, side, reduced).src).toContain('/anchor/')
      }
    }
    state.phase = 'ko'
    Object.assign(state.fighters[0], { activity: 'attack', activeButton: 'light', moveFrame: 5 })
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })

  it('uses Elon defense poses without overriding his backward footwork or round-end fallback', () => {
    const state = createMarsArcadeRound('booster', 'booster')
    state.phase = 'fight'
    for (const side of [0, 1] as const) {
      for (const reduced of [false, true]) {
        const fighter = state.fighters[side]
        for (const [activity, blocking, clip] of [
          ['idle', true, 'block'], ['blockstun', true, 'block'],
          ['hitstun', false, 'recoil'], ['walk', true, 'walk-back'],
        ] as const) {
          Object.assign(fighter, { activity, blocking })
          const pose = selectArcadeSprite(state, side, reduced)
          const set = clip === 'walk-back' ? 'normalised-walk-ready' : 'normalised-sleek-ready'
          expect(pose.src).toContain(`/booster/${set}/${clip}/`)
          expect(pose.placeholder).toBe(false)
          expect(ARCADE_SPRITE_SOURCES).toContain(pose.src)
        }
      }
    }
    state.phase = 'ko'
    Object.assign(state.fighters[0], { activity: 'hitstun', blocking: false })
    expect(selectArcadeSprite(state, 0, false).placeholder).toBe(true)
  })
})
