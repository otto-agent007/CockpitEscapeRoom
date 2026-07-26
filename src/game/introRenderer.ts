import {
  KEY_CLIPS,
  POPT_CLIPS,
  type HandoffFrame,
  type IntroAnimationFrame,
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
}

export type IntroDrawCommand =
  | { kind: 'clear'; color: '#02030a' }
  | { kind: 'background'; assetId: string; offsetX: number }
  | { kind: 'logo'; buildProgress: number; highlightOpacity: number }
  | { kind: 'prop'; prop: IntroPropFrame }
  | SpriteCommand
  | { kind: 'pixel-collapse'; progress: number }
  | { kind: 'handoff-key'; assetId: 'key-poses'; sourceFrame: 13; x: number; y: number; scale: number; rotation: number }
  | { kind: 'handoff-flash'; opacity: number }

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
  if (frame.logo.visible) {
    commands.push({
      kind: 'logo',
      buildProgress: frame.logo.buildProgress,
      highlightOpacity: frame.logo.highlightOpacity,
    })
  }
  for (const sceneProp of frame.props) {
    if (sceneProp.layer === 'back') commands.push({ kind: 'prop', prop: sceneProp })
  }
  if (frame.popt) commands.push(spriteCommand('popt', frame.popt))
  if (frame.key) commands.push(spriteCommand('key', frame.key))
  for (const sceneProp of frame.props) {
    if (sceneProp.layer === 'front') commands.push({ kind: 'prop', prop: sceneProp })
  }
  if (frame.pixelCollapse > 0) commands.push({ kind: 'pixel-collapse', progress: frame.pixelCollapse })
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

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

type PlateCrop = { sx: number; sy: number; sourceWidth: number; sourceHeight: number }

function plateCrop(width: number, height: number): PlateCrop {
  const targetAspect = INTRO_STAGE_WIDTH / INTRO_STAGE_HEIGHT
  const sourceAspect = width / height
  if (sourceAspect > targetAspect) {
    const sourceWidth = height * targetAspect
    return { sx: (width - sourceWidth) / 2, sy: 0, sourceWidth, sourceHeight: height }
  }
  const sourceHeight = width / targetAspect
  return { sx: 0, sy: (height - sourceHeight) / 2, sourceWidth: width, sourceHeight }
}

type ScaledPlate = { surface: CanvasImageSource; renderScale: number; logicalWidth: number }

/**
 * The plates are ~1586px wide and the stage grid is 320. Point-sampling that far down
 * drops roughly four out of five source columns, which is what made the skylines and
 * star fields shimmer and crawl during the parallax pan. Filtering fixes that, but
 * resampling a 1.6MP source at high quality on every animation frame is what dropped
 * a 2560 x 1440 shell to fifteen frames a second — so each plate is filtered once per
 * backing-store scale and the per-frame draw becomes a 1:1 window blit.
 */
const scaledPlates = new Map<string, ScaledPlate>()

function createSurface(width: number, height: number): HTMLCanvasElement | OffscreenCanvas | null {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height)
  if (typeof document === 'undefined') return null
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function getScaledPlate(
  assetId: string,
  image: CanvasImageSource,
  renderScale: number,
): ScaledPlate | null {
  const cached = scaledPlates.get(assetId)
  if (cached && cached.renderScale === renderScale) return cached

  const { width, height } = imageDimensions(image)
  const crop = plateCrop(width, height)
  // Keep the plate's full width so the parallax window can pan inside it.
  const logicalWidth = Math.ceil(width * (INTRO_STAGE_WIDTH / crop.sourceWidth))
  const surface = createSurface(logicalWidth * renderScale, INTRO_STAGE_HEIGHT * renderScale)
  const surfaceContext = surface?.getContext('2d') as CanvasRenderingContext2D | null
  if (!surface || !surfaceContext) return null

  surfaceContext.imageSmoothingEnabled = true
  surfaceContext.imageSmoothingQuality = 'high'
  surfaceContext.drawImage(
    image,
    0,
    crop.sy,
    width,
    crop.sourceHeight,
    0,
    0,
    logicalWidth * renderScale,
    INTRO_STAGE_HEIGHT * renderScale,
  )
  // The top/bottom shade is static and column-invariant, so bake it in rather than
  // filling a full-stage gradient on every animation frame.
  const shade = surfaceContext.createLinearGradient(0, 0, 0, INTRO_STAGE_HEIGHT * renderScale)
  shade.addColorStop(0, 'rgba(2,3,10,0.22)')
  shade.addColorStop(0.58, 'rgba(2,3,10,0)')
  shade.addColorStop(1, 'rgba(2,3,10,0.34)')
  surfaceContext.fillStyle = shade
  surfaceContext.fillRect(0, 0, logicalWidth * renderScale, INTRO_STAGE_HEIGHT * renderScale)
  const plate: ScaledPlate = { surface, renderScale, logicalWidth }
  scaledPlates.set(assetId, plate)
  return plate
}

