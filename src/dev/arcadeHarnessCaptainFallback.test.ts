import { describe, expect, it, vi } from 'vitest'

// Reproduce partial adoption explicitly; regular Captain now has both walk clips.
vi.mock('../game/marsArcadeAnimations.json', async importOriginal => {
  const actual=await importOriginal<{default:{version:number;animations:{fighter:string;animation:string}[]}}>()
  return {default:{...actual.default,animations:actual.default.animations.filter(c=>!(c.fighter==='captain'&&['walk-forward','walk-back','special'].includes(c.animation)))}}
})
import { createMarsArcadeRound } from '../game/marsArcade'
import { marsArcadeRulesFrame } from '../game/marsArcadePose'
import { arcadeClip, selectArcadeSprite } from './arcadeHarnessSprites'

describe('Captain partial-art fallback', () => {
  it('retains the existing special fallback when the authored move clip is absent', () => {
    const state=createMarsArcadeRound('captain','booster');state.phase='fight'
    Object.assign(state.fighters[0],{activity:'attack',activeButton:'special',moveFrame:27})
    expect(marsArcadeRulesFrame(state,0)).toBeNull()
    expect(selectArcadeSprite(state,0,false).placeholder).toBe(true)
  })

  it('retains a safe guard when retreat art is absent on either side', () => {
    const state=createMarsArcadeRound('captain','captain');state.phase='fight'
    for(const side of [0,1] as const)for(const reduced of [false,true]){
      Object.assign(state.fighters[side],{activity:'walk',blocking:true})
      const selected=selectArcadeSprite(state,side,reduced)
      expect(selected.placeholder).toBe(true)
      expect(selected.src).toBe(arcadeClip('captain','block')!.frames[0]!.src)
      expect(selected.frame).toEqual(marsArcadeRulesFrame(state,side))
      expect(selected.frame?.attack).toBeUndefined()
    }
  })
  it('keeps missing advance art hittable through the existing rules fallback', () => {
    const state=createMarsArcadeRound('captain','captain');state.phase='fight'
    for(const side of [0,1] as const){
      Object.assign(state.fighters[side],{activity:'walk',blocking:false})
      expect(marsArcadeRulesFrame(state,side)).toBeNull()
      expect(selectArcadeSprite(state,side,false).placeholder).toBe(true)
    }
  })
})
