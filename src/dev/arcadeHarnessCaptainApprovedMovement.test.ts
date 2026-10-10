import acceptance from './captainMovementAccepted.fixture.json'
import { afterEach, describe, expect, it } from 'vitest'
import { createMarsArcadeRound } from '../game/marsArcade'
import { marsArcadeRulesFrame, setMarsArcadeClipOverride } from '../game/marsArcadePose'
import { arcadeClip, selectArcadeSprite } from './arcadeHarnessSprites'

type Accepted = { family: string; sources: { path: string; hold: number }[] }
const accepted: Accepted[] = acceptance.approvedCandidates

afterEach(() => { for(const name of ['idle','walk-forward','walk-back'])setMarsArcadeClipOverride('captain',name,null) })

describe('Captain approved movement in regular play', () => {
  it('keeps retreat artwork and combat regions together during an incoming heavy startup', () => {
    for(const side of [0,1] as const)for(const reduced of [false,true]){
      const state=createMarsArcadeRound(side===0?'captain':'booster',side===1?'captain':'booster');state.phase='fight';state.frame=10
      Object.assign(state.fighters[side],{x:side===0?-15:15,facing:side===0?1:-1,activity:'walk',blocking:true})
      Object.assign(state.fighters[side===0?1:0],{x:side===0?15:-15,facing:side===0?-1:1,activity:'attack',activeButton:'heavy',moveFrame:1})
      const before=structuredClone(state),selected=selectArcadeSprite(state,side,reduced)
      expect(selected.label).toBe('backward shuffle')
      expect(selected.frame).toEqual(marsArcadeRulesFrame(state,side))
      expect(selected.placeholder).toBe(false)
      expect(state).toEqual(before)
    }
  })
  it('equips the exact owner-approved idle and stride order with their accepted holds', () => {
    for(const clip of accepted){
      const actual=arcadeClip('captain',clip.family)
      expect(actual,clip.family).not.toBeNull()
      expect(actual!.reviewed).toBe(true)
      expect(actual!.frames.map(f=>({path:f.src,hold:f.hold}))).toEqual(clip.sources.map(f=>({path:f.path,hold:f.hold})))
    }
  })

  it('keeps retreat drawings, guard and hurt boxes aligned with rules on either side', () => {
    const state=createMarsArcadeRound('captain','captain');state.phase='fight'
    for(const side of [0,1] as const)for(const reduced of [false,true])for(const blocking of [false,true]){
      Object.assign(state.fighters[side],{activity:'walk',blocking})
      for(let frame=0;frame<32;frame++){
        state.frame=frame
        const selected=selectArcadeSprite(state,side,reduced),rule=marsArcadeRulesFrame(state,side)
        expect(selected.placeholder).toBe(false)
        expect(selected.frame).toEqual(rule)
        expect(selected.frame?.attack).toBeUndefined()
        expect(Boolean(selected.frame?.guard)).toBe(blocking)
      }
    }
  })

  it('freezes breathing in reduced motion while preserving identical combat regions', () => {
    const state=createMarsArcadeRound('captain','captain');state.phase='fight'
    for(const side of [0,1] as const){
      const seen=new Set<string>()
      for(let frame=0;frame<120;frame++){
        state.frame=frame
        const moving=selectArcadeSprite(state,side,false),still=selectArcadeSprite(state,side,true)
        seen.add(moving.src)
        expect(moving.frame).toEqual(marsArcadeRulesFrame(state,side))
        expect(still.src).toBe(accepted[0]!.sources[0]!.path)
        expect(still.frame?.hurt).toEqual(moving.frame?.hurt)
        expect(still.frame?.collision).toEqual(moving.frame?.collision)
      }
      expect(seen.size).toBe(3)
    }
  })
})
