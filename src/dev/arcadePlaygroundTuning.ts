import type {MarsArcadeMoveTuning,MarsArcadeTuning} from '../game/marsArcadeFighters'

/** Keep a dev-only move from overwriting the retained production tuning slot. */
export function arcadePersistedTuning(tuning:MarsArcadeTuning,retained:MarsArcadeMoveTuning,pivotEnabled:boolean):MarsArcadeTuning {
  const saved=structuredClone(tuning)
  if(pivotEnabled)saved.fighters.oracle.moves.special=structuredClone(retained)
  return saved
}
