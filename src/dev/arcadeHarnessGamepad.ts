/**
 * Mars arcade box harness — game controllers.
 *
 * A controller holds the same key codes as its player's keyboard bindings, so taps,
 * holds, pause-and-step and Sam's motion input behave exactly as they do from the
 * keyboard. USB and Bluetooth controllers reach the browser the same way.
 *
 * Dev-only. Nothing in `src/dev/` is imported by the application, so none of it
 * reaches the production bundle.
 */

import type { ArcadeKeyBindings } from './arcadeHarnessInput'

/** The part of a browser `Gamepad` the harness reads. */
export interface ArcadePad {
  index: number
  id: string
  mapping: string
  connected: boolean
  axes: readonly number[]
  buttons: readonly { pressed: boolean }[]
}

export type ArcadeSide = 0 | 1

/** Harness commands a controller can send, named by the key that sends them. */
export type PadCommand = 'Space' | 'KeyR'

export interface PadReading {
  held: Set<string>
  commands: Set<PadCommand>
}

/** W3C "standard" mapping indices. Xbox, PlayStation, Switch Pro and 8BitDo pads use them. */
const BUTTON = {
  south: 0, // A · Cross
  east: 1, // B · Circle
  west: 2, // X · Square
  north: 3, // Y · Triangle
  back: 8, // Back · Share · Select · Minus
  start: 9, // Start · Options · Plus
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const

/** Half travel: a resting stick never walks, and a diagonal still reads both ways. */
export const PAD_STICK_DEADZONE = 0.5

export function readPad(pad: ArcadePad, bindings: ArcadeKeyBindings): PadReading {
  const pressed = (index: number) => pad.buttons[index]?.pressed === true
  // Only the standard mapping promises where the d-pad is. Anything else still gets
  // the left stick and the four face buttons.
  const dpad = (index: number) => pad.mapping === 'standard' && pressed(index)
  const x = pad.axes[0] ?? 0
  const y = pad.axes[1] ?? 0
  const held = new Set<string>()
  if (x <= -PAD_STICK_DEADZONE || dpad(BUTTON.left)) held.add(bindings.left)
  if (x >= PAD_STICK_DEADZONE || dpad(BUTTON.right)) held.add(bindings.right)
  if (y <= -PAD_STICK_DEADZONE || dpad(BUTTON.up) || pressed(BUTTON.south)) held.add(bindings.jump)
  if (bindings.down && (y >= PAD_STICK_DEADZONE || dpad(BUTTON.down))) held.add(bindings.down)
  if (pressed(BUTTON.west)) held.add(bindings.light)
  if (pressed(BUTTON.north)) held.add(bindings.heavy)
  if (pressed(BUTTON.east)) held.add(bindings.special)
  const commands = new Set<PadCommand>()
  if (pressed(BUTTON.start)) commands.add('Space')
  if (pressed(BUTTON.back)) commands.add('KeyR')
  return { held, commands }
}

/**
 * Seat newly connected controllers on the first free side, P1 before P2.
 *
 * A controller keeps its side until it disconnects, so P1's flat battery never
 * hands P1 to the P2 controller mid-round. A third controller waits for a free side.
 */
export function updatePadSides(
  previous: ReadonlyMap<number, ArcadeSide>,
  connected: readonly number[],
): Map<number, ArcadeSide> {
  const sides = new Map([...previous].filter(([index]) => connected.includes(index)))
  for (const index of [...connected].sort((a, b) => a - b)) {
    if (sides.has(index)) continue
    const taken = new Set(sides.values())
    const free = ([0, 1] as const).find(side => !taken.has(side))
    if (free === undefined) break
    sides.set(index, free)
  }
  return sides
}

/** One controller moves to the other side; two controllers trade sides. */
export function swapPadSides(sides: ReadonlyMap<number, ArcadeSide>): Map<number, ArcadeSide> {
  return new Map([...sides].map(([index, side]) => [index, side === 0 ? 1 : 0]))
}

/** "Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e …)" or "045e-0b13-Xbox …" → "Xbox Wireless Controller". */
export function padName(id: string): string {
  const name = id.replace(/\s*\([^)]*\)\s*$/, '').replace(/^[0-9a-f]{1,4}-[0-9a-f]{1,4}-/i, '').trim()
  return name || 'Controller'
}

export function padStatus(
  sides: ReadonlyMap<number, ArcadeSide>,
  pads: readonly ArcadePad[],
): string {
  const seated = ([0, 1] as const).flatMap(side => {
    const index = [...sides].find(([, seat]) => seat === side)?.[0]
    const pad = pads.find(candidate => candidate.index === index)
    if (!pad) return []
    const layout = pad.mapping === 'standard' ? '' : ' (unrecognised layout: left stick and face buttons only)'
    return [`P${side + 1} controller: ${padName(pad.id)}${layout}`]
  })
  if (seated.length === 0) {
    return 'No controller yet. Plug one in by USB or pair it by Bluetooth, then press any button on it.'
  }
  if (seated.length === 1) {
    const free = [...sides.values()].includes(0) ? 2 : 1
    return `${seated[0]}. P${free} plays on the keyboard, or press a button on a second controller.`
  }
  return seated.join(' · ')
}