function drawBackground(
  context: CanvasRenderingContext2D,
  assetId: string,
  image: CanvasImageSource,
  offsetX: number,
  renderScale: number,
): void {
  const { width, height } = imageDimensions(image)
  const crop = plateCrop(width, height)
  const travel = Math.max(-12, Math.min(12, offsetX)) * (crop.sourceWidth / INTRO_STAGE_WIDTH)
  const sx = Math.max(0, Math.min(width - crop.sourceWidth, crop.sx + travel))

  const plate = getScaledPlate(assetId, image, renderScale)
  if (plate) {
    const window = Math.round(sx * (INTRO_STAGE_WIDTH / crop.sourceWidth) * renderScale)
    const maxWindow = Math.max(0, plate.logicalWidth * renderScale - INTRO_STAGE_WIDTH * renderScale)
    const previousSmoothing = context.imageSmoothingEnabled
    context.imageSmoothingEnabled = false
    context.drawImage(
      plate.surface,
      Math.min(window, maxWindow),
      0,
      INTRO_STAGE_WIDTH * renderScale,
      INTRO_STAGE_HEIGHT * renderScale,
      0,
      0,
      INTRO_STAGE_WIDTH,
      INTRO_STAGE_HEIGHT,
    )
    context.imageSmoothingEnabled = previousSmoothing
    return
  }

  // Fallback for environments without a 2D offscreen surface: resample per frame and
  // shade inline, matching what the cached plate bakes in.
  const previousSmoothing = context.imageSmoothingEnabled
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(
    image,
    sx,
    crop.sy,
    crop.sourceWidth,
    crop.sourceHeight,
    0,
    0,
    INTRO_STAGE_WIDTH,
    INTRO_STAGE_HEIGHT,
  )
  context.imageSmoothingEnabled = previousSmoothing
  const shade = context.createLinearGradient(0, 0, 0, INTRO_STAGE_HEIGHT)
  shade.addColorStop(0, 'rgba(2,3,10,0.22)')
  shade.addColorStop(0.58, 'rgba(2,3,10,0)')
  shade.addColorStop(1, 'rgba(2,3,10,0.34)')
  context.fillStyle = shade
  context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
}

