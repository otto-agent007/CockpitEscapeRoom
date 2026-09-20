import { describe, expect, it } from 'vitest'
import { NEUTRAL_MARS_ARCADE_INPUT } from '../game/marsArcade'
import {
  PLAYER_ONE_BINDINGS,
  PLAYER_TWO_BINDINGS,
  inputFromKeys,
} from './arcadeHarnessInput'

describe('box harness key mapping', () => {
  it('is neutral with nothing held', () => {
    expect(inputFromKeys(new Set(), PLAYER_ONE_BINDINGS)).toEqual(NEUTRAL_MARS_ARCADE_INPUT)
  })

  it('walks each way', () => {
    expect(inputFromKeys(new Set(['KeyD']), PLAYER_ONE_BINDINGS).move).toBe(1)
    expect(inputFromKeys(new Set(['KeyA']), PLAYER_ONE_BINDINGS).move).toBe(-1)
  })

  it('treats both directions at once as a dead stop', () => {
    expect(inputFromKeys(new Set(['KeyA', 'KeyD']), PLAYER_ONE_BINDINGS).move).toBe(0)
  })

  it('maps every button', () => {
    const input = inputFromKeys(new Set(['KeyW', 'KeyJ', 'KeyK', 'KeyL']), PLAYER_ONE_BINDINGS)
    expect(input).toMatchObject({ jump: true, light: true, heavy: true, special: true })
  })

  it('keeps the two players on separate keys', () => {
    const shared = Object.values(PLAYER_ONE_BINDINGS).filter((key) =>
      Object.values(PLAYER_TWO_BINDINGS).includes(key),
    )
    expect(shared).toEqual([])

    const onlyPlayerTwo = inputFromKeys(new Set(['ArrowRight', 'Comma']), PLAYER_TWO_BINDINGS)
    expect(onlyPlayerTwo).toMatchObject({ move: 1, light: true })
    expect(inputFromKeys(new Set(['ArrowRight', 'Comma']), PLAYER_ONE_BINDINGS)).toEqual(
      NEUTRAL_MARS_ARCADE_INPUT,
    )
  })
})
