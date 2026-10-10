import type {MarsArcadeEvent,MarsArcadeSide,MarsArcadeState} from './marsArcade'
import {MARS_ARCADE_COFOUNDER_TARGETS,MARS_ARCADE_METER_MAX,MARS_ARCADE_PIVOT_TIMING,marsArcadeFighter} from './marsArcadeFighters'

export const PIVOT_CAPTURE_FRAME=MARS_ARCADE_PIVOT_TIMING.windup
export const PIVOT_SLIDE_FRAMES=MARS_ARCADE_PIVOT_TIMING.slide
export const PIVOT_CAPTURE_REACH=60
export interface MarsArcadePivotCapture {
  attacker:MarsArcadeSide
  defender:MarsArcadeSide
  fromX:number
  targetX:number
  rearX:number
  facing:1|-1
}
export interface MarsArcadeLawsuit {attacker:MarsArcadeSide;framesRemaining:number;untilTick:number}

export function releaseMarsArcadePivot(state:MarsArcadeState):void {
  if(state.pivot){
    const target=state.fighters[state.pivot.defender]
    if(target.activity==='distracted'){target.activity='idle';target.blocking=false}
    delete state.pivot
  }
}

/** World coordinates own the slide; only the captured pair can overlap during it. */
export function advanceMarsArcadePivot(state:MarsArcadeState,events:MarsArcadeEvent[],stageHalfWidth:number):void {
  if(state.pivot){
    const capture=state.pivot,actor=state.fighters[capture.attacker],target=state.fighters[capture.defender]
    const move=marsArcadeFighter(actor.id).moves.special
    if(actor.health<=0||target.health<=0||actor.activity!=='attack'||actor.activeButton!=='special'||!move.pivot||target.activity!=='distracted'){
      releaseMarsArcadePivot(state);return
    }
    const slideStart=move.startupFrames-PIVOT_SLIDE_FRAMES
    const progress=Math.min(1,Math.max(0,(actor.moveFrame-slideStart)/PIVOT_SLIDE_FRAMES))
    actor.x=capture.fromX+(capture.rearX-capture.fromX)*progress
    target.x=capture.targetX
    actor.facing=target.x>=actor.x?1:-1
    return
  }
  const requests=([0,1] as const).filter(side=>{
    const actor=state.fighters[side],target=state.fighters[side===0?1:0],move=marsArcadeFighter(actor.id).moves.special
    return move.pivot&&actor.health>0&&actor.activity==='attack'&&actor.activeButton==='special'&&actor.moveFrame===PIVOT_CAPTURE_FRAME&&
      target.health>0&&target.y<=0&&target.activity!=='airborne'&&Math.abs(target.x-actor.x)<=PIVOT_CAPTURE_REACH&&Math.sign(target.x-actor.x)===actor.facing
  })
  // Simultaneous mirrored promises both miss; neither side gets a hidden priority.
  if(requests.length!==1)return
  for(const side of requests){
    const actor=state.fighters[side],defender=side===0?1:0,target=state.fighters[defender]
    const move=marsArcadeFighter(actor.id).moves.special
    if(!move.pivot||actor.activity!=='attack'||actor.activeButton!=='special'||actor.moveFrame!==PIVOT_CAPTURE_FRAME)continue
    if(target.y>0||target.health<=0||Math.abs(target.x-actor.x)>PIVOT_CAPTURE_REACH)continue
    if(Math.sign(target.x-actor.x)!==actor.facing)continue
    const actorHalf=marsArcadeFighter(actor.id).pushboxWidth/2
    const defenderHalf=marsArcadeFighter(target.id).pushboxWidth/2
    const gap=Math.max(actorHalf+defenderHalf+2,move.reach+defenderHalf-2)
    const rearX=actor.facing===1?Math.min(stageHalfWidth-actorHalf,target.x+gap):Math.max(-stageHalfWidth+actorHalf,target.x-gap)
    const targetX=rearX-actor.facing*gap
    state.pivot={attacker:side,defender,fromX:actor.x,targetX,rearX,facing:actor.facing}
    Object.assign(target,{x:targetX,activity:'distracted',activeButton:null,stunFrames:0,blocking:false,velocityY:0})
    delete target.stunOrigin
    events.push({type:'pivotCapture',attacker:side,defender})
    break
  }
}

export function finishInterruptedMarsArcadePivot(state:MarsArcadeState):void {
  if(!state.pivot)return
  const actor=state.fighters[state.pivot.attacker],target=state.fighters[state.pivot.defender]
  if(actor.health<=0||target.health<=0||actor.activity!=='attack'||actor.activeButton!=='special'||target.activity!=='distracted')releaseMarsArcadePivot(state)
}

export function seizeMarsArcadeAssets(state:MarsArcadeState,attacker:MarsArcadeSide,defender:MarsArcadeSide,events:MarsArcadeEvent[]):void {
  const actor=state.fighters[attacker],target=state.fighters[defender],amount=target.meter/2
  target.meter-=amount;actor.meter=Math.min(MARS_ARCADE_METER_MAX,actor.meter+amount)
  if(MARS_ARCADE_COFOUNDER_TARGETS.includes(target.id))target.lawsuit={attacker,framesRemaining:180,untilTick:60}
  events.push({type:'assetSeizure',attacker,defender,amount})
  releaseMarsArcadePivot(state)
}

/** One status per defender; refresh replaces it, and simulation/hitstop own its clock. */
export function tickMarsArcadeLawsuits(state:MarsArcadeState,events:MarsArcadeEvent[]):void {
  for(const side of [0,1] as const){
    const fighter=state.fighters[side],status=fighter.lawsuit
    if(!status)continue
    status.framesRemaining--;status.untilTick--
    if(status.untilTick<=0){
      fighter.health=Math.max(0,fighter.health-1);status.untilTick=60
      events.push({type:'lawsuitDamage',attacker:status.attacker,defender:side,damage:1})
    }
    if(status.framesRemaining<=0||fighter.health<=0)delete fighter.lawsuit
  }
}
