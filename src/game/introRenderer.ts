import {
  CHART_POINTS,
  KEY_CLIPS,
  POPT_CLIPS,
  chartPointAt,
  type HandoffFrame,
  type IntroAnimationFrame,
  type IntroCardFrame,
  type IntroFxFrame,
  type IntroFxKind,
  type IntroPropFrame,
  type SpriteActorFrame,
  type SpriteClip,
} from './introAnimation'
import type { IntroRenderAssets } from './introAssets'
import { INTRO_STAGE_HEIGHT, INTRO_STAGE_WIDTH } from './introGeometry'

type SpriteCommand = {
  kind: 'sprite'
  actor: 'popt' | 'key'
  assetId: string
  sourceFrame: number
  frameWidth: number
  frameHeight: number
  columns: number
  pivot: { x: number; y: number }
  x: number
  y: number
  scale: number
  rotation: number
  flipX: boolean
  opacity: number
}

export type LogoLayerId =
  | 'logo-blue-mask'
  | 'logo-base'
  | 'logo-highlight-mask'
  | 'logo-productions'

export type LogoLayerCommand = {
  kind: 'logo-layer'
  assetId: LogoLayerId
  revealProgress: number
  opacity: number
  blendMode: GlobalCompositeOperation
}

export type IntroDrawCommand =
  | { kind: 'clear'; color: '#02030a' }
  | { kind: 'background'; assetId: string; offsetX: number }
  | { kind: 'background-dim'; opacity: number }
  | LogoLayerCommand
  | { kind: 'prop'; prop: IntroPropFrame }
  | SpriteCommand
  | { kind: 'fx'; fx: IntroFxFrame }
  | { kind: 'card'; card: IntroCardFrame }
  | { kind: 'flash'; color: 'white' | 'red'; opacity: number }
  | { kind: 'pixel-collapse'; progress: number }
  | { kind: 'handoff-key'; assetId: 'key-poses'; sourceFrame: 13; x: number; y: number; scale: number; rotation: number }
  | { kind: 'handoff-flash'; opacity: number }

/**
 * Environmental fx render under the actors; accent fx render over them.
 * A fixed table keeps the layering deterministic per fx kind.
 */
const FX_LAYER: Record<IntroFxKind, 'under' | 'over'> = {
  'laser-grid': 'under',
  'chart-glow': 'under',
  'pixel-assemble': 'under',
  sparkle: 'over',
  'burst-flash': 'over',
  exclaim: 'over',
  sweat: 'over',
  'impact-star': 'over',
  'radial-rays': 'over',
}

const clipsByAssetId = new Map<string, SpriteClip>()
for (const clip of [...Object.values(POPT_CLIPS), ...Object.values(KEY_CLIPS)]) {
  if (!clipsByAssetId.has(clip.assetId)) clipsByAssetId.set(clip.assetId, clip)
}

function spriteCommand(actor: 'popt' | 'key', frame: SpriteActorFrame): SpriteCommand {
  const clip = clipsByAssetId.get(frame.assetId)
  if (!clip) throw new Error(`Missing sprite clip metadata for ${frame.assetId}`)
  return {
    kind: 'sprite',
    actor,
    assetId: frame.assetId,
    sourceFrame: frame.sourceFrame,
    frameWidth: clip.frameWidth,
    frameHeight: clip.frameHeight,
    columns: clip.columns,
    pivot: clip.pivot,
    x: frame.x,
    y: frame.y,
    scale: frame.scale,
    rotation: frame.rotation,
    flipX: frame.flipX,
    opacity: frame.opacity,
  }
}

