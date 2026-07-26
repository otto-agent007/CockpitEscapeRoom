import { describe, expect, it } from 'vitest'
import { deriveHandoffAnimation, deriveIntroAnimation } from './introAnimation'
import { deriveIntroDrawCommands } from './introRenderer'

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
