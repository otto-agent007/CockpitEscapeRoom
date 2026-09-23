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
import type { LaserBeamWidth } from './arcadeHarnessLaser'

const ROOT = '/art-source/arcade/generated/fx-space-laser-v1/normalised'

export const LASER_EFFECT_LAYOUT = {
  /** Satellite sprite, 80 x 10, drawn with its top on this screen row. */
  satellite: { width: 80, height: 10, topRow: 30 },
  /** Column of the satellite's lens, measured from the normalised art. */
  lensColumn: 65.5,
  /** The beam runs from under the lens to the floor line. */
  beam: { topRow: 40, height: 148 },
  /** Impact frames share one ground line on their bottom row. */
  impact: { width: 64, height: 28 },
} as const

type EffectId = 'satellite' | `beam-${Exclude<LaserBeamWidth, 0>}` | `impact-${0 | 1 | 2 | 3}`

const { satellite, beam, impact } = LASER_EFFECT_LAYOUT
export const LASER_EFFECT_ART: Record<EffectId, { src: string; width: number; height: number }> = {
  satellite: { src: `${ROOT}/satellite-00.png`, width: satellite.width, height: satellite.height },
  'beam-14': { src: `${ROOT}/beam-w14.png`, width: 14, height: beam.height },
  'beam-10': { src: `${ROOT}/beam-w10.png`, width: 10, height: beam.height },
  'beam-6': { src: `${ROOT}/beam-w6.png`, width: 6, height: beam.height },
  'impact-0': { src: `${ROOT}/impact-00.png`, width: impact.width, height: impact.height },
  'impact-1': { src: `${ROOT}/impact-01.png`, width: impact.width, height: impact.height },
  'impact-2': { src: `${ROOT}/impact-02.png`, width: impact.width, height: impact.height },
  'impact-3': { src: `${ROOT}/impact-03.png`, width: impact.width, height: impact.height },
}

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
    image.src = art.src
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