function drawSprite(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  command: Pick<SpriteCommand, 'sourceFrame' | 'frameWidth' | 'frameHeight' | 'columns' | 'pivot' | 'x' | 'y' | 'scale' | 'rotation' | 'flipX'>,
): void {
  const sourceX = (command.sourceFrame % command.columns) * command.frameWidth
  const sourceY = Math.floor(command.sourceFrame / command.columns) * command.frameHeight
  context.save()
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

const LOGO_GLYPHS: Record<string, readonly string[]> = {
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  2: ['11110', '00001', '00001', '01110', '10000', '10000', '11111'],
}

const LOGO_CELL = 9
const LOGO_GLYPH_ROWS = 7
const LOGO_GLYPH_COLUMNS = 5

/** Deterministic star field so the ident never renders as a flat black rectangle. */
function drawIdentField(context: CanvasRenderingContext2D, buildProgress: number): void {
  const glow = context.createRadialGradient(
    INTRO_STAGE_WIDTH / 2,
    INTRO_STAGE_HEIGHT / 2,
    8,
    INTRO_STAGE_WIDTH / 2,
    INTRO_STAGE_HEIGHT / 2,
    INTRO_STAGE_WIDTH * 0.62,
  )
  const lift = 0.1 + buildProgress * 0.24
  glow.addColorStop(0, `rgba(23,97,232,${lift.toFixed(3)})`)
  glow.addColorStop(0.55, 'rgba(9,41,120,0.12)')
  glow.addColorStop(1, 'rgba(2,3,10,0)')
  context.fillStyle = glow
  context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)

  for (let index = 0; index < 96; index += 1) {
    const x = (index * 61 + 13) % INTRO_STAGE_WIDTH
    const y = (index * 37 + 5) % INTRO_STAGE_HEIGHT
    const twinkle = (index * 7) % 5
    context.fillStyle = twinkle === 0 ? 'rgba(200,224,255,0.85)' : 'rgba(117,196,255,0.35)'
    context.fillRect(x, y, twinkle === 0 ? 2 : 1, twinkle === 0 ? 2 : 1)
  }
}

function drawLogo(
  context: CanvasRenderingContext2D,
  buildProgress: number,
  highlightOpacity: number,
): void {
  drawIdentField(context, buildProgress)

  const label = 'TMB2'
  const cell = LOGO_CELL
  const glyphWidth = LOGO_GLYPH_COLUMNS * cell
  const gap = cell
  const logoWidth = label.length * glyphWidth + (label.length - 1) * gap
  const logoHeight = LOGO_GLYPH_ROWS * cell
  const originX = Math.floor((INTRO_STAGE_WIDTH - logoWidth) / 2)
  const originY = Math.floor((INTRO_STAGE_HEIGHT - logoHeight) / 2) - 6
  const pixels = [...label].flatMap((character, characterIndex) => (
    LOGO_GLYPHS[character]!.flatMap((row, rowIndex) => (
      [...row].flatMap((value, columnIndex) => value === '1' ? [{
        x: originX + characterIndex * (glyphWidth + gap) + columnIndex * cell,
        y: originY + rowIndex * cell,
        row: rowIndex,
      }] : [])
    ))
  ))

  // The whole wordmark drops in together with only a light per-pixel stagger, so it
  // reads as TMB2 from the first frame it is visible. Gating pixels on individual
  // arrival times — whether left to right or scrambled — left the middle of the
  // build as an unreadable scatter of loose blue blocks.
  const settle = clamp01(buildProgress / 0.7)
  for (const [index, pixel] of pixels.entries()) {
    const jitter = ((index * 11 + pixel.row * 5) % 19) / 19
    const local = clamp01((settle - jitter * 0.25) / 0.75)
    if (local <= 0) continue
    const y = pixel.y + Math.round((1 - local) ** 2 * -70)
    context.globalAlpha = local
    context.fillStyle = '#02061f'
    context.fillRect(pixel.x + 3, y + 3, cell, cell)
    context.fillStyle = '#0b3fae'
    context.fillRect(pixel.x, y, cell, cell)
    context.fillStyle = '#1761e8'
    context.fillRect(pixel.x, y, cell, cell - 2)
    context.fillStyle = '#75c4ff'
    context.fillRect(pixel.x, y, cell, 2)
    if (local < 1) {
      // In-flight pixels stay hot and cool as they lock in.
      context.fillStyle = `rgba(248,251,255,${(1 - local) * 0.6})`
      context.fillRect(pixel.x, y, cell, cell)
    }
    context.globalAlpha = 1
  }

  if (buildProgress > 0.6) {
    // Gold baseline rule that draws out under the wordmark.
    const ruleWidth = Math.round(logoWidth * clamp01((buildProgress - 0.6) / 0.4))
    context.fillStyle = '#f5c424'
    context.fillRect(originX + Math.floor((logoWidth - ruleWidth) / 2), originY + logoHeight + 8, ruleWidth, 3)
  }

  if (highlightOpacity > 0) {
    // Sweep clipped to the glyph pixels so it reads as a shine on the letters rather
    // than a gradient slab painted across the whole title area.
    const sweep = originX - 40 + (logoWidth + 80) * clamp01(highlightOpacity)
    for (const pixel of pixels) {
      const distance = Math.abs(pixel.x + cell / 2 - sweep)
      if (distance > 26) continue
      const intensity = (1 - distance / 26) ** 2
      context.fillStyle = `rgba(255,251,228,${(intensity * 0.9).toFixed(3)})`
      context.fillRect(pixel.x, pixel.y, cell, cell)
      context.fillStyle = `rgba(245,196,36,${(intensity * 0.5).toFixed(3)})`
      context.fillRect(pixel.x, pixel.y + cell - 3, cell, 3)
    }
  }
}

