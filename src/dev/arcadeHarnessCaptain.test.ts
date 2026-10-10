import { describe, expect, it } from 'vitest'
import { createMarsArcadeRound } from '../game/marsArcade'
import { marsArcadeRulesFrame } from '../game/marsArcadePose'
import { arcadeClip, selectArcadeSprite } from './arcadeHarnessSprites'

describe('Captain authored coffee-heavy', () => {
  it('selects the reviewed palm-jab beats at the approved phase boundaries', () => {
    const state = createMarsArcadeRound('captain', 'captain')
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      for (const [moveFrame, pose, phase] of [
        [0, 'raise-palm', 'startup'], [2, 'raise-palm', 'startup'],
        [3, 'draw-back', 'startup'], [5, 'draw-back', 'startup'],
        [6, 'forearm-strike', 'active'], [8, 'forearm-strike', 'active'],
        [9, 'retract-to-ready', 'recovery'], [12, 'retract-to-ready', 'recovery'],
        [13, 'settle-to-idle', 'recovery'], [18, 'settle-to-idle', 'recovery'],
      ] as const) {
        Object.assign(state.fighters[side], { activity: 'attack', activeButton: 'light', moveFrame, blocking: false })
        const selected = selectArcadeSprite(state, side, reduced)
        expect(selected.placeholder).toBe(false)
        expect(selected.label).toBe(`jab ${phase} — ${pose}`)
        expect(selected.src).toBe(marsArcadeRulesFrame(state, side)?.src)
        expect(selected.frame?.attack?.length ?? 0).toBe(phase === 'active' ? 1 : 0)
      }
    }
  })

  it('plays all five approved beats on both sides and reads the same frame as the rules', () => {
    const state = createMarsArcadeRound('captain', 'captain')
    state.phase = 'fight'
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      for (const [moveFrame, pose, active] of [
        [0, 'lift-cup', false], [4, 'lift-cup', false],
        [5, 'draw-cup-back', false], [8, 'draw-cup-back', false],
        [9, 'cup-strike', true], [11, 'cup-strike', true],
        [12, 'retract-cup', false], [16, 'retract-cup', false],
        [17, 'lower-cup', false], [22, 'lower-cup', false],
      ] as const) {
        Object.assign(state.fighters[side], { activity: 'attack', activeButton: 'heavy', moveFrame, blocking: false })
        const before = structuredClone(state)
        const selected = selectArcadeSprite(state, side, reduced)
        expect(selected.placeholder).toBe(false)
        expect(selected.frame?.pose).toBe(pose)
        expect(selected.frame?.attack?.length ?? 0).toBe(active ? 1 : 0)
        expect(selected.src).toBe(marsArcadeRulesFrame(state, side)?.src)
        expect(state).toEqual(before)
      }
    }
  })

  it('plays the approved flyby character phases with the same body regions as the rules', () => {
    const state=createMarsArcadeRound('captain','captain');state.phase='fight'
    for(const side of [0,1] as const)for(const reduced of [false,true])for(const moveFrame of [0,7,8,15,16,25,26,29,30,33,34,43,44,55]){
      Object.assign(state.fighters[side],{activity:'attack',activeButton:'special',moveFrame})
      const selected=selectArcadeSprite(state,side,reduced)
      expect(selected.placeholder).toBe(false)
      expect(selected.frame).toEqual(marsArcadeRulesFrame(state,side))
      expect(selected.frame?.attack).toBeUndefined()
    }
  })
})

describe('Captain authored normal guard', () => {
  it('uses ready, authored retreat and absorb poses with matching rules boxes on both sides', () => {
    const state = createMarsArcadeRound('captain', 'captain')
    state.phase = 'fight'
    const clip = arcadeClip('captain', 'block')!
    expect(clip).not.toBeNull()
    for (const side of [0, 1] as const) for (const reduced of [false, true]) {
      for (const activity of ['idle', 'walk', 'blockstun'] as const) {
        Object.assign(state.fighters[side], { activity, blocking: true, stunFrames: activity === 'blockstun' ? 5 : 0 })
        const before = structuredClone(state)
        const selected = selectArcadeSprite(state, side, reduced)
        const expected=activity==='walk'?arcadeClip('captain','walk-back')!.frames[0]!:clip.frames[activity==='blockstun'?1:0]!
        expect(selected.src).toBe(expected.src)
        expect(selected.placeholder).toBe(false)
        expect(selected.src).toBe(marsArcadeRulesFrame(state, side)?.src)
        expect(selected.frame?.hurt).toEqual(marsArcadeRulesFrame(state, side)?.hurt)
        expect(selected.frame?.attack?.length ?? 0).toBe(0)
        expect(state).toEqual(before)
      }
    }
  })

  it('uses the reviewed normal absorb pose while a heavy-block clip is still missing', () => {
    const state = createMarsArcadeRound('captain', 'booster')
    state.phase = 'fight'
    Object.assign(state.fighters[0], { activity: 'blockstun', blocking: true, stunFrames: 9 })
    const selected = selectArcadeSprite(state, 0, false, 0, {kind:'block',duration:14,offsetX:0})
    expect(selected.placeholder).toBe(false)
    expect(selected.frame?.pose).toBe('absorb-brace')
    expect(selected.src).toBe(marsArcadeRulesFrame(state, 0)?.src)
    expect(selected.frame?.attack?.length ?? 0).toBe(0)
  })
})
