import { describe, expect, it } from 'vitest'
import * as inputModule from './airbusInput'

describe('Airbus shared input', () => {
  it.each([
    [Number.NaN, 0],
    [0.1, 0],
    [0.12, 0],
    [0.56, 0.5],
    [-0.56, -0.5],
    [2, 1],
  ])('normalizes axis %s to %s with the default dead zone', (raw, expected) => {
    const normalizeAxis = (
      inputModule as unknown as {
        normalizeAirbusAxis?: (value: number, deadzone?: number) => number
      }
    ).normalizeAirbusAxis

    expect(normalizeAxis).toBeTypeOf('function')
    if (!normalizeAxis) return
    expect(normalizeAxis(raw)).toBeCloseTo(expected, 5)
  })

  it('maps left stick, triggers, and right-stick X from one gamepad snapshot', () => {
    const fromGamepad = (
      inputModule as unknown as {
        airbusInputFromGamepad?: (
          snapshot: { axes: readonly number[]; buttons: readonly number[] },
          directionalEnabled: boolean,
        ) => { pitch: number; bank: number; thrust: number; directional: number }
      }
    ).airbusInputFromGamepad

    expect(fromGamepad).toBeTypeOf('function')
    if (!fromGamepad) return

    const buttons = Array.from({ length: 8 }, () => 0)
    buttons[6] = 0.2
    buttons[7] = 0.7
    const snapshot = { axes: [0.56, -0.56, 0.56], buttons }

    expect(fromGamepad(snapshot, true)).toEqual({
      pitch: expect.closeTo(0.5, 5),
      bank: expect.closeTo(0.5, 5),
      thrust: expect.closeTo((0.5 - 0.05) / 0.95, 5),
      directional: expect.closeTo(0.5, 5),
    })
    expect(fromGamepad(snapshot, false).directional).toBe(0)
  })

  it('combines keyboard and accessible holds with opposing controls cancelling', () => {
    const combineInput = (
      inputModule as unknown as {
        combineAirbusInput?: (
          keys: ReadonlySet<string>,
          holds: ReadonlySet<string>,
          gamepad: { pitch: number; bank: number; thrust: number; directional: number },
          directionalEnabled: boolean,
        ) => {
          input: { pitch: number; bank: number; thrust: number; directional: number }
          method: string
        }
      }
    ).combineAirbusInput

    expect(combineInput).toBeTypeOf('function')
    if (!combineInput) return

    const combined = combineInput(
      new Set(['ArrowUp', 'ArrowDown', 'KeyD']),
      new Set(['bankLeft', 'bankRight', 'thrustUp']),
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      true,
    )

    expect(combined).toEqual({
      input: { pitch: 0, bank: 0, thrust: 1, directional: 1 },
      method: 'accessible',
    })
    expect(combineInput(
      new Set(['KeyD']),
      new Set(),
      { pitch: 0, bank: 0, thrust: 0, directional: 0 },
      false,
    ).input.directional).toBe(0)
  })
})
