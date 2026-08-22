import { describe, expect, it } from 'vitest'
import {
  DC9_CONTROL_CHECK_ITEM_IDS,
  dc9ControlCheckComplete,
  dc9ControlCheckItemsInGroup,
  dc9ControlCheckNextItem,
  dc9ControlCheckReached,
  dc9ControlCheckRemaining,
  normalizeDc9ControlCheckProgress,
  type Dc9ControlCheckItemId,
} from './dc9ControlCheck'
import { NEUTRAL_DC9_CONTROLS, type Dc9ControlState } from './dc9Input'

function at(overrides: Partial<Dc9ControlState>): Dc9ControlState {
  return { ...NEUTRAL_DC9_CONTROLS, ...overrides }
}

describe('dc9ControlCheckReached', () => {
  it('latches an item once the control reaches its stop', () => {
    expect(dc9ControlCheckReached(at({ pitch: 1 }), [])).toEqual(['yokeAft'])
    expect(dc9ControlCheckReached(at({ pitch: -1 }), [])).toEqual(['yokeForward'])
    expect(dc9ControlCheckReached(at({ roll: -1 }), [])).toEqual(['wheelLeft'])
    expect(dc9ControlCheckReached(at({ roll: 1 }), [])).toEqual(['wheelRight'])
    expect(dc9ControlCheckReached(at({ rudder: -1 }), [])).toEqual(['rudderLeft'])
    expect(dc9ControlCheckReached(at({ rudder: 1 }), [])).toEqual(['rudderRight'])
  })

  it('ignores partial deflection', () => {
    expect(dc9ControlCheckReached(at({ pitch: 0.8 }), [])).toEqual([])
    expect(dc9ControlCheckReached(at({ thrust: 0.9 }), [])).toEqual([])
  })

  it('never re-reports an item that is already latched', () => {
    expect(dc9ControlCheckReached(at({ pitch: 1 }), ['yokeAft'])).toEqual([])
  })

  it('can latch two items in one frame when both stops are held', () => {
    expect(dc9ControlCheckReached(at({ pitch: 1, rudder: 1 }), [])).toEqual(['yokeAft', 'rudderRight'])
  })

  it('will not accept closed levers until they have been advanced', () => {
    // The levers start closed, so this must not tick for free at stage entry.
    expect(dc9ControlCheckReached(at({ thrust: 0 }), [])).toEqual([])
    expect(dc9ControlCheckReached(at({ thrust: 1 }), [])).toEqual(['thrustAdvance'])
    expect(dc9ControlCheckReached(at({ thrust: 0 }), ['thrustAdvance'])).toEqual(['thrustClosed'])
  })
})

describe('control check progress', () => {
  const everything = [...DC9_CONTROL_CHECK_ITEM_IDS]

  it('is complete only when every movement has been made', () => {
    expect(dc9ControlCheckComplete([])).toBe(false)
    expect(dc9ControlCheckComplete(everything.slice(0, -1))).toBe(false)
    expect(dc9ControlCheckComplete(everything)).toBe(true)
  })

  it('reports what is left', () => {
    expect(dc9ControlCheckRemaining(everything)).toEqual([])
    expect(dc9ControlCheckRemaining(['yokeAft'])).toHaveLength(everything.length - 1)
  })

  it('coaches the next reachable item, never a blocked one', () => {
    expect(dc9ControlCheckNextItem([])).toBe('yokeAft')
    const allButThrust = everything.filter((id) => id !== 'thrustAdvance' && id !== 'thrustClosed')
    expect(dc9ControlCheckNextItem(allButThrust)).toBe('thrustAdvance')
    expect(dc9ControlCheckNextItem([...allButThrust, 'thrustAdvance'])).toBe('thrustClosed')
    expect(dc9ControlCheckNextItem(everything)).toBeNull()
  })

  it('groups items for the checklist panel', () => {
    expect(dc9ControlCheckItemsInGroup('yoke')).toEqual(['yokeAft', 'yokeForward', 'wheelLeft', 'wheelRight'])
    expect(dc9ControlCheckItemsInGroup('rudder')).toEqual(['rudderLeft', 'rudderRight'])
    expect(dc9ControlCheckItemsInGroup('thrust')).toEqual(['thrustAdvance', 'thrustClosed'])
    const grouped = (['yoke', 'rudder', 'thrust'] as const).flatMap(dc9ControlCheckItemsInGroup)
    expect(grouped.sort()).toEqual([...everything].sort())
  })
})

describe('normalizeDc9ControlCheckProgress', () => {
  it('keeps known items in canonical order', () => {
    expect(normalizeDc9ControlCheckProgress(['wheelRight', 'yokeAft', 'yokeAft']))
      .toEqual(['yokeAft', 'wheelRight'])
  })

  it('drops anything it does not recognise', () => {
    expect(normalizeDc9ControlCheckProgress(['yokeAft', 'flapsDown', 7, null])).toEqual(['yokeAft'])
    expect(normalizeDc9ControlCheckProgress('yokeAft')).toEqual([])
    expect(normalizeDc9ControlCheckProgress(undefined)).toEqual([])
  })

  it('refuses a closed-lever tick that outlived its prerequisite', () => {
    expect(normalizeDc9ControlCheckProgress(['thrustClosed'])).toEqual([])
    expect(normalizeDc9ControlCheckProgress(['thrustAdvance', 'thrustClosed']))
      .toEqual(['thrustAdvance', 'thrustClosed'])
  })
})

describe('a full sweep', () => {
  it('latches all eight movements exactly once', () => {
    const sweep: Dc9ControlState[] = [
      at({ pitch: 1 }), at({ pitch: -1 }), at({ roll: -1 }), at({ roll: 1 }),
      at({ rudder: -1 }), at({ rudder: 1 }), at({ thrust: 1 }), at({ thrust: 0 }),
    ]
    let completed: Dc9ControlCheckItemId[] = []
    const seen: Dc9ControlCheckItemId[] = []
    for (const state of sweep) {
      const reached = dc9ControlCheckReached(state, completed)
      seen.push(...reached)
      completed = [...completed, ...reached]
    }
    expect(seen).toHaveLength(DC9_CONTROL_CHECK_ITEM_IDS.length)
    expect(new Set(seen).size).toBe(DC9_CONTROL_CHECK_ITEM_IDS.length)
    expect(dc9ControlCheckComplete(completed)).toBe(true)
  })
})
