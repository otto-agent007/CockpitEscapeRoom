/**
 * Mars arcade cabinet — per-frame collision bounds.
 *
 * Pure data and geometry: no canvas, no DOM, no Three.js.
 *
 * **Why this exists.** The fight loop decides whether a move connects with a single
 * horizontal distance check — `separation > move.reach` plus a ceiling on the
 * defender's feet (`marsArcade.ts`). That number has no relationship to where the
 * drawn arm actually ends, so the sprite and the rules can disagree forever and no
 * test notices. Four box types per drawn frame fix that:
 *
 * - `collision` — the body box, what stands on the floor and what pushes.
 * - `hurt` — the hurtbox: where this fighter can be struck.
 * - `attack` — the hitbox, **live only on the frames where it says so**. An attack
 *   must not register before the limb is out or while it is being withdrawn.
 * - `guard` — what a block actually covers. The fight loop currently treats blocking
 *   as one boolean, so a block stops everything; a guard box is what makes a high
 *   attack able to beat a low block.
 *
 * **Coordinates are sprite-cell pixels**, origin top-left of the 128x128 cell, the
 * same space the gym draws in and the same space the sheets are authored in. Boxes
 * are stored unmirrored, facing right, and mirrored at read time — storing both
 * facings is the bug that hit the flying-car work five times over.
 *
 * The file that carries the boxes — every clip, every drawing, every hold — is
 * `marsArcadeAnimations.json`, parsed and validated by `marsArcadeAnimations.ts`.
 * This module is the geometry only: the cell, the box kinds, and how a cell-space box
 * becomes a stage-space one.
 */

/**
 * The sprite cell every box is measured against.
 *
 * `baselineRow` is where the feet sit and `centreColumn` is the pivot, both fixed by
 * the sprite contract. They are what turn a cell-space box into a stage-space one.
 */
export const MARS_ARCADE_CELL = {
  size: 128,
  baselineRow: 119,
  centreColumn: 64,
} as const

export type MarsArcadeBoundKind = 'collision' | 'hurt' | 'attack' | 'guard'

export const MARS_ARCADE_BOUND_KINDS: readonly MarsArcadeBoundKind[] = [
  'collision',
  'hurt',
  'attack',
  'guard',
]

/** A box in cell pixels, by its top-left corner. */
export interface MarsArcadeBox {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Which part of the move a drawn frame belongs to.
 *
 * The engine counts startup / active / recovery in 60 Hz frames while the art has
 * its own, far smaller, frame count, so the two cannot be matched one-to-one. The
 * phase is the join: it lets a test assert that an attack box is live on exactly the
 * frames the artist called `active`, without inventing a frame mapping that would be
 * wrong the moment either side is retimed.
 */
export type MarsArcadeFramePhase = 'startup' | 'active' | 'recovery' | 'neutral'

/** A box resolved into the fight loop's own space. */
export interface MarsArcadeStageBox {
  /** Stage x, the engine's horizontal space, centred on 0. */
  minX: number
  maxX: number
  /** Height above the floor. y grows upward, matching `marsArcade.ts`. */
  minY: number
  maxY: number
}

/**
 * Cell-space box to stage space, for a fighter at `x` facing `facing`.
 *
 * Boxes are authored facing right. For a left-facing fighter the box is mirrored
 * about the pivot column rather than stored twice.
 */
export function marsArcadeBoxToStage(
  box: MarsArcadeBox,
  fighterX: number,
  facing: 1 | -1,
  fighterY = 0,
): MarsArcadeStageBox {
  const left = box.x - MARS_ARCADE_CELL.centreColumn
  const right = left + box.width
  const minX = facing === 1 ? fighterX + left : fighterX - right
  return {
    minX,
    maxX: minX + box.width,
    minY: fighterY + (MARS_ARCADE_CELL.baselineRow - (box.y + box.height)),
    maxY: fighterY + (MARS_ARCADE_CELL.baselineRow - box.y),
  }
}

export function marsArcadeBoxesOverlap(a: MarsArcadeStageBox, b: MarsArcadeStageBox): boolean {
  return a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY
}

/**
 * Whether a guard box covers an incoming attack box.
 *
 * Vertical overlap only, deliberately. Horizontal reach is what decides whether the
 * attack arrives at all; the guard answers the separate question of whether it
 * arrives somewhere the defender is actually protecting. That is the high/low
 * distinction the reference calls out: a high attack against a low block connects.
 */
export function marsArcadeGuardCovers(
  attack: MarsArcadeStageBox,
  guard: MarsArcadeStageBox,
): boolean {
  return attack.minY < guard.maxY && guard.minY < attack.maxY
}
