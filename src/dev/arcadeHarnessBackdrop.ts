/**
 * Dev-only loader for the generated backdrop tiles.
 *
 * Kept out of `arcadeHarnessSprites.ts` deliberately: that module is the character
 * frame pilot and is being edited in parallel, and the two have nothing in common
 * beyond both calling `new Image()`.
 *
 * **Every tile is size-checked against the layer that declares it.** A backdrop layer
 * is positioned by its BOTTOM row, so a tile regenerated one row taller silently
 * shifts the whole layer up and nothing else would notice — the art still draws, it
 * is just in the wrong place. Checking `naturalWidth`/`naturalHeight` against
 * `MARS_ARCADE_BACKDROP` turns that into a visible status line instead.
 */
import { MARS_ARCADE_BACKDROP } from '../game/marsArcadeStage'

export interface ArcadeBackdropImages {
  get(id: string): HTMLImageElement | undefined
  ready(): boolean
  status(): string
}

export function loadArcadeBackdrop(): ArcadeBackdropImages {
  const images = new Map<string, HTMLImageElement>()
  const failures = new Map<string, string>()

  for (const layer of MARS_ARCADE_BACKDROP) {
    const image = new Image()
    image.onload = () => {
      if (image.naturalWidth === layer.width && image.naturalHeight === layer.height) {
        images.set(layer.id, image)
      } else {
        failures.set(
          layer.id,
          `${image.naturalWidth}x${image.naturalHeight}, expected ${layer.width}x${layer.height}`,
        )
      }
    }
    image.onerror = () => failures.set(layer.id, 'not found')
    image.src = layer.src
  }

  return {
    get: (id) => images.get(id),
    ready: () => images.size === MARS_ARCADE_BACKDROP.length,
    status: () => {
      const total = MARS_ARCADE_BACKDROP.length
      if (failures.size > 0) {
        const detail = [...failures].map(([id, why]) => `${id}: ${why}`).join(', ')
        return `${images.size}/${total} backdrop layers — ${detail}`
      }
      return images.size === total
        ? `${total}/${total} backdrop layers ready`
        : `${images.size}/${total} backdrop layers loading`
    },
  }
}
