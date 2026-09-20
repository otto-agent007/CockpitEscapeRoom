/**
 * Mars arcade box harness — keyboard mapping.
 *
 * Dev-only. Nothing in `src/dev/` is imported by the application, so none of it
 * reaches the production bundle.
 */

import { NEUTRAL_MARS_ARCADE_INPUT, type MarsArcadeInput } from '../game/marsArcade'

export interface ArcadeKeyBindings {
  left: string
  right: string
  jump: string
  light: string
  heavy: string
  special: string
}

export const PLAYER_ONE_BINDINGS: ArcadeKeyBindings = {
  left: 'KeyA',
  right: 'KeyD',
  jump: 'KeyW',
  light: 'KeyJ',
  heavy: 'KeyK',
  special: 'KeyL',
}

export const PLAYER_TWO_BINDINGS: ArcadeKeyBindings = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  jump: 'ArrowUp',
  light: 'Comma',
  heavy: 'Period',
  special: 'Slash',
}

export function inputFromKeys(
  held: ReadonlySet<string>,
  bindings: ArcadeKeyBindings,
): MarsArcadeInput {
  const left = held.has(bindings.left) ? 1 : 0
  const right = held.has(bindings.right) ? 1 : 0
  return {
    ...NEUTRAL_MARS_ARCADE_INPUT,
    // Holding both directions is a dead stop, not a jitter between them.
    move: right - left,
    jump: held.has(bindings.jump),
    light: held.has(bindings.light),
    heavy: held.has(bindings.heavy),
    special: held.has(bindings.special),
  }
}
