/**
 * Mars arcade cabinet — fighter content.
 *
 * Content only: no Three.js, no rendering, no sprite paths. The cabinet is an
 * optional Easter-egg beat that lives behind the Mars phase, so nothing in this
 * module may name a real person, and nothing here may reference the protected
 * ground-transport reward.
 *
 * Identity: THE BOOSTER and THE ORACLE are drawn as cartoon likenesses of Elon
 * Musk and Sam Altman, and THE CAPTAIN is Pop T. Owner decision, 2026-09-20,
 * superseding the invented-archetype-only rule of 2026-09-19. The ids and move
 * names below stay archetype-named on purpose: the rules do not depend on who a
 * fighter looks like, and the art direction can move again without touching them.
 *
 * Positions and reaches are expressed in the intro stage's pixel units so the
 * sprite pipeline and the fight rules share one coordinate space. Note that the
 * stage is now wider than the 320 px screen; see `marsArcadeStage.ts`.
 */

export type MarsArcadeFighterId = 'booster' | 'oracle' | 'captain'
export type MarsArcadeButton = 'light' | 'heavy' | 'special'

export interface MarsArcadeProjectileSpec {
  speed: number
  lifetimeFrames: number
  maxHeight: number
}

export interface MarsArcadeMove {
  id: string
  label: string
  button: MarsArcadeButton
  /** Frames before the hitbox exists. The move cannot hit during startup. */
  startupFrames: number
  /** Frames the hitbox is live. */
  activeFrames: number
  /** Frames of recovery after the hitbox closes. */
  recoveryFrames: number
  damage: number
  /** Damage dealt through a successful block. */
  chipDamage: number
  /** Guard meter removed from a blocking defender. */
  guardDamage: number
  /** Horizontal range measured from the attacker's origin. */
  reach: number
  /** Highest defender foot height this move can touch. */
  maxHeight: number
  hitstunFrames: number
  blockstunFrames: number
  knockback: number
  meterCost: number
  meterGainOnHit: number
  meterGainOnBlock: number
  /** Pops a grounded defender into the air. */
  launches: boolean
  projectile?: MarsArcadeProjectileSpec
  /**
   * Return-to-pad landing. Pressing the same button again inside the window
   * shortens recovery; letting the window close tips the fighter over and
   * hands the opponent a long punish. Frames are counted from the first
   * recovery frame, so an early press is always better than a late one.
   */
  landingWindow?: {
    openFrame: number
    closeFrame: number
    /** Recovery frames remaining, counted from the moment of the press. */
    stuckRecoveryFrames: number
    /** Total recovery frames once the window closes unanswered. */
    tippedRecoveryFrames: number
  }
}

export interface MarsArcadeFighter {
  id: MarsArcadeFighterId
  label: string
  /** One line of flavour for the character-select card. */
  blurb: string
  health: number
  walkSpeed: number
  jumpVelocity: number
  guardMax: number
  /** Guard meter recovered per frame while neither blocking nor stunned. */
  guardRegenPerFrame: number
  unlockedByDefault: boolean
  moves: Record<MarsArcadeButton, MarsArcadeMove>
}

export const MARS_ARCADE_METER_MAX = 100

const boosterMoves: Record<MarsArcadeButton, MarsArcadeMove> = {
  light: {
    id: 'booster.padJab',
    label: 'PAD JAB',
    button: 'light',
    startupFrames: 4,
    activeFrames: 3,
    recoveryFrames: 7,
    damage: 5,
    chipDamage: 1,
    guardDamage: 6,
    reach: 41,
    maxHeight: 34,
    hitstunFrames: 14,
    blockstunFrames: 10,
    knockback: 2,
    meterCost: 0,
    meterGainOnHit: 6,
    meterGainOnBlock: 3,
    launches: false,
  },
  heavy: {
    id: 'booster.staticFire',
    label: 'STATIC FIRE',
    button: 'heavy',
    startupFrames: 11,
    activeFrames: 4,
    recoveryFrames: 18,
    damage: 13,
    chipDamage: 3,
    guardDamage: 16,
    reach: 38,
    maxHeight: 30,
    hitstunFrames: 22,
    blockstunFrames: 14,
    knockback: 7,
    meterCost: 0,
    meterGainOnHit: 12,
    meterGainOnBlock: 5,
    launches: false,
  },
  special: {
    id: 'booster.orbitalInsertion',
    label: 'ORBITAL INSERTION',
    button: 'special',
    startupFrames: 6,
    activeFrames: 6,
    recoveryFrames: 30,
    damage: 16,
    chipDamage: 4,
    guardDamage: 22,
    reach: 26,
    maxHeight: 70,
    hitstunFrames: 26,
    blockstunFrames: 16,
    knockback: 4,
    meterCost: 25,
    meterGainOnHit: 4,
    meterGainOnBlock: 2,
    launches: true,
    landingWindow: {
      openFrame: 8,
      closeFrame: 18,
      stuckRecoveryFrames: 12,
      tippedRecoveryFrames: 46,
    },
  },
}

