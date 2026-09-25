/**
 * Mars arcade cabinet — playground tuning file.
 *
 * Pure data: parse and validate `marsArcadeTuning.json`, the numbers the fighter
 * playground edits live and saves. The game applies it on top of the baked content in
 * `marsArcadeFighters.ts` at startup (`applyShippedMarsArcadeTuning`), so what the
 * owner tunes in the playground is what the cabinet plays.
 *
 * The reference's rule, kept: "AI is not gonna be able to make your game feel
 * perfectly right" — the tuning loop has to be human and fast, and it has to persist.
 */

import {
  MARS_ARCADE_DEFAULT_RULES,
  MARS_ARCADE_FIGHTERS,
  MARS_ARCADE_TUNING_VERSION,
  setMarsArcadeTuning,
  type MarsArcadeButton,
  type MarsArcadeFighterId,
  type MarsArcadeFighterTuning,
  type MarsArcadeMoveTuning,
  type MarsArcadeTuning,
} from './marsArcadeFighters'
import shipped from './marsArcadeTuning.json'

const FIGHTERS: readonly MarsArcadeFighterId[] = ['booster', 'oracle', 'captain']
const BUTTONS: readonly MarsArcadeButton[] = ['light', 'heavy', 'special']
const MOVE_FIELDS: readonly (keyof MarsArcadeMoveTuning)[] = ['damage', 'chipDamage', 'guardDamage', 'knockback', 'hitstunFrames', 'blockstunFrames', 'hitstopFrames']
const FIGHTER_FIELDS: readonly Exclude<keyof MarsArcadeFighterTuning, 'moves'>[] = ['health', 'walkSpeed', 'jumpVelocity', 'guardMax', 'guardRegenPerFrame']

function number(value: unknown, where: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error(`tuning: ${where} is not a number`)
  if (value < min || value > max) throw new Error(`tuning: ${where} is ${value}, outside ${min}..${max}`)
  return value
}

function flag(value: unknown, where: string): boolean {
  if (typeof value !== 'boolean') throw new Error(`tuning: ${where} is not true or false`)
  return value
}

/**
 * A v1 file as v2: v1 had no rule switches and no hit stop. The switches come in
 * off, which is what v1 played, and each move takes the content's hit stop, which
 * only matters once the switch is on.
 */
function migrateV1(file: Record<string, unknown>): Record<string, unknown> {
  const fighters = file.fighters
  if (typeof fighters !== 'object' || fighters === null) return { ...file, version: 2 }
  const migrated: Record<string, unknown> = {}
  for (const [id, raw] of Object.entries(fighters as Record<string, unknown>)) {
    const content = Object.hasOwn(MARS_ARCADE_FIGHTERS, id) ? MARS_ARCADE_FIGHTERS[id as MarsArcadeFighterId] : null
    const moves = (raw as Record<string, unknown> | null)?.moves
    if (!content || typeof moves !== 'object' || moves === null) {
      migrated[id] = raw
      continue
    }
    const nextMoves: Record<string, unknown> = {}
    for (const [button, move] of Object.entries(moves as Record<string, unknown>)) {
      const baked = Object.hasOwn(content.moves, button) ? content.moves[button as MarsArcadeButton] : null
      nextMoves[button] = typeof move === 'object' && move !== null && baked
        ? { hitstopFrames: baked.hitstopFrames, ...move }
        : move
    }
    migrated[id] = { ...(raw as Record<string, unknown>), moves: nextMoves }
  }
  return { ...file, version: 2, rules: { ...MARS_ARCADE_DEFAULT_RULES }, fighters: migrated }
}

/**
 * Parse a tuning file. Ranges are generous sanity bounds, not balance: a negative
 * walk speed or a thousand-frame hitstun is a typo the playground must refuse, not a
 * setting the cabinet should ever load. A v1 file is migrated, not refused.
 */
