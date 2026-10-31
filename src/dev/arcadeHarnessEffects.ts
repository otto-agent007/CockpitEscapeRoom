/**
 * Dev-only loader and layout for the space laser's effect art.
 *
 * Kept apart from `arcadeHarnessSprites.ts` for the same reason the backdrop is:
 * that module is the character frame table, and its "N/N sprites ready" line is
 * asserted by every browser check. Effects report their own status.
 *
 * Every image is size-checked. These are placed by fixed rows (the satellite
 * under the HUD, the beam from its lens to the floor), so an image regenerated
 * one pixel off would draw in the wrong place without any other sign.
 */
import { LASER_EFFECT_ART } from '../game/marsArcadeArt'
export { LASER_EFFECT_ART, LASER_EFFECT_LAYOUT } from '../game/marsArcadeArt'
type EffectId = keyof typeof LASER_EFFECT_ART

export interface ArcadeEffectImages {
  get(id: EffectId): HTMLImageElement | undefined
  status(): string
}

export function loadArcadeEffects(): ArcadeEffectImages {
  const images = new Map<string, HTMLImageElement>()
  const failures = new Map<string, string>()
  const entries = Object.entries(LASER_EFFECT_ART)

  for (const [id, art] of entries) {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth === art.width && image.naturalHeight === art.height) {
        images.set(id, image)
      } else {
        failures.set(id, `${image.naturalWidth}x${image.naturalHeight}, expected ${art.width}x${art.height}`)
      }
    }
    image.onerror = () => failures.set(id, 'not found')
    image.src = `${import.meta.env.BASE_URL}${art.src.slice(1)}`
  }

  return {
    get: (id) => images.get(id),
    status: () => {
      const total = entries.length
      if (failures.size > 0) {
        const detail = [...failures].map(([id, why]) => `${id}: ${why}`).join(', ')
        return `${images.size}/${total} laser effects — ${detail}; drawn fallback`
      }
      return images.size === total ? `${total}/${total} laser effects ready` : `${images.size}/${total} laser effects loading`
    },
  }
}
