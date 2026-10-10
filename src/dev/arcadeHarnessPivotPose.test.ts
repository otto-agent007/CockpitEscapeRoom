import {afterEach,beforeEach,describe,expect,it} from 'vitest'
import {advanceMarsArcade,createMarsArcadeRound,NEUTRAL_MARS_ARCADE_INPUT} from '../game/marsArcade'
import {MARS_ARCADE_NON_PROFIT_PIVOT,setMarsArcadePivotPreview,setMarsArcadeTuning} from '../game/marsArcadeFighters'
import {marsArcadeMoveClip,marsArcadeRulesFrame} from '../game/marsArcadePose'
import {selectArcadeSprite} from './arcadeHarnessSprites'

beforeEach(()=>{setMarsArcadeTuning(null);setMarsArcadePivotPreview(true)})
afterEach(()=>{setMarsArcadePivotPreview(false);setMarsArcadeTuning(null)})

describe('Sam pen follow-through',()=>{
  it.each([[0,false],[0,true],[1,false],[1,true]] as const)('keeps the pen extended into recovery with no live attack box, side%s reduced%s',(side,reduced)=>{
    const state=createMarsArcadeRound(side===0?'oracle':'booster',side===1?'oracle':'booster');state.phase='fight'
    const strike=marsArcadeMoveClip('oracle','oracle.nonProfitPivot')!.frames.find(f=>f.phase==='active')!
    expect(MARS_ARCADE_NON_PROFIT_PIVOT.recoveryFrames).toBe(72)
    const start=MARS_ARCADE_NON_PROFIT_PIVOT.startupFrames
    for(const offset of [0,2,3,30,31,59,60,74]){
      const frame=start+offset
      Object.assign(state.fighters[side],{activity:'attack',activeButton:'special',moveFrame:frame})
      const selected=selectArcadeSprite(state,side,reduced),rules=marsArcadeRulesFrame(state,side)
      expect(selected.placeholder).toBe(false);expect(selected.src).toBe(rules?.src)
      expect(selected.src===strike.src).toBe(offset<=59)
      expect(rules?.attack?.length??0).toBe(offset<3?1:0)
      if(offset>=3&&offset<=59)expect(selected.frame?.pose).toBe(offset<31?'pen-contact-hold':'pen-follow-through')
    }
  })
  it.each([0,1] as const)('still deals one36damage hit and one half-meter seizure on side%s',side=>{
    let state=createMarsArcadeRound(side===0?'oracle':'booster',side===1?'oracle':'booster');state.phase='fight'
    for(const actor of [0,1] as const)Object.assign(state.fighters[actor],{x:actor===0?-15:15,meter:100})
    const events=[]
    const total=MARS_ARCADE_NON_PROFIT_PIVOT.startupFrames+MARS_ARCADE_NON_PROFIT_PIVOT.activeFrames+MARS_ARCADE_NON_PROFIT_PIVOT.recoveryFrames
    for(let tick=0;tick<total+13;tick++){
      const input={...NEUTRAL_MARS_ARCADE_INPUT,special:tick===0},next=advanceMarsArcade(state,side===0?[input,NEUTRAL_MARS_ARCADE_INPUT]:[NEUTRAL_MARS_ARCADE_INPUT,input],1/60)
      state=next.state;events.push(...next.events)
    }
    expect(state.fighters[side===0?1:0]).toMatchObject({health:63,meter:50})
    expect(state.fighters[side]).toMatchObject({meter:90,activity:'idle'})
    expect(events.filter(e=>e.type==='hit')).toHaveLength(1)
    expect(events.filter(e=>e.type==='hit')[0]).toMatchObject({damage:36})
    expect(events.filter(e=>e.type==='lawsuitDamage')).toHaveLength(1)
    expect(events.filter(e=>e.type==='assetSeizure')).toHaveLength(1)
  })
})
