import {marsArcadeActiveMove, type MarsArcadeSide, type MarsArcadeState} from '../game/marsArcade'
import {MARS_ARCADE_VIEW} from '../game/marsArcadeStage'

export interface CaptainFlybyLook {
  frame: 0 | 1 | 2 | 3
  centerX: number
  topRow: 28
  mirrored: boolean
}

export interface CaptainFlybyImages {
  get(frame: 0 | 1 | 2 | 3): HTMLImageElement | undefined
  status(): string
}

export function loadCaptainFlybyEffects(): CaptainFlybyImages {
  const images = new Map<number, HTMLImageElement>()
  const failures = new Map<number, string>()
  for (const frame of [0, 1, 2, 3] as const) {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth === 320 && image.naturalHeight === 96) images.set(frame, image)
      else failures.set(frame, 'wrong size')
    }
    image.onerror = () => failures.set(frame, 'not found')
    image.src = `/art-source/arcade/generated/fx-flyby-v2/normalised/flyby-0${frame}.png`
  }
  return {
    get: frame => images.get(frame),
    status: () => `${images.size}/4 flyby effects ${failures.size ? [...failures].map(([frame, why]) => `${frame}: ${why}`).join(', ') + '; available-frame fallback' : images.size === 4 ? 'ready' : 'loading'}`,
  }
}

/** Separate screen-space aircraft; combat positions and attack geometry stay in the engine. */
export function drawCaptainFlybys(ctx: CanvasRenderingContext2D, state: MarsArcadeState, images: CaptainFlybyImages, reducedMotion: boolean, scale: number): void {
  for (const side of [0, 1] as const) {
    const look = captainFlybyLook(state, side, reducedMotion)
    if (!look) continue
    const image = images.get(look.frame) ?? images.get(0) ?? images.get(1) ?? images.get(2) ?? images.get(3)
    if (!image) continue
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(Math.round(look.centerX) * scale, look.topRow * scale)
    ctx.scale(look.mirrored ? -scale : scale, scale)
    ctx.drawImage(image, -MARS_ARCADE_VIEW.width / 2, 0)
    ctx.restore()
  }
}

/** Owner requested an approximately one-second pass; combat retains its active window. */
export function captainFlybyLook(state: MarsArcadeState, side: MarsArcadeSide, reducedMotion: boolean): CaptainFlybyLook | null {
  if (state.phase !== 'fight') return null
  const fighter = state.fighters[side]
  if (fighter.id !== 'captain' || fighter.activeButton !== 'special') return null
  const move = marsArcadeActiveMove(fighter)
  if (!move) return null
  const duration = move.move.startupFrames + move.move.activeFrames + move.move.recoveryFrames
  const elapsed = move.frame
  if (elapsed < 0 || elapsed >= duration) return null
  const progress = elapsed / Math.max(1, duration - 1)
  const width = MARS_ARCADE_VIEW.width
  return {
    frame: reducedMotion ? 1 : Math.min(3, Math.floor(elapsed * 4 / duration)) as 0 | 1 | 2 | 3,
    centerX: reducedMotion ? width / 2 : fighter.facing === 1 ? width * (0.1 + 0.8 * progress) : width * (0.9 - 0.8 * progress),
    topRow: 28,
    mirrored: fighter.facing === -1,
  }
}
