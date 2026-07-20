import {
  getIntroSceneAtNormalizedTime,
  normalizeIntroTime,
  type IntroScene,
} from './introConfig'
import {
  getIntroSpriteFrame,
  introSpriteClips,
  type IntroSpriteClipId,
} from './introSpriteClips'

export type IntroActorId = 'popt' | 'key' | 'duffel' | 'baseball' | 'bull'

export type IntroActor = {
  id: IntroActorId
  x: number
  y: number
  clip?: IntroSpriteClipId
  frame?: number
}

export type IntroFrame = {
  scene: IntroScene
  actors: IntroActor[]
  progress: number
  elapsedSeconds: number
  environment: string
  layers: readonly ['backdrop', 'ground', 'actors', 'foreground', 'effects']
}

export type IntroRenderAssets = ReadonlyMap<string, CanvasImageSource>

const LAYERS = ['backdrop', 'ground', 'actors', 'foreground', 'effects'] as const
const TAU = Math.PI * 2

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function lerpInt(from: number, to: number, progress: number): number {
  return Math.round(from + (to - from) * clamp01(progress))
}

function waveInt(progress: number, amplitude: number, cycles = 1): number {
  return Math.round(Math.sin(progress * TAU * cycles) * amplitude)
}

function popT(x: number, y: number, clip: IntroSpriteClipId, elapsedSeconds: number): IntroActor {
  return { id: 'popt', x, y, clip, frame: getIntroSpriteFrame(clip, elapsedSeconds) }
}

export function deriveIntroFrame(timeSeconds: number): IntroFrame {
  const normalizedTimeSeconds = normalizeIntroTime(timeSeconds)
  const scene = getIntroSceneAtNormalizedTime(normalizedTimeSeconds)
  const duration = scene.endSeconds - scene.startSeconds
  const elapsedSeconds = normalizedTimeSeconds - scene.startSeconds
  const progress = clamp01(elapsedSeconds / duration)
  let environment: string = scene.id
  let actors: IntroActor[]

  switch (scene.id) {
    case 'tmb2-ident':
      environment = 'ident-grid'
      actors = progress >= 0.35
        ? [popT(lerpInt(36, 82, (progress - 0.35) / 0.65), 184, 'idle', elapsedSeconds)]
        : []
      break
    case 'duffel':
      environment = 'baggage-floor'
      actors = [
        popT(lerpInt(62, 116, progress), 183, progress < 0.78 ? 'run' : 'idle', elapsedSeconds),
        { id: 'duffel', x: lerpInt(196, 212, progress), y: 178 },
      ]
      break
    case 'key-escape':
      environment = 'spark-burst'
      actors = [
        popT(94, 184, progress < 0.3 ? 'idle' : 'run', elapsedSeconds),
        { id: 'key', x: lerpInt(178, 256, progress), y: lerpInt(139, 70, progress) + waveInt(progress, 7) },
      ]
      break
    case 'runway':
      environment = 'runway'
      actors = [
        popT(78, 181, 'run', elapsedSeconds),
        { id: 'key', x: 236, y: 76 + waveInt(progress, 9, 2) },
      ]
      break
    case 'ballpark':
      environment = 'ballpark'
      actors = [
        popT(lerpInt(60, 106, progress), 183, 'run', elapsedSeconds),
        { id: 'key', x: lerpInt(246, 202, progress), y: 88 + waveInt(progress, 8) },
        { id: 'baseball', x: lerpInt(292, 182, progress), y: lerpInt(76, 112, progress) - Math.round(Math.sin(progress * Math.PI) * 58) },
      ]
      break
    case 'city-finance':
      environment = 'city-finance'
      actors = [
        popT(lerpInt(54, 116, progress), 184, 'run', elapsedSeconds),
        { id: 'key', x: lerpInt(242, 268, progress), y: 62 + waveInt(progress, 8, 2) },
        { id: 'bull', x: 217, y: 176 },
      ]
      break
    case 'sky':
      environment = 'split-sky'
      actors = [
        popT(lerpInt(48, 138, progress), lerpInt(183, 126, progress), progress > 0.68 ? 'reach' : 'run', elapsedSeconds),
        { id: 'key', x: lerpInt(250, 214, progress), y: lerpInt(72, 58, progress) + waveInt(progress, 7) },
      ]
      break
    case 'final-pursuit':
      environment = 'final-pursuit'
      actors = [
        popT(lerpInt(72, 188, progress), lerpInt(174, 112, progress), 'reach', elapsedSeconds),
        { id: 'key', x: lerpInt(260, 224, progress), y: lerpInt(66, 96, progress) },
      ]
      break
    case 'catch':
      environment = 'captain-wings'
      actors = [
        popT(160, 157, 'reach', Math.max(0, elapsedSeconds + 0.5)),
        { id: 'key', x: lerpInt(212, 181, Math.min(1, progress * 1.8)), y: lerpInt(91, 103, Math.min(1, progress * 1.8)) },
      ]
      break
    case 'loop-reset':
      environment = 'return-tunnel'
      actors = [
        { id: 'key', x: lerpInt(180, 42, progress), y: lerpInt(103, 154, progress) + waveInt(progress, 5) },
      ]
      break
  }

  return { scene, actors, progress, elapsedSeconds, environment, layers: LAYERS }
}

