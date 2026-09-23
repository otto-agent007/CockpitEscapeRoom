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

/** Beam art is pre-rendered at these widths (stage px); 0 means the beam has gone. */
export type LaserBeamWidth = 14 | 10 | 6 | 0

export interface LaserStrikeLook {
  beamWidth: LaserBeamWidth
  /** Which of the four impact drawings: flash, burst, dust, scorch. */
  impactFrame: 0 | 1 | 2 | 3
  /** How far the satellite has flown on past the strike, or null once it is gone. */
  satelliteOffset: number | null
}

/** Stage px per frame the satellite flies on once it has fired. */
export const LASER_SATELLITE_EXIT_SPEED = 4

/**
 * The strike at a given age, in frames since the hit.
 *
 * The satellite holds over the target while the beam is up, then flies on. The
 * impact runs flash, burst, dust, and its last drawing, the scorch, lingers.
 * Reduced motion keeps the beam and the scorch, which are the only cue that the
 * hit came from the sky, and drops the flash, the width changes and the drift.
 */
export function laserStrikeLook(age: number, reducedMotion: boolean): LaserStrikeLook | null {
  if (age < 0 || age >= LASER_BEAM_FRAMES + LASER_SCORCH_FRAMES) return null
  const beamUp = age < LASER_BEAM_FRAMES
  if (reducedMotion) {
    return { beamWidth: beamUp ? 10 : 0, impactFrame: 3, satelliteOffset: beamUp ? 0 : null }
  }
  const beamWidth: LaserBeamWidth = age < 3 ? 14 : age < 9 ? 10 : beamUp ? 6 : 0
  const impactFrame = age < 3 ? 0 : age < 8 ? 1 : age < 16 ? 2 : 3
  const satelliteOffset = beamUp ? 0 : (age - LASER_BEAM_FRAMES + 1) * LASER_SATELLITE_EXIT_SPEED
  return { beamWidth, impactFrame, satelliteOffset }
}
