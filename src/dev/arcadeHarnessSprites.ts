/**
 * Dev-only sprite selector for the Mars arcade harness.
 *
 * Every drawing and every hold comes from `marsArcadeAnimations.json`, the same
 * table the character gym edits, so the harness cannot play a pose the gym does not
 * show and the gym cannot preview timing the harness does not use. What stays in
 * code is the mapping from engine *state* to a clip: which clip an activity uses,
 * how a reaction is stretched over the stun the engine applied, and which airborne
 * drawing a velocity picks.
 */
import { marsArcadeActiveMove, marsArcadeMeleeBoxes, type MarsArcadeSide, type MarsArcadeState } from '../game/marsArcade'
import { marsArcadeBoxesOverlap } from '../game/marsArcadeBounds'
import {
  marsArcadeAnimationSources,
  marsArcadeDrawingAt,
  marsArcadeFrameAt,
  type MarsArcadeAnimation,
  type MarsArcadeAnimationFrame,
  type MarsArcadeAnimationsFile,
} from '../game/marsArcadeAnimations'
import { marsArcadeRules, type MarsArcadeFighterId } from '../game/marsArcadeFighters'
import {
  MARS_ARCADE_ANIMATIONS,
  marsArcadeClip,
  marsArcadeJumpIndex,
  marsArcadeCaptainReactionFrame,
  marsArcadeMoveClip,
} from '../game/marsArcadePose'
import type { HeavyReaction } from './arcadeHarnessReactions'

/** The animation table as shipped: the same parsed copy the rules read boxes from. */
export const ARCADE_ANIMATIONS: MarsArcadeAnimationsFile = MARS_ARCADE_ANIMATIONS

/** The clip for a fighter and animation name, or null when it has not been drawn. */
export const arcadeClip = marsArcadeClip
/** Candidate previews live beside the lookup so the rules read the same drawing the harness shows. */
export {
  marsArcadeCandidateClips as arcadeCandidateClips,
  setMarsArcadeClipOverride as setArcadeClipOverride,
} from '../game/marsArcadePose'

function requireClip(fighter: MarsArcadeFighterId, animation: string): MarsArcadeAnimation {
  const clip = arcadeClip(fighter, animation)
  if (!clip) throw new Error(`arcade sprites: ${fighter} has no ${animation} clip`)
  return clip
}

const moveClip = marsArcadeMoveClip

/** Every distinct drawing the table references; what the harness preloads. */
export const ARCADE_SPRITE_SOURCES: string[] = marsArcadeAnimationSources(ARCADE_ANIMATIONS)

const anchors: Record<MarsArcadeFighterId, string> = {
  booster: requireClip('booster', 'idle').frames[0]!.src,
  oracle: requireClip('oracle', 'idle').frames[0]!.src,
  captain: requireClip('captain', 'idle').frames[0]!.src,
}
/** The anchor frame per fighter, reused by the HUD as the portrait source. */
export const ARCADE_ANCHOR_SOURCES = anchors

export interface ArcadeSpriteSelection {
  src: string
  /** True when an available guard or anchor stands in for an undrawn pose. */
  placeholder: boolean
  label: string
  /** The table frame the drawing came from, when it came from the table: its boxes. */
  frame?: MarsArcadeAnimationFrame
  renderX?: number
  renderY?: number
}

/** A reaction clip's beats by name; the engine's stun decides how long each lasts. */
function reactionBeat(clip: MarsArcadeAnimation, beat: 'impact' | 'stagger' | 'recover'): MarsArcadeAnimationFrame {
  const frames = clip.frames
  if (beat === 'impact') return frames[0]!
  if (beat === 'recover') return frames.at(-1)!
  return (frames.length >= 3 ? frames[1] : frames[0])!
}

/** The first table frame that uses a drawing, for poses picked by drawing. */
function frameFor(src: string): MarsArcadeAnimationFrame | undefined {
  for (const clip of ARCADE_ANIMATIONS.animations) {
    const found = clip.frames.find((frame) => frame.src === src)
    if (found) return found
  }
  return undefined
}

