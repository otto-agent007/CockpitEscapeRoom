import type {MarsArcadeEvent,MarsArcadeSide,MarsArcadeState} from '../game/marsArcade'
import {marsArcadeFighter} from '../game/marsArcadeFighters'
import {PIVOT_SLIDE_FRAMES} from '../game/marsArcadePivot'
import {MARS_ARCADE_VIEW,marsArcadeScreenX} from '../game/marsArcadeStage'
import {drawTextShadowed} from './arcadeTypography'

export const PIVOT_PROMISE='Look! Open-source AGI for the good of all humanity!'
export const PIVOT_PROMISE_FRAMES=270
export interface PivotPresentation {kind:'promise'|'stamp';side:MarsArcadeSide;frame:number;amount?:number}
export function updatePivotPresentations(previous:readonly PivotPresentation[],before:MarsArcadeState,after:MarsArcadeState,events:readonly MarsArcadeEvent[]):PivotPresentation[] {
  if(after.phase!=='fight')return []
  const next=previous.filter(p=>after.frame>=p.frame&&after.frame-p.frame<(p.kind==='promise'?PIVOT_PROMISE_FRAMES:45))
  for(const side of [0,1] as const){
    const actor=after.fighters[side],old=before.fighters[side]
    if(actor.activity==='attack'&&actor.activeButton==='special'&&marsArcadeFighter(actor.id).moves.special.pivot&&
      (old.activity!=='attack'||old.activeButton!=='special'||actor.moveFrame<old.moveFrame))
      next.push({kind:'promise',side,frame:after.frame-actor.moveFrame})
  }
  for(const event of events)if(event.type==='assetSeizure')next.push({kind:'stamp',side:event.defender,frame:after.frame,amount:event.amount})
  return next
}
export function pivotAccessibleStatus(state:MarsArcadeState,presentations:readonly PivotPresentation[]):string {
  const lines:string[]=[]
  if(presentations.some(p=>p.kind==='promise'))lines.push(PIVOT_PROMISE)
  if(state.pivot){
    const actor=state.fighters[state.pivot.attacker],reading=actor.moveFrame<marsArcadeFighter(actor.id).moves.special.startupFrames-PIVOT_SLIDE_FRAMES
    lines.push(reading?`P${state.pivot.defender+1} is distracted by Sam’s announcement.`:`P${state.pivot.defender+1} is distracted; Sam is reversing behind them.`)
  }
  const stamp=[...presentations].reverse().find(p=>p.kind==='stamp')
  if(stamp)lines.push(`Capped profit: acquired ${stamp.amount?.toFixed(1)} meter from P${stamp.side+1}.`)
  for(const side of [0,1] as const){const status=state.fighters[side].lawsuit;if(status)lines.push(`P${side+1}: Lawsuit Pending, ${Math.ceil(status.framesRemaining/60)} seconds remaining.`)}
  return lines.join(' ')
}

/** Pixel shapes/text are separate from the actor PNGs and never decide a hit. */
export function drawPivotPresentation(ctx:CanvasRenderingContext2D,state:MarsArcadeState,presentations:readonly PivotPresentation[],camera:number,scale:number):void {
  if(state.phase!=='fight')return
  ctx.save()
  const text=(value:string,x:number,y:number,color:string)=>drawTextShadowed(ctx,value,Math.round(x*scale),Math.round(y*scale),scale,color,'#090d18')
  if(presentations.some(p=>p.kind==='promise')){
    ctx.fillStyle='#13293b';ctx.fillRect(8*scale,30*scale,304*scale,34*scale)
    ctx.strokeStyle='#b9ffdf';ctx.lineWidth=scale;ctx.strokeRect(8*scale,30*scale,304*scale,34*scale)
    drawTextShadowed(ctx,'Look! Open-source AGI',16*scale,34*scale,scale*4/3,'#ffffff')
    drawTextShadowed(ctx,'For the good of all humanity!',16*scale,48*scale,scale*4/3,'#ffffff')
  }
  if(state.pivot){
    const target=state.fighters[state.pivot.defender],x=Math.round(marsArcadeScreenX(target.x,camera)),y=MARS_ARCADE_VIEW.floorRow-116
    ctx.fillStyle='#afffde'
    for(let row=-8;row<=8;row++){
      const edge=Math.round(Math.sqrt(64-row*row))
      ctx.fillRect((x-edge)*scale,(y+row)*scale,2*scale,scale)
      ctx.fillRect((x+edge-1)*scale,(y+row)*scale,2*scale,scale)
    }
    ctx.fillStyle='#ffffff'
    for(const [dx,dy] of [[-2,-2],[-4,0],[-2,2],[2,-2],[4,0],[2,2]] as const)ctx.fillRect((x+dx)*scale,(y+dy)*scale,2*scale,scale)
  }
  for(const p of presentations){
    if(p.kind!=='stamp')continue
    const x=Math.max(2,Math.min(234,marsArcadeScreenX(state.fighters[p.side].x,camera)-40))
    ctx.fillStyle='#35163e';ctx.fillRect(x*scale,70*scale,84*scale,22*scale)
    text('CAPPED PROFIT',x+2,72,'#ffe2ad')
    text(`-${p.amount?.toFixed(0)} METER`,x+2,82,'#b9ffdf')
  }
  for(const fighter of state.fighters){
    if(!fighter.lawsuit)continue
    const x=Math.max(2,Math.min(226,marsArcadeScreenX(fighter.x,camera)-42))
    ctx.fillStyle='#321d3d';ctx.fillRect(x*scale,204*scale,92*scale,9*scale)
    text('LAWSUIT PENDING',x+1,205,'#efbfff')
  }
  ctx.restore()
}
