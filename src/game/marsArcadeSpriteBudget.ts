/**
 * Mars arcade cabinet — how many drawings a move needs.
 *
 * The art budget is derived from the committed frame data, never hand-written,
 * so re-tuning a move's frames re-states how many drawings it needs instead of
 * silently leaving the sprite sheet a frame short. Consumed by the prompt pack
 * (`asset-reports/mars-arcade-frame-prompt-pack.md`) and by the contract test.
 */

import type { MarsArcadeMove } from './marsArcadeFighters'

export const DRAWING_BUDGET_RULE = {
  /** One startup drawing per this many frames of startup, capped. */
  framesPerStartupDrawing: 6,
  maxStartupDrawings: 3,
  framesPerActiveDrawing: 4,
  maxActiveDrawings: 2,
  framesPerRecoveryDrawing: 10,
  maxRecoveryDrawings: 2,
} as const

export interface DrawingBudget {
  startup: number
  active: number
  recovery: number
  total: number
}

function span(frames: number, framesPerDrawing: number, maximum: number): number {
  return Math.min(maximum, Math.max(1, Math.ceil(frames / framesPerDrawing)))
}

export function drawingBudget(move: MarsArcadeMove): DrawingBudget {
  // A move with no startup opens straight on its active drawing, so a startup
  // drawing would never be on screen (the booster's space laser). Active and
  // recovery keep their floor of one: the captain's coffee has no active frames,
  // yet the cup going down is still the pose the move exists to show.
  const startup =
    move.startupFrames === 0
      ? 0
      : span(
          move.startupFrames,
          DRAWING_BUDGET_RULE.framesPerStartupDrawing,
          DRAWING_BUDGET_RULE.maxStartupDrawings,
        )
  const active = span(
    move.activeFrames,
    DRAWING_BUDGET_RULE.framesPerActiveDrawing,
    DRAWING_BUDGET_RULE.maxActiveDrawings,
  )
  const recovery = span(
    move.recoveryFrames,
    DRAWING_BUDGET_RULE.framesPerRecoveryDrawing,
    DRAWING_BUDGET_RULE.maxRecoveryDrawings,
  )
  return { startup, active, recovery, total: startup + active + recovery }
}
