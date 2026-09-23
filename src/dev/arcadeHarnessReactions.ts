/** Dev presentation metadata only: derive reaction timing from actual hit and block events. */
import type { MarsArcadeEvent, MarsArcadeState } from '../game/marsArcade'
import { marsArcadeFighter } from '../game/marsArcadeFighters'

export interface HeavyReaction {
  kind: 'hit' | 'block'
  duration: number
  /** Initial drawing offset back toward the pre-knockback position. */
  offsetX: number
}
export type HeavyReactions = [HeavyReaction | null, HeavyReaction | null]

export function updateHeavyReactions(
  previous: HeavyReactions, before: MarsArcadeState, after: MarsArcadeState,
  events: MarsArcadeEvent[],
): HeavyReactions {
  if (after.phase !== 'fight') return [null, null]
  const next: HeavyReactions = [...previous]
  for (const side of [0, 1] as const) {
    const fighter = after.fighters[side]
    const activity = next[side]?.kind === 'block' ? 'blockstun' : 'hitstun'
    if (fighter.activity !== activity || fighter.stunFrames <= 0 || fighter.y !== 0) next[side] = null
  }
  for (const event of events) {
    if (event.type !== 'hit' && event.type !== 'blocked') continue
    const defender = event.attacker === 0 ? 1 : 0
    next[defender] = null
    const target = after.fighters[defender]
    const move = marsArcadeFighter(after.fighters[event.attacker].id).moves.heavy
    const kind = event.type === 'blocked' ? 'block' : 'hit'
    const activity = kind === 'block' ? 'blockstun' : 'hitstun'
    const authored = target.id === 'oracle' || (kind === 'hit' && target.id === 'booster')
    if (!authored || target.activity !== activity || target.y !== 0 || event.moveId !== move.id) continue
    if (kind === 'block') {
      next[defender] = { kind, duration: move.blockstunFrames, offsetX: 0 }
      continue
    }
    const direction = Math.sign(target.x - after.fighters[event.attacker].x)
    // Clamp to displacement the rules actually allowed, especially against a wall.
    const distance = Math.min(move.knockback, Math.max(0, direction * (target.x - before.fighters[defender].x)))
    next[defender] = { kind, duration: move.hitstunFrames, offsetX: -direction * distance }
  }
  return next
}
