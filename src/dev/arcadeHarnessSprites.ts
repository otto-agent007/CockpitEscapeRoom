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
import { marsArcadeActiveMove, type MarsArcadeSide, type MarsArcadeState } from '../game/marsArcade'
import {
  marsArcadeAnimationsIndex,
  marsArcadeAnimationKey,
  marsArcadeAnimationSources,
  marsArcadeDrawingAt,
  marsArcadeFrameAt,
  parseMarsArcadeAnimations,
  type MarsArcadeAnimation,
  type MarsArcadeAnimationsFile,
} from '../game/marsArcadeAnimations'
import rawAnimations from '../game/marsArcadeAnimations.json'
import type { MarsArcadeFighterId } from '../game/marsArcadeFighters'
import type { HeavyReaction } from './arcadeHarnessReactions'

/** The animation table as shipped. Parsed once; a malformed file fails at import. */
export const ARCADE_ANIMATIONS: MarsArcadeAnimationsFile = parseMarsArcadeAnimations(rawAnimations)
const index = marsArcadeAnimationsIndex(ARCADE_ANIMATIONS)

/** The clip for a fighter and animation name, or null when it has not been drawn. */
export function arcadeClip(fighter: MarsArcadeFighterId, animation: string): MarsArcadeAnimation | null {
  return index.get(marsArcadeAnimationKey(fighter, animation)) ?? null
}

function requireClip(fighter: MarsArcadeFighterId, animation: string): MarsArcadeAnimation {
  const clip = arcadeClip(fighter, animation)
  if (!clip) throw new Error(`arcade sprites: ${fighter} has no ${animation} clip`)
  return clip
}

/** The clip that illustrates a move, found by move id rather than button. */
function moveClip(fighter: MarsArcadeFighterId, moveId: string): MarsArcadeAnimation | null {
  for (const clip of ARCADE_ANIMATIONS.animations) {
    if (clip.fighter === fighter && clip.moveId === moveId) return clip
  }
  return null
}

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
  /** True when the pose has not been drawn and the anchor stands in for it. */
  placeholder: boolean
  label: string
  renderX?: number
  renderY?: number
}

/** A reaction clip's beats by name; the engine's stun decides how long each lasts. */
function reactionBeat(clip: MarsArcadeAnimation, beat: 'impact' | 'stagger' | 'recover'): string {
  const frames = clip.frames
  if (beat === 'impact') return frames[0]!.src
  if (beat === 'recover') return frames.at(-1)!.src
  return (frames.length >= 3 ? frames[1] : frames[0])!.src
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
  if (!live && fighter.id !== 'captain') {
    const won = state.winner === side
    const knockedOut = state.phase === 'ko' && fighter.health <= 0
    if (won || knockedOut) {
      const clip = requireClip(fighter.id, won ? 'victory' : 'knockout')
      const { frame, index } = reducedMotion
        ? { frame: clip.frames.at(-1)!, index: clip.frames.length - 1 }
        : marsArcadeFrameAt(clip, Math.max(0, outcomeFrame))
      return {
        src: frame.src, placeholder: false,
        label: `${won ? 'victory' : 'knockout'} ${index}`,
        // A terminal airborne fighter settles visually; frozen rules coordinates stay intact.
        renderY: fighter.y * (1 - index / Math.max(1, clip.frames.length - 1)),
      }
    }
    if (state.phase === 'timeOver') {
      return { src: anchors[fighter.id], placeholder: false, label: 'round over — resting', renderY: 0 }
    }
  }
  const move = marsArcadeActiveMove(fighter)
  if (live && fighter.activity === 'airborne' && fighter.id !== 'captain') {
    const clip = requireClip(fighter.id, 'jump')
    const index = fighter.velocityY > 0.6 ? 0 : fighter.velocityY < -0.6 ? 2 : 1
    const frame = clip.frames[Math.min(index, clip.frames.length - 1)]!
    return { src: frame.src, placeholder: false, label: `jump ${frame.pose}` }
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
      return { src: reactionBeat(clip, beat), placeholder: false, label: `heavy hit — ${beat}`, renderX: fighter.x + offset }
    }
    return { src: reactionBeat(clip, 'impact'), placeholder: false, label: 'hit recoil' }
  }
  if (live && fighter.id !== 'captain') {
    const guard = requireClip(fighter.id, 'block').frames[0]!.src
    if (fighter.activity === 'blockstun' && heavyReaction?.kind === 'block' && fighter.stunFrames > 0) {
      const clip = requireClip(fighter.id, 'heavy-block')
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const beat = elapsed < Math.ceil(heavyReaction.duration * 0.35) ? 'compress' :
        elapsed < Math.ceil(heavyReaction.duration * 0.75) ? 'settle' : 'guard'
      const src = beat === 'compress' ? clip.frames[0]!.src : beat === 'settle' ? clip.frames[1]!.src : guard
      return { src, placeholder: false, label: `heavy block — ${beat}` }
    }
    const opponent = state.fighters[side === 0 ? 1 : 0]
    const threat = marsArcadeActiveMove(opponent)
    if (fighter.blocking && fighter.stunFrames === 0 && fighter.y === 0 &&
      threat?.move.button === 'heavy' && threat.phase === 'startup' &&
      Math.abs(opponent.x - fighter.x) <= threat.move.reach) {
      return { src: guard, placeholder: false, label: 'heavy block — brace' }
    }
    if (fighter.activity === 'walk') {
      const clip = requireClip(fighter.id, fighter.blocking ? 'walk-back' : 'walk-forward')
      return {
        src: marsArcadeFrameAt(clip, state.frame).frame.src, placeholder: false,
        label: fighter.blocking ? 'backward shuffle' : 'forward shuffle',
      }
    }
    if (fighter.activity === 'blockstun' || fighter.blocking) {
      return { src: guard, placeholder: false, label: 'raised guard' }
    }
    if (fighter.activity === 'attack' && move) {
      const clip = moveClip(fighter.id, move.move.id)
      if (clip) {
        const frameInPhase = move.phase === 'startup' ? move.frame :
          move.phase === 'active' ? move.frame - move.move.startupFrames :
            move.frame - move.move.startupFrames - move.move.activeFrames
        const drawing = marsArcadeDrawingAt(clip, move.phase, frameInPhase)
        if (drawing) {
          return { src: drawing.frame.src, placeholder: false, label: `${clip.animation} ${move.phase} — ${drawing.frame.pose}` }
        }
      }
    }
  }
  const resting = fighter.activity === 'idle' && !fighter.blocking && live
  if (resting) {
    const clip = requireClip(fighter.id, 'idle')
    const frame = reducedMotion ? clip.frames[0]! : marsArcadeFrameAt(clip, state.frame).frame
    return { src: frame.src, placeholder: false, label: 'idle pilot' }
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
