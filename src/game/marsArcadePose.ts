/**
 * Mars arcade cabinet — which drawing the rules read.
 *
 * Pure: no canvas, no DOM. The animation table as shipped, clip lookups, and the one
 * question the fight loop needs answered once it reads boxes: which drawing is this
 * fighter in on this frame?
 *
 * The answer comes from rules state alone (`state.frame`, `moveFrame`, `velocityY`,
 * `activity`), so the same inputs still give the same round. It is the drawing the
 * harness shows for every clip that is played by state. The harness also has cosmetic
 * beats keyed on its own presentation state: the heavy-reaction beats, the
 * heavy-block brace, the knockback easing and the static idle under reduced motion.
 * Those move the picture, never a hurt box.
 */

import type { MarsArcadeFighterState, MarsArcadeSide, MarsArcadeState } from './marsArcade'
import {
  marsArcadeAnimationKey,
  marsArcadeAnimationsIndex,
  marsArcadeDrawingAt,
  marsArcadeFrameAt,
  parseMarsArcadeAnimations,
  type MarsArcadeAnimation,
  type MarsArcadeAnimationFrame,
  type MarsArcadeAnimationsFile,
} from './marsArcadeAnimations'
import rawAnimations from './marsArcadeAnimations.json'
import type { MarsArcadeFramePhase } from './marsArcadeBounds'
import { marsArcadeFighter, type MarsArcadeFighterId, type MarsArcadeMove } from './marsArcadeFighters'

/** The animation table as shipped. Parsed once; a malformed file fails at import. */
export const MARS_ARCADE_ANIMATIONS: MarsArcadeAnimationsFile = parseMarsArcadeAnimations(rawAnimations)
const index = marsArcadeAnimationsIndex(MARS_ARCADE_ANIMATIONS)

/**
 * Candidate overrides: play a candidate clip in place of the shipped one.
 *
 * A candidate is a clip named `<shipped>-<suffix>` (`walk-forward-video`) that no fighter
 * state maps to. The playground can point a shipped name at a candidate so the owner sees
 * it in the fight before deciding whether it ships; nothing here touches the table. The
 * override sits in this lookup, not the harness, so the rules read the candidate's boxes
 * while its drawings are on screen.
 */
const overrides = new Map<string, string>()
/** A clip named `<shipped><suffix>` is a candidate for `<shipped>`. */
const CANDIDATE_SUFFIXES = ['-video', '-candidate', '-alt']

export function setMarsArcadeClipOverride(fighter: MarsArcadeFighterId, animation: string, candidate: string | null): void {
  const key = marsArcadeAnimationKey(fighter, animation)
  if (candidate) overrides.set(key, candidate)
  else overrides.delete(key)
}

/** Every candidate clip, with the shipped clip it stands in for. */
export function marsArcadeCandidateClips(): { fighter: MarsArcadeFighterId; animation: string; candidate: string }[] {
  const out: { fighter: MarsArcadeFighterId; animation: string; candidate: string }[] = []
  for (const clip of MARS_ARCADE_ANIMATIONS.animations) {
    const suffix = CANDIDATE_SUFFIXES.find((candidate) => clip.animation.endsWith(candidate))
    if (!suffix) continue
    const base = clip.animation.slice(0, -suffix.length)
    if (index.has(marsArcadeAnimationKey(clip.fighter, base))) {
      out.push({ fighter: clip.fighter, animation: base, candidate: clip.animation })
    }
  }
  return out
}

/** The clip for a fighter and animation name (or its candidate override), or null when it has not been drawn. */
export function marsArcadeClip(fighter: MarsArcadeFighterId, animation: string): MarsArcadeAnimation | null {
  const key = marsArcadeAnimationKey(fighter, animation)
  const override = overrides.get(key)
  if (override) {
    const candidate = index.get(marsArcadeAnimationKey(fighter, override))
    if (candidate) return candidate
  }
  return index.get(key) ?? null
}

/** The clip that illustrates a move, found by move id rather than button. */
export function marsArcadeMoveClip(fighter: MarsArcadeFighterId, moveId: string): MarsArcadeAnimation | null {
  for (const clip of MARS_ARCADE_ANIMATIONS.animations) {
    if (clip.fighter === fighter && clip.moveId === moveId) return clip
  }
  return null
}

/** The move phase for an engine move frame, and how far into that phase it is. */
export function marsArcadeMovePhaseAt(
  move: MarsArcadeMove,
  moveFrame: number,
): { phase: Exclude<MarsArcadeFramePhase, 'neutral'>; frameInPhase: number } {
  if (moveFrame < move.startupFrames) return { phase: 'startup', frameInPhase: moveFrame }
  if (moveFrame < move.startupFrames + move.activeFrames) {
    return { phase: 'active', frameInPhase: moveFrame - move.startupFrames }
  }
  return { phase: 'recovery', frameInPhase: moveFrame - move.startupFrames - move.activeFrames }
}

/** Velocity either side of which the jump clip shows rising or falling, else apex. */
export const MARS_ARCADE_APEX_VELOCITY = 0.6

/** The jump drawing for a vertical velocity: rising, apex or falling. */
export function marsArcadeJumpIndex(velocityY: number): 0 | 1 | 2 {
  return velocityY > MARS_ARCADE_APEX_VELOCITY ? 0 : velocityY < -MARS_ARCADE_APEX_VELOCITY ? 2 : 1
}

function fighterFrame(fighter: MarsArcadeFighterState, frame: number): MarsArcadeAnimationFrame | null {
  const clip = (name: string) => marsArcadeClip(fighter.id, name)

  if (fighter.activity === 'attack' && fighter.activeButton) {
    const move = marsArcadeFighter(fighter.id).moves[fighter.activeButton]
    const moveClip = marsArcadeMoveClip(fighter.id, move.id)
    if (!moveClip) return null
    const { phase, frameInPhase } = marsArcadeMovePhaseAt(move, fighter.moveFrame)
    return marsArcadeDrawingAt(moveClip, phase, frameInPhase)?.frame ?? null
  }
  if (fighter.activity === 'airborne') {
    const jump = clip('jump')
    return jump ? jump.frames[Math.min(marsArcadeJumpIndex(fighter.velocityY), jump.frames.length - 1)]! : null
  }
  if (fighter.activity === 'hitstun') return clip('hit')?.frames[0] ?? null
  if (fighter.activity === 'walk') {
    const walk = clip(fighter.blocking ? 'walk-back' : 'walk-forward')
    return walk ? marsArcadeFrameAt(walk, frame).frame : null
  }
  if (fighter.activity === 'blockstun' || fighter.blocking) return clip('block')?.frames[0] ?? null
  if (fighter.activity === 'idle') {
    const idle = clip('idle')
    return idle ? marsArcadeFrameAt(idle, frame).frame : null
  }
  return null
}

/**
 * The drawing whose boxes the rules read for one fighter, or null when that state
 * has not been drawn (every captain move, for one). Null means "no boxes": the rules
 * fall back to the reach check for that pair rather than treating it as unhittable.
 */
export function marsArcadeRulesFrame(state: MarsArcadeState, side: MarsArcadeSide): MarsArcadeAnimationFrame | null {
  return fighterFrame(state.fighters[side], state.frame)
}
