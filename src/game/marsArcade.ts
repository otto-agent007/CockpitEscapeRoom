/**
 * Mars arcade cabinet — fight loop.
 *
 * Pure rules: no Three.js, no DOM, no timers, no randomness. One fixed 60 Hz
 * step drives frame data, hitboxes, blocking, guard meter, projectiles and the
 * round clock, so the same inputs always produce the same round.
 *
 * Coordinates are 320x224 intro-stage pixels. x = 0 is stage centre, y = 0 is
 * the floor, and y grows upward.
 */

import {
  CAPTAIN_COMPOSURE_METER_GAIN,
  MARS_ARCADE_METER_MAX,
  marsArcadeFighter,
  type MarsArcadeButton,
  type MarsArcadeFighterId,
  type MarsArcadeMove,
} from './marsArcadeFighters'

export const MARS_ARCADE_TIMING = {
  frameSeconds: 1 / 60,
  roundFrames: 60 * 60,
  introFrames: 90,
  maxFrameDeltaSeconds: 0.25,
} as const

export const MARS_ARCADE_STAGE = {
  /**
   * Half the walkable stage, in stage pixels.
   *
   * The stage is 480 px wide and the screen is 320, so a fighter can be walked out
   * of frame and the camera has to follow. The previous 140 fitted the whole stage
   * inside one screen, which is why nothing ever scrolled. See
   * `src/game/marsArcadeStage.ts` for the camera and the parallax that make the
   * extra room legible; widening this constant alone would just add empty floor.
   *
   * Consequence for balance: the zoner has more room to keep the pressure fighter
   * out. Walking wall to wall at THE ORACLE's 1.0 px/frame now takes 8.0 s of a
   * 60 s round, up from 4.7 s.
   */
  halfWidth: 240,
  pushboxWidth: 24,
  startOffset: 56,
  gravity: 0.28,
  projectileSpawnHeight: 24,
  projectileRadius: 18,
} as const

/** Meter a fighter banks per point of damage absorbed. */
export const METER_GAIN_PER_DAMAGE_TAKEN = 0.5

export type MarsArcadeSide = 0 | 1
export type MarsArcadeActivity = 'idle' | 'walk' | 'airborne' | 'attack' | 'hitstun' | 'blockstun'

export interface MarsArcadeInput {
  /** -1 walks left, 1 walks right, 0 stands. Holding away from the opponent blocks. */
  move: number
  jump: boolean
  light: boolean
  heavy: boolean
  special: boolean
}

export const NEUTRAL_MARS_ARCADE_INPUT: MarsArcadeInput = {
  move: 0,
  jump: false,
  light: false,
  heavy: false,
  special: false,
}

export interface MarsArcadeFighterState {
  id: MarsArcadeFighterId
  x: number
  y: number
  velocityY: number
  facing: 1 | -1
  health: number
  meter: number
  guard: number
  activity: MarsArcadeActivity
  activeButton: MarsArcadeButton | null
  moveFrame: number
  stunFrames: number
  hasHitThisMove: boolean
  blocking: boolean
  previousButtons: Record<MarsArcadeButton, boolean>
}

export interface MarsArcadeProjectile {
  owner: MarsArcadeSide
  moveId: string
  x: number
  y: number
  velocityX: number
  framesRemaining: number
  damage: number
  chipDamage: number
  guardDamage: number
  hitstunFrames: number
  blockstunFrames: number
  knockback: number
  maxHeight: number
  meterGainOnHit: number
  meterGainOnBlock: number
}

export interface MarsArcadeState {
  phase: 'intro' | 'fight' | 'ko' | 'timeOver'
  frame: number
  timerFrames: number
  carrySeconds: number
  fighters: [MarsArcadeFighterState, MarsArcadeFighterState]
  projectiles: MarsArcadeProjectile[]
  winner: MarsArcadeSide | null
}

export type MarsArcadeEvent =
  | { type: 'roundStart' }
  | { type: 'hit'; attacker: MarsArcadeSide; moveId: string; damage: number }
  | { type: 'blocked'; attacker: MarsArcadeSide; moveId: string; chipDamage: number }
  | { type: 'guardCrush'; defender: MarsArcadeSide }
  | { type: 'projectileFired'; attacker: MarsArcadeSide; moveId: string }
  | { type: 'composure'; fighter: MarsArcadeSide }
  | { type: 'ko'; winner: MarsArcadeSide }
  | { type: 'timeOver'; winner: MarsArcadeSide | null }

