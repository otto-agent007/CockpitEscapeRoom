export const INTRO_STAGE_WIDTH = 320
export const INTRO_STAGE_HEIGHT = 224

export type IntroStagePlacement = {
  scale: number
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
  const scale = Math.max(1, Math.floor(Math.min(
    availableWidth / INTRO_STAGE_WIDTH,
    availableHeight / INTRO_STAGE_HEIGHT,
  )))
  const width = INTRO_STAGE_WIDTH * scale
  const height = INTRO_STAGE_HEIGHT * scale
  return {
    scale,
    left: Math.floor((availableWidth - width) / 2),
    top: Math.floor((availableHeight - height) / 2),
    width,
    height,
  }
}
