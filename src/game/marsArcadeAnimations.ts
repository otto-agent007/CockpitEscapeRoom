/**
 * Mars arcade cabinet — the animation table.
 *
 * Pure data and arithmetic: no canvas, no DOM, no Three.js.
 *
 * One file, `marsArcadeAnimations.json`, is the single description of every drawn
 * clip a fighter has: which PNG each frame is, what the pose is called, which phase
 * of a move it belongs to, how many engine frames it is held, and the boxes authored
 * against it. The harness plays from it, the character gym edits it, the validator
 * checks it and the tests pin it to the frame data in `marsArcadeFighters.ts`.
 *
 * It replaces the v1 bounds file, which paired boxes with drawings **by array
 * position** — so inserting a pose silently moved every later box onto the wrong
 * drawing — and it replaces the holds that used to live as thresholds scattered
 * through the sprite selector, where the gym could not see them.
 *
 * Boxes are cell pixels, top-left origin, authored facing right and mirrored at
 * read time (`marsArcadeBounds.ts`). A frame may carry several hurt boxes and several
 * attack boxes; the body (`collision`) and `guard` boxes are one per frame.
 */

import {
  MARS_ARCADE_CELL,
  marsArcadeBoxToStage,
  type MarsArcadeBox,
  type MarsArcadeFramePhase,
} from './marsArcadeBounds'
import { marsArcadeFighter, type MarsArcadeFighterId, type MarsArcadeMove } from './marsArcadeFighters'

/** Bumped when the on-disk shape changes in a way old files cannot satisfy. */
export const MARS_ARCADE_ANIMATIONS_VERSION = 2

/**
 * How a clip advances.
 *
 * - `once`: the move clips. Holds per phase sum to the move's frame data.
 * - `loop`: walks and idles, cycled on simulation time.
 * - `hold-last`: outcomes, blocks. Plays through, then stays on the last drawing.
 * - `by-velocity`: airborne. The engine picks rise / apex / fall from velocity, so the
 *   holds are nominal and only the gym plays them in order.
 * - `by-stun`: hit and block reactions. Stretched over the stun the engine applied.
 */
export type MarsArcadeLoopMode = 'once' | 'loop' | 'hold-last' | 'by-velocity' | 'by-stun'

export const MARS_ARCADE_LOOP_MODES: readonly MarsArcadeLoopMode[] = ['once', 'loop', 'hold-last', 'by-velocity', 'by-stun']

export interface MarsArcadeAnimationFrame {
  /** The drawing, as the dev server serves it (`/art-source/arcade/...`). */
  src: string
  /** What the pose is called in the gym and the asset reports. */
  pose: string
  phase: MarsArcadeFramePhase
  /** Engine frames (60 Hz) this drawing stays on screen. */
  hold: number
  /** The body box: what stands on the floor and what pushes. */
  collision?: MarsArcadeBox
  /** Hurt boxes: where this fighter can be struck. */
  hurt?: MarsArcadeBox[]
  /** Hitboxes, present only on frames where the attack is live. */
  attack?: MarsArcadeBox[]
  /** What a block covers. Kept as a gym visual; the rules use guard height. */
  guard?: MarsArcadeBox
}

export interface MarsArcadeAnimation {
  fighter: MarsArcadeFighterId
  animation: string
  /** Move id this clip illustrates, when it illustrates one. */
  moveId?: string
  loop: MarsArcadeLoopMode
  /**
   * False while the boxes are machine-seeded from the drawing's silhouette and nobody
   * has looked at them in the gym. The validator warns until it is flipped.
   */
  reviewed: boolean
  /**
   * Why the drawn strike does not land on `reach`, when the owner accepted that. The
   * booster's heavy contact reaches 34 against a rules reach of 38, by decision.
   */
  reachException?: string
  frames: MarsArcadeAnimationFrame[]
}

export interface MarsArcadeAnimationsFile {
  version: number
  animations: MarsArcadeAnimation[]
}

export function marsArcadeAnimationKey(fighter: MarsArcadeFighterId, animation: string): string {
  return `${fighter}:${animation}`
}

export function marsArcadeAnimationsIndex(file: MarsArcadeAnimationsFile): Map<string, MarsArcadeAnimation> {
  return new Map(file.animations.map((entry) => [marsArcadeAnimationKey(entry.fighter, entry.animation), entry]))
}

/** Every distinct drawing the file references, in first-use order. */
export function marsArcadeAnimationSources(file: MarsArcadeAnimationsFile): string[] {
  return [...new Set(file.animations.flatMap((entry) => entry.frames.map((frame) => frame.src)))]
}