export function deriveIntroDrawCommands(
  frame: IntroAnimationFrame,
  handoff: HandoffFrame | null,
): readonly IntroDrawCommand[] {
  const commands: IntroDrawCommand[] = [{ kind: 'clear', color: '#02030a' }]
  if (frame.backgroundAssetId) {
    commands.push({ kind: 'background', assetId: frame.backgroundAssetId, offsetX: frame.backgroundOffsetX })
  }
  if (frame.backgroundDim > 0) {
    commands.push({ kind: 'background-dim', opacity: Math.min(1, frame.backgroundDim) })
  }
  if (frame.logo.visible) {
    commands.push({
      kind: 'logo-layer',
      assetId: 'logo-blue-mask',
      revealProgress: frame.logo.buildProgress,
      opacity: 1,
      blendMode: 'source-over',
    })
    if (frame.logo.buildProgress > 0.45) {
      commands.push({
        kind: 'logo-layer',
        assetId: 'logo-base',
        revealProgress: frame.logo.buildProgress,
        opacity: Math.min(1, (frame.logo.buildProgress - 0.45) / 0.35),
        blendMode: 'source-over',
      })
    }
    if (frame.logo.highlightOpacity > 0) {
      commands.push({
        kind: 'logo-layer',
        assetId: 'logo-highlight-mask',
        revealProgress: 1,
        opacity: frame.logo.highlightOpacity,
        blendMode: 'screen',
      })
    }
    if (frame.logo.buildProgress > 0.72) {
      commands.push({
        kind: 'logo-layer',
        assetId: 'logo-productions',
        revealProgress: 1,
        opacity: Math.min(1, (frame.logo.buildProgress - 0.72) / 0.22),
        blendMode: 'source-over',
      })
    }
  }
  for (const sceneProp of frame.props) commands.push({ kind: 'prop', prop: sceneProp })
  for (const fx of frame.fx) {
    if (FX_LAYER[fx.kind] === 'under') commands.push({ kind: 'fx', fx })
  }
  if (frame.popt) commands.push(spriteCommand('popt', frame.popt))
  if (frame.key) commands.push(spriteCommand('key', frame.key))
  for (const fx of frame.fx) {
    if (FX_LAYER[fx.kind] === 'over') commands.push({ kind: 'fx', fx })
  }
  if (frame.card) commands.push({ kind: 'card', card: frame.card })
  if (frame.pixelCollapse > 0) commands.push({ kind: 'pixel-collapse', progress: frame.pixelCollapse })
  if (frame.flash && frame.flash.opacity > 0) {
    commands.push({ kind: 'flash', color: frame.flash.color, opacity: frame.flash.opacity })
  }
  if (handoff) {
    commands.push({
      kind: 'handoff-key',
      assetId: 'key-poses',
      sourceFrame: 13,
      x: handoff.keyX,
      y: handoff.keyY,
      scale: handoff.keyScale,
      rotation: handoff.keyRotation,
    })
    commands.push({ kind: 'handoff-flash', opacity: handoff.flashOpacity })
  }
  return commands
}

function imageDimensions(image: CanvasImageSource): { width: number; height: number } {
  if (image instanceof HTMLImageElement) {
    return { width: image.naturalWidth || image.width, height: image.naturalHeight || image.height }
  }
  if (image instanceof HTMLCanvasElement || image instanceof OffscreenCanvas || image instanceof ImageBitmap) {
    return { width: image.width, height: image.height }
  }
  return { width: INTRO_STAGE_WIDTH, height: INTRO_STAGE_HEIGHT }
}

