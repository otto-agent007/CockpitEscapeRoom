import { useEffect, useRef, useState } from 'react'
import {
  computeIntroStagePlacement,
  INTRO_STAGE_HEIGHT,
  INTRO_STAGE_WIDTH,
} from '../../game/introGeometry'
import {
  deriveIntroFrame,
  renderIntroFrame,
  type IntroRenderAssets,
} from '../../game/introRenderer'

type IntroCanvasProps = {
  timeSeconds: number
  assets: IntroRenderAssets
  reducedMotion: boolean
}

export function IntroCanvas({ timeSeconds, assets, reducedMotion }: IntroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [placement, setPlacement] = useState(() => computeIntroStagePlacement(
    INTRO_STAGE_WIDTH,
    INTRO_STAGE_HEIGHT,
  ))
  const frame = deriveIntroFrame(timeSeconds)

  useEffect(() => {
    const stageShell = canvasRef.current?.parentElement
    if (!stageShell) return

    const updatePlacement = ({ width, height }: Pick<DOMRectReadOnly, 'width' | 'height'>) => {
      const nextPlacement = computeIntroStagePlacement(width, height)
      setPlacement((currentPlacement) => (
        currentPlacement.scale === nextPlacement.scale
        && currentPlacement.left === nextPlacement.left
        && currentPlacement.top === nextPlacement.top
          ? currentPlacement
          : nextPlacement
      ))
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) updatePlacement(entry.contentRect)
    })
    updatePlacement(stageShell.getBoundingClientRect())
    observer.observe(stageShell)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context) renderIntroFrame(context, deriveIntroFrame(timeSeconds), assets)
  }, [assets, timeSeconds])

  return (
    <canvas
      ref={canvasRef}
      className="game-intro__stage"
      width={INTRO_STAGE_WIDTH}
      height={INTRO_STAGE_HEIGHT}
      style={{
        left: placement.left,
        top: placement.top,
        transform: `scale(${placement.scale})`,
      }}
      data-scene={frame.scene.id}
      data-presentation-scale={placement.scale}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    />
  )
}
