import { describe, expect, it } from 'vitest'
import {
  NEUTRAL_DC9_CONTROLS,
  advanceDc9Controls,
  combineDc9Input,
  dc9InputFromGamepad,
  isDc9ControlKey,
  normalizeDc9Axis,
  resetDc9Controls,
  type Dc9ControlState,
  type Dc9HoldControl,
} from './dc9Input'

const noKeys = new Set<string>()
const noHolds = new Set<Dc9HoldControl>()
const noGamepad = { pitch: 0, roll: 0, thrust: 0, rudder: 0 }

/** Run the loop until it settles or gives up, so tests read as "hold this and see". */
function hold(
  input: Partial<Dc9ControlState>,
  seconds: number,
  from: Dc9ControlState = { ...NEUTRAL_DC9_CONTROLS },
): Dc9ControlState {
  let state = from
  const step = 1 / 60
  for (let elapsed = 0; elapsed < seconds; elapsed += step) {
    state = advanceDc9Controls(state, { ...noGamepad, ...input }, step)
  }
  return state
}

describe('normalizeDc9Axis', () => {
  it('ignores movement inside the deadzone', () => {
    expect(normalizeDc9Axis(0.1)).toBe(0)
    expect(normalizeDc9Axis(-0.1)).toBe(0)
  })

  it('rescales the live range so it still reaches full deflection', () => {
    expect(normalizeDc9Axis(1)).toBe(1)
    expect(normalizeDc9Axis(-1)).toBe(-1)
    expect(normalizeDc9Axis(0.56)).toBeCloseTo(0.5, 2)
  })

  it('treats non-finite input as centred', () => {
    expect(normalizeDc9Axis(Number.NaN)).toBe(0)
  })
})

describe('Memphis departure input', () => {
  it('never claims Space as a DC-9 control key now that the brake hold is retired', () => {
    expect(isDc9ControlKey('Space')).toBe(false)
    expect(isDc9ControlKey('KeyW')).toBe(true)
    expect(isDc9ControlKey('ArrowUp')).toBe(true)
  })

  it('resets every physical DC-9 control to its stopped position', () => {
    expect(resetDc9Controls()).toEqual({ pitch: 0, roll: 0, thrust: 0, rudder: 0 })
  })
})

describe('combineDc9Input', () => {
  it('maps the keyboard to the right controls', () => {
    const { input, method } = combineDc9Input(new Set(['ArrowUp', 'KeyD']), noHolds, noGamepad, null)
    expect(input).toEqual({ pitch: 1, roll: 0, thrust: 0, rudder: 1 })
    expect(method).toBe('keyboard')
  })

  it('cancels opposing keys instead of picking one', () => {
    const { input } = combineDc9Input(new Set(['ArrowUp', 'ArrowDown']), noHolds, noGamepad, null)
    expect(input.pitch).toBe(0)
  })

  it('treats hold buttons as an equal path to the keyboard', () => {
    const { input, method } = combineDc9Input(noKeys, new Set<Dc9HoldControl>(['rollLeft']), noGamepad, null)
    expect(input.roll).toBe(-1)
    expect(method).toBe('accessible')
  })

  it('prefers a live gamepad over the keyboard', () => {
    const gamepad = { pitch: -0.8, roll: 0, thrust: 0, rudder: 0 }
    const { input, method } = combineDc9Input(new Set(['ArrowUp']), noHolds, gamepad, null)
    expect(input.pitch).toBe(-0.8)
    expect(method).toBe('gamepad')
  })

  it('lets a drag on the yoke override everything else on the axes it drives', () => {
    const { input, method } = combineDc9Input(
      new Set(['KeyW']),
      noHolds,
      { pitch: 0.5, roll: 0, thrust: 0, rudder: 0 },
      { pitch: -1, roll: 0.25 },
    )
    expect(input.pitch).toBe(-1)
    expect(input.roll).toBe(0.25)
    // The pedestal is not part of the drag, so the keyboard still works there.
    expect(input.thrust).toBe(1)
    expect(method).toBe('pointer')
  })

  it('ignores a pointer that is not deflecting anything', () => {
    const { method } = combineDc9Input(new Set(['ArrowUp']), noHolds, noGamepad, { pitch: 0, roll: 0 })
    expect(method).toBe('keyboard')
  })
})

describe('dc9InputFromGamepad', () => {
  it('reads sticks and triggers', () => {
    const input = dc9InputFromGamepad({ axes: [1, -1, 0.5], buttons: [0, 0, 0, 0, 0, 0, 0, 1] })
    expect(input.roll).toBe(1)
    expect(input.pitch).toBe(1)
    expect(input.thrust).toBe(1)
    expect(input.rudder).toBeCloseTo(0.43, 2)
  })

  it('is centred with no pad attached', () => {
    expect(dc9InputFromGamepad(null)).toEqual(NEUTRAL_DC9_CONTROLS)
  })
})

describe('advanceDc9Controls', () => {
  it('drives the yoke to its stop and holds it there', () => {
    const held = hold({ pitch: 1 }, 1)
    expect(held.pitch).toBe(1)
  })

  it('springs the yoke, wheel and pedals back to neutral on release', () => {
    const deflected = hold({ pitch: 1, roll: -1, rudder: 1 }, 1)
    const released = hold({}, 1, deflected)
    expect(released.pitch).toBe(0)
    expect(released.roll).toBe(0)
    expect(released.rudder).toBe(0)
  })

  it('leaves the thrust levers wherever the player stops pushing', () => {
    const advanced = hold({ thrust: 1 }, 1)
    expect(advanced.thrust).toBeGreaterThan(0.5)
    const released = hold({}, 2, advanced)
    expect(released.thrust).toBe(advanced.thrust)
  })

  it('clamps the levers between closed and fully forward', () => {
    expect(hold({ thrust: 1 }, 6).thrust).toBe(1)
    expect(hold({ thrust: -1 }, 6, hold({ thrust: 1 }, 6)).thrust).toBe(0)
  })

  it('survives absurd frame times without teleporting a control', () => {
    const stepped = advanceDc9Controls({ ...NEUTRAL_DC9_CONTROLS }, { ...noGamepad, pitch: 1 }, 500)
    expect(stepped.pitch).toBeLessThanOrEqual(1)
    const broken = advanceDc9Controls({ ...NEUTRAL_DC9_CONTROLS }, { ...noGamepad, pitch: 1 }, Number.NaN)
    expect(broken.pitch).toBe(0)
  })

  it('recovers from a corrupt stored position', () => {
    const repaired = advanceDc9Controls(
      { pitch: 99, roll: Number.NaN, thrust: -5, rudder: 42 },
      noGamepad,
      1 / 60,
    )
    expect(repaired.pitch).toBeLessThanOrEqual(1)
    expect(repaired.roll).toBe(0)
    expect(repaired.thrust).toBe(0)
    expect(repaired.rudder).toBeLessThanOrEqual(1)
  })
})
