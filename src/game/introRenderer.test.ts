import { describe, expect, it } from 'vitest'
import { deriveHandoffAnimation, deriveIntroAnimation, type IntroAnimationFrame } from './introAnimation'
import { deriveIntroDrawCommands, shouldUseExactLogoFallback } from './introRenderer'

describe('Scramble Canvas draw commands', () => {
  it('assembles the approved TMB2 Productions layers without procedural typography', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(4.8, false), null)
    expect(commands[0]).toEqual({ kind: 'clear', color: '#02030a' })
    expect(commands.filter((command) => command.kind === 'logo-layer')).toEqual([
      expect.objectContaining({ assetId: 'logo-blue-mask' }),
      expect.objectContaining({ assetId: 'logo-base' }),
      expect.objectContaining({ assetId: 'logo-highlight-mask' }),
      expect.objectContaining({ assetId: 'logo-productions' }),
    ])
    // The ident gag stages Pop T with the logo, never over it.
    const kinds = commands.map((command) => command.kind)
    expect(kinds.lastIndexOf('logo-layer')).toBeLessThan(kinds.indexOf('sprite'))
    expect(JSON.stringify(commands)).not.toMatch(/glyph|procedural|title|caption|chapter/i)
  })

  it('reveals base, productions, and highlight layers only at their thresholds', () => {
    const early = deriveIntroDrawCommands(deriveIntroAnimation(0.5, false), null)
    expect(early.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask'])

    const base = deriveIntroDrawCommands(deriveIntroAnimation(1, false), null)
    expect(base.filter((command) => command.kind === 'logo-layer').map((command) => command.assetId))
      .toEqual(['logo-blue-mask', 'logo-base'])

    const productions = deriveIntroDrawCommands(deriveIntroAnimation(1.5, false), null)
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

  it('draws the reveal plate over the dark plate, clipped to its progress', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(13.2, false), null)
    const kinds = commands.map((command) => command.kind)
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'plate-hangar-dark' })
    expect(kinds.indexOf('background-reveal')).toBe(kinds.indexOf('background') + 1)
  })

  it('orders the doorway plate, the silhouette, and the door leaves back to front', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(28, false), null)
    const kinds = commands.map((command) => command.kind)
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'plate-doorway' })
    // The leaves close over the silhouette standing in the gap.
    expect(kinds.indexOf('sprite')).toBeLessThan(kinds.indexOf('doors'))
  })

  it('letters the nameplate over the case card, above the fx', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(12, false), null)
    const kinds = commands.map((command) => command.kind)
    const nameplateIndex = kinds.indexOf('nameplate')
    expect(nameplateIndex).toBeGreaterThan(kinds.indexOf('background'))
    expect(commands[nameplateIndex]).toMatchObject({
      nameplate: { text: 'CAPT. POP T' },
    })
  })

  it('orders the takeoff: runway lights under the jet, accents over it', () => {
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(44, false), null)
    expect(commands[1]).toMatchObject({ kind: 'background', assetId: 'plate-runway-lineup' })
    const indexed = commands.map((command, index) => ({ command, index }))
    const lightsIndex = indexed.find(
      (entry) => entry.command.kind === 'fx' && entry.command.fx.kind === 'runway-lights',
    )!.index
    const strobeIndex = indexed.find(
      (entry) => entry.command.kind === 'fx' && entry.command.fx.kind === 'nav-strobe',
    )!.index
    const spriteIndex = indexed.find((entry) => entry.command.kind === 'sprite')!.index
    expect(lightsIndex).toBeLessThan(spriteIndex)
    expect(strobeIndex).toBeGreaterThan(spriteIndex)
    expect(commands[spriteIndex]).toMatchObject({ actor: 'jet', assetId: 'dc9-runway', scale: 1 })
  })

  it('adds pixel collapse only during the reset beat', () => {
    expect(deriveIntroDrawCommands(deriveIntroAnimation(50, false), null)
      .some((command) => command.kind === 'pixel-collapse')).toBe(false)
    expect(deriveIntroDrawCommands(deriveIntroAnimation(52.5, false), null)
      .some((command) => command.kind === 'pixel-collapse')).toBe(true)
  })

  it('renders the accent flash above the card and below the Start handoff', () => {
    const story = deriveIntroAnimation(50.2, false)
    const frame: IntroAnimationFrame = {
      ...story,
      flash: { color: 'white', opacity: 0.6 },
    }
    const commands = deriveIntroDrawCommands(frame, deriveHandoffAnimation(0.5))
    const kinds = commands.map((command) => command.kind)
    expect(kinds.indexOf('flash')).toBeGreaterThan(kinds.indexOf('card'))
    expect(kinds.indexOf('flash')).toBeLessThan(kinds.indexOf('handoff-emblem'))

    expect(deriveIntroDrawCommands(deriveIntroAnimation(33, false), null)
      .some((command) => command.kind === 'flash')).toBe(false)
  })

  it('draws the Start handoff emblem over the frozen story frame', () => {
    const handoff = deriveHandoffAnimation(1)
    const commands = deriveIntroDrawCommands(deriveIntroAnimation(24, false), handoff)
    expect(commands.at(-2)).toEqual({ kind: 'handoff-emblem', x: 160, y: 106, scale: 4.5 })
    expect(commands.at(-1)).toEqual({ kind: 'handoff-flash', opacity: 1 })
  })
})