function fillRect(
  context: CanvasRenderingContext2D,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  context.fillStyle = color
  context.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height))
}

function drawCloud(context: CanvasRenderingContext2D, x: number, y: number, scale = 1): void {
  const unit = Math.max(1, Math.round(scale * 4))
  fillRect(context, '#b9d8ef', x, y + unit, unit * 8, unit * 2)
  fillRect(context, '#eaf7ff', x + unit, y, unit * 5, unit * 3)
  fillRect(context, '#ffffff', x + unit * 3, y - unit, unit * 3, unit * 3)
}

function drawStars(context: CanvasRenderingContext2D, phase: number, count = 18): void {
  for (let index = 0; index < count; index += 1) {
    const x = (index * 47 + Math.round(phase * 73)) % 316 + 2
    const y = (index * 29 + 11) % 130 + 4
    const size = index % 5 === 0 ? 2 : 1
    fillRect(context, index % 3 === 0 ? '#fff6b0' : '#58a7ff', x, y, size, size)
  }
}

function drawTmb2Ident(context: CanvasRenderingContext2D, progress: number): void {
  fillRect(context, '#01030b', 0, 0, 320, 224)
  for (let index = 0; index < 34; index += 1) {
    const gather = clamp01(progress * 1.8)
    const scatterX = (index * 53) % 310
    const scatterY = 216 - ((index * 31) % 150)
    const targetX = 79 + (index % 17) * 10
    const targetY = 83 + Math.floor(index / 17) * 38
    fillRect(
      context,
      index % 4 === 0 ? '#68c6ff' : '#075ee8',
      lerpInt(scatterX, targetX, gather),
      lerpInt(scatterY, targetY, gather),
      index % 6 === 0 ? 4 : 2,
      index % 6 === 0 ? 4 : 2,
    )
  }
  if (progress > 0.22) {
    context.save()
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = '900 54px monospace'
    context.lineWidth = 8
    context.strokeStyle = '#075ee8'
    context.strokeText('TMB2', 161, 112)
    context.fillStyle = '#e8f8ff'
    context.fillText('TMB2', 161, 112)
    const highlightX = lerpInt(92, 235, progress)
    fillRect(context, '#fff3a4', highlightX, 77, 3, 68)
    context.restore()
  }
}

