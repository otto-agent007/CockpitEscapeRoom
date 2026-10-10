import {afterEach,beforeEach,expect,it} from 'vitest'
import {advanceMarsArcade,createMarsArcadeRound,NEUTRAL_MARS_ARCADE_INPUT} from '../game/marsArcade'
import {setMarsArcadePivotPreview,setMarsArcadeTuning} from '../game/marsArcadeFighters'
import {PIVOT_PROMISE,pivotAccessibleStatus,updatePivotPresentations} from './arcadeHarnessPivot'

beforeEach(()=>{setMarsArcadeTuning(null);setMarsArcadePivotPreview(true)})
afterEach(()=>{setMarsArcadePivotPreview(false);setMarsArcadeTuning(null)})
it('keeps the announcement readable for4.5simulation seconds and expires it after that',()=>{
  let state=createMarsArcadeRound('oracle','booster');state.phase='fight'
  Object.assign(state.fighters[0],{x:-15,meter:100});Object.assign(state.fighters[1],{x:15,meter:80})
  let presentations:ReturnType<typeof updatePivotPresentations>=[]
  const step=(special=false)=>{const next=advanceMarsArcade(state,[{...NEUTRAL_MARS_ARCADE_INPUT,special},NEUTRAL_MARS_ARCADE_INPUT],1/60);presentations=updatePivotPresentations(presentations,state,next.state,next.events);state=next.state}
  step(true);const start=presentations[0]!.frame
  while(state.frame<start+120)step()
  expect(pivotAccessibleStatus(state,presentations)).toContain(PIVOT_PROMISE)
  while(state.frame<start+269)step()
  expect(pivotAccessibleStatus(state,presentations)).toContain(PIVOT_PROMISE)
  step()
  expect(pivotAccessibleStatus(state,presentations)).not.toContain(PIVOT_PROMISE)
})
