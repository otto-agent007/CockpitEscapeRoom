import { useEffect, useMemo, useRef, useState } from 'react'
import { deriveHandoffAnimation, deriveIntroAnimation } from '../../game/introAnimation'
import type { IntroRenderAssets } from '../../game/introAssets'
import {
  computeIntroStagePlacement,
  INTRO_STAGE_HEIGHT,
  INTRO_STAGE_WIDTH,
} from '../../game/introGeometry'
import { renderIntroFrame } from '../../game/introRenderer'

type IntroCanvasProps = {
  timeSeconds: number
  assets: IntroRenderAssets
  reducedMotion: boolean
  handoffProgress: number | null
}

export function IntroCanvas({
  timeSeconds,
  assets,
  reducedMotion,
  handoffProgress,
}: IntroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [placement, setPlacement] = useState(() => computeIntroStagePlacement(
    INTRO_STAGE_WIDTH,
    INTRO_STAGE_HEIGHT,
  ))
  const frame = useMemo(
    () => deriveIntroAnimation(timeSeconds, reducedMotion),
    [reducedMotion, timeSeconds],
  )
  const handoff = handoffProgress === null ? null : deriveHandoffAnimation(handoffProgress)

  useEffect(() => {
    const shell = canvasRef.current?.parentElement
    if (!shell) return
    const updatePlacement = ({ width, height }: Pick<DOMRectReadOnly, 'width' | 'height'>) => {
      const next = computeIntroStagePlacement(width, height)
      setPlacement((current) => (
        current.scale === next.scale
        && current.left === next.left
        && current.top === next.top
          ? current
          : next
      ))
    }
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) updatePlacement(entry.contentRect)
    })
    updatePlacement(shell.getBoundingClientRect())
    observer.observe(shell)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const context = canvasRef.current?.getContext('2d')
    if (context) renderIntroFrame(context, frame, assets, handoff)
  }, [assets, frame, handoff])

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
      aria-hidden="true"
      data-scene={frame.sceneId}
      data-time={timeSeconds.toFixed(3)}
      data-popt-frame={frame.popt?.sourceFrame ?? ''}
      data-jet-frame={frame.jet?.sourceFrame ?? ''}
      data-presentation-scale={placement.scale}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-handoff-progress={handoffProgress === null ? '' : handoffProgress.toFixed(3)}
    />
  )
}