function drawBackdrop(context: CanvasRenderingContext2D, frame: IntroFrame): void {
  const { environment, progress } = frame
  if (environment === 'ident-grid') {
    drawTmb2Ident(context, progress)
    return
  }

  fillRect(context, '#02030a', 0, 0, 320, 224)
  if (environment === 'baggage-floor' || environment === 'spark-burst') {
    drawStars(context, progress, 12)
    for (let y = 170; y < 224; y += 8) fillRect(context, '#062d79', 0, y, 320, 1)
    for (let x = -32; x < 352; x += 32) fillRect(context, '#05245b', x, 170, 1, 54)
  } else if (environment === 'runway') {
    fillRect(context, '#0752bd', 0, 0, 320, 135)
    drawCloud(context, 22, 38, 0.8)
    drawCloud(context, 210, 26, 1)
    fillRect(context, '#4b5866', 0, 135, 320, 89)
    fillRect(context, '#d89d2d', 0, 184, 320, 3)
    const scroll = Math.floor(progress * 64) % 32
    for (let x = -scroll; x < 320; x += 32) fillRect(context, '#f8f3d6', x, 157, 17, 4)
    fillRect(context, '#dbe9f4', 220, 113, 72, 8)
    fillRect(context, '#dbe9f4', 255, 105, 4, 15)
    fillRect(context, '#dbe9f4', 239, 118, 9, 3)
  } else if (environment === 'ballpark') {
    fillRect(context, '#031946', 0, 0, 320, 118)
    drawStars(context, progress, 11)
    fillRect(context, '#172d56', 0, 112, 320, 39)
    for (let x = 8; x < 320; x += 13) fillRect(context, x % 26 ? '#d5e3ef' : '#e5523d', x, 121 + (x % 3), 3, 3)
    fillRect(context, '#6e452b', 0, 151, 320, 73)
    fillRect(context, '#39713f', 0, 203, 320, 21)
    fillRect(context, '#f5ead1', 146, 188, 28, 4)
  } else if (environment === 'city-finance') {
    fillRect(context, '#020720', 0, 0, 320, 224)
    for (let index = 0; index < 15; index += 1) {
      const x = index * 23 - 8
      const height = 38 + (index * 19) % 78
      fillRect(context, index % 2 ? '#061c55' : '#07143d', x, 178 - height, 18, height)
      for (let y = 170 - height; y < 170; y += 12) fillRect(context, index % 3 ? '#0ce0ff' : '#f24961', x + 5, y, 3, 5)
    }
    context.strokeStyle = '#ff4968'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(0, 164)
    context.lineTo(61, 147)
    context.lineTo(110, 155)
    context.lineTo(166, 109)
    context.lineTo(219, 124)
    context.lineTo(319, 64)
    context.stroke()
    fillRect(context, '#0b2b65', 0, 178, 320, 46)
  } else if (environment === 'split-sky' || environment === 'final-pursuit') {
    fillRect(context, '#071941', 0, 0, 176, 224)
    fillRect(context, '#180319', 176, 0, 144, 224)
    drawCloud(context, 14, 47, 1.1)
    drawCloud(context, 98, 112, 0.9)
    drawCloud(context, 202, 35, 0.7)
    for (let y = 151; y < 224; y += 9) fillRect(context, '#6d092d', 176, y, 144, 1)
    for (let x = 176; x < 320; x += 16) fillRect(context, '#410625', x, 151, 1, 73)
    drawStars(context, progress, 14)
  } else if (environment === 'captain-wings') {
    fillRect(context, '#02143d', 0, 0, 320, 224)
    for (let ray = 0; ray < 9; ray += 1) {
      context.strokeStyle = ray % 2 ? '#0b7cff' : '#d8f4ff'
      context.lineWidth = ray % 2 ? 4 : 2
      context.beginPath()
      context.moveTo(160, 112)
      context.lineTo(14 + ray * 37, ray % 2 ? 0 : 224)
      context.stroke()
    }
  } else if (environment === 'return-tunnel') {
    drawStars(context, progress, 24)
    for (let index = 0; index < 7; index += 1) {
      context.strokeStyle = index % 2 ? '#064fc4' : '#10347c'
      context.strokeRect(40 + index * 12, 28 + index * 8, 240 - index * 24, 168 - index * 16)
    }
  }
}

function drawGround(context: CanvasRenderingContext2D, frame: IntroFrame): void {
  if (frame.environment === 'baggage-floor' || frame.environment === 'spark-burst') {
    fillRect(context, '#07153b', 0, 178, 320, 46)
    fillRect(context, '#0a55c9', 0, 178, 320, 2)
  }
  if (frame.environment === 'runway') {
    const cartX = 122 - (Math.floor(frame.progress * 96) % 190)
    fillRect(context, '#d6a019', cartX, 139, 25, 10)
    fillRect(context, '#0b1730', cartX + 3, 149, 5, 5)
    fillRect(context, '#0b1730', cartX + 17, 149, 5, 5)
  }
}

function drawPopT(context: CanvasRenderingContext2D, actor: IntroActor, assets: IntroRenderAssets): void {
  const clipId = actor.clip ?? 'idle'
  const clip = introSpriteClips[clipId]
  const image = assets.get(clip.assetId)
  if (!image) return
  const frameIndex = actor.frame ?? 0
  const sourceX = (frameIndex % clip.columns) * clip.frameWidth
  const sourceY = Math.floor(frameIndex / clip.columns) * clip.frameHeight
  context.save()
  context.imageSmoothingEnabled = false
  context.drawImage(
    image,
    sourceX,
    sourceY,
    clip.frameWidth,
    clip.frameHeight,
    actor.x - clip.anchor.x,
    actor.y - clip.anchor.y,
    clip.drawSize.width,
    clip.drawSize.height,
  )
  context.restore()
}

function drawCartoonKey(context: CanvasRenderingContext2D, actor: IntroActor): void {
  context.save()
  context.translate(actor.x, actor.y)
  context.lineWidth = 3
  context.strokeStyle = '#8e4d00'
  context.fillStyle = '#f6b91d'
  context.beginPath()
  context.arc(0, 0, 13, 0, TAU)
  context.fill()
  context.stroke()
  fillRect(context, '#f6b91d', 10, -4, 28, 8)
  fillRect(context, '#f6b91d', 29, 3, 7, 8)
  fillRect(context, '#f6b91d', 20, 3, 6, 6)
  fillRect(context, '#ffffff', -7, -5, 5, 8)
  fillRect(context, '#ffffff', 2, -5, 5, 8)
  fillRect(context, '#0b1021', -5, -2, 2, 4)
  fillRect(context, '#0b1021', 4, -2, 2, 4)
  fillRect(context, '#ffffff', -22, -7, 10, 4)
  fillRect(context, '#ffffff', -19, -13, 7, 5)
  fillRect(context, '#2469d8', -20, -5, 8, 2)
  context.restore()
}

