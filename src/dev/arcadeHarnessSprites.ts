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
const walking = [`${boosterRoot}/walk/walk-00.png`, `${boosterRoot}/walk/walk-01.png`] as const
const oracleRoot = '/art-source/arcade/oracle/normalised-exchange-ready'
const guard = `${oracleRoot}/block/block-00.png`
const recoil = `${oracleRoot}/recoil/recoil-00.png`
const oracleHitRecover = '/art-source/arcade/oracle/normalised-heavy-hit-ready/recover/recover-00.png'
const oracleBlockRoot = '/art-source/arcade/oracle/normalised-heavy-block-ready'
const oracleBlockCompress = `${oracleBlockRoot}/compress/compress-00.png`
const oracleBlockSettle = `${oracleBlockRoot}/settle/settle-00.png`
const oracleFootworkRoot = '/art-source/arcade/oracle/normalised-footwork-ready/walk-back'
const oracleBackward = [`${oracleFootworkRoot}/walk-back-00.png`, `${oracleFootworkRoot}/walk-back-01.png`] as const
const oracleAttackRoot = '/art-source/arcade/oracle/normalised-counterattack-ready'
const oracleAnticipation = `${oracleAttackRoot}/anticipation/anticipation-00.png`
const oracleJab = `${oracleAttackRoot}/jab/jab-00.png`
const oracleRecovery = `${oracleAttackRoot}/recovery/recovery-00.png`
const boosterGuard = `${boosterRoot}/block/block-00.png`
const boosterRecoil = `${boosterRoot}/recoil/recoil-00.png`
const boosterHitRoot = '/art-source/arcade/booster/normalised-hit-reaction-ready'
const boosterHitStagger = `${boosterHitRoot}/stagger/stagger-00.png`
const boosterHitRecover = `${boosterHitRoot}/recover/recover-00.png`
const hitReactionFrames = {
  booster: { impact: boosterRecoil, stagger: boosterHitStagger, recover: boosterHitRecover },
  oracle: { impact: recoil, stagger: recoil, recover: oracleHitRecover },
}
const movementRoot = (id: 'booster' | 'oracle') => `/art-source/arcade/${id}/normalised-movement-ready`
const oracleForward = [
  `${movementRoot('oracle')}/walk-forward/walk-forward-00.png`,
  `${movementRoot('oracle')}/walk-forward/walk-forward-01.png`,
] as const
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
const outcomeRoot = '/art-source/arcade/booster/normalised-outcomes-ready'
const victory = [0, 1, 2].map(index => `${outcomeRoot}/win/win-0${index}.png`)
const knockout = [boosterRecoil, `${outcomeRoot}/ko/ko-01.png`, `${outcomeRoot}/ko/ko-02.png`]
export const ARCADE_SPRITE_SOURCES = [
  ...Object.values(anchors), boosterInhale, jab, anticipation, recovery, ...walking,
  guard, recoil, oracleHitRecover, oracleBlockCompress, oracleBlockSettle, ...oracleBackward, oracleAnticipation, oracleJab, oracleRecovery,
  boosterGuard, boosterRecoil, boosterHitStagger, boosterHitRecover, ...oracleForward, ...airborne.booster, ...airborne.oracle,
  ...Object.values(heavy.booster), boosterHeavySwing, boosterHeavyDrive, boosterHeavyRetract, boosterHeavySettle, ...Object.values(heavy.oracle),
  ...victory, ...knockout.slice(1),
]

export function selectArcadeSprite(state: MarsArcadeState, side: MarsArcadeSide, reducedMotion: boolean, outcomeFrame = 0, heavyReaction: HeavyReaction | null = null) {
  const fighter = state.fighters[side]
  const live = state.phase === 'intro' || state.phase === 'fight'
  if (!live && fighter.id === 'booster') {
    const index = reducedMotion ? 2 : Math.min(2, Math.floor(Math.max(0, outcomeFrame) / 12))
    const won = state.winner === side
    const knockedOut = state.phase === 'ko' && fighter.health <= 0
    if (won || knockedOut) {
      return {
        src: (won ? victory : knockout)[index]!, placeholder: false,
        label: `${won ? 'victory' : 'knockout'} ${index}`,
        // A terminal airborne fighter settles visually; frozen rules coordinates stay intact.
        renderY: fighter.y * (1 - index / 2),
      }
    }
    if (state.phase === 'timeOver') {
      return { src: anchors.booster, placeholder: false, label: 'round over — resting', renderY: 0 }
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
  if (live && fighter.id === 'oracle') {
    if (fighter.activity === 'blockstun' && heavyReaction?.kind === 'block' && fighter.stunFrames > 0) {
      const elapsed = Math.max(0, heavyReaction.duration - fighter.stunFrames)
      const phase = elapsed < Math.ceil(heavyReaction.duration * 0.35) ? 'compress' :
        elapsed < Math.ceil(heavyReaction.duration * 0.75) ? 'settle' : 'guard'
      return {
        src: phase === 'compress' ? oracleBlockCompress : phase === 'settle' ? oracleBlockSettle : guard,
        placeholder: false, label: `heavy block — ${phase}`,
      }
    }
    const opponent = state.fighters[side === 0 ? 1 : 0]
    const threat = marsArcadeActiveMove(opponent)
    if (fighter.blocking && fighter.stunFrames === 0 && fighter.y === 0 &&
      threat?.move.button === 'heavy' && threat.phase === 'startup' &&
      Math.abs(opponent.x - fighter.x) <= threat.move.reach) {
      return { src: guard, placeholder: false, label: 'heavy block — brace' }
    }
    if (fighter.activity === 'walk' && fighter.blocking) {
      return {
        src: oracleBackward[Math.floor(state.frame / 6) % 2] ?? oracleBackward[0],
        placeholder: false,
        label: 'guarded backward shuffle',
      }
    }
    if (fighter.activity === 'blockstun' || fighter.blocking) {
      return { src: guard, placeholder: false, label: 'raised guard' }
    }
    if (fighter.activity === 'walk') {
      return { src: oracleForward[Math.floor(state.frame / 6) % 2] ?? oracleForward[0], placeholder: false, label: 'forward shuffle' }
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
    return { src: heavy[fighter.id][move.phase], placeholder: false, label: `heavy ${move.phase}` }
  }
  if (live && fighter.id === 'booster' && move?.move.id === 'booster.padJab') {
    const recoveryElapsed = move.frame - move.move.startupFrames - move.move.activeFrames
    const src = move.phase === 'active' ? jab :
      move.phase === 'startup' ? anticipation : recoveryElapsed < 3 ? recovery : anchors.booster
    return { src, placeholder: false, label: `jab ${move.phase}` }
  }
  if (live && fighter.id === 'booster' && fighter.activity === 'walk') {
    return {
      src: walking[Math.floor(state.frame / 6) % 2] ?? walking[0],
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
