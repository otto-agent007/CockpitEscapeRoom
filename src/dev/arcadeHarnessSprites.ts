/** Dev-only pilot: explicitly NOT the complete Wave 1 animation manifest. */
import { marsArcadeActiveMove, type MarsArcadeSide, type MarsArcadeState } from '../game/marsArcade'
import type { HeavyReaction } from './arcadeHarnessReactions'
import type { MarsArcadeFighterId } from '../game/marsArcadeFighters'

const anchors: Record<MarsArcadeFighterId, string> = {
  booster: '/art-source/arcade/booster/normalised-sleek-ready/anchor/anchor-00.png',
  oracle: '/art-source/arcade/oracle/normalised-clean/anchor/anchor-00.png',
  captain: '/art-source/arcade/captain/normalised-clean/anchor/anchor-00.png',
}
/** The anchor frame per fighter, reused by the HUD as the portrait source. */
export const ARCADE_ANCHOR_SOURCES = anchors

const boosterRoot = '/art-source/arcade/booster/normalised-sleek-ready'
const boosterInhale = `${boosterRoot}/idle/idle-01.png`
const jab = `${boosterRoot}/jab/jab-00.png`
const anticipation = `${boosterRoot}/anticipation/anticipation-00.png`
const recovery = `${boosterRoot}/recovery/recovery-00.png`
/**
 * Booster's walk: a boxer's step-and-drag, four drawings each way, drawn in place and
 * held to the stance (forward) or block (backward) torso line. Replaced 2026-09-23 the
 * two-drawing lunge/near-stance flip that also played backwards.
 */
const walkCycle = (id: 'booster' | 'oracle', clip: 'walk-forward' | 'walk-back') =>
  [0, 1, 2, 3].map(index => `/art-source/arcade/${id}/normalised-walk-ready/${clip}/${clip}-0${index}.png`)