export function parseMarsArcadeTuning(input: unknown): MarsArcadeTuning {
  if (typeof input !== 'object' || input === null) throw new Error('tuning: not an object')
  let file = input as Record<string, unknown>
  if (file.version === 1) file = migrateV1(file)
  if (file.version !== MARS_ARCADE_TUNING_VERSION) throw new Error(`tuning: version ${String(file.version)}, expected ${MARS_ARCADE_TUNING_VERSION}`)
  const rules = file.rules as Record<string, unknown> | undefined
  if (typeof rules !== 'object' || rules === null) throw new Error('tuning: rules is missing')
  const stage = file.stage as Record<string, unknown> | undefined
  if (typeof stage !== 'object' || stage === null) throw new Error('tuning: stage is missing')
  const fighters = file.fighters as Record<string, unknown> | undefined
  if (typeof fighters !== 'object' || fighters === null) throw new Error('tuning: fighters is missing')
  const result: MarsArcadeTuning = {
    version: MARS_ARCADE_TUNING_VERSION,
    stage: { gravity: number(stage.gravity, 'stage.gravity', 0.01, 5) },
    rules: { useBounds: flag(rules.useBounds, 'rules.useBounds'), hitstop: flag(rules.hitstop, 'rules.hitstop') },
    fighters: {} as MarsArcadeTuning['fighters'],
  }
  for (const id of FIGHTERS) {
    const raw = fighters[id] as Record<string, unknown> | undefined
    if (typeof raw !== 'object' || raw === null) throw new Error(`tuning: fighters.${id} is missing`)
    const moves = raw.moves as Record<string, unknown> | undefined
    if (typeof moves !== 'object' || moves === null) throw new Error(`tuning: fighters.${id}.moves is missing`)
    const fighter = {
      health: number(raw.health, `${id}.health`, 1, 9999),
      walkSpeed: number(raw.walkSpeed, `${id}.walkSpeed`, 0, 20),
      jumpVelocity: number(raw.jumpVelocity, `${id}.jumpVelocity`, 0, 40),
      guardMax: number(raw.guardMax, `${id}.guardMax`, 1, 9999),
      guardRegenPerFrame: number(raw.guardRegenPerFrame, `${id}.guardRegenPerFrame`, 0, 100),
      moves: {} as Record<MarsArcadeButton, MarsArcadeMoveTuning>,
    }
    for (const button of BUTTONS) {
      const move = moves[button] as Record<string, unknown> | undefined
      if (typeof move !== 'object' || move === null) throw new Error(`tuning: fighters.${id}.moves.${button} is missing`)
      fighter.moves[button] = {
        damage: number(move.damage, `${id}.${button}.damage`, 0, 999),
        chipDamage: number(move.chipDamage, `${id}.${button}.chipDamage`, 0, 999),
        guardDamage: number(move.guardDamage, `${id}.${button}.guardDamage`, 0, 999),
        knockback: number(move.knockback, `${id}.${button}.knockback`, 0, 999),
        hitstunFrames: number(move.hitstunFrames, `${id}.${button}.hitstunFrames`, 0, 600),
        blockstunFrames: number(move.blockstunFrames, `${id}.${button}.blockstunFrames`, 0, 600),
        hitstopFrames: number(move.hitstopFrames, `${id}.${button}.hitstopFrames`, 0, 30),
      }
    }
    result.fighters[id] = fighter
  }
  return result
}

export { MOVE_FIELDS as MARS_ARCADE_MOVE_TUNING_FIELDS, FIGHTER_FIELDS as MARS_ARCADE_FIGHTER_TUNING_FIELDS }

/** The tuning file as shipped, parsed once. A malformed file fails at import. */
export const MARS_ARCADE_SHIPPED_TUNING: MarsArcadeTuning = parseMarsArcadeTuning(shipped)

/** Put the shipped tuning in force. Called once by whoever hosts the cabinet. */
export function applyShippedMarsArcadeTuning(): MarsArcadeTuning {
  setMarsArcadeTuning(MARS_ARCADE_SHIPPED_TUNING)
  return MARS_ARCADE_SHIPPED_TUNING
}
