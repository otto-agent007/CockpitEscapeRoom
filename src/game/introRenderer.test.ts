import { describe, expect, it } from 'vitest'
import { deriveHandoffAnimation, deriveIntroAnimation } from './introAnimation'
import { deriveIntroDrawCommands, shouldUseExactLogoFallback } from './introRenderer'

describe('TMB2 Canvas draw commands', () => {
  it('assembles the approved TMB2 Productions layers without procedural typography', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
    expect(commands.map((command) => command.kind)).toEqual([
      'clear',
      'logo-layer',
      'logo-layer',
      'logo-layer',
      'logo-layer',
    ])
    expect(commands.filter((command) => command.kind === 'logo-layer')).toEqual([
      expect.objectContaining({ assetId: 'logo-blue-mask' }),
      expect.objectContaining({ assetId: 'logo-base' }),
      expect.objectContaining({ assetId: 'logo-highlight-mask' }),
      expect.objectContaining({ assetId: 'logo-productions' }),
    ])
    expect(JSON.stringify(commands)).not.toMatch(/glyph|procedural|title|caption|chapter/i)
  })

  it('reveals base, productions, and highlight layers only at their thresholds', () => {
    const early = deriveIntroDrawCommands(deriveIntroAnimation(1, false), null)
    expect(early.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask'])

    const base = deriveIntroDrawCommands(deriveIntroAnimation(2.4, false), null)
    expect(base.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask', 'logo-base'])

    const productions = deriveIntroDrawCommands(deriveIntroAnimation(3.5, false), null)
    expect(productions.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask', 'logo-base', 'logo-productions'])

    const highlighted = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
    expect(highlighted.some((command) => (
      command.kind === 'logo-layer' && command.assetId === 'logo-highlight-mask'
    ))).toBe(true)
  })

  it('uses the exact approved source when a commanded derived logo layer is missing', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
      .filter((command) => command.kind === 'logo-layer')
    const image = {} as CanvasImageSource

    expect(shouldUseExactLogoFallback(commands, new Map([
      ['logo-blue-mask', image],
      ['logo-highlight-mask', image],
      ['logo-productions', image],
    ]))).toBe(true)
    expect(shouldUseExactLogoFallback(commands, new Map([
      ['logo-blue-mask', image],
      ['logo-base', image],
      ['logo-highlight-mask', image],
      ['logo-productions', image],
    ]))).toBe(false)
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