export interface MarsArcadeTransition {
  state: MarsArcadeState
  events: MarsArcadeEvent[]
}

interface PendingHit {
  attacker: MarsArcadeSide
  defender: MarsArcadeSide
  move: Pick<
    MarsArcadeMove,
    | 'id'
    | 'damage'
    | 'chipDamage'
    | 'guardDamage'
    | 'hitstunFrames'
    | 'blockstunFrames'
    | 'knockback'
    | 'unblockable'
    | 'meterGainOnHit'
    | 'meterGainOnBlock'
  >
  projectileIndex?: number
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function createFighterState(id: MarsArcadeFighterId, x: number, facing: 1 | -1): MarsArcadeFighterState {
  const fighter = marsArcadeFighter(id)
  return {
    id,
    x,
    y: 0,
    velocityY: 0,
    facing,
    health: fighter.health,
    meter: 0,
    guard: fighter.guardMax,
    activity: 'idle',
    activeButton: null,
    moveFrame: 0,
    stunFrames: 0,
    hasHitThisMove: false,
    blocking: false,
    previousButtons: { light: false, heavy: false, special: false },
  }
}

export function createMarsArcadeRound(
  left: MarsArcadeFighterId,
  right: MarsArcadeFighterId,
): MarsArcadeState {
  return {
    phase: 'intro',
    frame: 0,
    timerFrames: MARS_ARCADE_TIMING.roundFrames,
    carrySeconds: 0,
    fighters: [
      createFighterState(left, -MARS_ARCADE_STAGE.startOffset, 1),
      createFighterState(right, MARS_ARCADE_STAGE.startOffset, -1),
    ],
    projectiles: [],
    winner: null,
  }
}

function cloneFighter(fighter: MarsArcadeFighterState): MarsArcadeFighterState {
  return { ...fighter, previousButtons: { ...fighter.previousButtons } }
}

function moveTotalFrames(move: MarsArcadeMove): number {
  return move.startupFrames + move.activeFrames + move.recoveryFrames
}

function activeMoveOf(fighter: MarsArcadeFighterState): MarsArcadeMove | null {
  if (fighter.activity !== 'attack' || !fighter.activeButton) return null
  return marsArcadeFighter(fighter.id).moves[fighter.activeButton]
}

function isGrounded(fighter: MarsArcadeFighterState): boolean {
  return fighter.y <= 0
}

function canAct(fighter: MarsArcadeFighterState): boolean {
  return fighter.stunFrames === 0 && fighter.activity !== 'attack' && isGrounded(fighter)
}

function pressedButton(
  fighter: MarsArcadeFighterState,
  input: MarsArcadeInput,
  button: MarsArcadeButton,
): boolean {
  return input[button] && !fighter.previousButtons[button]
}

function startMove(
  fighter: MarsArcadeFighterState,
  button: MarsArcadeButton,
  side: MarsArcadeSide,
  events: MarsArcadeEvent[],
): void {
  const move = marsArcadeFighter(fighter.id).moves[button]
  if (move.meterCost > fighter.meter) return
  fighter.meter -= move.meterCost
  fighter.activity = 'attack'
  fighter.activeButton = button
  fighter.moveFrame = 0
  fighter.hasHitThisMove = false
  fighter.blocking = false
  if (move.id === 'captain.setDownTheCoffee') {
    fighter.meter = Math.min(MARS_ARCADE_METER_MAX, fighter.meter + CAPTAIN_COMPOSURE_METER_GAIN)
    events.push({ type: 'composure', fighter: side })
  }
}

function applyInput(
  fighter: MarsArcadeFighterState,
  opponent: MarsArcadeFighterState,
  input: MarsArcadeInput,
  side: MarsArcadeSide,
  events: MarsArcadeEvent[],
): void {
  if (!canAct(fighter)) {
    if (fighter.activity !== 'blockstun') fighter.blocking = false
    return
  }

  if (pressedButton(fighter, input, 'special')) {
    startMove(fighter, 'special', side, events)
    return
  }
  if (pressedButton(fighter, input, 'heavy')) {
    startMove(fighter, 'heavy', side, events)
    return
  }
  if (pressedButton(fighter, input, 'light')) {
    startMove(fighter, 'light', side, events)
    return
  }

  if (input.jump) {
    fighter.velocityY = marsArcadeFighter(fighter.id).jumpVelocity
    fighter.activity = 'airborne'
    fighter.blocking = false
    return
  }

  const direction = Math.sign(input.move)
  const awayFromOpponent = opponent.x >= fighter.x ? -1 : 1
  fighter.blocking = direction !== 0 && direction === awayFromOpponent
  if (direction !== 0) {
    fighter.activity = 'walk'
    fighter.x += direction * marsArcadeFighter(fighter.id).walkSpeed
  } else {
    fighter.activity = 'idle'
  }
}

function advanceMoveFrame(fighter: MarsArcadeFighterState): void {
  const move = activeMoveOf(fighter)
  if (!move) return

  fighter.moveFrame += 1
  if (fighter.moveFrame >= moveTotalFrames(move)) {
    fighter.activity = 'idle'
    fighter.activeButton = null
    fighter.moveFrame = 0
    fighter.hasHitThisMove = false
  }
}

function isInActiveWindow(fighter: MarsArcadeFighterState, move: MarsArcadeMove): boolean {
  return (
    fighter.moveFrame >= move.startupFrames &&
    fighter.moveFrame < move.startupFrames + move.activeFrames
  )
}

function spawnProjectile(
  fighter: MarsArcadeFighterState,
  move: MarsArcadeMove,
  side: MarsArcadeSide,
): MarsArcadeProjectile {
  const spec = move.projectile
  if (!spec) throw new Error(`move ${move.id} has no projectile spec`)
  return {
    owner: side,
    moveId: move.id,
    x: fighter.x + fighter.facing * 20,
    y: MARS_ARCADE_STAGE.projectileSpawnHeight,
    velocityX: fighter.facing * spec.speed,
    framesRemaining: spec.lifetimeFrames,
    damage: move.damage,
    chipDamage: move.chipDamage,
    guardDamage: move.guardDamage,
    hitstunFrames: move.hitstunFrames,
    blockstunFrames: move.blockstunFrames,
    knockback: move.knockback,
    maxHeight: spec.maxHeight,
    meterGainOnHit: move.meterGainOnHit,
    meterGainOnBlock: move.meterGainOnBlock,
  }
}

function collectMeleeHits(fighters: [MarsArcadeFighterState, MarsArcadeFighterState]): PendingHit[] {
  const hits: PendingHit[] = []
  for (const side of [0, 1] as const) {
    const attacker = fighters[side]
    const defender = fighters[side === 0 ? 1 : 0]
    const move = activeMoveOf(attacker)
    if (!move || attacker.hasHitThisMove || !isInActiveWindow(attacker, move)) continue
    if (move.activeFrames === 0 || move.damage === 0 || move.projectile) continue
    if (!move.lockOn) {
      const separation = Math.abs(defender.x - attacker.x)
      const facingDefender = Math.sign(defender.x - attacker.x) === attacker.facing
      if (!facingDefender || separation > move.reach) continue
      if (defender.y > move.maxHeight) continue
    }
    hits.push({ attacker: side, defender: side === 0 ? 1 : 0, move })
  }
  return hits
}

function applyHit(
  state: MarsArcadeState,
  hit: PendingHit,
  events: MarsArcadeEvent[],
): void {
  const attacker = state.fighters[hit.attacker]
  const defender = state.fighters[hit.defender]
  const defenderFighter = marsArcadeFighter(defender.id)
  const blocking =
    !hit.move.unblockable &&
    defender.blocking &&
    isGrounded(defender) &&
    (defender.stunFrames === 0 || defender.activity === 'blockstun')

  if (blocking) {
    defender.guard -= hit.move.guardDamage
    if (defender.guard > 0) {
      defender.health = Math.max(0, defender.health - hit.move.chipDamage)
      defender.stunFrames = hit.move.blockstunFrames
      defender.activity = 'blockstun'
      defender.x += Math.sign(defender.x - attacker.x || 1) * (hit.move.knockback * 0.4)
      attacker.meter = Math.min(MARS_ARCADE_METER_MAX, attacker.meter + hit.move.meterGainOnBlock)
      events.push({
        type: 'blocked',
        attacker: hit.attacker,
        moveId: hit.move.id,
        chipDamage: hit.move.chipDamage,
      })
      return
    }
    defender.guard = defenderFighter.guardMax
    events.push({ type: 'guardCrush', defender: hit.defender })
  }

  defender.health = Math.max(0, defender.health - hit.move.damage)
  defender.stunFrames = hit.move.hitstunFrames
  defender.activity = 'hitstun'
  defender.activeButton = null
  defender.moveFrame = 0
  defender.blocking = false
  defender.x += Math.sign(defender.x - attacker.x || 1) * hit.move.knockback
  defender.meter = Math.min(
    MARS_ARCADE_METER_MAX,
    defender.meter + hit.move.damage * METER_GAIN_PER_DAMAGE_TAKEN,
  )
  attacker.meter = Math.min(MARS_ARCADE_METER_MAX, attacker.meter + hit.move.meterGainOnHit)
  events.push({ type: 'hit', attacker: hit.attacker, moveId: hit.move.id, damage: hit.move.damage })
}

function advanceProjectiles(state: MarsArcadeState, events: MarsArcadeEvent[]): void {
  const surviving: MarsArcadeProjectile[] = []
  for (const projectile of state.projectiles) {
    const moved: MarsArcadeProjectile = {
      ...projectile,
      x: projectile.x + projectile.velocityX,
      framesRemaining: projectile.framesRemaining - 1,
    }
    const defenderSide: MarsArcadeSide = moved.owner === 0 ? 1 : 0
    const defender = state.fighters[defenderSide]
    const struck =
      Math.abs(moved.x - defender.x) <= MARS_ARCADE_STAGE.projectileRadius &&
      defender.y <= moved.maxHeight
    if (struck) {
      applyHit(
        state,
        {
          attacker: moved.owner,
          defender: defenderSide,
          move: {
            id: moved.moveId,
            damage: moved.damage,
            chipDamage: moved.chipDamage,
            guardDamage: moved.guardDamage,
            hitstunFrames: moved.hitstunFrames,
            blockstunFrames: moved.blockstunFrames,
            knockback: moved.knockback,
            meterGainOnHit: moved.meterGainOnHit,
            meterGainOnBlock: moved.meterGainOnBlock,
          },
        },
        events,
      )
      continue
    }
    if (moved.framesRemaining <= 0 || Math.abs(moved.x) > MARS_ARCADE_STAGE.halfWidth + 40) continue
    surviving.push(moved)
  }
  state.projectiles = surviving
}

function applyPhysics(fighter: MarsArcadeFighterState): void {
  if (fighter.y > 0 || fighter.velocityY > 0) {
    fighter.y += fighter.velocityY
    fighter.velocityY -= MARS_ARCADE_STAGE.gravity
    if (fighter.y <= 0) {
      fighter.y = 0
      fighter.velocityY = 0
      if (fighter.activity === 'airborne') fighter.activity = 'idle'
    } else if (fighter.stunFrames === 0 && fighter.activity !== 'attack') {
      fighter.activity = 'airborne'
    }
  }
}

function separate(fighters: [MarsArcadeFighterState, MarsArcadeFighterState]): void {
  const [a, b] = fighters
  const separation = b.x - a.x
  const overlap = MARS_ARCADE_STAGE.pushboxWidth - Math.abs(separation)
  if (overlap > 0) {
    const push = (overlap / 2) * (separation >= 0 ? 1 : -1)
    a.x -= push
    b.x += push
  }
  for (const fighter of fighters) {
    fighter.x = clamp(fighter.x, -MARS_ARCADE_STAGE.halfWidth, MARS_ARCADE_STAGE.halfWidth)
  }
}

function stepFrame(
  previous: MarsArcadeState,
  inputs: [MarsArcadeInput, MarsArcadeInput],
  events: MarsArcadeEvent[],
): MarsArcadeState {
  const state: MarsArcadeState = {
    ...previous,
    fighters: [cloneFighter(previous.fighters[0]), cloneFighter(previous.fighters[1])],
    projectiles: previous.projectiles.map((projectile) => ({ ...projectile })),
  }

  if (state.phase === 'intro') {
    state.frame += 1
    if (state.frame >= MARS_ARCADE_TIMING.introFrames) {
      state.phase = 'fight'
      events.push({ type: 'roundStart' })
    }
    return state
  }
  if (state.phase !== 'fight') return state

  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    if (fighter.stunFrames > 0) {
      fighter.stunFrames -= 1
      if (fighter.stunFrames === 0 && isGrounded(fighter)) fighter.activity = 'idle'
    }
  }

  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    const opponent = state.fighters[side === 0 ? 1 : 0]
    if (fighter.activity === 'attack') {
      advanceMoveFrame(fighter)
    } else {
      applyInput(fighter, opponent, inputs[side], side, events)
    }
  }

  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    const move = activeMoveOf(fighter)
    if (!move?.projectile) continue
    if (fighter.moveFrame === move.startupFrames && !fighter.hasHitThisMove) {
      fighter.hasHitThisMove = true
      state.projectiles.push(spawnProjectile(fighter, move, side))
      events.push({ type: 'projectileFired', attacker: side, moveId: move.id })
    }
  }

  const hits = collectMeleeHits(state.fighters)
  for (const hit of hits) {
    state.fighters[hit.attacker].hasHitThisMove = true
  }
  for (const hit of hits) {
    applyHit(state, hit, events)
  }

  advanceProjectiles(state, events)

  for (const fighter of state.fighters) applyPhysics(fighter)
  separate(state.fighters)

  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    const opponent = state.fighters[side === 0 ? 1 : 0]
    const fighterContent = marsArcadeFighter(fighter.id)
    if (fighter.activity === 'idle' || fighter.activity === 'walk') {
      fighter.facing = opponent.x >= fighter.x ? 1 : -1
    }
    if (!fighter.blocking && fighter.stunFrames === 0) {
      fighter.guard = Math.min(fighterContent.guardMax, fighter.guard + fighterContent.guardRegenPerFrame)
    }
    fighter.previousButtons = {
      light: inputs[side].light,
      heavy: inputs[side].heavy,
      special: inputs[side].special,
    }
  }

  state.frame += 1
  state.timerFrames = Math.max(0, state.timerFrames - 1)

  const [first, second] = state.fighters
  if (first.health <= 0 || second.health <= 0) {
    state.phase = 'ko'
    state.winner = first.health <= 0 && second.health <= 0 ? null : first.health <= 0 ? 1 : 0
    if (state.winner !== null) events.push({ type: 'ko', winner: state.winner })
  } else if (state.timerFrames === 0) {
    state.phase = 'timeOver'
    state.winner = first.health === second.health ? null : first.health > second.health ? 0 : 1
    events.push({ type: 'timeOver', winner: state.winner })
  }

  return state
}