const boosterWalkForward = walkCycle('booster', 'walk-forward')
const boosterWalkBack = walkCycle('booster', 'walk-back')
/** Oracle's walk, rebuilt the same way on 2026-09-23 (it had the same two-drawing flip). */
const oracleForward = walkCycle('oracle', 'walk-forward')
const oracleBackward = walkCycle('oracle', 'walk-back')
/** Engine frames each walk drawing is held: a 24-frame step cycle. */
const WALK_HOLD = 6
const oracleRoot = '/art-source/arcade/oracle/normalised-exchange-ready'
const guard = `${oracleRoot}/block/block-00.png`
const recoil = `${oracleRoot}/recoil/recoil-00.png`
const oracleHitRecover = '/art-source/arcade/oracle/normalised-heavy-hit-ready/recover/recover-00.png'
const oracleBlockRoot = '/art-source/arcade/oracle/normalised-heavy-block-ready'
const oracleBlockCompress = `${oracleBlockRoot}/compress/compress-00.png`
const oracleBlockSettle = `${oracleBlockRoot}/settle/settle-00.png`
const oracleAttackRoot = '/art-source/arcade/oracle/normalised-counterattack-ready'
const oracleAnticipation = `${oracleAttackRoot}/anticipation/anticipation-00.png`
const oracleJab = `${oracleAttackRoot}/jab/jab-00.png`
const oracleRecovery = `${oracleAttackRoot}/recovery/recovery-00.png`
const boosterGuard = `${boosterRoot}/block/block-00.png`
const boosterRecoil = `${boosterRoot}/recoil/recoil-00.png`
const boosterHitRoot = '/art-source/arcade/booster/normalised-hit-reaction-ready'
const boosterHitStagger = `${boosterHitRoot}/stagger/stagger-00.png`
const boosterHitRecover = `${boosterHitRoot}/recover/recover-00.png`
const boosterBlockRoot = '/art-source/arcade/booster/normalised-heavy-block-ready'
/** Blocked-heavy beats per fighter: brace and guard reuse the approved block drawing. */
const heavyBlockFrames = {
  booster: { guard: boosterGuard, compress: `${boosterBlockRoot}/compress/compress-00.png`, settle: `${boosterBlockRoot}/settle/settle-00.png` },
  oracle: { guard, compress: oracleBlockCompress, settle: oracleBlockSettle },
}
const hitReactionFrames = {
  booster: { impact: boosterRecoil, stagger: boosterHitStagger, recover: boosterHitRecover },
  oracle: { impact: recoil, stagger: recoil, recover: oracleHitRecover },
}
const movementRoot = (id: 'booster' | 'oracle') => `/art-source/arcade/${id}/normalised-movement-ready`
const jumpFrames = (id: 'booster' | 'oracle') => [
  `${movementRoot(id)}/airborne/airborne-00.png`,
  `${movementRoot(id)}/airborne/airborne-01.png`,
  `${movementRoot(id)}/airborne/airborne-02.png`,
] as const
const airborne = {
  booster: jumpFrames('booster'),
  oracle: jumpFrames('oracle'),
}
const heavyFrames = (id: 'booster' | 'oracle') => {
  const folder = id === 'booster' ? 'normalised-heavy-continuity-ready' : 'normalised-heavy-ready'
  const root = `/art-source/arcade/${id}/${folder}`
  return {
    startup: `${root}/heavy-startup/heavy-startup-00.png`,
    active: `${root}/heavy-active/heavy-active-00.png`,
    recovery: `${root}/heavy-recovery/heavy-recovery-00.png`,
  }
}
const heavy = { booster: heavyFrames('booster'), oracle: heavyFrames('oracle') }
const boosterHeavySwing = '/art-source/arcade/booster/normalised-heavy-continuity-ready/heavy-swing/heavy-swing-00.png'
const boosterHeavyRetract = '/art-source/arcade/booster/normalised-heavy-recovery-v1/heavy-retract/heavy-retract-00.png'
const boosterHeavyDrive = '/art-source/arcade/booster/normalised-heavy-drive-ready/heavy-drive/heavy-drive-00.png'
const boosterHeavySettle = '/art-source/arcade/booster/normalised-heavy-drive-ready/heavy-settle/heavy-settle-00.png'
/** Oracle's low sweep in-betweens: the sweep before contact, the settle after the rise. */
const oracleHeavyMotion = Object.fromEntries((['sweep', 'settle'] as const).map(beat =>
  [beat, `/art-source/arcade/oracle/normalised-heavy-motion-ready/heavy-${beat}/heavy-${beat}-00.png`])) as
  Record<'sweep' | 'settle', string>
const spaceLaserRoot = '/art-source/arcade/booster/normalised-space-laser-ready'
const spaceLaser = {
  callItIn: `${spaceLaserRoot}/call-it-in/call-it-in-00.png`,
  watch: `${spaceLaserRoot}/watch/watch-00.png`,
  pocket: `${spaceLaserRoot}/pocket/pocket-00.png`,
}
/** Recovery frames the call-in pose is held past the one-frame hit, so it reads. */
const SPACE_LASER_CALL_HOLD = 10
/** Recovery frame the phone starts going back into the pocket. */
const SPACE_LASER_POCKET_FROM = 20
/** Round-end beats per fighter; the first knockdown beat reuses that fighter's recoil. */
const outcomeFrames = (id: 'booster' | 'oracle', impact: string) => {
  const root = `/art-source/arcade/${id}/normalised-outcomes-ready`
  return {
    victory: [0, 1, 2].map(index => `${root}/win/win-0${index}.png`),
    knockout: [impact, `${root}/ko/ko-01.png`, `${root}/ko/ko-02.png`],
  }
}
const outcomes = { booster: outcomeFrames('booster', boosterRecoil), oracle: outcomeFrames('oracle', recoil) }
export const ARCADE_SPRITE_SOURCES = [
  ...Object.values(anchors), boosterInhale, jab, anticipation, recovery, ...boosterWalkForward, ...boosterWalkBack,
  guard, recoil, oracleHitRecover, oracleBlockCompress, oracleBlockSettle, ...oracleBackward, oracleAnticipation, oracleJab, oracleRecovery,
  boosterGuard, boosterRecoil, boosterHitStagger, boosterHitRecover, ...oracleForward, ...airborne.booster, ...airborne.oracle,
  ...Object.values(heavy.booster), boosterHeavySwing, boosterHeavyDrive, boosterHeavyRetract, boosterHeavySettle, ...Object.values(heavy.oracle),
  ...outcomes.booster.victory, ...outcomes.booster.knockout.slice(1),
  spaceLaser.callItIn, spaceLaser.watch, spaceLaser.pocket,
  heavyBlockFrames.booster.compress, heavyBlockFrames.booster.settle,
  ...outcomes.oracle.victory, ...outcomes.oracle.knockout.slice(1),
  ...Object.values(oracleHeavyMotion),
]

