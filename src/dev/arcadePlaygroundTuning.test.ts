import {describe,expect,it} from 'vitest'
import {marsArcadeDefaultTuning} from '../game/marsArcadeFighters'
import {arcadePersistedTuning} from './arcadePlaygroundTuning'

describe('regular Sam arcade tuning persistence',()=>{
  it('keeps other live edits and the retained Text Bubble slot when Pivot is active',()=>{
    const baseline=marsArcadeDefaultTuning(),retained=structuredClone(baseline.fighters.oracle.moves.special)
    const live=structuredClone(baseline);live.fighters.captain.walkSpeed=1.35;live.fighters.oracle.moves.special.damage=18;live.fighters.oracle.moves.special.chipDamage=0
    const before=structuredClone(live),saved=arcadePersistedTuning(live,retained,true)
    expect(saved.fighters.captain.walkSpeed).toBe(1.35)
    expect(saved.fighters.oracle.moves.special).toEqual(retained)
    expect(live).toEqual(before)
    saved.fighters.oracle.moves.special.damage=99
    expect(retained).toEqual(baseline.fighters.oracle.moves.special)
  })
  it('retains normal special edits when playing the legacy mode',()=>{
    const live=marsArcadeDefaultTuning(),retained=structuredClone(live.fighters.oracle.moves.special)
    live.fighters.oracle.moves.special.damage=12
    expect(arcadePersistedTuning(live,retained,false).fighters.oracle.moves.special.damage).toBe(12)
  })
})
