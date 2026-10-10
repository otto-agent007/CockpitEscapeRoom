import type {ArcadeKeyBindings} from './arcadeHarnessInput'
export type PivotDirection='neutral'|'forward'|'down'|'down-forward'|'back'
export interface PivotMotionHistory {stage:0|1|2|3;startedFrame:number;facing:1|-1;lastDirection:PivotDirection}
export function createPivotMotion():PivotMotionHistory {return {stage:0,startedFrame:0,facing:1,lastDirection:'neutral'}}
export function pivotDirection(held:ReadonlySet<string>,bindings:ArcadeKeyBindings,facing:1|-1):PivotDirection {
  const move=(held.has(bindings.right)?1:0)-(held.has(bindings.left)?1:0)
  const down=bindings.down?held.has(bindings.down):false
  if(move===-facing)return 'back'
  return down?(move===facing?'down-forward':'down'):move===facing?'forward':'neutral'
}
export function advancePivotMotion(previous:PivotMotionHistory,direction:PivotDirection,heavyPressed:boolean,frame:number,facing:1|-1):{history:PivotMotionHistory;special:boolean} {
  const history={...previous}
  if(frame<previous.startedFrame||frame-previous.startedFrame>18||facing!==previous.facing){
    Object.assign(history,{stage:0,startedFrame:frame,facing,lastDirection:'neutral'})
  }
  if(direction!==history.lastDirection&&direction!=='neutral'){
    if(direction==='forward'){history.stage=1;history.startedFrame=frame;history.facing=facing}
    else if(direction==='down'&&history.stage===1)history.stage=2
    else if(direction==='down-forward'&&history.stage===2)history.stage=3
    else history.stage=0
  }
  history.lastDirection=direction
  const special=heavyPressed&&history.stage===3&&direction==='down-forward'&&frame-history.startedFrame<=18
  if(special)history.stage=0
  return {history,special}
}