export function marsArcadeAnimationDuration(entry: MarsArcadeAnimation): number {
  return entry.frames.reduce((sum, frame) => sum + frame.hold, 0)
}

/**
 * The drawing on screen `tick` frames into a clip.
 *
 * Loops wrap; everything else clamps to the last drawing, which is what "hold the
 * final pose" means for an outcome and what a move does if the engine's count runs a
 * frame past the holds.
 */
export function marsArcadeFrameAt(entry: MarsArcadeAnimation, tick: number): { frame: MarsArcadeAnimationFrame; index: number } {
  const total = marsArcadeAnimationDuration(entry)
  let remaining = entry.loop === 'loop' && total > 0 ? ((tick % total) + total) % total : Math.max(0, tick)
  for (let index = 0; index < entry.frames.length; index += 1) {
    const frame = entry.frames[index]!
    if (remaining < frame.hold) return { frame, index }
    remaining -= frame.hold
  }
  const index = entry.frames.length - 1
  return { frame: entry.frames[index]!, index }
}

/**
 * The drawing for a move `frameInPhase` frames into `phase`.
 *
 * Only the frames of that phase are walked, so the drawing can never be one from a
 * different phase whatever the holds say — the guarantee the attack-box rule rests
 * on. Returns null when the clip has no drawing for the phase.
 */
export function marsArcadeDrawingAt(
  entry: MarsArcadeAnimation,
  phase: MarsArcadeFramePhase,
  frameInPhase: number,
): { frame: MarsArcadeAnimationFrame; index: number } | null {
  let remaining = Math.max(0, frameInPhase)
  let last: { frame: MarsArcadeAnimationFrame; index: number } | null = null
  for (let index = 0; index < entry.frames.length; index += 1) {
    const frame = entry.frames[index]!
    if (frame.phase !== phase) continue
    last = { frame, index }
    if (remaining < frame.hold) return last
    remaining -= frame.hold
  }
  return last
}

/** The furthest forward edge of any live hitbox on the frame, in cell pixels past the pivot. */
export function marsArcadeAttackReach(frame: MarsArcadeAnimationFrame): number | null {
  if (frame.phase !== 'active' || !frame.attack?.length) return null
  return Math.max(...frame.attack.map((box) => marsArcadeBoxToStage(box, 0, 1).maxX))
}

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

const PHASES: readonly MarsArcadeFramePhase[] = ['startup', 'active', 'recovery', 'neutral']

