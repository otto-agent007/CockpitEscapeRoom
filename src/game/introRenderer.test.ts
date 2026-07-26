import { describe, expect, it } from 'vitest'
import { deriveHandoffAnimation, deriveIntroAnimation } from './introAnimation'
import { deriveIntroDrawCommands, renderIntroFrame } from './introRenderer'
import { INTRO_STAGE_HEIGHT, INTRO_STAGE_WIDTH } from './introGeometry'

/** Minimal 2D context recorder: enough to observe smoothing state at each draw. */
function recordingContext() {
  const smoothingAtDraw: boolean[] = []
  const context = {
    imageSmoothingEnabled: false,
    imageSmoothingQuality: 'low',
    globalAlpha: 1,
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    setTransform() {},
    save() {},
    restore() {},
    translate() {},
    rotate() {},
    scale() {},
    beginPath() {},
    closePath() {},
    moveTo() {},
    lineTo() {},
    arc() {},
    ellipse() {},
    fill() {},
    stroke() {},
    fillRect() {},
    clearRect() {},
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    drawImage() {
      smoothingAtDraw.push(context.imageSmoothingEnabled)
    },
  }
  return { context: context as unknown as CanvasRenderingContext2D, smoothingAtDraw }
}

describe('TMB2 raster fidelity', () => {
  it('draws sprite art with smoothing off so the pixel grid survives', () => {
    const { context, smoothingAtDraw } = recordingContext()
    // A scene with no background plate, so every drawImage is sprite art.
    const identFrame = deriveIntroAnimation(3, false)
    renderIntroFrame(context, identFrame, new Map(), null, 4)

    const sprite = new Map<string, CanvasImageSource>([
      ['popt-run', { width: 1024, height: 512 } as unknown as CanvasImageSource],
      ['key-poses', { width: 1280, height: 1024 } as unknown as CanvasImageSource],
    ])
    const chaseFrame = deriveIntroAnimation(18, false)
    renderIntroFrame(context, chaseFrame, sprite, null, 4)

    expect(smoothingAtDraw.length).toBeGreaterThan(0)
    expect(smoothingAtDraw.every((enabled) => enabled === false)).toBe(true)
  })

  it('rasterizes on the logical stage regardless of backing-store scale', () => {
    const { context } = recordingContext()
    expect(() => renderIntroFrame(context, deriveIntroAnimation(3, false), new Map(), null, 5)).not.toThrow()
    expect(INTRO_STAGE_WIDTH).toBe(320)
    expect(INTRO_STAGE_HEIGHT).toBe(224)
  })
})

describe('TMB2 Canvas draw commands', () => {
  it('builds the blue ident without any visible title or chapter-caption command', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(3, false), null)
    expect(commands.map((command) => command.kind)).toEqual(['clear', 'logo'])
    expect(JSON.stringify(commands)).not.toMatch(/title|caption|chapter/i)
  })

  it('orders recovered runway art, independent props, and pivot-stable actors', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(18, false), null)
    expect(commands[0]).toEqual({ kind: 'clear', color: '#02030a' })
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'background-runway' })
    expect(commands.some((command) => command.kind === 'prop' && command.prop.id === 'runway-cart')).toBe(true)

    const sprites = commands.filter((command) => command.kind === 'sprite')
    expect(sprites).toHaveLength(2)
    expect(sprites).toEqual(expect.arrayContaining([
      expect.objectContaining({ actor: 'popt', assetId: 'popt-run', pivot: { x: 128, y: 224 } }),
      expect.objectContaining({ actor: 'key', assetId: 'key-poses', pivot: { x: 128, y: 224 } }),
    ]))
  })

  it('splits props around the actors so staging sits behind and impacts sit in front', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(31, false), null)
    const firstSprite = commands.findIndex((command) => command.kind === 'sprite')
    const lastSprite = commands.map((command) => command.kind).lastIndexOf('sprite')
    const propIndex = (id: string) => commands.findIndex(
      (command) => command.kind === 'prop' && command.prop.id === id,
    )

    expect(propIndex('graph')).toBeLessThan(firstSprite)
    expect(propIndex('shadow')).toBeLessThan(firstSprite)
    expect(propIndex('bull-impact')).toBeGreaterThan(lastSprite)
  })

  it('adds pixel collapse only during the reset beat', () => {
    expect(deriveIntroDrawCommands(deriveIntroAnimation(50, false), null)
      .some((command) => command.kind === 'pixel-collapse')).toBe(false)
    expect(deriveIntroDrawCommands(deriveIntroAnimation(52.5, false), null)
      .some((command) => command.kind === 'pixel-collapse')).toBe(true)
  })

  it('draws the Start handoff key over the frozen story frame', () => {
    const handoff = deriveHandoffAnimation(1)
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(24, false), handoff)
    expect(commands.at(-2)).toMatchObject({
      kind: 'handoff-key',
      assetId: 'key-poses',
      scale: 4.5,
      rotation: Math.PI * 2,
    })
    expect(commands.at(-1)).toEqual({ kind: 'handoff-flash', opacity: 1 })
  })
})
