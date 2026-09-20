import { describe, expect, it } from 'vitest'
import {
  MARS_ARCADE_TIMING,
  NEUTRAL_MARS_ARCADE_INPUT,
  advanceMarsArcade,
  createMarsArcadeRound,
  type MarsArcadeInput,
  type MarsArcadeState,
} from './marsArcade'
import {
  advanceMarsArcadeOpponent,
  createMarsArcadeOpponent,
  type MarsArcadeDifficulty,
  type MarsArcadeOpponent,
} from './marsArcadeOpponent'
import { MARS_ARCADE_FIGHTERS } from './marsArcadeFighters'

const neutral = (): MarsArcadeInput => ({ ...NEUTRAL_MARS_ARCADE_INPUT })

function startedRound(): MarsArcadeState {
  let state = createMarsArcadeRound('booster', 'oracle')
  for (let frame = 0; frame < MARS_ARCADE_TIMING.introFrames; frame += 1) {
    state = advanceMarsArcade(state, [neutral(), neutral()], MARS_ARCADE_TIMING.frameSeconds).state
  }
  return state
}

/** Run the opponent on side 1 against a completely passive player. */
function runOpponent(
  seed: number,
  frames: number,
  difficulty: MarsArcadeDifficulty = 'veteran',
  initial: MarsArcadeState = startedRound(),
): { state: MarsArcadeState; inputs: MarsArcadeInput[]; opponent: MarsArcadeOpponent } {
  let state = initial
  let opponent = createMarsArcadeOpponent(1, difficulty, seed)
  const inputs: MarsArcadeInput[] = []
  for (let frame = 0; frame < frames; frame += 1) {
    const decision = advanceMarsArcadeOpponent(opponent, state)
    opponent = decision.opponent
    inputs.push(decision.input)
    state = advanceMarsArcade(
      state,
      [neutral(), decision.input],
      MARS_ARCADE_TIMING.frameSeconds,
    ).state
  }
  return { state, inputs, opponent }
}

describe('mars arcade opponent', () => {
  it('replays identically for the same seed', () => {
    const first = runOpponent(1234, 300)
    const second = runOpponent(1234, 300)
    expect(first.inputs).toEqual(second.inputs)
    expect(first.state).toEqual(second.state)
  })

  it('behaves differently for a different seed', () => {
    const first = runOpponent(1234, 300)
    const other = runOpponent(98765, 300)
    expect(first.inputs).not.toEqual(other.inputs)
  })

  it('stays still until the round actually starts', () => {
    const intro = createMarsArcadeRound('booster', 'oracle')
    const opponent = createMarsArcadeOpponent(1, 'veteran', 7)
    const decision = advanceMarsArcadeOpponent(opponent, intro)
    expect(decision.input).toEqual(NEUTRAL_MARS_ARCADE_INPUT)
    expect(decision.opponent.intent).toBe('wait')
  })

  it('closes the distance from across the stage', () => {
    const start = startedRound()
    const separated: MarsArcadeState = {
      ...start,
      fighters: [
        { ...start.fighters[0], x: -130 },
        { ...start.fighters[1], x: 130 },
      ],
    }
    const result = runOpponent(42, 420, 'veteran', separated)
    const finalSeparation = Math.abs(result.state.fighters[1].x - result.state.fighters[0].x)
    expect(finalSeparation).toBeLessThan(260)
    expect(result.state.fighters[0].health).toBeLessThan(100)
  })

  it('actually attacks a passive player', () => {
    const result = runOpponent(2026, 900)
    expect(result.state.fighters[0].health).toBeLessThan(100)
    expect(result.inputs.some((input) => input.light || input.heavy || input.special)).toBe(true)
  })

  it('answers its own landing window, and the veteran answers it more often', () => {
    const base = createMarsArcadeRound('oracle', 'booster')
    const fight: MarsArcadeState = { ...base, phase: 'fight' }
    const special = MARS_ARCADE_FIGHTERS.booster.moves.special
    const window = special.landingWindow
    expect(window).toBeDefined()
    const insideWindow: MarsArcadeState = {
      ...fight,
      fighters: [
        fight.fighters[0],
        {
          ...fight.fighters[1],
          activity: 'attack',
          activeButton: 'special',
          landingResolved: false,
          moveFrame: special.startupFrames + special.activeFrames + (window?.openFrame ?? 0),
        },
      ],
    }

    const answers = (difficulty: MarsArcadeDifficulty) =>
      Array.from({ length: 24 }, (_, seed) =>
        advanceMarsArcadeOpponent(createMarsArcadeOpponent(1, difficulty, seed), insideWindow).input,
      ).filter((input) => input.special).length

    const rookieAnswers = answers('rookie')
    const veteranAnswers = answers('veteran')
    expect(veteranAnswers).toBeGreaterThan(rookieAnswers)
    expect(rookieAnswers).toBeGreaterThan(0)
  })
})
