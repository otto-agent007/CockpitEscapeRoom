export const INTRO_STAGE_WIDTH = 320
export const INTRO_STAGE_HEIGHT = 224

/**
 * The 320 x 224 raster is still authored and rasterized on an integer pixel grid: the
 * backing store is always a whole-number multiple of the logical stage, and every
 * sprite, prop, and logo pixel is drawn with nearest-neighbour sampling inside it.
 * Only the final compositing step fits that buffer to the shell, which lets narrow
 * windows show the same composition full-bleed instead of stranding a one-times
 * postage stamp in a field of black.
 */
export const INTRO_MIN_RENDER_SCALE = 1
export const INTRO_MAX_RENDER_SCALE = 5

export type IntroStagePlacement = {
  /** Fractional contain-fit factor from logical stage pixels to CSS pixels. */
  scale: number
  /** Integer multiplier for the canvas backing store. */
  renderScale: number
  left: number
  top: number
  width: number
  height: number
}

function wholeAvailablePixels(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0
}

export function computeIntroStagePlacement(
  shellWidth: number,
  shellHeight: number,
): IntroStagePlacement {
  const availableWidth = wholeAvailablePixels(shellWidth)
  const availableHeight = wholeAvailablePixels(shellHeight)
  const fit = Math.min(
    availableWidth / INTRO_STAGE_WIDTH,
    availableHeight / INTRO_STAGE_HEIGHT,
  )
  const scale = Number.isFinite(fit) && fit > 0 ? fit : 1
  const width = Math.round(INTRO_STAGE_WIDTH * scale)
  const height = Math.round(INTRO_STAGE_HEIGHT * scale)
  // Rasterize at the whole multiple nearest the display size. Compositing then lands
  // within a few percent of 1:1, so the stage can stay on the cheap nearest-neighbour
  // scaling path: smooth CSS scaling of a live canvas cost two thirds of the frame
  // budget at 2560 x 1440, and at these ratios it buys nothing visible.
  const renderScale = Math.min(
    INTRO_MAX_RENDER_SCALE,
    Math.max(INTRO_MIN_RENDER_SCALE, Math.round(scale)),
  )
  return {
    scale,
    renderScale,
    left: Math.round((availableWidth - width) / 2),
    top: Math.round((availableHeight - height) / 2),
    width,
    height,
  }
}
