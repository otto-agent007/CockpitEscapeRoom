import { describe, expect, it } from 'vitest'
import {
  padName,
  padStatus,
  readPad,
  swapPadSides,
  updatePadSides,
  type ArcadePad,
} from './arcadeHarnessGamepad'
import { PLAYER_ONE_BINDINGS, PLAYER_TWO_BINDINGS, inputFromKeys } from './arcadeHarnessInput'

function pad(options: { index?: number; buttons?: number[]; axes?: number[]; mapping?: string; id?: string } = {}): ArcadePad {
  const pressed = new Set(options.buttons ?? [])
  return {
    index: options.index ?? 0,
    id: options.id ?? 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)',
    mapping: options.mapping ?? 'standard',
    connected: true,
    axes: options.axes ?? [0, 0, 0, 0],
    buttons: Array.from({ length: 17 }, (_, button) => ({ pressed: pressed.has(button) })),
  }
}

describe('arcade controller mapping', () => {
  it('is neutral at rest, including a stick drifting inside the deadzone', () => {
    const reading = readPad(pad({ axes: [0.3, -0.4, 0, 0] }), PLAYER_ONE_BINDINGS)
    expect([...reading.held]).toEqual([])
    expect([...reading.commands]).toEqual([])
  })

  it('walks and jumps from the d-pad and from the left stick', () => {
    expect(inputFromKeys(readPad(pad({ buttons: [15] }), PLAYER_ONE_BINDINGS).held, PLAYER_ONE_BINDINGS).move).toBe(1)
    expect(inputFromKeys(readPad(pad({ buttons: [14] }), PLAYER_ONE_BINDINGS).held, PLAYER_ONE_BINDINGS).move).toBe(-1)
    expect(inputFromKeys(readPad(pad({ axes: [-0.9, 0] }), PLAYER_ONE_BINDINGS).held, PLAYER_ONE_BINDINGS).move).toBe(-1)
    expect(readPad(pad({ buttons: [12] }), PLAYER_ONE_BINDINGS).held).toContain('KeyW')
    expect(readPad(pad({ axes: [0, -0.8] }), PLAYER_ONE_BINDINGS).held).toContain('KeyW')
  })

  it('maps the four face buttons to jump, special, light and heavy', () => {
    const input = inputFromKeys(readPad(pad({ buttons: [0, 1, 2, 3] }), PLAYER_ONE_BINDINGS).held, PLAYER_ONE_BINDINGS)
    expect(input).toMatchObject({ jump: true, special: true, light: true, heavy: true })
    expect([...readPad(pad({ buttons: [2] }), PLAYER_ONE_BINDINGS).held]).toEqual(['KeyJ'])
    expect([...readPad(pad({ buttons: [3] }), PLAYER_ONE_BINDINGS).held]).toEqual(['KeyK'])
    expect([...readPad(pad({ buttons: [1] }), PLAYER_ONE_BINDINGS).held]).toEqual(['KeyL'])
  })

  it('reads a stick diagonal as down-forward for the motion input', () => {
    const held = readPad(pad({ axes: [0.71, 0.71] }), PLAYER_ONE_BINDINGS).held
    expect([...held].sort()).toEqual(['KeyD', 'KeyS'])
  })

  it('presses the P2 keys for a P2 controller', () => {
    const held = readPad(pad({ buttons: [15, 2] }), PLAYER_TWO_BINDINGS).held
    expect([...held].sort()).toEqual(['ArrowRight', 'Comma'])
    expect(inputFromKeys(held, PLAYER_ONE_BINDINGS).move).toBe(0)
  })

  it('sends pause from Start and restart from Back', () => {
    expect([...readPad(pad({ buttons: [9] }), PLAYER_ONE_BINDINGS).commands]).toEqual(['Space'])
    expect([...readPad(pad({ buttons: [8] }), PLAYER_ONE_BINDINGS).commands]).toEqual(['KeyR'])
  })

  it('skips a non-standard pad\'s unknown d-pad but keeps its stick and face buttons', () => {
    expect([...readPad(pad({ mapping: '', buttons: [12, 13, 14, 15] }), PLAYER_ONE_BINDINGS).held]).toEqual([])
    expect([...readPad(pad({ mapping: '', buttons: [0, 2] }), PLAYER_ONE_BINDINGS).held].sort()).toEqual(['KeyJ', 'KeyW'])
    expect(readPad(pad({ mapping: '', axes: [1, 0] }), PLAYER_ONE_BINDINGS).held).toContain('KeyD')
  })
})

describe('arcade controller seats', () => {
  it('seats the first controller on P1 and the second on P2', () => {
    const one = updatePadSides(new Map(), [0])
    expect([...one]).toEqual([[0, 0]])
    expect([...updatePadSides(one, [0, 1])]).toEqual([[0, 0], [1, 1]])
  })

  it('keeps P2 on P2 when P1 disconnects, and refills P1 first', () => {
    const both = updatePadSides(new Map(), [0, 1])
    const p2Only = updatePadSides(both, [1])
    expect([...p2Only]).toEqual([[1, 1]])
    expect([...updatePadSides(p2Only, [1, 2])].sort()).toEqual([[1, 1], [2, 0]])
  })

  it('leaves a third controller unseated', () => {
    expect([...updatePadSides(new Map(), [0, 1, 2])]).toEqual([[0, 0], [1, 1]])
  })

  it('swaps one controller across, or two controllers with each other', () => {
    expect([...swapPadSides(new Map([[0, 0]]))]).toEqual([[0, 1]])
    expect([...swapPadSides(new Map([[0, 0], [1, 1]]))]).toEqual([[0, 1], [1, 0]])
    // A swapped lone controller stays on P2, and a newcomer takes the free P1.
    expect([...updatePadSides(new Map([[0, 1]]), [0, 1])]).toEqual([[0, 1], [1, 0]])
  })
})

describe('arcade controller status', () => {
  it('names Chrome and Firefox controller ids plainly', () => {
    expect(padName('Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)')).toBe('Xbox Wireless Controller')
    expect(padName('054c-0ce6-DualSense Wireless Controller')).toBe('DualSense Wireless Controller')
    expect(padName('')).toBe('Controller')
  })

  it('says how to connect when nothing is seated', () => {
    expect(padStatus(new Map(), [])).toMatch(/press any button/)
  })

  it('names the keyboard side when one controller is seated', () => {
    expect(padStatus(new Map([[0, 0]]), [pad()])).toBe(
      'P1 controller: Xbox Wireless Controller. P2 plays on the keyboard, or press a button on a second controller.',
    )
    expect(padStatus(new Map([[0, 1]]), [pad()])).toMatch(/^P2 controller: .*P1 plays on the keyboard/)
  })

  it('lists both players and flags an unrecognised layout', () => {
    const pads = [pad(), pad({ index: 1, mapping: '', id: '0079-0006-Generic USB Joystick' })]
    expect(padStatus(new Map([[0, 0], [1, 1]]), pads)).toBe(
      'P1 controller: Xbox Wireless Controller · P2 controller: Generic USB Joystick (unrecognised layout: left stick and face buttons only)',
    )
  })
})