function drawBackground(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  offsetX: number,
): void {
  const { width, height } = imageDimensions(image)
  const targetAspect = INTRO_STAGE_WIDTH / INTRO_STAGE_HEIGHT
  const sourceAspect = width / height
  let sx = 0
  let sy = 0
  let sourceWidth = width
  let sourceHeight = height
  if (sourceAspect > targetAspect) {
    sourceWidth = height * targetAspect
    sx = (width - sourceWidth) / 2
  } else {
    sourceHeight = width / targetAspect
    sy = (height - sourceHeight) / 2
  }
  const travel = Math.max(-12, Math.min(12, offsetX)) * (sourceWidth / INTRO_STAGE_WIDTH)
  sx = Math.max(0, Math.min(width - sourceWidth, sx + travel))
  context.drawImage(
    image,
    sx,
    sy,
    sourceWidth,
    sourceHeight,
    0,
    0,
    INTRO_STAGE_WIDTH,
    INTRO_STAGE_HEIGHT,
  )
  const shade = context.createLinearGradient(0, 0, 0, INTRO_STAGE_HEIGHT)
  shade.addColorStop(0, 'rgba(2,3,10,0.18)')
  shade.addColorStop(0.62, 'rgba(2,3,10,0)')
  shade.addColorStop(1, 'rgba(2,3,10,0.38)')
  context.fillStyle = shade
  context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
}

function drawSprite(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  command: Pick<SpriteCommand, 'sourceFrame' | 'frameWidth' | 'frameHeight' | 'columns' | 'pivot' | 'x' | 'y' | 'scale' | 'rotation' | 'flipX' | 'opacity'>,
): void {
  if (command.opacity <= 0) return
  const sourceX = (command.sourceFrame % command.columns) * command.frameWidth
  const sourceY = Math.floor(command.sourceFrame / command.columns) * command.frameHeight
  context.save()
  context.globalAlpha = Math.min(1, command.opacity)
  context.translate(Math.round(command.x), Math.round(command.y))
  context.rotate(command.rotation)
  context.scale(command.flipX ? -command.scale : command.scale, command.scale)
  context.drawImage(
    image,
    sourceX,
    sourceY,
    command.frameWidth,
    command.frameHeight,
    -command.pivot.x,
    -command.pivot.y,
    command.frameWidth,
    command.frameHeight,
  )
  context.restore()
}

const IDENT_SOURCE_CROP = { x: 105, y: 261, width: 1468, height: 402 } as const
const IDENT_TARGET = { x: 16, y: 72, width: 288, height: 79 } as const

