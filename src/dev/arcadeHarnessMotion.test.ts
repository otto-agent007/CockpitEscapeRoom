import {describe,expect,it} from 'vitest'
import {advancePivotMotion,createPivotMotion,pivotDirection} from './arcadeHarnessMotion'
import {PLAYER_ONE_BINDINGS} from './arcadeHarnessInput'

describe('Sam forward/down/down-forward Heavy motion',()=>{
  it.each([1,-1] as const)('recognizes the facing-relative sequence once, facing%s',facing=>{
    let history=createPivotMotion()
    const forward=facing===1?'KeyD':'KeyA'
    for(const [keys,frame] of [[[forward],0],[['KeyS'],3],[[forward,'KeyS'],6]] as const){
      const result=advancePivotMotion(history,pivotDirection(new Set(keys),PLAYER_ONE_BINDINGS,facing),false,frame,facing)
      history=result.history;expect(result.special).toBe(false)
    }
    const hit=advancePivotMotion(history,'down-forward',true,7,facing)
    expect(hit.special).toBe(true)
    expect(advancePivotMotion(hit.history,'down-forward',true,8,facing).special).toBe(false)
  })
  it('keeps neutral releases between directions and accepts a paused sequence on one frame',()=>{
    let history=createPivotMotion()
    for(const direction of ['forward','neutral','down','neutral','down-forward'] as const)history=advancePivotMotion(history,direction,false,10,1).history
    expect(advancePivotMotion(history,'down-forward',true,10,1).special).toBe(true)
  })
  it('rejects expired or wrong-order sequences so Heavy can remain a normal attack',()=>{
    let history=createPivotMotion()
    history=advancePivotMotion(history,'forward',false,0,1).history
    history=advancePivotMotion(history,'down',false,10,1).history
    history=advancePivotMotion(history,'down-forward',false,19,1).history
    expect(advancePivotMotion(history,'down-forward',true,20,1).special).toBe(false)
    history=createPivotMotion()
    for(const direction of ['down','forward','down-forward'] as const)history=advancePivotMotion(history,direction,false,0,1).history
    expect(advancePivotMotion(history,'down-forward',true,0,1).special).toBe(false)
  })
  it('resets across a round/frame reset or facing change',()=>{
    let history=createPivotMotion()
    for(const direction of ['forward','down','down-forward'] as const)history=advancePivotMotion(history,direction,false,40,1).history
    expect(advancePivotMotion(history,'down-forward',true,0,1).special).toBe(false)
    expect(advancePivotMotion(history,'down-forward',true,41,-1).special).toBe(false)
    expect(advancePivotMotion(createPivotMotion(),'down-forward',true,41,1).special).toBe(false)
  })
})
