import {
  getIntroSceneAtNormalizedTime,
  normalizeIntroTime,
  type IntroScene,
} from './introConfig'

export type IntroActor = {
  id: 'popt' | 'key' | 'duffel'
  x: number
  y: number
  color: string
  label: string
}

export type IntroFrame = { scene: IntroScene; actors: IntroActor[]; progress: number }

export type IntroRenderAssets = ReadonlyMap<string, CanvasImageSource>

export function deriveIntroFrame(timeSeconds: number): IntroFrame {
  const normalizedTimeSeconds = normalizeIntroTime(timeSeconds)
  const scene = getIntroSceneAtNormalizedTime(normalizedTimeSeconds)
  const progress = Math.max(0, Math.min(
    1,
    (normalizedTimeSeconds - scene.startSeconds) / (scene.endSeconds - scene.startSeconds),
  ))
  const travel = Math.round(progress * 96)

  return {
    scene,
    progress,
    actors: scene.id === 'tmb2-ident'
      ? []
      : [
          { id: 'popt', x: 48 + travel, y: 166, color: '#f1eff0', label: 'POP T' },
          { id: 'key', x: 160 + travel, y: 112, color: '#f5c424', label: 'KEY' },
          ...(scene.id === 'duffel' ? [{ id: 'duffel' as const, x: 190, y: 154, color: '#1a203f', label: 'DUFFEL' }] : []),
        ],
  }
}

export function renderIntroFrame(
  context: CanvasRenderingContext2D,
  frame: IntroFrame,
  _assets: IntroRenderAssets,
): void {
  void _assets
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, 320, 224)
  context.fillStyle = '#02030a'
  context.fillRect(0, 0, 320, 224)
  context.fillStyle = '#3d7cff'
  context.font = 'bold 12px monospace'
  context.textAlign = 'center'
  context.fillText(frame.scene.label.toUpperCase(), 160, 28)

  if (frame.scene.id === 'tmb2-ident') {
    context.fillStyle = '#f5c424'
    context.font = 'bold 48px monospace'
    context.fillText('TMB2', 160, 126)
  }

  for (const actor of frame.actors) {
    context.fillStyle = actor.color
    context.fillRect(actor.x - 12, actor.y - 24, 24, 24)
    context.font = 'bold 8px monospace'
    context.fillText(actor.label, actor.x, actor.y + 12)
  }
}