function isBox(value: unknown): value is MarsArcadeBox {
  if (typeof value !== 'object' || value === null) return false
  const box = value as Record<string, unknown>
  return (['x', 'y', 'width', 'height'] as const).every(
    (key) => typeof box[key] === 'number' && Number.isFinite(box[key]) && Number.isInteger(box[key]),
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

function parseBox(value: unknown, where: string): MarsArcadeBox {
  if (!isBox(value) || !boxInsideCell(value)) throw new Error(`animations: ${where} is an invalid box`)
  return { x: value.x, y: value.y, width: value.width, height: value.height }
}

function parseBoxList(value: unknown, where: string): MarsArcadeBox[] {
  if (!Array.isArray(value)) throw new Error(`animations: ${where} is not a list`)
  if (value.length === 0) throw new Error(`animations: ${where} is empty; omit it instead`)
  return value.map((box, index) => parseBox(box, `${where}[${index}]`))
}

/**
 * Parse and validate the shape of an animations file.
 *
 * The gym writes this file from a browser, so it is untrusted input to everything
 * downstream and a malformed box must fail loudly here rather than silently become a
 * hitbox at NaN — which overlaps nothing, meaning the move would simply stop
 * connecting and look like a balance bug. Shape only; the rules that need the frame
 * data live in `validateMarsArcadeAnimations`.
 */
export function parseMarsArcadeAnimations(input: unknown): MarsArcadeAnimationsFile {
  if (typeof input !== 'object' || input === null) throw new Error('animations: not an object')
  const file = input as Record<string, unknown>
  if (file.version !== MARS_ARCADE_ANIMATIONS_VERSION) {
    throw new Error(`animations: version ${String(file.version)}, expected ${MARS_ARCADE_ANIMATIONS_VERSION}`)
  }
  if (!Array.isArray(file.animations)) throw new Error('animations: animations is not an array')

  const seen = new Set<string>()
  const animations = file.animations.map((raw, index) => {
    if (typeof raw !== 'object' || raw === null) throw new Error(`animations: entry ${index} is not an object`)
    const entry = raw as Record<string, unknown>
    if (typeof entry.fighter !== 'string' || typeof entry.animation !== 'string') {
      throw new Error(`animations: entry ${index} is missing fighter or animation`)
    }
    const fighter = entry.fighter as MarsArcadeFighterId
    const key = marsArcadeAnimationKey(fighter, entry.animation)
    if (seen.has(key)) throw new Error(`animations: duplicate entry ${key}`)
    seen.add(key)
    if (typeof entry.loop !== 'string' || !MARS_ARCADE_LOOP_MODES.includes(entry.loop as MarsArcadeLoopMode)) {
      throw new Error(`animations: ${key} has loop ${String(entry.loop)}`)
    }
    if (typeof entry.reviewed !== 'boolean') throw new Error(`animations: ${key} is missing reviewed`)
    if (!Array.isArray(entry.frames) || entry.frames.length === 0) throw new Error(`animations: ${key} has no frames`)

    const frames = entry.frames.map((frameRaw, frameIndex): MarsArcadeAnimationFrame => {
      const where = `${key} frame ${frameIndex}`
      if (typeof frameRaw !== 'object' || frameRaw === null) throw new Error(`animations: ${where} is not an object`)
      const frame = frameRaw as Record<string, unknown>
      if (typeof frame.src !== 'string' || !frame.src.startsWith('/art-source/arcade/')) {
        throw new Error(`animations: ${where} src must be a drawing under /art-source/arcade/`)
      }
      if (typeof frame.pose !== 'string' || frame.pose.length === 0) throw new Error(`animations: ${where} has no pose name`)
      if (typeof frame.phase !== 'string' || !PHASES.includes(frame.phase as MarsArcadeFramePhase)) {
        throw new Error(`animations: ${where} has phase ${String(frame.phase)}`)
      }
      if (typeof frame.hold !== 'number' || !Number.isInteger(frame.hold) || frame.hold < 1) {
        throw new Error(`animations: ${where} hold must be a whole number of frames, at least 1`)
      }
      const parsed: MarsArcadeAnimationFrame = {
        src: frame.src,
        pose: frame.pose,
        phase: frame.phase as MarsArcadeFramePhase,
        hold: frame.hold,
      }
      if (frame.collision != null) parsed.collision = parseBox(frame.collision, `${where} collision`)
      if (frame.hurt != null) parsed.hurt = parseBoxList(frame.hurt, `${where} hurt`)
      if (frame.attack != null) parsed.attack = parseBoxList(frame.attack, `${where} attack`)
      if (frame.guard != null) parsed.guard = parseBox(frame.guard, `${where} guard`)
      if (parsed.attack && parsed.phase !== 'active') {
        throw new Error(`animations: ${where} carries an attack box on a ${parsed.phase} frame`)
      }
      return parsed
    })

    const result: MarsArcadeAnimation = {
      fighter,
      animation: entry.animation,
      loop: entry.loop as MarsArcadeLoopMode,
      reviewed: entry.reviewed,
      frames,
    }
    if (typeof entry.moveId === 'string') result.moveId = entry.moveId
    if (typeof entry.reachException === 'string' && entry.reachException.length > 0) {
      result.reachException = entry.reachException
    }
    return result
  })

  return { version: MARS_ARCADE_ANIMATIONS_VERSION, animations }
}

// ---------------------------------------------------------------------------
// Rules validation
// ---------------------------------------------------------------------------

export interface MarsArcadeAnimationFinding {
  severity: 'error' | 'warning'
  key: string
  /** Frame index, when the finding is about one frame. */
  frame?: number
  rule: string
  message: string
}

/** Cell pixels the drawn strike may miss `reach` by; mirrors the sprite contract. */
export const MARS_ARCADE_REACH_TOLERANCE_PX = 3

export function marsArcadeMoveById(id: string): MarsArcadeMove | null {
  for (const fighter of ['booster', 'oracle', 'captain'] as MarsArcadeFighterId[]) {
    for (const move of Object.values(marsArcadeFighter(fighter).moves)) {
      if (move.id === id) return move
    }
  }
  return null
}

/**
 * Check a parsed file against the frame data and the box rules.
 *
 * Errors are what the gym refuses to save and the tests refuse to pass. Warnings are
 * the honest list of what is still placeholder: seeded boxes nobody has reviewed,
 * frames with no boxes at all, a reach exception the owner granted.
 */
export function validateMarsArcadeAnimations(file: MarsArcadeAnimationsFile): MarsArcadeAnimationFinding[] {
  const findings: MarsArcadeAnimationFinding[] = []
  const error = (key: string, rule: string, message: string, frame?: number): void => {
    findings.push({ severity: 'error', key, rule, message, ...(frame === undefined ? {} : { frame }) })
  }
  const warning = (key: string, rule: string, message: string, frame?: number): void => {
    findings.push({ severity: 'warning', key, rule, message, ...(frame === undefined ? {} : { frame }) })
  }

  for (const entry of file.animations) {
    const key = marsArcadeAnimationKey(entry.fighter, entry.animation)
    const move = entry.moveId ? marsArcadeMoveById(entry.moveId) : null
    if (entry.moveId && !move) error(key, 'unknown-move', `${entry.moveId} is not a move any fighter has`)
    if (entry.moveId && move && !Object.values(marsArcadeFighter(entry.fighter).moves).includes(move)) {
      error(key, 'foreign-move', `${entry.moveId} belongs to another fighter`)
    }
    if (!entry.reviewed) warning(key, 'unreviewed', 'boxes are machine-seeded and have not been reviewed in the gym')

    if (move) {
      if (entry.loop !== 'once') error(key, 'move-loop', `a move clip plays once, not ${entry.loop}`)
      const held = { startup: 0, active: 0, recovery: 0, neutral: 0 }
      for (const frame of entry.frames) held[frame.phase] += frame.hold
      if (held.neutral > 0) error(key, 'neutral-in-move', 'a move clip has no neutral frames; use startup, active or recovery')
      const expected = { startup: move.startupFrames, active: move.activeFrames, recovery: move.recoveryFrames }
      for (const phase of ['startup', 'active', 'recovery'] as const) {
        if (expected[phase] === 0 && held[phase] === 0) continue
        if (held[phase] !== expected[phase]) {
          error(key, 'hold-sum', `${phase} drawings are held ${held[phase]} frames; the move has ${expected[phase]}`)
        }
      }
      const strikes = move.reach > 0 && !move.lockOn && !move.projectile && move.damage > 0
      let bestReach: number | null = null
      entry.frames.forEach((frame, index) => {
        const reach = marsArcadeAttackReach(frame)
        if (frame.phase === 'active' && strikes && reach === null) {
          error(key, 'active-without-attack', `active pose "${frame.pose}" has no attack box`, index)
        }
        if (reach !== null && !strikes) {
          error(key, 'attack-without-reach', `pose "${frame.pose}" carries an attack box but ${move.id} does not strike by reach`, index)
        }
        if (reach !== null) bestReach = bestReach === null ? reach : Math.max(bestReach, reach)
      })
      if (strikes && bestReach !== null) {
        const miss = bestReach - move.reach
        if (Math.abs(miss) > MARS_ARCADE_REACH_TOLERANCE_PX) {
          if (entry.reachException) {
            warning(key, 'reach-exception', `attack reaches ${bestReach} against reach ${move.reach}: ${entry.reachException}`)
          } else {
            error(key, 'reach', `attack reaches ${bestReach}, ${miss > 0 ? '+' : ''}${miss} against reach ${move.reach} (tolerance ${MARS_ARCADE_REACH_TOLERANCE_PX})`)
          }
        }
      }
    } else {
      entry.frames.forEach((frame, index) => {
        if (frame.attack) error(key, 'attack-without-move', `pose "${frame.pose}" carries an attack box but the clip illustrates no move`, index)
      })
    }

    entry.frames.forEach((frame, index) => {
      if (frame.collision && frame.collision.y + frame.collision.height !== MARS_ARCADE_CELL.baselineRow) {
        error(key, 'collision-baseline', `pose "${frame.pose}" body box bottom is row ${frame.collision.y + frame.collision.height}, not the baseline ${MARS_ARCADE_CELL.baselineRow}`, index)
      }
      if (!frame.collision || !frame.hurt) {
        warning(key, 'missing-boxes', `pose "${frame.pose}" has no ${!frame.collision ? 'body' : 'hurt'} box`, index)
      }
      if (entry.animation === 'block' && !frame.guard) {
        error(key, 'block-without-guard', `block pose "${frame.pose}" has no guard box`, index)
      }
    })
  }
  return findings
}

export function marsArcadeAnimationErrors(findings: MarsArcadeAnimationFinding[]): MarsArcadeAnimationFinding[] {
  return findings.filter((finding) => finding.severity === 'error')
}

export function formatMarsArcadeFinding(finding: MarsArcadeAnimationFinding): string {
  const where = finding.frame === undefined ? finding.key : `${finding.key} #${finding.frame + 1}`
  return `${finding.severity.toUpperCase()} ${where} [${finding.rule}] ${finding.message}`
}
