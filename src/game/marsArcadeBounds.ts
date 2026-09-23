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
 * - `hit` — the hurtbox: where this fighter can be struck.
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
 * **Nothing here is wired into hit detection yet.** Doing that silently would change
 * every matchup's spacing. This module ships the contract, the authoring format and
 * the consistency checks first; the engine switchover is a separate, reviewable step.
 */

import type { MarsArcadeFighterId } from './marsArcadeFighters'

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

export type MarsArcadeBoundKind = 'collision' | 'hit' | 'attack' | 'guard'

export const MARS_ARCADE_BOUND_KINDS: readonly MarsArcadeBoundKind[] = [
  'collision',
  'hit',
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

export interface MarsArcadeFrameBounds {
  phase: MarsArcadeFramePhase
  collision?: MarsArcadeBox
  hit?: MarsArcadeBox
  guard?: MarsArcadeBox
  /** Present only on frames where the hitbox exists at all. */
  attack?: MarsArcadeBox
}

export interface MarsArcadeAnimationBounds {
  fighter: MarsArcadeFighterId
  animation: string
  /** Move id this animation illustrates, when it illustrates one. */
  moveId?: string
  frames: MarsArcadeFrameBounds[]
}

export interface MarsArcadeBoundsFile {
  version: number
  animations: MarsArcadeAnimationBounds[]
}

/** Bumped when the on-disk shape changes in a way old files cannot satisfy. */
export const MARS_ARCADE_BOUNDS_VERSION = 1

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

/** The hitbox for a frame, or null when the frame has none live. */
export function marsArcadeAttackBox(frame: MarsArcadeFrameBounds): MarsArcadeBox | null {
  return frame.phase === 'active' && frame.attack ? frame.attack : null
}

export function marsArcadeBoundsKey(fighter: MarsArcadeFighterId, animation: string): string {
  return `${fighter}:${animation}`
}

function isBox(value: unknown): value is MarsArcadeBox {
  if (typeof value !== 'object' || value === null) return false
  const box = value as Record<string, unknown>
  return (['x', 'y', 'width', 'height'] as const).every(
    (key) => typeof box[key] === 'number' && Number.isFinite(box[key]),
  )
}

function boxInsideCell(box: MarsArcadeBox): boolean {
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.x >= 0 &&
    box.y >= 0 &&
    box.x + box.width <= MARS_ARCADE_CELL.size &&
    box.y + box.height <= MARS_ARCADE_CELL.size
  )
}

const PHASES: readonly MarsArcadeFramePhase[] = ['startup', 'active', 'recovery', 'neutral']

/**
 * Parse and validate a bounds file.
 *
 * The gym writes this file from a browser, so it is untrusted input to everything
 * downstream and a malformed box must fail loudly here rather than silently produce
 * a hitbox at NaN — which overlaps nothing, meaning the move would simply stop
 * connecting and look like a balance bug.
 */
export function parseMarsArcadeBounds(input: unknown): MarsArcadeBoundsFile {
  if (typeof input !== 'object' || input === null) throw new Error('bounds: not an object')
  const file = input as Record<string, unknown>
  if (file.version !== MARS_ARCADE_BOUNDS_VERSION) {
    throw new Error(`bounds: version ${String(file.version)}, expected ${MARS_ARCADE_BOUNDS_VERSION}`)
  }
  if (!Array.isArray(file.animations)) throw new Error('bounds: animations is not an array')

  const seen = new Set<string>()
  const animations = file.animations.map((raw, index) => {
    if (typeof raw !== 'object' || raw === null) throw new Error(`bounds: animation ${index} is not an object`)
    const entry = raw as Record<string, unknown>
    const fighter = entry.fighter
    const animation = entry.animation
    if (typeof fighter !== 'string' || typeof animation !== 'string') {
      throw new Error(`bounds: animation ${index} is missing fighter or animation`)
    }
    const key = marsArcadeBoundsKey(fighter as MarsArcadeFighterId, animation)
    if (seen.has(key)) throw new Error(`bounds: duplicate entry ${key}`)
    seen.add(key)

    if (!Array.isArray(entry.frames) || entry.frames.length === 0) {
      throw new Error(`bounds: ${key} has no frames`)
    }
    const frames = entry.frames.map((frameRaw, frameIndex) => {
      if (typeof frameRaw !== 'object' || frameRaw === null) {
        throw new Error(`bounds: ${key} frame ${frameIndex} is not an object`)
      }
      const frame = frameRaw as Record<string, unknown>
      const phase = frame.phase
      if (typeof phase !== 'string' || !PHASES.includes(phase as MarsArcadeFramePhase)) {
        throw new Error(`bounds: ${key} frame ${frameIndex} has phase ${String(phase)}`)
      }
      const parsed: MarsArcadeFrameBounds = { phase: phase as MarsArcadeFramePhase }
      for (const kind of MARS_ARCADE_BOUND_KINDS) {
        const value = frame[kind]
        if (value === undefined || value === null) continue
        if (!isBox(value) || !boxInsideCell(value)) {
          throw new Error(`bounds: ${key} frame ${frameIndex} has an invalid ${kind} box`)
        }
        parsed[kind] = value
      }
      if (parsed.attack && phase !== 'active') {
        throw new Error(
          `bounds: ${key} frame ${frameIndex} carries an attack box on a ${phase} frame`,
        )
      }
      return parsed
    })

    const result: MarsArcadeAnimationBounds = {
      fighter: fighter as MarsArcadeFighterId,
      animation,
      frames,
    }
    if (typeof entry.moveId === 'string') result.moveId = entry.moveId
    return result
  })

  return { version: MARS_ARCADE_BOUNDS_VERSION, animations }
}

export function marsArcadeBoundsIndex(
  file: MarsArcadeBoundsFile,
): Map<string, MarsArcadeAnimationBounds> {
  return new Map(
    file.animations.map((entry) => [marsArcadeBoundsKey(entry.fighter, entry.animation), entry]),
  )
}