export interface ArcadeGymFrame {
  src: string
  /** The pose's name, shown in the gym beside the frame number. */
  pose: string
  phase: 'startup' | 'active' | 'recovery' | 'neutral'
}

export interface ArcadeGymAnimation {
  fighter: MarsArcadeFighterId
  animation: string
  moveId?: string
  frames: ArcadeGymFrame[]
}

const pose = (src: string, name: string, phase: ArcadeGymFrame['phase'] = 'neutral'): ArcadeGymFrame =>
  ({ src, pose: name, phase })

/**
 * Every animation the harness plays, in playback order, for the character gym.
 *
 * Built from the same constants `selectArcadeSprite` draws, so wiring a new pose into
 * the harness is what puts it in the gym. The sprite test fails if a source in
 * ARCADE_SPRITE_SOURCES appears in no animation here — booster heavy went missing
 * from the gym for exactly that reason when the gym kept its own frame list.
 */
export const ARCADE_GYM_ANIMATIONS: ArcadeGymAnimation[] = [
  { fighter: 'booster', animation: 'idle', frames: [pose(anchors.booster, 'anchor'), pose(boosterInhale, 'inhale')] },
  { fighter: 'booster', animation: 'walk-forward', frames: boosterWalkForward.map((src, index) => pose(src, ['step', 'drag', 'gather', 'load'][index]!)) },
  { fighter: 'booster', animation: 'walk-back', frames: boosterWalkBack.map((src, index) => pose(src, ['step back', 'drag back', 'gather', 'load'][index]!)) },
  {
    fighter: 'booster', animation: 'jab', moveId: 'booster.padJab',
    frames: [pose(anticipation, 'anticipation', 'startup'), pose(jab, 'jab', 'active'), pose(recovery, 'recovery', 'recovery')],
  },
  {
    fighter: 'booster', animation: 'heavy', moveId: 'booster.staticFire',
    frames: [
      pose(heavy.booster.startup, 'startup', 'startup'),
      pose(boosterHeavySwing, 'swing', 'startup'),
      pose(boosterHeavyDrive, 'drive', 'startup'),
      pose(heavy.booster.active, 'contact', 'active'),
      pose(boosterHeavyRetract, 'retract', 'recovery'),
      pose(heavy.booster.recovery, 'follow-through', 'recovery'),
      pose(boosterHeavySettle, 'settle', 'recovery'),
      pose(boosterGuard, 'guard', 'recovery'),
    ],
  },
  { fighter: 'booster', animation: 'block', frames: [pose(boosterGuard, 'guard')] },
  {
    fighter: 'booster', animation: 'heavy-block',
    frames: [pose(heavyBlockFrames.booster.compress, 'compress'), pose(heavyBlockFrames.booster.settle, 'settle'), pose(boosterGuard, 'guard')],
  },
  {
    fighter: 'booster', animation: 'special', moveId: 'booster.spaceLaser',
    frames: [pose(spaceLaser.callItIn, 'call it in', 'active'), pose(spaceLaser.watch, 'watch it land', 'recovery'), pose(spaceLaser.pocket, 'pocket the phone', 'recovery')],
  },
  {
    fighter: 'booster', animation: 'hit',
    frames: [pose(boosterRecoil, 'impact'), pose(boosterHitStagger, 'stagger'), pose(boosterHitRecover, 'recover')],
  },
  { fighter: 'booster', animation: 'jump', frames: airborne.booster.map((src, index) => pose(src, ['rising', 'apex', 'falling'][index]!)) },
  { fighter: 'booster', animation: 'victory', frames: outcomes.booster.victory.map((src, index) => pose(src, `win ${index}`)) },
  { fighter: 'booster', animation: 'knockout', frames: outcomes.booster.knockout.map((src, index) => pose(src, `ko ${index}`)) },
  { fighter: 'oracle', animation: 'idle', frames: [pose(anchors.oracle, 'anchor')] },
  { fighter: 'oracle', animation: 'walk-forward', frames: oracleForward.map((src, index) => pose(src, ['step', 'drag', 'gather', 'load'][index]!)) },
  { fighter: 'oracle', animation: 'walk-back', frames: oracleBackward.map((src, index) => pose(src, ['step back', 'drag back', 'gather', 'load'][index]!)) },
  {
    fighter: 'oracle', animation: 'jab', moveId: 'oracle.prompt',
    frames: [pose(oracleAnticipation, 'anticipation', 'startup'), pose(oracleJab, 'jab', 'active'), pose(oracleRecovery, 'recovery', 'recovery')],
  },
  {
    fighter: 'oracle', animation: 'heavy', moveId: 'oracle.hardCutoff',
    frames: [
      pose(heavy.oracle.startup, 'wind-up', 'startup'),
      pose(oracleHeavyMotion.sweep, 'sweep', 'startup'),
      pose(heavy.oracle.active, 'contact', 'active'),
      pose(heavy.oracle.recovery, 'rise', 'recovery'),
      pose(oracleHeavyMotion.settle, 'settle', 'recovery'),
    ],
  },
  { fighter: 'oracle', animation: 'block', frames: [pose(guard, 'guard')] },
  {
    fighter: 'oracle', animation: 'heavy-block',
    frames: [pose(oracleBlockCompress, 'compress'), pose(oracleBlockSettle, 'settle'), pose(guard, 'guard')],
  },
  { fighter: 'oracle', animation: 'hit', frames: [pose(recoil, 'impact'), pose(oracleHitRecover, 'recover')] },
  { fighter: 'oracle', animation: 'jump', frames: airborne.oracle.map((src, index) => pose(src, ['rising', 'apex', 'falling'][index]!)) },
  { fighter: 'oracle', animation: 'victory', frames: outcomes.oracle.victory.map((src, index) => pose(src, `win ${index}`)) },
  { fighter: 'oracle', animation: 'knockout', frames: outcomes.oracle.knockout.map((src, index) => pose(src, `ko ${index}`)) },
  { fighter: 'captain', animation: 'idle', frames: [pose(anchors.captain, 'anchor')] },
]