export function advanceMarsArcade(
  state: MarsArcadeState,
  inputs: [MarsArcadeInput, MarsArcadeInput],
  elapsedSeconds: number,
): MarsArcadeTransition {
  const events: MarsArcadeEvent[] = []
  const bounded = clamp(elapsedSeconds, 0, MARS_ARCADE_TIMING.maxFrameDeltaSeconds)
  let carrySeconds = state.carrySeconds + bounded
  let next = state
  while (carrySeconds >= MARS_ARCADE_TIMING.frameSeconds) {
    carrySeconds -= MARS_ARCADE_TIMING.frameSeconds
    next = stepFrame(next, inputs, events)
  }
  return { state: { ...next, carrySeconds }, events }
}

export type MarsArcadeMovePhase = 'startup' | 'active' | 'recovery'

export interface MarsArcadeActiveMove {
  move: MarsArcadeMove
  phase: MarsArcadeMovePhase
  frame: number
  totalFrames: number
  framesRemaining: number
}

/**
 * Which part of a move a fighter is in, and how long is left of it.
 *
 * A read helper, not a rule: the sprite renderer needs it to pick a drawing, and
 * the box harness needs it to draw the hitbox only while the hitbox exists.
 */
export function marsArcadeActiveMove(
  fighter: MarsArcadeFighterState,
): MarsArcadeActiveMove | null {
  const move = activeMoveOf(fighter)
  if (!move) return null
  const totalFrames = moveTotalFrames(move)
  const phase: MarsArcadeMovePhase =
    fighter.moveFrame < move.startupFrames
      ? 'startup'
      : fighter.moveFrame < move.startupFrames + move.activeFrames
        ? 'active'
        : 'recovery'
  return {
    move,
    phase,
    frame: fighter.moveFrame,
    totalFrames,
    framesRemaining: Math.max(0, totalFrames - fighter.moveFrame),
  }
}

export function marsArcadeTimerSeconds(state: MarsArcadeState): number {
  return Math.ceil(state.timerFrames * MARS_ARCADE_TIMING.frameSeconds)
}

export function marsArcadeHealthFraction(fighter: MarsArcadeFighterState): number {
  return clamp(fighter.health / marsArcadeFighter(fighter.id).health, 0, 1)
}
