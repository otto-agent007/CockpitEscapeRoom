/**
 * Mars arcade cabinet — the connect-distance table.
 *
 * How far apart two fighters can stand and still have a move land, measured by
 * running the fight loop itself (`advanceMarsArcade`), not by adding box edges up.
 * One row per striking move per opponent, with the `useBounds` rule off (the reach
 * check) and on (box overlap). The difference is the balance change the switch makes.
 *
 * Box edits in the gym change the "on" column. That is on purpose: a box is a balance
 * number, and the pinned table in `marsArcadeConnect.test.ts` makes each edit's
 * spacing effect show up in review. `node tools/assets/arcade-anim.mjs connect`
 * prints the current table.
 */

import {
  MARS_ARCADE_STAGE,
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  advanceMarsArcade,
  createMarsArcadeRound,
  marsArcadeMeleeBoxes,
  type MarsArcadeState,
} from './marsArcade'
import {
  marsArcadeFighter,
  marsArcadeTuningInForce,
  setMarsArcadeTuning,
  type MarsArcadeButton,
  type MarsArcadeFighterId,
  type MarsArcadeGuardHeight,
  type MarsArcadeMove,
  type MarsArcadeRules,
} from './marsArcadeFighters'

export interface MarsArcadeConnectRow {
  attacker: MarsArcadeFighterId
  button: MarsArcadeButton
  moveId: string
  defender: MarsArcadeFighterId
  reach: number
  guardHeight: MarsArcadeGuardHeight
  /** Furthest separation that lands with `useBounds` off; null if it never lands. */
  off: number | null
  /** The same with `useBounds` on. */
  on: number | null
  /** What decided the "on" column: drawn boxes, or the reach fallback for undrawn poses. */
  resolvedBy: 'boxes' | 'reach'
}

const FIGHTERS: readonly MarsArcadeFighterId[] = ['booster', 'oracle', 'captain']
const BUTTONS: readonly MarsArcadeButton[] = ['light', 'heavy', 'special']

/** A move the table measures: it strikes by position, not by projectile or lock-on. */
export function marsArcadeStrikesByPosition(move: MarsArcadeMove): boolean {
  return move.damage > 0 && move.activeFrames > 0 && !move.projectile && !move.lockOn
}

/**
 * The round one frame before `activeFrame` of the attacker's move, with the attacker
 * at 0 facing right and an idle defender `separation` px to the right.
 */
function poised(
  attacker: MarsArcadeFighterId,
  button: MarsArcadeButton,
  defender: MarsArcadeFighterId,
  separation: number,
  activeFrame: number,
): MarsArcadeState {
  const move = marsArcadeFighter(attacker).moves[button]
  const round = createMarsArcadeRound(attacker, defender)
  return {
    ...round,
    phase: 'fight',
    fighters: [
      { ...round.fighters[0], x: 0, facing: 1, activity: 'attack', activeButton: button, moveFrame: move.startupFrames + activeFrame - 1 },
      { ...round.fighters[1], x: separation, facing: -1 },
    ],
  }
}

function lands(state: MarsArcadeState): boolean {
  const { events } = advanceMarsArcade(state, [NEUTRAL_MARS_ARCADE_INPUT, NEUTRAL_MARS_ARCADE_INPUT], MARS_ARCADE_TIMING.frameSeconds)
  return events.some((event) => event.type === 'hit' && event.attacker === 0)
}

function withRules<T>(rules: MarsArcadeRules, run: () => T): T {
  const before = marsArcadeTuningInForce()
  setMarsArcadeTuning({ ...before, rules })
  try {
    return run()
  } finally {
    setMarsArcadeTuning(before)
  }
}

/** The furthest whole-pixel separation at which any active frame of the move lands. */
export function marsArcadeConnectDistance(
  attacker: MarsArcadeFighterId,
  button: MarsArcadeButton,
  defender: MarsArcadeFighterId,
): number | null {
  const move = marsArcadeFighter(attacker).moves[button]
  if (move.startupFrames === 0) throw new Error(`connect table: ${move.id} has no startup frame to poise on`)
  let furthest: number | null = null
  for (let separation = 0; separation <= MARS_ARCADE_STAGE.halfWidth * 2; separation += 1) {
    for (let frame = 0; frame < move.activeFrames; frame += 1) {
      if (lands(poised(attacker, button, defender, separation, frame))) {
        furthest = separation
        break
      }
    }
  }
  return furthest
}

/** Every striking move against every opponent's idle, with the bounds rule off and on. */
export function marsArcadeConnectTable(): MarsArcadeConnectRow[] {
  const rules = marsArcadeTuningInForce().rules
  const rows: MarsArcadeConnectRow[] = []
  for (const attacker of FIGHTERS) {
    for (const button of BUTTONS) {
      const move = marsArcadeFighter(attacker).moves[button]
      if (!marsArcadeStrikesByPosition(move)) continue
      for (const defender of FIGHTERS) {
        if (defender === attacker) continue
        const off = withRules({ ...rules, useBounds: false, hitstop: false }, () => marsArcadeConnectDistance(attacker, button, defender))
        const on = withRules({ ...rules, useBounds: true, hitstop: false }, () => marsArcadeConnectDistance(attacker, button, defender))
        const probe = advanceMarsArcade(poised(attacker, button, defender, 0, 0), [NEUTRAL_MARS_ARCADE_INPUT, NEUTRAL_MARS_ARCADE_INPUT], MARS_ARCADE_TIMING.frameSeconds).state
        rows.push({
          attacker,
          button,
          moveId: move.id,
          defender,
          reach: move.reach,
          guardHeight: move.guardHeight,
          off,
          on,
          resolvedBy: marsArcadeMeleeBoxes(probe, 0) ? 'boxes' : 'reach',
        })
      }
    }
  }
  return rows
}

/** The table as markdown, for the PR and the asset report. */
export function formatMarsArcadeConnectTable(rows: MarsArcadeConnectRow[]): string {
  const cell = (value: number | null) => (value === null ? 'never' : String(value))
  const lines = [
    '| move | vs | guard | reach | off (reach check) | on (boxes) | change | decided by |',
    '| --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
  ]
  for (const row of rows) {
    const change = row.off !== null && row.on !== null ? row.on - row.off : null
    lines.push(
      `| ${row.moveId} | ${row.defender} | ${row.guardHeight} | ${row.reach} | ${cell(row.off)} | ${cell(row.on)} | ${change === null ? '—' : `${change > 0 ? '+' : ''}${change}`} | ${row.resolvedBy} |`,
    )
  }
  return lines.join('\n')
}