const oracleMoves: Record<MarsArcadeButton, MarsArcadeMove> = {
  light: {
    id: 'oracle.prompt',
    label: 'PROMPT',
    button: 'light',
    startupFrames: 5,
    activeFrames: 2,
    recoveryFrames: 8,
    damage: 4,
    chipDamage: 1,
    guardDamage: 5,
    reach: 40,
    maxHeight: 34,
    hitstunFrames: 13,
    blockstunFrames: 10,
    knockback: 2,
    meterCost: 0,
    meterGainOnHit: 6,
    meterGainOnBlock: 3,
    launches: false,
  },
  heavy: {
    id: 'oracle.hardCutoff',
    label: 'HARD CUTOFF',
    button: 'heavy',
    startupFrames: 13,
    activeFrames: 3,
    recoveryFrames: 20,
    damage: 11,
    chipDamage: 2,
    guardDamage: 14,
    reach: 40,
    maxHeight: 24,
    hitstunFrames: 20,
    blockstunFrames: 13,
    knockback: 9,
    meterCost: 0,
    meterGainOnHit: 11,
    meterGainOnBlock: 5,
    launches: false,
  },
  special: {
    id: 'oracle.textBubble',
    label: 'TEXT BUBBLE',
    button: 'special',
    startupFrames: 9,
    activeFrames: 1,
    recoveryFrames: 16,
    damage: 10,
    chipDamage: 3,
    guardDamage: 12,
    reach: 0,
    maxHeight: 26,
    hitstunFrames: 18,
    blockstunFrames: 12,
    knockback: 5,
    meterCost: 20,
    meterGainOnHit: 4,
    meterGainOnBlock: 2,
    launches: false,
    projectile: {
      speed: 3.4,
      lifetimeFrames: 120,
      // Below a jump apex (~35 px) so a well-timed jump clears the bubble.
      maxHeight: 26,
    },
  },
}

const captainMoves: Record<MarsArcadeButton, MarsArcadeMove> = {
  light: {
    id: 'captain.setDownTheCoffee',
    label: 'SET DOWN THE COFFEE',
    button: 'light',
    startupFrames: 6,
    activeFrames: 0,
    recoveryFrames: 10,
    damage: 0,
    chipDamage: 0,
    guardDamage: 0,
    reach: 0,
    maxHeight: 0,
    hitstunFrames: 0,
    blockstunFrames: 0,
    knockback: 0,
    meterCost: 0,
    meterGainOnHit: 0,
    meterGainOnBlock: 0,
    launches: false,
  },
  heavy: {
    id: 'captain.runTheChecklist',
    label: 'RUN THE CHECKLIST',
    button: 'heavy',
    startupFrames: 9,
    activeFrames: 3,
    recoveryFrames: 11,
    damage: 9,
    chipDamage: 2,
    guardDamage: 12,
    reach: 36,
    maxHeight: 32,
    hitstunFrames: 18,
    blockstunFrames: 12,
    knockback: 5,
    meterCost: 0,
    meterGainOnHit: 9,
    meterGainOnBlock: 4,
    launches: false,
  },
  special: {
    id: 'captain.flyby',
    label: 'DC-9 FLYBY',
    button: 'special',
    startupFrames: 26,
    activeFrames: 8,
    recoveryFrames: 22,
    damage: 30,
    chipDamage: 6,
    guardDamage: 40,
    // The whole stage, so the 26-frame telegraph stays the payoff it was written
    // to be and cannot be answered by simply running to the far wall. Tracks
    // MARS_ARCADE_STAGE.halfWidth * 2; `the flyby still covers the whole stage`
    // fails if the stage is widened and this is left behind.
    reach: 480,
    maxHeight: 90,
    hitstunFrames: 30,
    blockstunFrames: 20,
    knockback: 12,
    meterCost: 70,
    meterGainOnHit: 0,
    meterGainOnBlock: 0,
    launches: false,
  },
}

export const MARS_ARCADE_FIGHTERS: Record<MarsArcadeFighterId, MarsArcadeFighter> = {
  booster: {
    id: 'booster',
    label: 'THE BOOSTER',
    blurb: 'Goes up fast. Coming back down is the hard part.',
    health: 100,
    walkSpeed: 1.25,
    jumpVelocity: 4.6,
    guardMax: 90,
    guardRegenPerFrame: 0.22,
    unlockedByDefault: true,
    moves: boosterMoves,
  },
  oracle: {
    id: 'oracle',
    label: 'THE ORACLE',
    blurb: 'Answers from anywhere on the stage. Runs out of room to think.',
    health: 100,
    walkSpeed: 1,
    jumpVelocity: 4.4,
    guardMax: 60,
    guardRegenPerFrame: 0.14,
    unlockedByDefault: true,
    moves: oracleMoves,
  },
  captain: {
    id: 'captain',
    label: 'THE CAPTAIN',
    blurb: 'Does not rush. Sets the cup down. Lands it once.',
    health: 100,
    walkSpeed: 0.95,
    jumpVelocity: 4.2,
    guardMax: 110,
    guardRegenPerFrame: 0.3,
    unlockedByDefault: false,
    moves: captainMoves,
  },
}

/** Meter the captain banks for setting the cup down instead of swinging. */
export const CAPTAIN_COMPOSURE_METER_GAIN = 14

export function marsArcadeFighter(id: MarsArcadeFighterId): MarsArcadeFighter {
  return MARS_ARCADE_FIGHTERS[id]
}
