/**
 * Dev presentation for the booster's space laser: where the beam is drawn and
 * what it looks like at each age. Derived from real hit events, never a rule.
 *
 * The engine resolves the strike on the frame the button goes down, so the beam
 * cannot be scheduled ahead of it. It is recorded from the `hit` event at the
 * defender's position on that frame and aged by the fight's own frame counter,
 * so pause, step and speed changes all hold it in step with the fight.
 */
import type { MarsArcadeEvent, MarsArcadeState } from '../game/marsArcade'
import { marsArcadeFighter } from '../game/marsArcadeFighters'

export interface LaserStrike {
  /** Stage x the beam landed on: the defender's position on the strike frame. */
  x: number
  /** Fight frame the strike resolved on. */
  frame: number
}

/** Frames the beam itself is on screen. */
export const LASER_BEAM_FRAMES = 14
/** Frames the scorch mark stays on the regolith after the beam has gone. */
export const LASER_SCORCH_FRAMES = 40

export type LaserBeamPhase = 'slam' | 'hold' | 'thin' | 'scorch'

export interface LaserBeamShape {
  phase: LaserBeamPhase
  /** Beam core width in stage pixels. Zero once only the scorch is left. */
  width: number
}

export function updateLaserStrikes(
  previous: LaserStrike[],
  after: MarsArcadeState,
  events: MarsArcadeEvent[],
): LaserStrike[] {
  const next = previous.filter((strike) => after.frame - strike.frame < LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES)
  for (const event of events) {
    if (event.type !== 'hit') continue
    const attacker = after.fighters[event.attacker]
    const move = marsArcadeFighter(attacker.id).moves.special
    if (event.moveId !== move.id || !move.lockOn) continue
    const defender = after.fighters[event.attacker === 0 ? 1 : 0]
    next.push({ x: defender.x, frame: after.frame })
  }
  return next
}

/**
 * The beam at a given age, in frames since the strike.
 *
 * Reduced motion keeps the beam and the scorch, which are the only cue that a
 * hit came from the sky, but drops the width changes: one steady beam, then gone.
 */
export function laserBeamShape(age: number, reducedMotion: boolean): LaserBeamShape | null {
  if (age < 0 || age >= LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES) return null
  if (age >= LASER_BEAM_FRAMES) return { phase: 'scorch', width: 0 }
  if (reducedMotion) return { phase: 'hold', width: 6 }
  if (age < 3) return { phase: 'slam', width: 10 }
  if (age < 9) return { phase: 'hold', width: 6 }
  return { phase: 'thin', width: 2 }
}
