import { describe, expect, it } from 'vitest'
import { advanceCapMotion, createCapMotion, type PivotDirection } from './arcadeHarnessMotion'

describe('down forward Light Punch Cap Throw command', () => {
  function command(directions: PivotDirection[], facing: 1 | -1 = 1, lastTick = directions.length) {
    let history = createCapMotion()
    for (let i = 0; i < directions.length - 1; i++) history = advanceCapMotion(history, directions[i]!, false, i, facing).history
    return advanceCapMotion(history, directions.at(-1)!, true, lastTick, facing)
  }
  it.each([1, -1] as const)('accepts down then forward relative to facing %i', facing => {
    expect(command(['down', 'neutral', 'forward'], facing).special).toBe(true)
    expect(command(['down', 'down-forward', 'forward'], facing).special).toBe(true)
  })
  it.each([['forward'], ['forward', 'down-forward'], ['down', 'back', 'forward'], ['down', 'down']] as PivotDirection[][])('keeps %j as ordinary Light Punch', (...directions) => {
    expect(command(directions).special).toBe(false)
  })
  it('expires after eighteen combat ticks', () => expect(command(['down', 'forward'], 1, 19).special).toBe(false))
  it('consumes a recognized motion so repeated Light presses cannot reuse it', () => {
    const first = command(['down', 'forward'])
    expect(first.special).toBe(true)
    expect(advanceCapMotion(first.history, 'forward', true, 4, 1).special).toBe(false)
  })
  it('clears on a facing change or a reset clock', () => {
    const start = advanceCapMotion(createCapMotion(), 'down', false, 20, 1).history
    expect(advanceCapMotion(start, 'forward', true, 21, -1).special).toBe(false)
    expect(advanceCapMotion(start, 'forward', true, 0, 1).special).toBe(false)
  })
})