/** Anticipate the first active drawing at the current positions, using the live rules. */
function heavyCanMeetGuard(state: MarsArcadeState, attackerSide: MarsArcadeSide): boolean {
  const attacker = state.fighters[attackerSide]
  const defender = state.fighters[attackerSide === 0 ? 1 : 0]
  const threat = marsArcadeActiveMove(attacker)!
  if (marsArcadeRules().useBounds) {
    if (threat.move.guardHeight === 'low') return false
    const projected: MarsArcadeState = { ...state, fighters: [{ ...state.fighters[0] }, { ...state.fighters[1] }] }
    projected.fighters[attackerSide].moveFrame = threat.move.startupFrames
    const boxes = marsArcadeMeleeBoxes(projected, attackerSide)
    if (boxes) return boxes.attack.some(attack => boxes.hurt.some(hurt => marsArcadeBoxesOverlap(attack, hurt)))
  }
  return Math.sign(defender.x - attacker.x) === attacker.facing &&
    Math.abs(defender.x - attacker.x) <= threat.move.reach && defender.y <= threat.move.maxHeight
}

export function selectArcadeSprite(
  state: MarsArcadeState,
  side: MarsArcadeSide,
  reducedMotion: boolean,
  outcomeFrame = 0,
  heavyReaction: HeavyReaction | null = null,
): ArcadeSpriteSelection {
  const fighter = state.fighters[side]
  const live = state.phase === 'intro' || state.phase === 'fight'
  if (!live) {
    const won = state.winner === side
    const knockedOut = state.phase === 'ko' && fighter.health <= 0
    if (won || knockedOut) {
      const clip = arcadeClip(fighter.id, won ? 'victory' : 'knockout')
      if (clip) {
        const { frame, index } = reducedMotion
          ? { frame: clip.frames.at(-1)!, index: clip.frames.length - 1 }
          : marsArcadeFrameAt(clip, Math.max(0, outcomeFrame))
        return {
          src: frame.src, placeholder: false, frame,
          label: `${won ? 'victory' : 'knockout'} ${index}`,
          // A terminal airborne fighter settles visually; frozen rules coordinates stay intact.
          renderY: fighter.y * (1 - index / Math.max(1, clip.frames.length - 1)),
        }
      }
    }
    if (state.phase === 'timeOver' && !won) {
      return { src: anchors[fighter.id], placeholder: false, label: 'round over — resting', renderY: 0 }
    }
  }
  const move = marsArcadeActiveMove(fighter)
  if(live&&fighter.activity==='distracted'){
    const clip=arcadeClip(fighter.id,'distracted'),frame=clip?.frames[0]??arcadeClip(fighter.id,'idle')?.frames[0]
    if(frame)return {src:frame.src,placeholder:!clip,frame,label:clip?'distracted — looking up':'distraction — art pending'}
  }
  const captainReaction = live ? marsArcadeCaptainReactionFrame(fighter) : null
  if (captainReaction) {
    return { src: captainReaction.src, placeholder: false, frame: captainReaction,
      label: `${fighter.activity === 'hitstun' ? 'hit' : 'heavy block'} — ${captainReaction.pose}` }
  }
  if (live && fighter.activity === 'airborne') {
    const clip = arcadeClip(fighter.id, 'jump')
    if (clip) {
      const index = marsArcadeJumpIndex(fighter.velocityY)
      const frame = clip.frames[Math.min(index, clip.frames.length - 1)]!
      return { src: frame.src, placeholder: false, frame, label: `jump ${frame.pose}` }
    }
  }
  if (live && fighter.id !== 'captain' && fighter.activity === 'hitstun') {
    const clip = requireClip(fighter.id, 'hit')
    if (heavyReaction?.kind === 'hit' && fighter.stunFrames > 0 && fighter.y === 0) {
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const beat = elapsed >= Math.ceil(heavyReaction.duration * 0.55) ? 'recover' :
        elapsed < 3 ? 'impact' : 'stagger'
      // Ease the existing knockback into view; never move the rules position.
      const remaining = Math.max(0, 1 - elapsed / 8)
      const offset = reducedMotion ? 0 : Math.round(heavyReaction.offsetX * remaining * remaining)
      const frame = reactionBeat(clip, beat)
      return { src: frame.src, placeholder: false, frame, label: `heavy hit — ${beat}`, renderX: fighter.x + offset }
    }
    const impact = reactionBeat(clip, 'impact')
    return { src: impact.src, placeholder: false, frame: impact, label: 'hit recoil' }
  }
  if (live && fighter.activity === 'attack' && move && !fighter.blocking) {
    const clip = moveClip(fighter.id, move.move.id)
    if (clip) {
      const frameInPhase = move.phase === 'startup' ? move.frame :
        move.phase === 'active' ? move.frame - move.move.startupFrames :
          move.frame - move.move.startupFrames - move.move.activeFrames
      const drawing = marsArcadeDrawingAt(clip, move.phase, frameInPhase)
      if (drawing) {
        return { src: drawing.frame.src, placeholder: false, frame: drawing.frame, label: `${clip.animation} ${move.phase} — ${drawing.frame.pose}` }
      }
    }
  }
  if (live) {
    const guardClip = arcadeClip(fighter.id, 'block')
    const guardFrame = guardClip?.frames[0]
    const guard = guardFrame?.src
    const heavyBlock = arcadeClip(fighter.id, 'heavy-block')
    if (fighter.id !== 'captain' && guard && heavyBlock && fighter.activity === 'blockstun' && heavyReaction?.kind === 'block' && fighter.stunFrames > 0) {
      const clip = heavyBlock
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const beat = elapsed < Math.ceil(heavyReaction.duration * 0.35) ? 'compress' :
        elapsed < Math.ceil(heavyReaction.duration * 0.75) ? 'settle' : 'guard'
      const src = beat === 'compress' ? clip.frames[0]!.src : beat === 'settle' ? clip.frames[1]!.src : guard
      return { src, placeholder: false, frame: frameFor(src), label: `heavy block — ${beat}` }
    }
    const opponent = state.fighters[side === 0 ? 1 : 0]
    const threat = marsArcadeActiveMove(opponent)
    // Captain's authored retreat already carries its guard regions; keep rules and drawing together.
    if (fighter.id !== 'captain' && guardFrame && fighter.blocking && fighter.stunFrames === 0 && fighter.y === 0 &&
      threat?.move.button === 'heavy' && threat.phase === 'startup' &&
      heavyCanMeetGuard(state, side === 0 ? 1 : 0)) {
      return { src: guardFrame.src, placeholder: false, frame: guardFrame, label: 'heavy block — brace' }
    }
    if (fighter.activity === 'walk') {
      const clip = arcadeClip(fighter.id, fighter.blocking ? 'walk-back' : 'walk-forward')
      if (clip) {
        const { frame } = marsArcadeFrameAt(clip, state.frame)
        return { src: frame.src, placeholder: false, frame, label: fighter.blocking ? 'backward shuffle' : 'forward shuffle' }
      }
      if (fighter.id === 'captain' && fighter.blocking && guardFrame) {
        return { src: guardFrame.src, placeholder: true, frame: guardFrame, label: 'raised guard — back-walk art pending' }
      }
    }
    if (guardFrame && (fighter.activity === 'blockstun' || fighter.blocking)) {
      const absorb = fighter.id === 'captain' && fighter.activity === 'blockstun'
      const frame = absorb ? guardClip!.frames.at(-1)! : guardFrame
      return { src: frame.src, placeholder: false, frame, label: absorb ? 'guard absorb' : 'raised guard' }
    }
  }
  const resting = fighter.activity === 'idle' && !fighter.blocking && live
  if (resting) {
    const clip = requireClip(fighter.id, 'idle')
    const frame = reducedMotion ? clip.frames[0]! : marsArcadeFrameAt(clip, state.frame).frame
    return { src: frame.src, placeholder: false, frame, label: 'idle pilot' }
  }
  return { src: anchors[fighter.id], placeholder: true, label: 'anchor placeholder — pose not authored' }
}

/** One preload per source; an unavailable image falls back to the original box renderer. */
export function loadArcadeSprites() {
  const images = new Map<string, HTMLImageElement>()
  const failures = new Set<string>()
  for (const src of ARCADE_SPRITE_SOURCES) {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth === 128 && image.naturalHeight === 128) images.set(src, image)
      else failures.add(src)
    }
    image.onerror = () => failures.add(src)
    image.src = src
  }
  return {
    get: (src: string) => images.get(src),
    status: () => `${images.size}/${ARCADE_SPRITE_SOURCES.length} sprites ready` +
      (failures.size ? `; ${failures.size} failed — box fallback` :
        images.size < ARCADE_SPRITE_SOURCES.length ? '; loading — box fallback' : ''),
  }
}