function drawLogoLayer(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  command: LogoLayerCommand,
): void {
  const revealProgress = Math.max(0, Math.min(1, command.revealProgress))
  if (revealProgress <= 0 || command.opacity <= 0) return
  context.save()
  context.globalAlpha = command.opacity
  context.globalCompositeOperation = command.blendMode
  if (command.assetId === 'logo-productions') {
    context.drawImage(image, 0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
  } else {
    context.beginPath()
    context.rect(
      IDENT_TARGET.x,
      IDENT_TARGET.y,
      IDENT_TARGET.width * revealProgress,
      IDENT_TARGET.height,
    )
    context.clip()
    context.drawImage(
      image,
      IDENT_TARGET.x,
      IDENT_TARGET.y,
      IDENT_TARGET.width,
      IDENT_TARGET.height,
    )
  }
  context.restore()
}

function drawExactLogoFallback(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  revealProgress: number,
): void {
  const reveal = Math.max(0, Math.min(1, revealProgress))
  if (reveal <= 0) return
  context.drawImage(
    image,
    IDENT_SOURCE_CROP.x,
    IDENT_SOURCE_CROP.y,
    IDENT_SOURCE_CROP.width * reveal,
    IDENT_SOURCE_CROP.height,
    IDENT_TARGET.x,
    IDENT_TARGET.y,
    IDENT_TARGET.width * reveal,
    IDENT_TARGET.height,
  )
}

export function shouldUseExactLogoFallback(
  commands: readonly LogoLayerCommand[],
  assets: IntroRenderAssets,
): boolean {
  return commands
    .filter((command) => command.assetId !== 'logo-productions')
    .some((command) => !assets.has(command.assetId))
}

function drawProp(context: CanvasRenderingContext2D, prop: IntroPropFrame): void {
  context.save()
  context.globalAlpha = prop.opacity
  context.translate(Math.round(prop.x), Math.round(prop.y))
  context.rotate(prop.rotation)
  context.scale(prop.scale, prop.scale)
  switch (prop.id) {
    case 'duffel':
      context.fillStyle = '#f5c424'
      context.fillRect(-32, -12, 10, 2)
      context.fillRect(-38, -4, 12, 2)
      context.fillRect(-34, 4, 9, 2)
      context.fillRect(24, -10, 9, 2)
      context.fillRect(28, -2, 12, 2)
      context.fillRect(24, 6, 8, 2)
      break
    case 'runway-cart':
      context.fillStyle = '#d8e7ff'
      context.fillRect(-26, -17, 52, 13)
      context.fillStyle = '#1761e8'
      context.fillRect(-22, -14, 18, 6)
      context.fillStyle = '#f5c424'
      context.fillRect(6, -12, 14, 3)
      context.fillStyle = '#151b32'
      context.fillRect(-20, -3, 9, 6)
      context.fillRect(11, -3, 9, 6)
      break
    case 'baseball':
      context.fillStyle = '#fffdf0'
      context.beginPath()
      context.arc(0, 0, 5, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#e54835'
      context.fillRect(-1, -4, 2, 8)
      break
    case 'base':
      context.rotate(Math.PI / 4)
      context.fillStyle = '#fffdf0'
      context.fillRect(-8, -8, 16, 16)
      break
    case 'graph':
      context.strokeStyle = '#3d7cff'
      context.lineWidth = 3
      context.beginPath()
      context.moveTo(-118, 30)
      context.lineTo(-62, 12)
      context.lineTo(-18, 20)
      context.lineTo(34, -12)
      context.lineTo(112, -48)
      context.stroke()
      break
    case 'bull-impact':
      drawImpactStarShape(context)
      break
    case 'cloud-puff':
      context.fillStyle = '#d8e7ff'
      context.fillRect(-28, -3, 56, 9)
      context.fillRect(-18, -10, 17, 7)
      context.fillRect(2, -14, 20, 11)
      context.fillStyle = '#75a8ff'
      context.fillRect(-24, 6, 46, 3)
      context.fillRect(5, -6, 17, 3)
      break
    case 'pilot-wings':
      context.fillStyle = '#fffbe4'
      context.save()
      context.rotate(-0.18)
      context.fillRect(-56, -7, 45, 6)
      context.fillRect(-48, 2, 37, 5)
      context.fillRect(-38, 10, 27, 4)
      context.restore()
      context.save()
      context.rotate(0.18)
      context.fillRect(11, -7, 45, 6)
      context.fillRect(11, 2, 37, 5)
      context.fillRect(11, 10, 27, 4)
      context.restore()
      context.fillStyle = '#f5c424'
      context.fillRect(-14, -4, 28, 8)
      context.fillStyle = '#1761e8'
      context.fillRect(-5, -2, 10, 4)
      break
  }
  context.restore()
}

function drawImpactStarShape(context: CanvasRenderingContext2D): void {
  context.fillStyle = '#f5c424'
  for (let index = 0; index < 8; index += 1) {
    context.rotate(Math.PI / 4)
    context.fillRect(8, -2, 15, 4)
  }
}

const SPARKLE_TINTS = { blue: '#75c4ff', white: '#fffdf0', gold: '#f5c424' } as const

function drawFx(
  context: CanvasRenderingContext2D,
  fx: IntroFxFrame,
): void {
  context.save()
  switch (fx.kind) {
    case 'sparkle': {
      context.globalAlpha = fx.opacity
      context.fillStyle = SPARKLE_TINTS[fx.tint]
      const size = Math.max(1, Math.round(fx.size))
      const x = Math.round(fx.x)
      const y = Math.round(fx.y)
      context.fillRect(x - size, y, size * 2 + 1, 1)
      context.fillRect(x, y - size, 1, size * 2 + 1)
      if (size > 2) context.fillRect(x - 1, y - 1, 3, 3)
      break
    }
    case 'burst-flash': {
      context.globalAlpha = fx.opacity
      context.translate(Math.round(fx.x), Math.round(fx.y))
      context.fillStyle = '#fffbe4'
      context.beginPath()
      context.arc(0, 0, Math.max(2, fx.radius * 0.45), 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#f5c424'
      const armLength = Math.max(4, Math.round(fx.radius))
      for (let index = 0; index < 8; index += 1) {
        context.rotate(Math.PI / 4)
        context.fillRect(Math.round(fx.radius * 0.3), -2, armLength, 4)
      }
      break
    }
    case 'exclaim': {
      context.globalAlpha = fx.opacity
      context.translate(Math.round(fx.x), Math.round(fx.y))
      context.scale(fx.scale, fx.scale)
      context.fillStyle = '#5a1410'
      context.fillRect(-4, -25, 8, 16)
      context.fillRect(-4, -6, 8, 7)
      context.fillStyle = '#e54835'
      context.fillRect(-3, -24, 6, 14)
      context.fillRect(-3, -5, 6, 5)
      break
    }
    case 'sweat': {
      context.globalAlpha = fx.opacity
      context.translate(Math.round(fx.x), Math.round(fx.y))
      context.scale(fx.scale, fx.scale)
      context.fillStyle = '#75c4ff'
      context.fillRect(-1, -4, 2, 2)
      context.fillRect(-2, -2, 4, 4)
      context.fillStyle = '#d8e7ff'
      context.fillRect(-1, -1, 1, 1)
      break
    }
    case 'impact-star': {
      context.globalAlpha = fx.opacity
      context.translate(Math.round(fx.x), Math.round(fx.y))
      context.rotate(fx.rotation)
      context.scale(fx.scale, fx.scale)
      drawImpactStarShape(context)
      break
    }
    case 'laser-grid': {
      const horizonY = Math.round(fx.horizonY)
      context.globalAlpha = fx.opacity
      context.strokeStyle = '#c03030'
      context.lineWidth = 1
      const depth = INTRO_STAGE_HEIGHT - horizonY
      context.beginPath()
      for (let index = 0; index <= 12; index += 1) {
        const spread = (index - 6) / 6
        context.moveTo(160 + spread * 26, horizonY)
        context.lineTo(160 + spread * 240, INTRO_STAGE_HEIGHT)
      }
      for (let index = 0; index < 7; index += 1) {
        const wrapped = (index + fx.scroll) % 7
        const rowProgress = (wrapped / 7) ** 2
        const y = horizonY + Math.round(depth * rowProgress)
        context.moveTo(0, y)
        context.lineTo(INTRO_STAGE_WIDTH, y)
      }
      context.stroke()
      context.globalAlpha = fx.opacity * 0.55
      context.strokeStyle = '#e54835'
      context.beginPath()
      context.moveTo(0, horizonY)
      context.lineTo(INTRO_STAGE_WIDTH, horizonY)
      context.stroke()
      break
    }
    case 'chart-glow': {
      const tip = chartPointAt(fx.progress)
      const firstUnlit = CHART_POINTS.findIndex(
        (_point, index) => index > 0 && chartProgressBefore(index) >= fx.progress,
      )
      const litPoints = CHART_POINTS.slice(0, firstUnlit === -1 ? CHART_POINTS.length : firstUnlit)
      context.globalAlpha = fx.opacity * 0.35
      context.strokeStyle = '#75c4ff'
      context.lineWidth = 5
      strokeChart(context, litPoints, tip)
      context.globalAlpha = fx.opacity
      context.strokeStyle = '#3d7cff'
      context.lineWidth = 2
      strokeChart(context, litPoints, tip)
      break
    }
    case 'radial-rays': {
      context.globalAlpha = fx.opacity
      context.translate(Math.round(fx.x), Math.round(fx.y))
      context.rotate(fx.rotation)
      const rayLength = 190 * fx.scale
      for (let index = 0; index < 12; index += 1) {
        context.rotate(Math.PI / 6)
        context.fillStyle = index % 2 === 0 ? '#1761e8' : '#75c4ff'
        context.globalAlpha = fx.opacity * (index % 2 === 0 ? 0.5 : 0.32)
        context.beginPath()
        context.moveTo(0, 0)
        context.lineTo(rayLength, -10 * fx.scale)
        context.lineTo(rayLength, 10 * fx.scale)
        context.closePath()
        context.fill()
      }
      break
    }
    case 'pixel-assemble': {
      const progress = Math.max(0, Math.min(1, fx.progress))
      const count = 88
      for (let index = 0; index < count; index += 1) {
        const startX = (index * 73 + 19) % INTRO_STAGE_WIDTH
        const startY = (index * 41 + 7) % INTRO_STAGE_HEIGHT
        const endX = fx.x + ((index * 29) % 56) - 28
        const endY = fx.y - ((index * 17) % 72)
        const travel = progress ** 1.5
        const x = Math.round(startX + (endX - startX) * travel)
        const y = Math.round(startY + (endY - startY) * travel)
        const size = Math.max(1, 6 - Math.floor(progress * 4) - (index % 3))
        context.globalAlpha = 0.35 + 0.65 * progress
        context.fillStyle = index % 3 === 0 ? '#75c4ff' : index % 2 === 0 ? '#1761e8' : '#061b66'
        context.fillRect(x, y, size, size)
      }
      break
    }
  }
  context.restore()
}

function chartProgressBefore(pointIndex: number): number {
  let length = 0
  for (let index = 1; index <= pointIndex; index += 1) {
    const from = CHART_POINTS[index - 1]!
    const to = CHART_POINTS[index]!
    length += Math.hypot(to.x - from.x, to.y - from.y)
  }
  let total = 0
  for (let index = 1; index < CHART_POINTS.length; index += 1) {
    const from = CHART_POINTS[index - 1]!
    const to = CHART_POINTS[index]!
    total += Math.hypot(to.x - from.x, to.y - from.y)
  }
  return total === 0 ? 0 : length / total
}

function strokeChart(
  context: CanvasRenderingContext2D,
  litPoints: ReadonlyArray<{ x: number; y: number }>,
  tip: { x: number; y: number },
): void {
  context.beginPath()
  const first = litPoints[0] ?? tip
  context.moveTo(first.x, first.y)
  for (const point of litPoints.slice(1)) context.lineTo(point.x, point.y)
  context.lineTo(tip.x, tip.y)
  context.stroke()
}

function drawCard(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  card: IntroCardFrame,
): void {
  if (card.opacity <= 0) return
  const { width, height } = imageDimensions(image)
  const drawWidth = Math.round(width * card.scale)
  const drawHeight = Math.round(height * card.scale)
  context.save()
  context.globalAlpha = Math.min(1, card.opacity)
  context.drawImage(
    image,
    Math.round(card.x - drawWidth / 2),
    Math.round(card.y - drawHeight / 2),
    drawWidth,
    drawHeight,
  )
  context.restore()
}

function drawPixelCollapse(context: CanvasRenderingContext2D, progress: number): void {
  const count = Math.floor(112 * Math.max(0, Math.min(1, progress)))
  for (let index = 0; index < count; index += 1) {
    const x = (index * 73 + 19) % INTRO_STAGE_WIDTH
    const y = (index * 41 + 7) % INTRO_STAGE_HEIGHT
    const size = 2 + (index % 4) * 2
    context.fillStyle = index % 3 === 0 ? '#75c4ff' : index % 2 === 0 ? '#1761e8' : '#061b66'
    context.fillRect(x, y, size, size)
  }
}

/**
 * World commands scale and shake with the punch camera; the card, transitions,
 * accent flash, and Start handoff stay screen-space.
 */
const CAMERA_SPACE_COMMANDS: ReadonlySet<IntroDrawCommand['kind']> = new Set([
  'background',
  'background-dim',
  'logo-layer',
  'prop',
  'sprite',
  'fx',
])

function withCamera(
  context: CanvasRenderingContext2D,
  camera: IntroAnimationFrame['camera'],
  draw: () => void,
): void {
  if (camera.zoom === 1 && camera.offsetX === 0 && camera.offsetY === 0) {
    draw()
    return
  }
  context.save()
  context.translate(camera.x + camera.offsetX, camera.y + camera.offsetY)
  context.scale(camera.zoom, camera.zoom)
  context.translate(-camera.x, -camera.y)
  draw()
  context.restore()
}

export function renderIntroFrame(
  context: CanvasRenderingContext2D,
  frame: IntroAnimationFrame,
  assets: IntroRenderAssets,
  handoff: HandoffFrame | null,
): void {
  context.imageSmoothingEnabled = false
  const commands = deriveIntroDrawCommands(frame, handoff)
  const logoCommands = commands.filter(
    (command): command is LogoLayerCommand => command.kind === 'logo-layer',
  )
  const useExactLogoFallback = shouldUseExactLogoFallback(logoCommands, assets)
  const exactLogoReveal = Math.max(
    0,
    ...logoCommands
      .filter((command) => command.assetId !== 'logo-productions')
      .map((command) => command.revealProgress),
  )
  let drewExactLogoFallback = false

  for (const command of commands) {
    const drawCommand = (): void => {
    switch (command.kind) {
      case 'clear':
        context.clearRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.fillStyle = command.color
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        break
      case 'background': {
        const image = assets.get(command.assetId)
        if (image) drawBackground(context, image, command.offsetX)
        break
      }
      case 'logo-layer': {
        if (command.assetId === 'logo-productions') {
          const productions = assets.get(command.assetId)
          if (productions) drawLogoLayer(context, productions, command)
          break
        }
        if (useExactLogoFallback) {
          if (!drewExactLogoFallback) {
            const source = assets.get('logo-source')
            if (source) drawExactLogoFallback(context, source, exactLogoReveal)
            drewExactLogoFallback = true
          }
          break
        }
        const image = assets.get(command.assetId)
        if (image) drawLogoLayer(context, image, command)
        break
      }
      case 'background-dim':
        context.save()
        context.globalAlpha = command.opacity
        context.fillStyle = '#02030a'
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.restore()
        break
      case 'prop':
        drawProp(context, command.prop)
        break
      case 'sprite': {
        const image = assets.get(command.assetId)
        if (image) drawSprite(context, image, command)
        break
      }
      case 'fx':
        drawFx(context, command.fx)
        break
      case 'card': {
        const image = assets.get(command.card.assetId)
        if (image) drawCard(context, image, command.card)
        break
      }
      case 'pixel-collapse':
        drawPixelCollapse(context, command.progress)
        break
      case 'handoff-key': {
        const image = assets.get(command.assetId)
        if (image) {
          drawSprite(context, image, {
            ...command,
            frameWidth: 256,
            frameHeight: 256,
            columns: 5,
            pivot: { x: 128, y: 224 },
            flipX: false,
            opacity: 1,
          })
        }
        break
      }
      case 'flash':
        context.save()
        context.globalAlpha = Math.min(1, command.opacity)
        context.fillStyle = command.color === 'red' ? '#e54835' : '#fffbe4'
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.restore()
        break
      case 'handoff-flash':
        context.save()
        context.globalAlpha = command.opacity
        context.fillStyle = '#fffbe4'
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.restore()
        break
    }
    }
    if (CAMERA_SPACE_COMMANDS.has(command.kind)) {
      withCamera(context, frame.camera, drawCommand)
    } else {
      drawCommand()
    }
  }
}
