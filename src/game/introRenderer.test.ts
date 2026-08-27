import { describe, expect, it } from 'vitest'
import { deriveHandoffAnimation, deriveIntroAnimation, type IntroAnimationFrame } from './introAnimation'
import { deriveIntroDrawCommands, IDENT_TARGET, shouldUseExactLogoFallback } from './introRenderer'

describe('Scramble Canvas draw commands', () => {
  it('assembles the approved TMB2 ident layers without procedural typography', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
    expect(commands[0]).toEqual({ kind: 'clear', color: '#02030a' })
    expect(commands.filter((command) => command.kind === 'logo-layer')).toEqual([
      expect.objectContaining({ assetId: 'logo-blue-mask' }),
      expect.objectContaining({ assetId: 'logo-base' }),
      expect.objectContaining({ assetId: 'logo-highlight-mask' }),
    ])
    // The ident gag stages Pop T with the logo, never over it.
    const kinds = commands.map((command) => command.kind)
    expect(kinds.lastIndexOf('logo-layer')).toBeLessThan(kinds.indexOf('sprite'))
    expect(JSON.stringify(commands)).not.toMatch(/glyph|procedural|title|caption|chapter/i)
  })

  it('reveals the base and highlight layers only at their thresholds', () => {
    const early = deriveIntroDrawCommands(deriveIntroAnimation(0.5, false), null)
    expect(early.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask'])

    const base = deriveIntroDrawCommands(deriveIntroAnimation(1, false), null)
    expect(base.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask', 'logo-base'])

    const highlighted = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
    expect(highlighted.some((command) => (
      command.kind === 'logo-layer' && command.assetId === 'logo-highlight-mask'
    ))).toBe(true)
  })

  it('never commands a PRODUCTIONS wordmark layer at any point in the ident', () => {
    for (let time = 0; time < 6; time += 0.1) {
      const assetIds = deriveIntroDrawCommands(deriveIntroAnimation(time, false), null)
        .filter((command) => command.kind === 'logo-layer')
        .map((command) => command.assetId)
      expect(assetIds, `t=${time.toFixed(1)}`).not.toContain('logo-productions')
    }
  })

  it('sizes the ident logo to half the stage width, centred', () => {
    expect(IDENT_TARGET).toEqual({ x: 80, y: 78, width: 160, height: 44 })
    expect(IDENT_TARGET.x * 2 + IDENT_TARGET.width).toBe(320)
  })

  it('uses the exact approved source when a commanded derived logo layer is missing', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
      .filter((command) => command.kind === 'logo-layer')
    const image = {} as CanvasImageSource

    expect(shouldUseExactLogoFallback(commands, new Map([
      ['logo-blue-mask', image],
      ['logo-highlight-mask', image],
    ]))).toBe(true)
    expect(shouldUseExactLogoFallback(commands, new Map([
      ['logo-blue-mask', image],
      ['logo-base', image],
      ['logo-highlight-mask', image],
    ]))).toBe(false)
  })

  it('draws the reveal plate over the dark plate, clipped to its progress', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(35.7, false), null)
    const kinds = commands.map((command) => command.kind)
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'plate-hangar-dark' })
    expect(kinds.indexOf('background-reveal')).toBe(kinds.indexOf('background') + 1)
  })

  it('orders the doorway plate, the silhouette, and the door leaves back to front', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(19.5, false), null)
    const kinds = commands.map((command) => command.kind)
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'plate-doorway' })
    // The leaves close over the silhouette standing in the gap.
    expect(kinds.indexOf('sprite')).toBeLessThan(kinds.indexOf('doors'))
  })

  it('orders the departure: the panel under the accent fx, with no jet left in it', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(45.6, false), null)
    const kinds = commands.map((command) => command.kind)
    expect(kinds).toContain('background')
    expect(kinds.indexOf('background')).toBeLessThan(kinds.indexOf('fx'))
    // No jet sprite survives anywhere in the departure act.
    expect(kinds).not.toContain('sprite')
  })

  it('renders the accent flash above the card and below the Start handoff', () => {
    const story = deriveIntroAnimation(50.2, false)
    const frame: IntroAnimationFrame = {
      ...story,
      flash: { color: 'white', opacity: 0.6 },
    }
    const commands = deriveIntroDrawCommands(frame, deriveHandoffAnimation(0.5))
    const kinds = commands.map((command) => command.kind)
    expect(kinds.indexOf('title-plaque')).toBeLessThan(kinds.indexOf('title'))
    expect(kinds.indexOf('flash')).toBeGreaterThan(kinds.indexOf('title'))
    expect(kinds.indexOf('flash')).toBeLessThan(kinds.indexOf('handoff-title-plaque'))
    expect(kinds.indexOf('handoff-title-plaque')).toBeLessThan(kinds.indexOf('handoff-title'))

    expect(deriveIntroDrawCommands(deriveIntroAnimation(33, false), null)
      .some((command) => command.kind === 'flash')).toBe(false)
  })

  it('draws the Start handoff title over the frozen story frame', () => {
    const handoff = deriveHandoffAnimation(1)
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(19.5, false), handoff)
    expect(commands.at(-3)).toEqual({
      kind: 'handoff-title-plaque',
      assetId: 'title-plaque-gold',
      x: 160,
      y: 44,
      width: 248,
      height: 54,
      scale: 4.5,
    })
    expect(commands.at(-2)).toEqual({ kind: 'handoff-title', x: 160, y: 44, scale: 4.5 })
    expect(commands.at(-1)).toEqual({ kind: 'handoff-flash', opacity: 1 })
  })
})