function drawProp(context: CanvasRenderingContext2D, prop: IntroPropFrame): void {
  context.save()
  context.globalAlpha = prop.opacity
  context.translate(Math.round(prop.x), Math.round(prop.y))
  context.rotate(prop.rotation)
  context.scale(prop.scale, prop.scale)
  switch (prop.id) {
    case 'shadow': {
      const shade = context.createRadialGradient(0, 0, 0, 0, 0, 26)
      shade.addColorStop(0, 'rgba(2,6,22,0.9)')
      shade.addColorStop(0.55, 'rgba(2,6,22,0.4)')
      shade.addColorStop(1, 'rgba(2,6,22,0)')
      context.fillStyle = shade
      context.save()
      context.scale(1, 0.26)
      context.beginPath()
      context.arc(0, 0, 26, 0, Math.PI * 2)
      context.fill()
      context.restore()
      break
    }
    case 'duffel': {
      // Symmetric shake ticks that jitter with the story clock.
      const wobble = Math.sin(prop.phase) * 3
      context.fillStyle = '#f5c424'
      for (const [offsetY, length] of [[-6, 10], [1, 13], [8, 9]] as const) {
        context.fillRect(-24 - length + wobble, offsetY, length, 2)
        context.fillRect(24 - wobble, offsetY, length, 2)
      }
      break
    }
    case 'runway-cart':
      context.fillStyle = 'rgba(2,6,22,0.45)'
      context.beginPath()
      context.ellipse(0, 7, 30, 4, 0, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#d8e7ff'
      context.fillRect(-26, -17, 52, 13)
      context.fillStyle = '#8fb4e8'
      context.fillRect(-26, -6, 52, 3)
      context.fillStyle = '#1761e8'
      context.fillRect(-22, -14, 18, 6)
      context.fillStyle = '#f5c424'
      context.fillRect(6, -12, 14, 3)
      context.fillStyle = '#151b32'
      context.fillRect(-20, -3, 9, 8)
      context.fillRect(11, -3, 9, 8)
      context.fillStyle = '#46557d'
      context.fillRect(-18, -1, 5, 4)
      context.fillRect(13, -1, 5, 4)
      break
    case 'baseball': {
      // Trail behind the ball so a five-pixel dot still reads as a thrown ball.
      const trail = clamp01(prop.phase)
      for (let index = 1; index <= 5; index += 1) {
        context.fillStyle = `rgba(255,253,240,${(0.34 * trail * (1 - index / 6)).toFixed(3)})`
        context.fillRect(-6 - index * 5, -1 + index, 4, 2)
      }
      context.fillStyle = '#fffdf0'
      context.beginPath()
      context.arc(0, 0, 6, 0, Math.PI * 2)
      context.fill()
      context.strokeStyle = '#e54835'
      context.lineWidth = 1
      context.beginPath()
      context.arc(-4, 0, 5, -0.7, 0.7)
      context.stroke()
      context.beginPath()
      context.arc(4, 0, 5, Math.PI - 0.7, Math.PI + 0.7)
      context.stroke()
      break
    }
    case 'base':
      context.fillStyle = 'rgba(2,6,22,0.42)'
      context.beginPath()
      context.ellipse(0, 5, 16, 4, 0, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#c8c4ad'
      context.beginPath()
      context.moveTo(-15, 0)
      context.lineTo(0, -7)
      context.lineTo(15, 0)
      context.lineTo(0, 7)
      context.closePath()
      context.fill()
      context.fillStyle = '#fffdf0'
      context.beginPath()
      context.moveTo(-15, 0)
      context.lineTo(0, -7)
      context.lineTo(15, 0)
      context.lineTo(0, -1)
      context.closePath()
      context.fill()
      break
    case 'graph': {
      // Neon trail behind the key, fading out along its length. A solid full-length
      // stroke read as a beam skewering whoever happened to stand in front of it.
      const progress = clamp01(prop.phase)
      const endX = 150 * progress
      const endY = -72 * progress
      if (progress <= 0.01) break
      const fade = context.createLinearGradient(0, 0, endX, endY)
      fade.addColorStop(0, 'rgba(117,196,255,0)')
      fade.addColorStop(0.78, 'rgba(117,196,255,0.08)')
      fade.addColorStop(1, 'rgba(160,214,255,0.72)')
      context.lineCap = 'round'
      context.strokeStyle = fade
      context.lineWidth = 4
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(endX, endY)
      context.stroke()
      context.lineWidth = 1
      context.beginPath()
      context.moveTo(0, 0)
      context.lineTo(endX, endY)
      context.stroke()
      context.fillStyle = '#fffbe4'
      context.fillRect(endX - 2, endY - 2, 4, 4)
      break
    }
    case 'bull-impact': {
      // Comic hit star: rays and an expanding ring, with only a small hot core. A
      // filled disc at peak intensity blotted out the character it was hitting.
      const intensity = clamp01(prop.phase)
      for (let index = 0; index < 10; index += 1) {
        context.rotate(Math.PI / 5)
        context.fillStyle = index % 2 === 0 ? '#fffbe4' : '#f5c424'
        const length = (index % 2 === 0 ? 16 : 10) + intensity * 18
        context.fillRect(9, -2, length, 4)
      }
      context.strokeStyle = '#f5c424'
      context.lineWidth = 3
      context.beginPath()
      context.arc(0, 0, 7 + intensity * 14, 0, Math.PI * 2)
      context.stroke()
      context.fillStyle = '#fffbe4'
      context.beginPath()
      context.arc(0, 0, 4 + intensity * 4, 0, Math.PI * 2)
      context.fill()
      break
    }
    case 'cloud-puff':
      context.fillStyle = 'rgba(117,168,255,0.85)'
      context.beginPath()
      context.ellipse(0, 8, 32, 7, 0, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#e8f1ff'
      context.beginPath()
      context.arc(-20, 1, 12, 0, Math.PI * 2)
      context.arc(-2, -8, 17, 0, Math.PI * 2)
      context.arc(18, -1, 13, 0, Math.PI * 2)
      context.arc(0, 4, 16, 0, Math.PI * 2)
      context.fill()
      break
    case 'pilot-wings': {
      // Swept gold wings behind Pop T's shoulders. Flat near-white bars at full span
      // read as a board strapped across his waist rather than as deployed wings, so
      // the feathers stay gold, taper, and rake back and up from the badge.
      for (const direction of [1, -1] as const) {
        context.save()
        context.scale(direction, 1)
        context.rotate(-0.22)
        context.fillStyle = '#f5c424'
        context.fillRect(9, -7, 40, 5)
        context.fillStyle = '#d8a318'
        context.fillRect(9, -2, 31, 4)
        context.fillStyle = '#a97a0c'
        context.fillRect(9, 2, 21, 3)
        context.fillStyle = '#fffbe4'
        context.fillRect(9, -7, 40, 1)
        context.restore()
      }
      context.fillStyle = '#f5c424'
      context.beginPath()
      context.arc(0, -2, 10, 0, Math.PI * 2)
      context.fill()
      context.fillStyle = '#1761e8'
      context.beginPath()
      context.arc(0, -2, 5, 0, Math.PI * 2)
      context.fill()
      break
    }
  }
  context.restore()
}

const COLLAPSE_BLOCK = 8
const COLLAPSE_COLUMNS = Math.ceil(INTRO_STAGE_WIDTH / COLLAPSE_BLOCK)
const COLLAPSE_ROWS = Math.ceil(INTRO_STAGE_HEIGHT / COLLAPSE_BLOCK)

/**
 * Deterministic Fisher-Yates shuffle of every block position. Modular arithmetic on
 * the block coordinates looked ordered rather than random: it laid the dissolve down
 * in hard diagonal stripes that read as a moire artefact.
 */
const COLLAPSE_ORDER = (() => {
  const total = COLLAPSE_COLUMNS * COLLAPSE_ROWS
  const order = Array.from({ length: total }, (_, index) => index)
  let seed = 0x9e3779b9
  for (let index = total - 1; index > 0; index -= 1) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const swap = seed % (index + 1)
    const held = order[index]!
    order[index] = order[swap]!
    order[swap] = held
  }
  // rank[position] is when that block appears, in 0..1.
  const rank = new Float64Array(total)
  for (const [step, position] of order.entries()) rank[position] = step / total
  return rank
})()

/**
 * Ordered block dissolve back to the ident blue. The previous version scattered a
 * handful of loose squares over a bare black frame, which read as a rendering fault
 * rather than as the picture collapsing.
 */
function drawPixelCollapse(context: CanvasRenderingContext2D, progress: number): void {
  const eased = clamp01(progress)
  context.fillStyle = `rgba(2,3,10,${(eased * 0.9).toFixed(3)})`
  context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)

  // Blocks fade out behind the darkening wash as the beat closes, so the reset hands
  // off to the near-black ident instead of snapping from a bright cyan checkerboard.
  const blockFade = 1 - eased ** 2 * 0.85
  const total = COLLAPSE_COLUMNS * COLLAPSE_ROWS
  for (let index = 0; index < total; index += 1) {
    const order = COLLAPSE_ORDER[index]!
    if (order > eased) continue
    const column = index % COLLAPSE_COLUMNS
    const row = Math.floor(index / COLLAPSE_COLUMNS)
    const settle = clamp01((eased - order) * 6)
    const size = COLLAPSE_BLOCK * (0.35 + settle * 0.65)
    const inset = (COLLAPSE_BLOCK - size) / 2
    const tone = (index * 7) % 3
    context.fillStyle = tone === 0 ? '#75c4ff' : tone === 1 ? '#1761e8' : '#061b66'
    context.globalAlpha = (0.35 + settle * 0.65) * blockFade
    context.fillRect(column * COLLAPSE_BLOCK + inset, row * COLLAPSE_BLOCK + inset, size, size)
  }
  context.globalAlpha = 1
}

export function renderIntroFrame(
  context: CanvasRenderingContext2D,
  frame: IntroAnimationFrame,
  assets: IntroRenderAssets,
  handoff: HandoffFrame | null,
  renderScale = 1,
): void {
  // Every command below is authored in logical 320 x 224 stage pixels. The backing
  // store is a whole-number multiple of that, so art still lands on an integer grid.
  const safeRenderScale = Number.isFinite(renderScale) && renderScale > 0 ? renderScale : 1
  context.setTransform(safeRenderScale, 0, 0, safeRenderScale, 0, 0)
  context.imageSmoothingEnabled = false
  for (const command of deriveIntroDrawCommands(frame, handoff)) {
    switch (command.kind) {
      case 'clear':
        context.clearRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.fillStyle = command.color
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        break
      case 'background': {
        const image = assets.get(command.assetId)
        if (image) {
          drawBackground(context, command.assetId, image, command.offsetX, safeRenderScale)
        }
        break
      }
      case 'logo':
        drawLogo(context, command.buildProgress, command.highlightOpacity)
        break
      case 'prop':
        drawProp(context, command.prop)
        break
      case 'sprite': {
        const image = assets.get(command.assetId)
        if (image) drawSprite(context, image, command)
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
          })
        }
        break
      }
      case 'handoff-flash':
        context.save()
        context.globalAlpha = command.opacity
        context.fillStyle = '#fffbe4'
        context.fillRect(0, 0, INTRO_STAGE_WIDTH, INTRO_STAGE_HEIGHT)
        context.restore()
        break
    }
  }
}
