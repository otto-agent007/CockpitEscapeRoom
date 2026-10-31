/**
 * Shared development/player loader for the generated backdrop images.
 *
 * Kept out of `arcadeHarnessSprites.ts` deliberately: that module is the character
 * frame pilot, and the two have nothing in common
 * beyond both calling `new Image()`.
 *
 * **Every tile is size-checked against the layer that declares it.** A backdrop layer
 * is positioned by its BOTTOM row, so a tile regenerated one row taller silently
 * shifts the whole layer up and nothing else would notice — the art still draws, it
 * is just in the wrong place. Checking `naturalWidth`/`naturalHeight` against
 * `MARS_ARCADE_BACKDROP` turns that into a visible status line instead.
 */
import { MARS_ARCADE_BACKDROP } from '../game/marsArcadeStage'
import { MOONBASE_PANORAMA } from '../game/marsArcadeArt'
import type { ArcadeBackgroundId } from '../game/arcadeBackground'

export interface ArcadeBackdropImages {
  readonly background: ArcadeBackgroundId
  select(background: ArcadeBackgroundId): void
  failed(): boolean
  retry(): void
  get(id: string): HTMLImageElement | undefined
  ready(): boolean
  status(): string
}

export function loadArcadeBackdrop(initial: ArcadeBackgroundId = 'mars'): ArcadeBackdropImages {
  const images = new Map<string, HTMLImageElement>()
  const failures = new Map<string, string>()
  const requested = new Set<string>()
  let background = initial
  const layers = (id: ArcadeBackgroundId) => id === 'mars'
    ? MARS_ARCADE_BACKDROP.map(layer => ({ id: layer.id, src: layer.src, width: layer.width, height: layer.height }))
    : [{ id: 'panorama', src: MOONBASE_PANORAMA.src, width: MOONBASE_PANORAMA.sourceWidth, height: MOONBASE_PANORAMA.sourceHeight }]
  const key = (id: string) => `${background}:${id}`
  const ensure = (selected: ArcadeBackgroundId) => {
    for (const layer of layers(selected)) {
      const owned = `${selected}:${layer.id}`
      if (requested.has(owned)) continue
      requested.add(owned)
      const image = new Image()
      image.onload = () => {
        if (image.naturalWidth === layer.width && image.naturalHeight === layer.height) {
          images.set(owned, image)
        } else failures.set(owned, `${image.naturalWidth}x${image.naturalHeight}, expected ${layer.width}x${layer.height}`)
      }
      image.onerror = () => failures.set(owned, 'not found')
      image.src = `${import.meta.env.BASE_URL}${layer.src.slice(1)}`
    }
  }
  ensure(background)
  return {
    get background() { return background },
    select: selected => { background = selected; ensure(selected) },
    get: id => images.get(key(id)),
    ready: () => layers(background).every(layer => images.has(key(layer.id))),
    failed: () => layers(background).some(layer => failures.has(key(layer.id))),
    retry: () => {
      for (const layer of layers(background)) {
        const owned = key(layer.id)
        if (!failures.has(owned)) continue
        failures.delete(owned)
        requested.delete(owned)
      }
      ensure(background)
    },
    status: () => {
      const selected = layers(background), count = selected.filter(layer => images.has(key(layer.id))).length
      const label = background === 'mars' ? 'backdrop layers' : 'Moonbase panorama'
      const detail = selected.flatMap(layer => failures.has(key(layer.id)) ? [`${layer.id}: ${failures.get(key(layer.id))}`] : []).join(', ')
      return detail ? `${count}/${selected.length} ${label} — ${detail}`
        : `${count}/${selected.length} ${label} ${count === selected.length ? 'ready' : 'loading'}`
    },
  }
}