export function selectArcadeSprite(state: MarsArcadeState, side: MarsArcadeSide, reducedMotion: boolean, outcomeFrame = 0, heavyReaction: HeavyReaction | null = null) {
  const fighter = state.fighters[side]
  const live = state.phase === 'intro' || state.phase === 'fight'
  if (!live && fighter.id !== 'captain') {
    const index = reducedMotion ? 2 : Math.min(2, Math.floor(Math.max(0, outcomeFrame) / 12))
    const won = state.winner === side
    const knockedOut = state.phase === 'ko' && fighter.health <= 0
    if (won || knockedOut) {
      return {
        src: (won ? outcomes[fighter.id].victory : outcomes[fighter.id].knockout)[index]!, placeholder: false,
        label: `${won ? 'victory' : 'knockout'} ${index}`,
        // A terminal airborne fighter settles visually; frozen rules coordinates stay intact.
        renderY: fighter.y * (1 - index / 2),
      }
    }
    if (state.phase === 'timeOver') {
      return { src: anchors[fighter.id], placeholder: false, label: 'round over — resting', renderY: 0 }
    }
  }
  const move = marsArcadeActiveMove(fighter)
  if (live && fighter.activity === 'airborne' && fighter.id !== 'captain') {
    const index = fighter.velocityY > 0.6 ? 0 : fighter.velocityY < -0.6 ? 2 : 1
    return {
      src: airborne[fighter.id][index], placeholder: false,
      label: `jump ${['rising', 'apex', 'falling'][index]}`,
    }
  }
  if (live && fighter.id !== 'captain' && fighter.activity === 'hitstun') {
    const frames = hitReactionFrames[fighter.id]
    if (heavyReaction?.kind === 'hit' && fighter.stunFrames > 0 && fighter.y === 0) {
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const phase = elapsed >= Math.ceil(heavyReaction.duration * 0.55) ? 'recover' :
        elapsed < 3 ? 'impact' : 'stagger'
      // Ease the existing knockback into view; never move the rules position.
      const remaining = Math.max(0, 1 - elapsed / 8)
      const offset = reducedMotion ? 0 : Math.round(heavyReaction.offsetX * remaining * remaining)
      return {
        src: frames[phase], placeholder: false, label: `heavy hit — ${phase}`,
        renderX: fighter.x + offset,
      }
    }
    return { src: frames.impact, placeholder: false, label: 'hit recoil' }
  }
  if (live && fighter.id !== 'captain') {
    const beats = heavyBlockFrames[fighter.id]
    if (fighter.activity === 'blockstun' && heavyReaction?.kind === 'block' && fighter.stunFrames > 0) {
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const phase = elapsed < Math.ceil(heavyReaction.duration * 0.35) ? 'compress' :
        elapsed < Math.ceil(heavyReaction.duration * 0.75) ? 'settle' : 'guard'
      return { src: beats[phase], placeholder: false, label: `heavy block — ${phase}` }
    }
    const opponent = state.fighters[side === 0 ? 1 : 0]
    const threat = marsArcadeActiveMove(opponent)
    if (fighter.blocking && fighter.stunFrames === 0 && fighter.y === 0 &&
      threat?.move.button === 'heavy' && threat.phase === 'startup' &&
      Math.abs(opponent.x - fighter.x) <= threat.move.reach) {
      return { src: beats.guard, placeholder: false, label: 'heavy block — brace' }
    }
  }
  if (live && fighter.id === 'oracle') {
    if (fighter.activity === 'walk' && fighter.blocking) {
      return {
        src: oracleBackward[Math.floor(state.frame / WALK_HOLD) % oracleBackward.length]!,
        placeholder: false,
        label: 'guarded backward shuffle',
      }
    }
    if (fighter.activity === 'blockstun' || fighter.blocking) {
      return { src: guard, placeholder: false, label: 'raised guard' }
    }
    if (fighter.activity === 'walk') {
      return { src: oracleForward[Math.floor(state.frame / WALK_HOLD) % oracleForward.length]!, placeholder: false, label: 'forward shuffle' }
    }
    if (move?.move.id === 'oracle.prompt') {
      const src = move.phase === 'active' ? oracleJab :
        move.phase === 'startup' ? oracleAnticipation : oracleRecovery
      return { src, placeholder: false, label: `jab ${move.phase}` }
    }
  }
  if (live && fighter.id === 'booster') {
    if (fighter.activity === 'blockstun' || (fighter.blocking && fighter.activity !== 'walk')) {
      return { src: boosterGuard, placeholder: false, label: 'raised guard' }
    }
  }
  if (live && fighter.activity === 'attack' && fighter.id !== 'captain' && move?.move.button === 'heavy') {
    if (fighter.id === 'booster') {
      // Shorten the held wind-up, then drive the bent arm forward into contact.
      if (move.phase === 'startup' && move.frame >= 8) {
        return { src: boosterHeavyDrive, placeholder: false, label: 'heavy startup — drive' }
      }
      if (move.phase === 'startup' && move.frame >= 5) {
        return { src: boosterHeavySwing, placeholder: false, label: 'heavy startup — swing' }
      }
      const recoveryElapsed = move.frame - move.move.startupFrames - move.move.activeFrames
      // Bridge contact into the low follow-through without extending recovery.
      if (move.phase === 'recovery' && recoveryElapsed < 4) {
        return { src: boosterHeavyRetract, placeholder: false, label: 'heavy recovery — retract' }
      }
      if (move.phase === 'recovery' && recoveryElapsed >= 9 && recoveryElapsed < 14) {
        return { src: boosterHeavySettle, placeholder: false, label: 'heavy recovery — settle' }
      }
      if (move.phase === 'recovery' && recoveryElapsed >= 14) {
        return { src: boosterGuard, placeholder: false, label: 'heavy recovery — guard' }
      }
    }
    if (fighter.id === 'oracle') {
      // Swing the sweeping leg in before contact, then settle back toward idle.
      const recoveryElapsed = move.frame - move.move.startupFrames - move.move.activeFrames
      const beat = move.phase === 'startup' && move.frame >= 10 ? 'sweep'
        : move.phase === 'recovery' && recoveryElapsed >= 12 ? 'settle' : null
      if (beat) return { src: oracleHeavyMotion[beat], placeholder: false, label: `heavy ${move.phase} — ${beat}` }
    }
    return { src: heavy[fighter.id][move.phase], placeholder: false, label: `heavy ${move.phase}` }
  }
  if (live && fighter.id === 'booster' && move?.move.id === 'booster.spaceLaser') {
    // The hit is a single frame, so the call-in pose carries on into recovery.
    // All three are essential poses and stay under reduced motion.
    const recoveryElapsed = move.frame - move.move.startupFrames - move.move.activeFrames
    const beat = recoveryElapsed < SPACE_LASER_CALL_HOLD ? 'callItIn'
      : recoveryElapsed < SPACE_LASER_POCKET_FROM ? 'watch' : 'pocket'
    return { src: spaceLaser[beat], placeholder: false, label: `space laser — ${beat}` }
  }
  if (live && fighter.id === 'booster' && move?.move.id === 'booster.padJab') {
    const recoveryElapsed = move.frame - move.move.startupFrames - move.move.activeFrames
    const src = move.phase === 'active' ? jab :
      move.phase === 'startup' ? anticipation : recoveryElapsed < 3 ? recovery : anchors.booster
    return { src, placeholder: false, label: `jab ${move.phase}` }
  }
  if (live && fighter.id === 'booster' && fighter.activity === 'walk') {
    const cycle = fighter.blocking ? boosterWalkBack : boosterWalkForward
    return {
      src: cycle[Math.floor(state.frame / WALK_HOLD) % cycle.length]!,
      placeholder: false,
      label: fighter.blocking ? 'backward shuffle' : 'forward shuffle',
    }
  }
  const resting = fighter.activity === 'idle' && !fighter.blocking &&
    (state.phase === 'intro' || state.phase === 'fight')
  const src = resting && fighter.id === 'booster' && !reducedMotion &&
    Math.floor(state.frame / 18) % 2 === 1 ? boosterInhale : anchors[fighter.id]
  return { src, placeholder: !resting, label: resting ? 'idle pilot' : 'anchor placeholder — pose not authored' }
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
