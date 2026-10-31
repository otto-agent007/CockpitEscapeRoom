/** Dev-only cap art; flight, attachment and expiry are owned by the fixed-step rules. */
import { marsArcadeHeadBox, type MarsArcadeState } from '../game/marsArcade'
import { marsArcadeFighter } from '../game/marsArcadeFighters'

import { CAP_EFFECT_ART } from '../game/marsArcadeArt'
export { CAP_EFFECT_ART } from '../game/marsArcadeArt'
type CapEffectId = keyof typeof CAP_EFFECT_ART
export interface CapEffectImages { get(id: CapEffectId): HTMLImageElement | undefined; status(): string }

export function loadCapEffects(): CapEffectImages {
  const images = new Map<CapEffectId, HTMLImageElement>()
  const failures = new Set<CapEffectId>()
  for (const id of ['cap', 'box'] as const) {
    const art = CAP_EFFECT_ART[id], image = new Image()
    image.onload = () => {
      if (image.naturalWidth === art.width && image.naturalHeight === art.height) images.set(id, image)
      else failures.add(id)
    }
    image.onerror = () => failures.add(id)
    image.src = `${import.meta.env.BASE_URL}${art.src.slice(1)}`
  }
  return { get: id => images.get(id), status: () => `${images.size}/2 cap effects ${failures.size ? 'failed — drawn fallback' : images.size === 2 ? 'ready' : 'loading'}` }
}

/** Kept behind the body so the reaching hand remains visible over the open box. */
export function drawCapBoxes(ctx: CanvasRenderingContext2D, state: MarsArcadeState, images: CapEffectImages, x: (n: number) => number, y: (n: number) => number, scale: number): void {
  if (state.phase !== 'fight') return
  for (const fighter of state.fighters) {
    if (fighter.id !== 'trump' || fighter.activity !== 'attack' || fighter.activeButton !== 'special') continue
    const move = marsArcadeFighter(fighter.id).moves.special
    if (fighter.moveFrame >= move.startupFrames + move.activeFrames) continue
    ctx.save(); ctx.imageSmoothingEnabled = false
    ctx.translate(x(fighter.x + fighter.facing * 38), y(0)); ctx.scale(fighter.facing * scale, scale)
    const box = images.get('box')
    if (box) ctx.drawImage(box, -18, -25, 36, 25)
    else { ctx.fillStyle = '#a97342'; ctx.fillRect(-18, -20, 36, 20); ctx.fillStyle = '#eb222a'; ctx.fillRect(-11, -25, 22, 8) }
    ctx.restore()
  }
}

function drawCap(ctx: CanvasRenderingContext2D, images: CapEffectImages, top: number): void {
  const cap = images.get('cap')
  if (cap) ctx.drawImage(cap, -15, top, 30, 18)
  else { ctx.fillStyle = '#e51c23'; ctx.fillRect(-11, top + 2, 20, 11); ctx.fillRect(-13, top + 11, 28, 4) }
}

export function drawCaps(ctx: CanvasRenderingContext2D, state: MarsArcadeState, images: CapEffectImages, x: (n: number) => number, y: (n: number) => number, scale: number, reducedMotion: boolean): void {
  if (state.phase !== 'fight') return
  for (const projectile of state.projectiles) {
    const flight = projectile.capFlight
    if (!flight) continue
    ctx.save(); ctx.imageSmoothingEnabled = false
    ctx.translate(x(projectile.x), y(projectile.y)); ctx.scale(flight.facing * scale, scale)
    if (!reducedMotion) ctx.rotate(flight.age * 0.18)
    drawCap(ctx, images, -9); ctx.restore()
  }
  for (const side of [0, 1] as const) {
    const fighter = state.fighters[side]
    if (!fighter.capFreeze) continue
    const head = marsArcadeHeadBox(state, side)
    ctx.save(); ctx.imageSmoothingEnabled = false
    ctx.translate(x((head.minX + head.maxX) / 2), y(head.maxY)); ctx.scale(fighter.facing * scale, scale)
    drawCap(ctx, images, -10); ctx.restore()
  }
}

export function capAccessibleStatus(state: MarsArcadeState): string {
  return state.phase === 'fight' ? state.fighters.flatMap((fighter, side) => fighter.capFreeze
    ? [`P${side + 1}: cap freeze · ${fighter.capFreeze.hits} hat hit${fighter.capFreeze.hits === 1 ? '' : 's'}`]
    : []).join(' · ') : ''
}
