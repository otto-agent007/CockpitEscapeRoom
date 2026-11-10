export interface AirbusFlightInput {
  pitch: number
  bank: number
  thrust: number
  directional: number
}

export type AirbusHoldControl =
  | 'pitchUp'
  | 'pitchDown'
  | 'bankLeft'
  | 'bankRight'
  | 'thrustUp'
  | 'thrustDown'
  | 'balanceLeft'
  | 'balanceRight'

export type AirbusInputMethod = 'keyboard' | 'gamepad' | 'accessible'

export interface AirbusGamepadSnapshot {
  axes: readonly number[]
  buttons: readonly number[]
}

export const ZERO_AIRBUS_INPUT: Readonly<AirbusFlightInput> = {
  pitch: 0,
  bank: 0,
  thrust: 0,
  directional: 0,
}

export function normalizeAirbusAxis(value: number, deadzone = 0.12): number {
  if (!Number.isFinite(value) || Math.abs(value) <= deadzone) return 0
  return Math.sign(value) * Math.min(1, (Math.abs(value) - deadzone) / (1 - deadzone))
}

export function airbusInputFromGamepad(
  snapshot: AirbusGamepadSnapshot | null,
  directionalEnabled: boolean,
): AirbusFlightInput {
  if (!snapshot) return { ...ZERO_AIRBUS_INPUT }
  const leftTrigger = snapshot.buttons[6] ?? 0
  const rightTrigger = snapshot.buttons[7] ?? 0
  return {
    pitch: -normalizeAirbusAxis(snapshot.axes[1] ?? 0),
    bank: normalizeAirbusAxis(snapshot.axes[0] ?? 0),
    thrust: normalizeAirbusAxis(rightTrigger - leftTrigger, 0.05),
    directional: directionalEnabled
      ? normalizeAirbusAxis(snapshot.axes[2] ?? 0)
      : 0,
  }
}

export function combineAirbusInput(
  keys: ReadonlySet<string>,
  holds: ReadonlySet<AirbusHoldControl>,
  gamepad: AirbusFlightInput,
  directionalEnabled: boolean,
): { input: AirbusFlightInput; method: AirbusInputMethod } {
  const accessibleActive = holds.size > 0
  const keyboardActive = keys.size > 0
  const digital: AirbusFlightInput = {
    pitch: (keys.has('ArrowUp') || holds.has('pitchUp') ? 1 : 0)
      - (keys.has('ArrowDown') || holds.has('pitchDown') ? 1 : 0),
    bank: (keys.has('ArrowRight') || holds.has('bankRight') ? 1 : 0)
      - (keys.has('ArrowLeft') || holds.has('bankLeft') ? 1 : 0),
    thrust: (keys.has('KeyW') || holds.has('thrustUp') ? 1 : 0)
      - (keys.has('KeyS') || holds.has('thrustDown') ? 1 : 0),
    directional: directionalEnabled
      ? (keys.has('KeyD') || holds.has('balanceRight') ? 1 : 0)
        - (keys.has('KeyA') || holds.has('balanceLeft') ? 1 : 0)
      : 0,
  }
  const gamepadActive = Math.abs(gamepad.pitch) +
    Math.abs(gamepad.bank) +
    Math.abs(gamepad.thrust) +
    Math.abs(gamepad.directional) > 0
  return {
    input: gamepadActive ? gamepad : digital,
    method: gamepadActive
      ? 'gamepad'
      : accessibleActive
        ? 'accessible'
        : keyboardActive
          ? 'keyboard'
          : 'keyboard',
  }
}