function drawDuffel(context: CanvasRenderingContext2D, actor: IntroActor): void {
  fillRect(context, '#050b1f', actor.x - 38, actor.y - 44, 76, 43)
  fillRect(context, '#101d43', actor.x - 34, actor.y - 39, 68, 35)
  fillRect(context, '#d29a24', actor.x - 36, actor.y - 43, 72, 3)
  fillRect(context, '#d29a24', actor.x - 1, actor.y - 40, 3, 36)
  context.strokeStyle = '#d29a24'
  context.lineWidth = 3
  context.strokeRect(actor.x - 19, actor.y - 58, 38, 20)
  fillRect(context, '#f0b629', actor.x - 7, actor.y - 24, 14, 9)
}

function drawBaseball(context: CanvasRenderingContext2D, actor: IntroActor): void {
  context.save()
  context.fillStyle = '#f5efe0'
  context.strokeStyle = '#d7d2c9'
  context.lineWidth = 2
  context.beginPath()
  context.arc(actor.x, actor.y, 10, 0, TAU)
  context.fill()
  context.stroke()
  fillRect(context, '#d94435', actor.x - 5, actor.y - 6, 2, 3)
  fillRect(context, '#d94435', actor.x + 4, actor.y + 3, 2, 3)
  context.restore()
}

function drawBull(context: CanvasRenderingContext2D, actor: IntroActor): void {
  fillRect(context, '#8f5a1e', actor.x - 25, actor.y - 29, 45, 21)
  fillRect(context, '#8f5a1e', actor.x + 14, actor.y - 37, 18, 18)
  fillRect(context, '#8f5a1e', actor.x - 18, actor.y - 10, 5, 18)
  fillRect(context, '#8f5a1e', actor.x + 10, actor.y - 10, 5, 18)
  fillRect(context, '#e5b74b', actor.x + 25, actor.y - 43, 12, 3)
  fillRect(context, '#e5b74b', actor.x + 20, actor.y - 45, 3, 8)
}

function drawActors(context: CanvasRenderingContext2D, frame: IntroFrame, assets: IntroRenderAssets): void {
  for (const actor of frame.actors) {
    if (actor.id === 'popt') drawPopT(context, actor, assets)
    else if (actor.id === 'key') drawCartoonKey(context, actor)
    else if (actor.id === 'duffel') drawDuffel(context, actor)
    else if (actor.id === 'baseball') drawBaseball(context, actor)
    else if (actor.id === 'bull') drawBull(context, actor)
  }
}

function drawForeground(context: CanvasRenderingContext2D, frame: IntroFrame): void {
  if (frame.environment === 'ballpark') {
    fillRect(context, '#fff4d4', 151, 190, 18, 2)
    fillRect(context, '#fff4d4', 158, 184, 4, 9)
  }
  if (frame.environment === 'captain-wings') {
    fillRect(context, '#e3f2ff', 22, 161, 98, 7)
    fillRect(context, '#3c8bea', 34, 169, 87, 4)
    fillRect(context, '#e3f2ff', 200, 161, 98, 7)
    fillRect(context, '#3c8bea', 199, 169, 87, 4)
    fillRect(context, '#e7ae23', 118, 158, 84, 16)
    fillRect(context, '#075ee8', 146, 154, 28, 24)
  }
  if (frame.environment === 'return-tunnel') {
    drawDuffel(context, { id: 'duffel', x: 58, y: 192 })
  }
}

function drawEffects(context: CanvasRenderingContext2D, frame: IntroFrame): void {
  context.save()
  context.globalAlpha = 0.12
  for (let y = 1; y < 224; y += 3) fillRect(context, '#000000', 0, y, 320, 1)
  context.globalAlpha = 1
  if (frame.scene.id !== 'tmb2-ident') {
    context.textAlign = 'left'
    context.textBaseline = 'top'
    context.font = '700 8px monospace'
    context.fillStyle = '#8ec9ff'
    context.fillText(frame.scene.label.toUpperCase(), 8, 8)
  }
  context.restore()
}

export function renderIntroFrame(
  context: CanvasRenderingContext2D,
  frame: IntroFrame,
  assets: IntroRenderAssets,
): void {
  context.save()
  context.imageSmoothingEnabled = false
  context.clearRect(0, 0, 320, 224)
  drawBackdrop(context, frame)
  drawGround(context, frame)
  drawActors(context, frame, assets)
  drawForeground(context, frame)
  drawEffects(context, frame)
  context.restore()
}
