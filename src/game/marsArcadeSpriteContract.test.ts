import { describe, expect, it } from 'vitest'
import contractJson from '../../asset-reports/mars-arcade-sprite-contract.json'
import { MARS_ARCADE_STAGE } from './marsArcade'
import { MARS_ARCADE_FIGHTERS, type MarsArcadeButton } from './marsArcadeFighters'
import { drawingBudget } from './marsArcadeSpriteBudget'

/**
 * The sprite contract and the prompt pack quote numbers that belong to the fight
 * rules. If a move is re-tuned and nobody re-reads the art budget, the sheet ends
 * up a drawing short and the animation silently desyncs from the hitbox. These
 * tests make that a failing build instead of a surprise on the cabinet.
 */

const contract = contractJson as unknown as {
  cell: { canonical: [number, number]; baseline: number; pivot: { x: number; y: number } }
  character: {
    standingHeightPx: number
    standingHeightTolerancePx: number
    envelopeBounds: { x: [number, number]; y: [number, number] }
  }
  derivation: {
    stage: { width: number; height: number; halfWidth: number; pushboxWidth: number }
    characterOnStage: { standingHeightStagePx: number }
  }
  sharedClips: { id: string; frames: number }[]
  sharedClipFrameTotal: number
  moveClips: Record<string, unknown> & {
    moveDrawingTotal: number
  }
  outcomeClips: { id: string; frames: number }[]
  effects: { sprites: { id: string; frames: number }[]; effectFrameTotal: number }
  frameTotals: {
    anchors: number
    sharedPerFighter: number
    sharedAllFighters: number
    moves: number
    outcomes: number
    effects: number
    grandTotal: number
  }
  generation: { identityReference: Record<string, string> }
}

type ContractBudget = { drawings: number; startup: number; active: number; recovery: number }

const BUTTONS: MarsArcadeButton[] = ['light', 'heavy', 'special']

describe('mars arcade sprite contract', () => {
  it('quotes the stage the fight loop actually uses', () => {
    expect(contract.derivation.stage.halfWidth).toBe(MARS_ARCADE_STAGE.halfWidth)
    expect(contract.derivation.stage.pushboxWidth).toBe(MARS_ARCADE_STAGE.pushboxWidth)
  })

  it('budgets every move from its committed frame data', () => {
    for (const fighter of Object.values(MARS_ARCADE_FIGHTERS)) {
      const clips = contract.moveClips[fighter.id] as Record<string, ContractBudget> | undefined
      expect(clips, `contract has no moveClips for ${fighter.id}`).toBeDefined()
      if (!clips) continue
      for (const button of BUTTONS) {
        const move = fighter.moves[button]
        const expected = drawingBudget(move)
        expect(clips[move.id], `contract has no budget for ${move.id}`).toEqual({
          drawings: expected.total,
          startup: expected.startup,
          active: expected.active,
          recovery: expected.recovery,
        })
      }
      expect(Object.keys(clips)).toHaveLength(BUTTONS.length)
    }
  })

  it('has an identity reference for every fighter', () => {
    for (const id of Object.keys(MARS_ARCADE_FIGHTERS)) {
      expect(contract.generation.identityReference[id], `no reference noted for ${id}`).toBeTruthy()
    }
  })

  it('adds its own totals up', () => {
    const sharedSum = contract.sharedClips.reduce((total, clip) => total + clip.frames, 0)
    expect(sharedSum).toBe(contract.sharedClipFrameTotal)
    expect(contract.frameTotals.sharedPerFighter).toBe(sharedSum)

    const fighterCount = Object.keys(MARS_ARCADE_FIGHTERS).length
    expect(contract.frameTotals.sharedAllFighters).toBe(sharedSum * fighterCount)
    expect(contract.frameTotals.anchors).toBe(fighterCount)

    const moveSum = Object.values(MARS_ARCADE_FIGHTERS).reduce(
      (total, fighter) =>
        total + BUTTONS.reduce((sum, button) => sum + drawingBudget(fighter.moves[button]).total, 0),
      0,
    )
    expect(contract.moveClips.moveDrawingTotal).toBe(moveSum)
    expect(contract.frameTotals.moves).toBe(moveSum)

    const outcomeSum = contract.outcomeClips.reduce((total, clip) => total + clip.frames, 0)
    expect(contract.frameTotals.outcomes).toBe(outcomeSum)

    const effectSum = contract.effects.sprites.reduce((total, sprite) => total + sprite.frames, 0)
    expect(contract.effects.effectFrameTotal).toBe(effectSum)
    expect(contract.frameTotals.effects).toBe(effectSum)

    expect(contract.frameTotals.grandTotal).toBe(
      contract.frameTotals.anchors +
        contract.frameTotals.sharedAllFighters +
        contract.frameTotals.moves +
        contract.frameTotals.outcomes +
        contract.frameTotals.effects,
    )
  })

  it('keeps the fields the python normaliser and gate read', () => {
    // tools/assets/normalise-popt-frame.py and check-popt-frames-fullcolour.py index
    // these exact paths. A rename here breaks both without touching any TypeScript.
    expect(contract.cell.canonical).toHaveLength(2)
    expect(contract.cell.baseline).toBeTypeOf('number')
    expect(contract.cell.pivot.x).toBeTypeOf('number')
    expect(contract.character.standingHeightPx).toBeTypeOf('number')
    expect(contract.character.standingHeightTolerancePx).toBeTypeOf('number')
    expect(contract.character.envelopeBounds.x).toHaveLength(2)
    expect(contract.character.envelopeBounds.y).toHaveLength(2)
    expect(contract.derivation.characterOnStage.standingHeightStagePx).toBe(
      contract.character.standingHeightPx,
    )
  })

  it('keeps every pose inside the cell it declares', () => {
    const [cellWidth, cellHeight] = contract.cell.canonical
    const { x, y } = contract.character.envelopeBounds
    expect(x[0]).toBeGreaterThanOrEqual(0)
    expect(x[1]).toBeLessThan(cellWidth)
    expect(y[0]).toBeGreaterThanOrEqual(0)
    expect(y[1]).toBeLessThan(cellHeight)
    expect(contract.cell.baseline).toBeLessThan(cellHeight)
  })

  it('leaves room in the cell for the longest reach in the rules', () => {
    const longestReach = Math.max(
      ...Object.values(MARS_ARCADE_FIGHTERS).flatMap((fighter) =>
        BUTTONS.map((button) => fighter.moves[button])
          // The captain's flyby reaches the whole stage; the aircraft is an effect
          // sprite, not part of the character cell, so it does not size the cell.
          .filter((move) => !move.projectile && move.reach <= contract.cell.canonical[0])
          .map((move) => move.reach),
      ),
    )
    const forwardRoom = contract.character.envelopeBounds.x[1] - contract.cell.pivot.x
    expect(forwardRoom).toBeGreaterThan(longestReach)
  })
})
