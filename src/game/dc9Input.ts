/**
 * Input model for the parked DC-9 right-seat controls.
 *
 * Deliberately mirrors `airbusInput.ts` so keyboard, hold buttons and gamepad behave
 * the same in both cockpits. The difference is mechanical rather than stylistic: the
 * yoke and rudder pedals are spring-centred and fall back to neutral when released,
 * while the thrust levers stay wherever the player leaves them, exactly like the
 * pedestal they are modelled on.
 */

export interface Dc9ControlInput {
  /** Demand, -1 (push forward) to +1 (pull aft). */
  pitch: number
  /** Demand, -1 (wheel left) to +1 (wheel right). */
  roll: number
  /** Demand, -1 (close levers) to +1 (advance levers). */
  thrust: number
  /** Demand, -1 (left pedal) to +1 (right pedal). */
  rudder: number
}

export interface Dc9ControlState {
  /** Column position, -1 full forward to +1 full aft. */
  pitch: number
  /** Wheel position, -1 full left to +1 full right. */
  roll: number
  /** Lever position, 0 closed to 1 fully advanced. */
  thrust: number
  /** Pedal position, -1 full left to +1 full right. */
  rudder: number
}

export type Dc9HoldControl =
  | 'pitchAft'
  | 'pitchForward'
  | 'rollLeft'
  | 'rollRight'
  | 'thrustAdvance'
  | 'thrustClose'
  | 'rudderLeft'
  | 'rudderRight'

export type Dc9InputMethod = 'keyboard' | 'pointer' | 'gamepad' | 'accessible'

export interface Dc9GamepadSnapshot {
  axes: readonly number[]
  buttons: readonly number[]
}

export const ZERO_DC9_INPUT: Readonly<Dc9ControlInput> = { pitch: 0, roll: 0, thrust: 0, rudder: 0 }

export const NEUTRAL_DC9_CONTROLS: Readonly<Dc9ControlState> = { pitch: 0, roll: 0, thrust: 0, rudder: 0 }

const DC9_CONTROL_KEY_CODES = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'KeyW',
  'KeyS',
  'KeyA',
  'KeyD',
])

/** Seconds-to-stop rates. Spring axes drive faster than they recentre. */
const PITCH_ROLL_DRIVE_RATE = 2.2
const RUDDER_DRIVE_RATE = 1.8
const SPRING_RETURN_RATE = 3
/** Levers advance deliberately but close quickly, like pulling them to idle. */
const THRUST_ADVANCE_RATE = 0.9
const THRUST_CLOSE_RATE = 1.8

function clampAxis(value: number): number {
  return Math.max(-1, Math.min(1, Number.isFinite(value) ? value : 0))
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))
}

/** The DC-9 keyboard map: arrows for the yoke, W/S levers, A/D pedals. */
export function isDc9ControlKey(code: string): boolean {
  return DC9_CONTROL_KEY_CODES.has(code)
}

/** Return a fresh stopped control state without changing the public control-state shape. */
export function resetDc9Controls(): Dc9ControlState {
  return { ...NEUTRAL_DC9_CONTROLS }
}

export function normalizeDc9Axis(value: number, deadzone = 0.12): number {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0
  return Math.sign(value) * Math.min(1, (Math.abs(value) - deadzone) / (1 - deadzone))
}

export function dc9InputFromGamepad(snapshot: Dc9GamepadSnapshot | null): Dc9ControlInput {
  if (!snapshot) return { ...ZERO_DC9_INPUT }
  const leftTrigger = snapshot.buttons[6] ?? 0
  const rightTrigger = snapshot.buttons[7] ?? 0
  return {
    pitch: -normalizeDc9Axis(snapshot.axes[1] ?? 0),
    roll: normalizeDc9Axis(snapshot.axes[0] ?? 0),
    thrust: normalizeDc9Axis(rightTrigger - leftTrigger, 0.05),
    rudder: normalizeDc9Axis(snapshot.axes[2] ?? 0),
  }
}

function isActive(input: Dc9ControlInput): boolean {
  return Math.abs(input.pitch) + Math.abs(input.roll) + Math.abs(input.thrust) + Math.abs(input.rudder) > 0
}

/**
 * Fold every available input source into one demand. A direct drag on the yoke wins,
 * then the gamepad, then hold buttons and the keyboard, which are equivalent.
 */
export function combineDc9Input(
  keys: ReadonlySet<string>,
  holds: ReadonlySet<Dc9HoldControl>,
  gamepad: Dc9ControlInput,
  pointer: Partial<Dc9ControlInput> | null,
): { input: Dc9ControlInput; method: Dc9InputMethod } {
  const digital: Dc9ControlInput = {
    pitch: (keys.has('ArrowUp') || holds.has('pitchAft') ? 1 : 0)
      - (keys.has('ArrowDown') || holds.has('pitchForward') ? 1 : 0),
    roll: (keys.has('ArrowRight') || holds.has('rollRight') ? 1 : 0)
      - (keys.has('ArrowLeft') || holds.has('rollLeft') ? 1 : 0),
    thrust: (keys.has('KeyW') || holds.has('thrustAdvance') ? 1 : 0)
      - (keys.has('KeyS') || holds.has('thrustClose') ? 1 : 0),
    rudder: (keys.has('KeyD') || holds.has('rudderRight') ? 1 : 0)
      - (keys.has('KeyA') || holds.has('rudderLeft') ? 1 : 0),
  }
  if (pointer && isActive({ ...ZERO_DC9_INPUT, ...pointer })) {
    return { input: { ...digital, ...pointer }, method: 'pointer' }
  }
  if (isActive(gamepad)) return { input: gamepad, method: 'gamepad' }
  if (holds.size > 0) return { input: digital, method: 'accessible' }
  return { input: digital, method: 'keyboard' }
}

function approach(current: number, target: number, rate: number, deltaSeconds: number): number {
  const step = rate * deltaSeconds
  const difference = target - current
  if (Math.abs(difference) <= step) return target
  return current + Math.sign(difference) * step
}

/**
 * Advance the physical control positions by one frame. Spring axes chase the demand
 * and recentre when it is released; the thrust levers integrate their demand and hold
 * position.
 */
export function advanceDc9Controls(
  state: Dc9ControlState,
  input: Dc9ControlInput,
  deltaSeconds: number,
): Dc9ControlState {
  const delta = Number.isFinite(deltaSeconds) ? Math.max(0, Math.min(0.1, deltaSeconds)) : 0
  const pitchDemand = clampAxis(input.pitch)
  const rollDemand = clampAxis(input.roll)
  const rudderDemand = clampAxis(input.rudder)
  return {
    pitch: approach(
      clampAxis(state.pitch),
      pitchDemand,
      pitchDemand === 0 ? SPRING_RETURN_RATE : PITCH_ROLL_DRIVE_RATE,
      delta,
    ),
    roll: approach(
      clampAxis(state.roll),
      rollDemand,
      rollDemand === 0 ? SPRING_RETURN_RATE : PITCH_ROLL_DRIVE_RATE,
      delta,
    ),
    rudder: approach(
      clampAxis(state.rudder),
      rudderDemand,
      rudderDemand === 0 ? SPRING_RETURN_RATE : RUDDER_DRIVE_RATE,
      delta,
    ),
    thrust: clamp01(clamp01(state.thrust) + clampAxis(input.thrust)
      * (clampAxis(input.thrust) < 0 ? THRUST_CLOSE_RATE : THRUST_ADVANCE_RATE) * delta),
  }
}
