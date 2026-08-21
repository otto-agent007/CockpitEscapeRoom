import {
  POPT_CLIPS,
  type HandoffFrame,
  type IntroAnimationFrame,
  TITLE_CARD,
  type IntroLabelFrame,
  type IntroTitleFrame,
  type IntroDoorsFrame,
  type IntroFxFrame,
  type IntroFxKind,
  type IntroPropFrame,
  type IntroRevealFrame,
  type SpriteActorFrame,
  type SpriteClip,
} from './introAnimation'
import type { IntroRenderAssets } from './introAssets'
import { INTRO_STAGE_HEIGHT, INTRO_STAGE_WIDTH } from './introGeometry'

type SpriteCommand = {
  kind: 'sprite'
  actor: 'popt' | 'jet'
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
  | { kind: 'background-reveal'; reveal: IntroRevealFrame }
  | { kind: 'background-dim'; opacity: number }
  | LogoLayerCommand
  | { kind: 'prop'; prop: IntroPropFrame }
  | SpriteCommand
  | { kind: 'doors'; doors: IntroDoorsFrame }
  | { kind: 'fx'; fx: IntroFxFrame }
  | { kind: 'label'; label: IntroLabelFrame }
  | { kind: 'title'; title: IntroTitleFrame }
  | { kind: 'flash'; color: 'white' | 'red'; opacity: number }
  | { kind: 'pixel-collapse'; progress: number }
  | { kind: 'handoff-title'; x: number; y: number; scale: number }
  | { kind: 'handoff-flash'; opacity: number }

/**
 * Environmental fx render under the actors; accent fx render over them.
 * A fixed table keeps the layering deterministic per fx kind.
 */
const FX_LAYER: Record<IntroFxKind, 'under' | 'over'> = {
  'beacon-sweep': 'under',
  'runway-lights': 'under',
  'landing-lights': 'under',
  contrail: 'under',
  sparkle: 'over',
  'radial-rays': 'over',
  beacon: 'over',
  'nav-strobe': 'over',
  exhaust: 'over',
}

const clipsByAssetId = new Map<string, SpriteClip>()
for (const clip of Object.values(POPT_CLIPS)) {
  if (!clipsByAssetId.has(clip.assetId)) clipsByAssetId.set(clip.assetId, clip)
}

function spriteCommand(actor: 'popt', frame: SpriteActorFrame): SpriteCommand {
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
  if (frame.backgroundReveal && frame.backgroundReveal.progress > 0) {
    commands.push({ kind: 'background-reveal', reveal: frame.backgroundReveal })
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
  }
  for (const label of frame.labels) commands.push({ kind: 'label', label })
  for (const sceneProp of frame.props) commands.push({ kind: 'prop', prop: sceneProp })
  for (const fx of frame.fx) {
    if (FX_LAYER[fx.kind] === 'under') commands.push({ kind: 'fx', fx })
  }
  if (frame.popt) commands.push(spriteCommand('popt', frame.popt))
  if (frame.cap) commands.push(spriteCommand('popt', frame.cap))
  // The door leaves close over the actors: the silhouette stands in the gap.
  if (frame.doors) commands.push({ kind: 'doors', doors: frame.doors })
  for (const fx of frame.fx) {
    if (FX_LAYER[fx.kind] === 'over') commands.push({ kind: 'fx', fx })
  }
  if (frame.title) commands.push({ kind: 'title', title: frame.title })
  if (frame.pixelCollapse > 0) commands.push({ kind: 'pixel-collapse', progress: frame.pixelCollapse })
  if (frame.flash && frame.flash.opacity > 0) {
    commands.push({ kind: 'flash', color: frame.flash.color, opacity: frame.flash.opacity })
  }
  if (handoff) {
    commands.push({ kind: 'handoff-title', x: handoff.x, y: handoff.y, scale: handoff.scale })
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
}

/** Reveal a second full-frame plate over the base along an axis: the
 * floodlight row-slam (top-to-bottom) and the instrument wake-up
 * (left-to-right). Both states are generated art; the runtime only wipes. */
function drawBackgroundReveal(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  reveal: IntroRevealFrame,
): void {
  const progress = Math.max(0, Math.min(1, reveal.progress))
  if (progress <= 0) return
  context.save()
  context.beginPath()
  if (reveal.axis === 'ltr') {
    context.rect(0, 0, Math.round(INTRO_STAGE_WIDTH * progress), INTRO_STAGE_HEIGHT)
  } else {
    context.rect(0, 0, INTRO_STAGE_WIDTH, Math.round(INTRO_STAGE_HEIGHT * progress))
  }
  context.clip()
  drawBackground(context, image, 0)
  context.restore()
}

const DOOR_LEAF_WIDTH = 168
const DOOR_CENTER_X = 160

/** The two sliding leaves, hazard chevrons on the leading edges. */
function drawDoors(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  doors: IntroDoorsFrame,
): void {
  const gap = Math.max(0, Math.round(doors.gap))
  context.drawImage(image, DOOR_CENTER_X - gap - DOOR_LEAF_WIDTH, 0, DOOR_LEAF_WIDTH, INTRO_STAGE_HEIGHT)
  context.save()
  context.translate(DOOR_CENTER_X + gap + DOOR_LEAF_WIDTH, 0)
  context.scale(-1, 1)
  context.drawImage(image, 0, 0, DOOR_LEAF_WIDTH, INTRO_STAGE_HEIGHT)
  context.restore()
}


export function shouldUseExactLogoFallback(
  commands: readonly LogoLayerCommand[],
  assets: IntroRenderAssets,
): boolean {
  return commands.some((command) => !assets.has(command.assetId))
}

function drawProp(context: CanvasRenderingContext2D, prop: IntroPropFrame): void {
  context.save()
  context.globalAlpha = prop.opacity
  context.translate(Math.round(prop.x), Math.round(prop.y))
  context.rotate(prop.rotation)
  context.scale(prop.scale, prop.scale)
  switch (prop.id) {
    case 'cloud-puff':
      context.fillStyle = '#d8e7ff'
      context.fillRect(-28, -3, 56, 9)
      context.fillRect(-18, -10, 17, 7)
      context.fillRect(2, -14, 20, 11)
      context.fillStyle = '#75a8ff'
      context.fillRect(-24, 6, 46, 3)
      context.fillRect(5, -6, 17, 3)
      break
  }
  context.restore()
}

const SPARKLE_TINTS = { blue: '#75c4ff', white: '#fffdf0', gold: '#f5c424' } as const

/** The runway's painted horizon row in plate-runway-lineup (measured). */
const RUNWAY_HORIZON_Y = 117

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
    case 'beacon': {
      if (!fx.on) break
      const x = Math.round(fx.x)
      const y = Math.round(fx.y)
      context.fillStyle = '#ffb020'
      context.fillRect(x - 1, y - 1, 3, 3)
      context.globalAlpha = 0.7
      context.fillRect(x - 3, y, 2, 1)
      context.fillRect(x + 2, y, 2, 1)
      context.fillRect(x, y - 3, 1, 2)
      context.fillRect(x, y + 2, 1, 2)
      break
    }
    case 'beacon-sweep': {
      context.globalAlpha = fx.opacity
      const x = Math.round(fx.x)
      for (let index = 0; index < 5; index += 1) {
        const weight = 5 - index
        context.strokeStyle = `rgb(${30 + 14 * weight}, ${24 + 10 * weight}, 10)`
        context.lineWidth = 3
        context.beginPath()
        context.moveTo(x - index * 14, 0)
        context.lineTo(x - index * 14 - 30, INTRO_STAGE_HEIGHT)
        context.stroke()
      }
      context.fillStyle = '#ffb020'
      context.fillRect(x - 2, 100, 5, 5)
      break
    }
    case 'landing-lights': {
      // Two hot cores with a cone of spill opening toward the camera. The cone
      // is a flat wedge, not a gradient, so it stays inside the intro's
      // cel-shaded language and on the pixel grid.
      const cx = Math.round(fx.x)
      const cy = Math.round(fx.y)
      const spread = Math.max(1, Math.round(fx.spread))
      const intensity = Math.max(0, Math.min(1, fx.intensity))
      const reach = INTRO_STAGE_HEIGHT - cy
      for (const [widthScale, alpha] of [[3.4, 0.1], [1.9, 0.14], [0.9, 0.2]] as const) {
        context.globalAlpha = alpha * intensity
        context.fillStyle = '#dce8ff'
        context.beginPath()
        context.moveTo(cx - spread, cy)
        context.lineTo(cx + spread, cy)
        context.lineTo(cx + Math.round(spread * widthScale * 2.2), cy + reach)
        context.lineTo(cx - Math.round(spread * widthScale * 2.2), cy + reach)
        context.closePath()
        context.fill()
      }
      const core = Math.max(2, Math.round(2 + 3 * intensity))
      for (const side of [-1, 1] as const) {
        const lampX = cx + side * spread
        context.globalAlpha = Math.min(1, 0.55 * intensity)
        context.fillStyle = '#dce8ff'
        context.fillRect(lampX - core, cy - core, core * 2, core * 2)
        context.globalAlpha = Math.min(1, intensity)
        context.fillStyle = '#fffdf0'
        context.fillRect(
          lampX - Math.round(core / 2),
          cy - Math.round(core / 2),
          Math.max(1, core),
          Math.max(1, core),
        )
      }
      break
    }
    case 'runway-lights': {
      // Centreline dashes and edge lights over the painted runway, streaking
      // with speed. Deterministic in phase; geometry anchored to the plate's
      // measured horizon.
      const scroll = (fx.phase * (10 + 280 * fx.speed)) % 24
      const depthSpan = INTRO_STAGE_HEIGHT - RUNWAY_HORIZON_Y
      for (let index = 0; index < 10; index += 1) {
        const y = RUNWAY_HORIZON_Y + 6 + index * 24 - scroll
        if (y <= RUNWAY_HORIZON_Y || y >= INTRO_STAGE_HEIGHT) continue
        const depth = (y - RUNWAY_HORIZON_Y) / depthSpan
        const dashWidth = Math.max(1, Math.round(2 + 8 * depth))
        const dashLength = Math.max(2, Math.round(3 + 14 * depth * (1 + 2 * fx.speed)))
        context.fillStyle = '#fffdf0'
        context.fillRect(160 - Math.floor(dashWidth / 2), Math.round(y), dashWidth, dashLength)
        const edgeX = Math.round(14 + 136 * depth)
        const stretch = Math.max(1, Math.round(1 + 10 * fx.speed * depth))
        context.fillStyle = '#ffb020'
        context.fillRect(160 - edgeX, Math.round(y), 2, stretch)
        context.fillRect(160 + edgeX - 2, Math.round(y), 2, stretch)
      }
      break
    }
    case 'nav-strobe': {
      if (!fx.on) break
      context.fillStyle = '#fffdf0'
      context.fillRect(Math.round(fx.x) - 1, Math.round(fx.y) - 1, 2, 2)
      break
    }
    case 'exhaust': {
      context.globalAlpha = Math.min(1, fx.intensity)
      const x = Math.round(fx.x)
      const y = Math.round(fx.y)
      context.fillStyle = '#ffc878'
      context.beginPath()
      context.moveTo(x - 6, y)
      context.lineTo(x + 6, y)
      context.lineTo(x, y + 5 + Math.round(4 * fx.intensity))
      context.closePath()
      context.fill()
      break
    }
    case 'contrail': {
      // Climb-out trail rising left-to-right; the climb-out jet rides its tip
      // (introAnimation keeps the two on the same curve).
      const progress = Math.max(0, Math.min(1, fx.progress))
      if (progress <= 0) break
      context.globalAlpha = 0.85
      context.fillStyle = '#dce4f4'
      for (let index = 0; index < 24; index += 1) {
        const along = index / 23
        if (along > progress) break
        const x = Math.round(60 + 220 * along)
        const y = Math.round(150 - 110 * along ** 1.3)
        const size = Math.max(1, Math.round(4 * (1 - along) + 1))
        context.fillRect(x - size, y - size, size * 2, size * 2)
      }
      break
    }
  }
  context.restore()
}

