import { describe, expect, it } from 'vitest'
import { MARS_ARCADE_STAGE, createMarsArcadeRound } from './marsArcade'
import { MARS_ARCADE_FIGHTERS } from './marsArcadeFighters'
import {
  MARS_ARCADE_BACKDROP,
  MARS_ARCADE_BANDS,
  MARS_ARCADE_CAMERA,
  MARS_ARCADE_VIEW,
  marsArcadeBackdropTiles,
  marsArcadeCameraLimit,
  marsArcadeCameraTarget,
  marsArcadeLayerShift,
  marsArcadeScreenX,
} from './marsArcadeStage'

/**
 * The stage is wider than the screen, so two things can now be quietly wrong in a
 * way boxes on a fixed camera never could be: a fighter can be pushed somewhere the
 * camera refuses to look, and a parallax layer can run out of tiles and open a gap
 * at the screen edge. Both are cheap to assert and expensive to notice by eye.
 */

/** The colour the stage used before this backdrop existed: a near-black void. */
const RETIRED_VOID = '#14101a'

/** The drawn sprite is 44 px wide; the pushbox it collides with is 24. */
const SPRITE_STANDING_WIDTH = 44

function relativeLuminance(hex: string): number {
  const channel = (value: number): number => {
    const scaled = value / 255
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
  }
  const red = channel(Number.parseInt(hex.slice(1, 3), 16))
  const green = channel(Number.parseInt(hex.slice(3, 5), 16))
  const blue = channel(Number.parseInt(hex.slice(5, 7), 16))
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function roundAt(leftX: number, rightX: number) {
  const state = createMarsArcadeRound('booster', 'oracle')
  return {
    ...state,
    fighters: [
      { ...state.fighters[0], x: leftX },
      { ...state.fighters[1], x: rightX },
    ] as typeof state.fighters,
  }
}

describe('mars arcade camera', () => {
  it('centres between the fighters', () => {
    expect(marsArcadeCameraTarget(roundAt(-40, 80))).toBe(20)
    expect(marsArcadeCameraTarget(roundAt(-100, 20))).toBe(-40)
  })

  it('reports a whole stage pixel, because the stage is drawn at an integer scale', () => {
    const target = marsArcadeCameraTarget(roundAt(-15, 20))
    expect(Number.isInteger(target)).toBe(true)
  })

  it('clamps at both ends of the stage', () => {
    const limit = marsArcadeCameraLimit()
    const wall = MARS_ARCADE_STAGE.halfWidth
    expect(marsArcadeCameraTarget(roundAt(wall - 20, wall))).toBe(limit)
    expect(marsArcadeCameraTarget(roundAt(-wall, -wall + 20))).toBe(-limit)
  })

  it('keeps a cornered fighter fully on screen', () => {
    const wall = MARS_ARCADE_STAGE.halfWidth
    const half = SPRITE_STANDING_WIDTH / 2
    for (const corner of [wall, -wall]) {
      const camera = marsArcadeCameraTarget(roundAt(corner, corner))
      const screenX = marsArcadeScreenX(corner, camera)
      expect(screenX - half).toBeGreaterThanOrEqual(0)
      expect(screenX + half).toBeLessThanOrEqual(MARS_ARCADE_VIEW.width)
    }
  })

  it('never looks further past a wall than the corner margin allows', () => {
    const wall = MARS_ARCADE_STAGE.halfWidth
    const camera = marsArcadeCameraTarget(roundAt(wall, wall))
    const rightEdge = camera + MARS_ARCADE_VIEW.width / 2
    expect(rightEdge - wall).toBe(MARS_ARCADE_CAMERA.cornerMarginPx)
  })

  it('actually has somewhere to scroll — the stage is wider than the screen', () => {
    expect(MARS_ARCADE_STAGE.halfWidth * 2).toBeGreaterThan(MARS_ARCADE_VIEW.width)
    expect(marsArcadeCameraLimit()).toBeGreaterThan(0)
  })
})

describe('mars arcade backdrop', () => {
  it('bands tile the whole view with no gap and no overlap', () => {
    let row = 0
    for (const band of MARS_ARCADE_BANDS) {
      expect(band.y).toBe(row)
      expect(band.height).toBeGreaterThan(0)
      row += band.height
    }
    expect(row).toBe(MARS_ARCADE_VIEW.height)
  })

  it('is not a void — the fighters have something to read against', () => {
    const voidLuminance = relativeLuminance(RETIRED_VOID)
    const weighted = MARS_ARCADE_BANDS.reduce(
      (total, band) => total + relativeLuminance(band.colour) * band.height,
      0,
    )
    const mean = weighted / MARS_ARCADE_VIEW.height
    expect(mean).toBeGreaterThan(voidLuminance * 5)

    // Every band the standing fighter is drawn against, head row downward.
    const headRow = MARS_ARCADE_VIEW.floorRow - 104
    for (const band of MARS_ARCADE_BANDS) {
      if (band.y + band.height <= headRow) continue
      expect(relativeLuminance(band.colour)).toBeGreaterThan(voidLuminance * 3)
    }
  })

  it('orders the layers far to near, all within the parallax range', () => {
    const factors = MARS_ARCADE_BACKDROP.map((layer) => layer.parallax)
    expect(factors).toEqual([...factors].sort((a, b) => a - b))
    for (const layer of MARS_ARCADE_BACKDROP) {
      expect(layer.parallax).toBeGreaterThanOrEqual(0)
      expect(layer.parallax).toBeLessThanOrEqual(1)
      expect(layer.spanWidth).toBeGreaterThan(0)
      expect(layer.width).toBeGreaterThan(0)
      expect(layer.height).toBeGreaterThan(0)
      expect(layer.src).toMatch(/\.png$/)
      // A tile is placed by its BOTTOM row, so a layer whose art is taller than the
      // room above that row would be drawn off the top of the view.
      expect(layer.bottomRow - layer.height).toBeGreaterThanOrEqual(0)
      expect(layer.bottomRow).toBeLessThanOrEqual(MARS_ARCADE_VIEW.height)
    }
  })

  it('keeps every layer clear of the band the HUD owns', () => {
    // The HUD owns rows 2..27. The retired star layer honoured this by starting at
    // row 28; the generated layers have to honour it too, or a cloud bank is drawn
    // behind a health bar and reads as a rendering fault rather than as sky.
    for (const layer of MARS_ARCADE_BACKDROP) {
      expect(layer.bottomRow - layer.height).toBeGreaterThanOrEqual(28)
    }
  })

  it('has a distinct tile for every layer', () => {
    const sources = MARS_ARCADE_BACKDROP.map((layer) => layer.src)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('scrolls the backdrop against the camera, faster the nearer the layer', () => {
    const shifts = MARS_ARCADE_BACKDROP.map((layer) => marsArcadeLayerShift(layer, 60))
    for (const shift of shifts) expect(shift).toBeLessThanOrEqual(0)
    for (let index = 1; index < shifts.length; index += 1) {
      expect(Math.abs(shifts[index] ?? 0)).toBeGreaterThan(Math.abs(shifts[index - 1] ?? 0))
    }
  })

  it('locks the deck to stage space, so walking reads as movement', () => {
    const deck = MARS_ARCADE_BACKDROP.find((layer) => layer.id === 'deck')
    expect(deck?.parallax).toBe(1)
    if (!deck) return
    // A deck feature and a fighter standing on it must move together: both are
    // stage-space, so the layer shift is exactly the fighter's screen displacement.
    for (const camera of [-80, 0, 37, 104]) {
      const featureX = marsArcadeLayerShift(deck, camera) + MARS_ARCADE_VIEW.width / 2
      expect(featureX).toBe(marsArcadeScreenX(0, camera))
    }
  })

  it('draws every tile that reaches the view, at every camera position', () => {
    // Every layer is now a single tile whose art exactly fills its span, so the
    // overhang case the old shape layers had cannot arise. The coverage check is
    // kept because it is what proves no gap opens at a screen edge at ANY camera
    // position, which is the property that actually matters and the one a wrong
    // tiling margin would break.
    const limit = marsArcadeCameraLimit()
    for (const layer of MARS_ARCADE_BACKDROP) {
      const leftMost = 0
      const rightMost = layer.width
      for (let camera = -limit; camera <= limit; camera += 1) {
        const tiles = marsArcadeBackdropTiles(layer, camera)
        const shift = marsArcadeLayerShift(layer, camera)
        const firstNeeded = Math.ceil((-rightMost - shift) / layer.spanWidth)
        const lastNeeded = Math.floor(
          (MARS_ARCADE_VIEW.width - leftMost - shift) / layer.spanWidth,
        )
        expect(lastNeeded).toBeGreaterThanOrEqual(firstNeeded)
        for (let index = firstNeeded; index <= lastNeeded; index += 1) {
          expect(tiles).toContain(Math.round(shift + index * layer.spanWidth))
        }
        for (let index = 1; index < tiles.length; index += 1) {
          expect((tiles[index] ?? 0) - (tiles[index - 1] ?? 0)).toBe(layer.spanWidth)
        }
      }
    }
  })
})

describe('moves that are written against the whole stage', () => {
  it('the flyby still covers the whole stage after it was widened', () => {
    expect(MARS_ARCADE_FIGHTERS.captain.moves.special.reach).toBe(MARS_ARCADE_STAGE.halfWidth * 2)
  })
})
