import {afterEach,beforeEach,describe,expect,it} from 'vitest'
import {advanceMarsArcade,createMarsArcadeRound,NEUTRAL_MARS_ARCADE_INPUT,type MarsArcadeInput,type MarsArcadeSide,type MarsArcadeState} from './marsArcade'
import {MARS_ARCADE_NON_PROFIT_PIVOT,setMarsArcadePivotPreview,setMarsArcadeTuning,type MarsArcadeFighterId} from './marsArcadeFighters'

const neutral=NEUTRAL_MARS_ARCADE_INPUT
const strikeFrame=()=>MARS_ARCADE_NON_PROFIT_PIVOT.startupFrames
const moveTicks=()=>strikeFrame()+MARS_ARCADE_NON_PROFIT_PIVOT.activeFrames+MARS_ARCADE_NON_PROFIT_PIVOT.recoveryFrames
beforeEach(()=>{
  setMarsArcadeTuning(null)
  setMarsArcadePivotPreview(true)
})
afterEach(()=>{setMarsArcadePivotPreview(false);setMarsArcadeTuning(null)})

const other=(side:MarsArcadeSide):MarsArcadeSide=>side===0?1:0
function round(target:MarsArcadeFighterId='booster',side:MarsArcadeSide=0):MarsArcadeState {
  const state=createMarsArcadeRound(side===0?'oracle':target,side===1?'oracle':target)
  state.phase='fight'
  Object.assign(state.fighters[side],{x:side===0?-15:15,facing:side===0?1:-1,meter:100})
  Object.assign(state.fighters[other(side)],{x:side===0?15:-15,facing:side===0?-1:1,meter:80})
  return state
}
function step(state:MarsArcadeState,side:MarsArcadeSide,special=false,targetInput:MarsArcadeInput=neutral){
  const own={...neutral,special}
  return advanceMarsArcade(state,side===0?[own,targetInput]:[targetInput,own],1/60)
}
function land(initial:MarsArcadeState,side:MarsArcadeSide=0,targetInput:MarsArcadeInput=neutral){
  let state=step(initial,side,true,targetInput).state
  const events=[]
  for(let tick=1;tick<=strikeFrame();tick++){const next=step(state,side,false,targetInput);state=next.state;events.push(...next.events)}
  return {state,events}
}