/** Book-cover style lettering: plain, small, one colour, no shadow play. */
function drawLabel(context: CanvasRenderingContext2D, label: IntroLabelFrame): void {
  if (label.opacity <= 0) return
  context.save()
  context.globalAlpha = Math.min(1, label.opacity)
  context.font = `700 ${Math.max(1, Math.round(label.sizePx))}px "Courier New", monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = label.ink === 'dark' ? '#232838' : '#e8ddb8'
  context.fillText(label.text, Math.round(label.x), Math.round(label.y))
  context.restore()
}

/**
 * The finale title, lettered at runtime rather than baked into art — the same
 * route the case nameplate uses, and the reason no generated plate has to carry
 * text. The blue/red offset copies mirror the PRESS START prompt's shadow so
 * the ending shares the intro's typography.
 */
function drawTitle(
  context: CanvasRenderingContext2D,
  title: IntroTitleFrame,
  scale = 1,
  x = title.x,
  y = title.y,
): void {
  if (title.opacity <= 0) return
  const size = Math.max(1, Math.round(TITLE_FONT_PX * scale))
  const shadow = Math.max(1, Math.round(scale))
  const centreX = Math.round(x)
  const centreY = Math.round(y)
  context.save()
  context.globalAlpha = Math.min(1, title.opacity)
  context.font = `700 ${size}px "Courier New", monospace`
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillStyle = '#1761e8'
  context.fillText(title.text, centreX - shadow, centreY)
  context.fillStyle = '#a41724'
  context.fillText(title.text, centreX + shadow, centreY)
  context.fillStyle = '#f8fbff'
  context.fillText(title.text, centreX, centreY)
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
  'background-reveal',
  'background-dim',
  'logo-layer',
  'prop',
  'sprite',
  'doors',
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
    ...logoCommands.map((command) => command.revealProgress),
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
      case 'background-reveal': {
        const image = assets.get(command.reveal.assetId)
        if (image) drawBackgroundReveal(context, image, command.reveal)
        break
      }
      case 'logo-layer': {
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
      case 'doors': {
        const image = assets.get('door-leaf')
        if (image) drawDoors(context, image, command.doors)
        break
      }
      case 'fx':
        drawFx(context, command.fx)
        break
      case 'label':
        drawLabel(context, command.label)
        break
      case 'title':
        drawTitle(context, command.title)
        break
      case 'pixel-collapse':
        drawPixelCollapse(context, command.progress)
        break
      case 'flash':
        context.save()
        context.globalAlpha = Math.min(1, command.opacity)
        context.fillStyle = command.color === 'red' ? '#e54835' : '#fffbe4'
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.restore()
        break
      case 'handoff-title':
        drawTitle(
          context,
          { text: TITLE_CARD.text, x: command.x, y: command.y, opacity: 1 },
          command.scale,
          command.x,
          command.y,
        )
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

/** Stage pixels tall for the finale title at scale 1. */
const TITLE_FONT_PX = 13

const IDENT_SOURCE_CROP = { x: 105, y: 261, width: 1468, height: 402 } as const
/** On-stage ident geometry: half the 320 px stage width, centred. */
export const IDENT_TARGET = { x: 80, y: 78, width: 160, height: 44 } as const

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
