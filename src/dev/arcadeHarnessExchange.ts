/** A repeatable, dev-only input recording. Outcomes still come from the fight engine. */
import {
  advanceMarsArcade,
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  type MarsArcadeInput,
  type MarsArcadeState,
  type MarsArcadeTransition,
} from '../game/marsArcade'

export const EXCHANGE_END_FRAME = 460

function inputs(frame: number): [MarsArcadeInput, MarsArcadeInput] {
  return [
    {
      ...NEUTRAL_MARS_ARCADE_INPUT,
      // Eight follow-up steps stop inside jab range without pushing Sam along.
      move: (frame >= 90 && frame <= 150) || (frame >= 190 && frame <= 197) ||
        (frame >= 300 && frame <= 309) ? 1 : frame >= 330 && frame <= 335 ? -1 : 0,
      light: frame === 162 || frame === 222,
    },
    {
      ...NEUTRAL_MARS_ARCADE_INPUT,
      move: frame >= 162 && frame <= 184 ? 1 : 0,
      light: frame === 330 || frame === 410,
    },
  ]
}

export function advanceExchange(state: MarsArcadeState, elapsedSeconds: number): MarsArcadeTransition {
  if (state.frame >= EXCHANGE_END_FRAME || elapsedSeconds <= 0 || !Number.isFinite(elapsedSeconds)) {
    return { state, events: [] }
  }
  const events: MarsArcadeTransition['events'] = []
  const step = MARS_ARCADE_TIMING.frameSeconds
  let remaining = state.carrySeconds + Math.min(elapsedSeconds, MARS_ARCADE_TIMING.maxFrameDeltaSeconds)
  let next = state
  // Sample each simulation tick, not each browser render: even a delayed frame
  // must deliver each one-tick press exactly once.
  while (remaining >= step && next.frame < EXCHANGE_END_FRAME) {
    const result = advanceMarsArcade({ ...next, carrySeconds: 0 }, inputs(next.frame), step)
    next = result.state
    events.push(...result.events)
    remaining -= step
  }
  return { state: { ...next, carrySeconds: next.frame === EXCHANGE_END_FRAME ? 0 : remaining }, events }
}