describe('Non-Profit Pivot command capture',()=>{
  it.each([0,1] as const)('freezes a guarded target, reverses and steals exactly half once on side%s',side=>{
    let state=round('booster',side)
    state.fighters[side].x=side===0?-12:12
    state.fighters[other(side)].x=side===0?12:-12
    const guard={...neutral,move:side===0?1:-1}
    state=step(state,side,true,guard).state
    for(let tick=1;tick<=24;tick++)state=step(state,side,false,guard).state
    expect(state.fighters[other(side)].activity).toBe('distracted')
    expect(state).toHaveProperty('pivot.attacker',side)
    const original=structuredClone(state),targetX=state.fighters[other(side)].x
    const next=step(state,side,false,{...guard,jump:true,heavy:true})
    expect(next.state.fighters[other(side)].x).toBe(targetX)
    expect(next.state.fighters[other(side)].activity).toBe('distracted')
    expect(state).toEqual(original)
    state=next.state
    const events=[]
    for(let tick=26;tick<=strikeFrame();tick++){const next=step(state,side,false,guard);state=next.state;events.push(...next.events)}
    expect(state.fighters[other(side)]).toMatchObject({health:64,meter:40,guard:90,activity:'hitstun'})
    expect(state.fighters[side].meter).toBe(80)
    expect(state.fighters[side].facing).toBe(side===0?-1:1)
    expect(Math.sign(state.fighters[side].x-state.fighters[other(side)].x)).toBe(side===0?1:-1)
    expect(events.filter(e=>e.type==='hit')).toHaveLength(1)
    for(let tick=0;tick<30;tick++)state=step(state,side).state
    expect(state.fighters[other(side)].health).toBe(64)
    expect(state.fighters[other(side)].meter).toBe(40)
  })

  it('uses base damage against Captain and no co-founder penalty',()=>{
    const {state}=land(round('captain'))
    expect(state.fighters[1]).toMatchObject({health:82,meter:40,guard:110})
    expect(state.fighters[1]).not.toHaveProperty('lawsuit')
    expect(state.fighters[0].meter).toBe(80)
  })

  it.each(['far','jump'] as const)('spends cost and whiffs without acquiring a%s target',mode=>{
    let state=round()
    if(mode==='far')state.fighters[1].x=120
    state=step(state,0,true).state
    for(let tick=1;tick<moveTicks()+13;tick++)state=step(state,0,false,{...neutral,jump:mode==='jump'&&tick===18}).state
    expect(state.fighters[0].meter).toBe(40)
    expect(state.fighters[1]).toMatchObject({health:100,meter:80})
    expect(state).not.toHaveProperty('pivot')
  })

  it.each([0,1] as const)('fits rear placement at either wall on side%s',side=>{
    for(const facing of [1,-1] as const){
      const start=round('booster',side)
      Object.assign(start.fighters[other(side)],{x:facing*228})
      Object.assign(start.fighters[side],{x:facing*178,facing})
      const {state}=land(start,side)
      for(const fighter of state.fighters)expect(Math.abs(fighter.x)).toBeLessThanOrEqual(228)
      expect(Math.abs(state.fighters[side].x-state.fighters[other(side)].x)).toBeGreaterThanOrEqual(24)
      expect(state.fighters[side].facing).toBe(-facing)
      expect(state.fighters[other(side)].health).toBe(64)
    }
  })

  it('releases capture on interruption without theft or a stuck defender',()=>{
    let state=step(round(),0,true).state
    for(let tick=1;tick<=28;tick++)state=step(state,0).state
    expect(state.fighters[1].activity).toBe('distracted')
    Object.assign(state.fighters[0],{activity:'hitstun',activeButton:null,stunFrames:12})
    state=step(state,0).state
    expect(state).not.toHaveProperty('pivot')
    expect(state.fighters[1]).toMatchObject({activity:'idle',health:100,meter:80})
  })

  it('ticks the single lawsuit three times on simulation time and freezes through hit stop',()=>{
    let {state}=land(round())
    expect(state.fighters[1]).toHaveProperty('lawsuit')
    const frozen=structuredClone(state.fighters[1])
    expect(state.hitstop).not.toBeNull()
    state=step(state,0).state
    expect(state.fighters[1]).toEqual(frozen)
    const hitFrame=state.frame
    while(state.frame<hitFrame+179)state=step(state,0).state
    expect(state.fighters[1].health).toBe(62)
    state=step(state,0).state
    expect(state.fighters[1].health).toBe(61)
    expect(state.fighters[1]).not.toHaveProperty('lawsuit')
  })
  it('reapplies one lawsuit after recovery and ends it safely at knockout',()=>{
    let {state}=land(round())
    while(state.fighters[0].activity==='attack')state=step(state,0).state
    state=land(state).state
    expect(state.fighters[1].lawsuit).toMatchObject({framesRemaining:180,untilTick:60})
    state.fighters[1].health=1
    for(let tick=0;tick<70&&state.phase==='fight';tick++)state=step(state,0).state
    expect(state).toMatchObject({phase:'ko',winner:0})
    expect(state.fighters[1].health).toBe(0)
    expect(state.fighters[1]).not.toHaveProperty('lawsuit')
    expect(createMarsArcadeRound('oracle','booster')).not.toHaveProperty('pivot')
  })
  it('honors a jump initiated on the capture tick',()=>{
    let state=step(round(),0,true).state
    for(let tick=1;tick<=24;tick++)state=step(state,0,false,{...neutral,jump:tick===24}).state
    expect(state).not.toHaveProperty('pivot')
    expect(state.fighters[1].activity).toBe('airborne')
  })
  it('does not emit a phantom capture when a lawsuit kills the caster first',()=>{
    const state=round()
    Object.assign(state.fighters[0],{activity:'attack',activeButton:'special',moveFrame:23,health:1,lawsuit:{attacker:1,framesRemaining:60,untilTick:1}})
    const next=step(state,0)
    expect(next.state).toMatchObject({phase:'ko',winner:1})
    expect(next.events.some(e=>e.type==='pivotCapture')).toBe(false)
    expect(next.state.fighters[1].activity).not.toBe('distracted')
  })
  it('releases a target killed by a lawsuit before the pen strike without theft',()=>{
    let state=step(round(),0,true).state
    for(let tick=1;tick<strikeFrame();tick++)state=step(state,0).state
    Object.assign(state.fighters[1],{health:1,lawsuit:{attacker:0,framesRemaining:60,untilTick:1}})
    const next=step(state,0)
    expect(next.state).toMatchObject({phase:'ko',winner:0})
    expect(next.state.fighters[1]).toMatchObject({health:0,meter:80})
    expect(next.events.some(e=>e.type==='hit'||e.type==='assetSeizure')).toBe(false)
    expect(next.state).not.toHaveProperty('pivot')
  })
  it('treats simultaneous mirrored captures as mutual misses without side priority',()=>{
    let state=createMarsArcadeRound('oracle','oracle');state.phase='fight'
    for(const side of [0,1] as const)Object.assign(state.fighters[side],{x:side===0?-15:15,meter:100})
    const special={...neutral,special:true}
    state=advanceMarsArcade(state,[special,special],1/60).state
    for(let tick=0;tick<moveTicks()+13;tick++)state=advanceMarsArcade(state,[neutral,neutral],1/60).state
    expect(state).not.toHaveProperty('pivot')
    for(const fighter of state.fighters)expect(fighter).toMatchObject({health:100,meter:40,activity:'idle'})
  })
  it.each([0,1] as const)('holds the captured announcement for two seconds before sliding, side%s',side=>{
    let state=step(round('booster',side),side,true).state
    for(let tick=1;tick<=24;tick++)state=step(state,side).state
    const actorX=state.fighters[side].x,targetX=state.fighters[other(side)].x
    for(let tick=25;tick<=144;tick++){
      state=step(state,side,false,{...neutral,heavy:true,jump:true,move:1}).state
      expect(state.fighters[side].x).toBe(actorX)
      expect(state.fighters[other(side)]).toMatchObject({x:targetX,health:100,meter:80,activity:'distracted'})
    }
    state=step(state,side).state
    expect(state.fighters[side].x).not.toBe(actorX)
    expect(strikeFrame()).toBe(162)
  })
})
