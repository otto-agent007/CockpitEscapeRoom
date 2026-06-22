import { dc9Atmosphere } from './config'

export const GAME_SCHEMA_VERSION = 1 as const
export const SWITCH_ORDER = ['battery', 'navigation', 'cabin'] as const
export const PUZZLE_IDS = ['power', 'route'] as const
export type SwitchId = (typeof SWITCH_ORDER)[number]
export type GameMode = 'crew' | 'captain'
export type GamePhase = 'briefing' | 'power' | 'route' | 'complete' | 'mars'
export type PuzzleId = (typeof PUZZLE_IDS)[number]

export interface GameState {
  schemaVersion: typeof GAME_SCHEMA_VERSION
  mode: GameMode
  phase: GamePhase
  switchSequence: SwitchId[]
  routeSelections: string[]
  completedPuzzles: PuzzleId[]
  hintsUsed: number
  captainRewardUnlocked: boolean
  marsUnlocked: boolean
  statusMessage: string
}

export type GameAction =
  | { type: 'SET_MODE'; mode: GameMode }
  | { type: 'START' }
  | { type: 'ACTIVATE_SWITCH'; switchId: SwitchId }
  | { type: 'TOGGLE_ROUTE'; code: string }
  | { type: 'SUBMIT_ROUTE' }
  | { type: 'USE_HINT' }
  | { type: 'UNLOCK_MARS' }
  | { type: 'RETURN_TO_COMPLETE' }
  | { type: 'RESET' }

export function createInitialState(mode: GameMode = 'crew'): GameState {
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    mode,
    phase: 'briefing',
    switchSequence: [],
    routeSelections: [],
    completedPuzzles: [],
    hintsUsed: 0,
    captainRewardUnlocked: false,
    marsUnlocked: false,
    statusMessage: 'Select a mode, then begin the commemorative flight.',
  }
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)]
}

function sameCodeSet(actual: string[], expected: readonly string[]): boolean {
  if (actual.length !== expected.length) return false
  const sortedActual = [...actual].sort()
  const sortedExpected = [...expected].sort()
  return sortedActual.every((value, index) => value === sortedExpected[index])
}

function hintFor(state: GameState): string {
  if (state.phase === 'power') {
    if (state.mode === 'crew') return 'Start with stored power, then restore navigation, then the cabin circuit.'
    return 'Think source first, guidance second, passengers third.'
  }

  if (state.phase === 'route') {
    if (state.mode === 'crew') return 'Choose three short Southern feeder routes into Memphis.'
    return 'The answer is three short-haul codes from the Southern funnel, not trunk or international destinations.'
  }

  return 'No hint is needed at this stage.'
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_MODE':
      if (state.phase !== 'briefing') return state
      return {
        ...state,
        mode: action.mode,
        statusMessage:
          action.mode === 'captain'
            ? 'Captain Mode selected: fewer labels, same fair puzzles.'
            : 'Crew Mode selected: city names and clearer prompts are enabled.',
      }

    case 'START':
      if (state.phase !== 'briefing') return state
      return {
        ...state,
        phase: 'power',
        statusMessage: 'Inspect the panel and restore the three fictional circuits in sequence.',
      }

    case 'ACTIVATE_SWITCH': {
      if (state.phase !== 'power') return state
      const expected = SWITCH_ORDER[state.switchSequence.length]

      if (action.switchId === expected) {
        const nextSequence = [...state.switchSequence, action.switchId]
        const complete = nextSequence.length === SWITCH_ORDER.length
        return {
          ...state,
          switchSequence: nextSequence,
          phase: complete ? 'route' : state.phase,
          completedPuzzles: complete ? unique([...state.completedPuzzles, 'power']) : state.completedPuzzles,
          statusMessage: complete
            ? 'Power restored. A Memphis route strip has released from the panel.'
            : `Correct. ${SWITCH_ORDER.length - nextSequence.length} circuit${SWITCH_ORDER.length - nextSequence.length === 1 ? '' : 's'} remaining.`,
        }
      }

      return {
        ...state,
        switchSequence: [],
        statusMessage: 'That sequence did not latch. The current puzzle reset; completed progress remains safe.',
      }
    }

    case 'TOGGLE_ROUTE': {
      if (state.phase !== 'route') return state
      const selected = state.routeSelections.includes(action.code)
      if (selected) {
        return {
          ...state,
          routeSelections: state.routeSelections.filter((code) => code !== action.code),
          statusMessage: `${action.code} removed from the route strip.`,
        }
      }
      if (state.routeSelections.length >= dc9Atmosphere.routePuzzleAnswers.length) {
        return {
          ...state,
          statusMessage: 'The route strip holds three codes. Remove one before choosing another.',
        }
      }
      return {
        ...state,
        routeSelections: [...state.routeSelections, action.code],
        statusMessage: `${action.code} added to the Memphis feeder route.`,
      }
    }

    case 'SUBMIT_ROUTE': {
      if (state.phase !== 'route') return state
      const correct = sameCodeSet(state.routeSelections, dc9Atmosphere.routePuzzleAnswers)
      if (!correct) {
        return {
          ...state,
          routeSelections: [],
          statusMessage: 'Those routes do not form the intended Southern funnel. Try another three; power remains restored.',
        }
      }
      return {
        ...state,
        phase: 'complete',
        completedPuzzles: unique([...state.completedPuzzles, 'route']),
        captainRewardUnlocked: state.mode === 'captain',
        statusMessage:
          state.mode === 'captain'
            ? 'Captain Mode complete. The hangar reward sequence is authorized.'
            : 'Crew Mode complete. Captain Mode remains available for the red Model Y reward.',
      }
    }

    case 'USE_HINT':
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        statusMessage: hintFor(state),
      }

    case 'UNLOCK_MARS':
      if (state.phase !== 'complete' && state.phase !== 'mars') return state
      return {
        ...state,
        phase: 'mars',
        marsUnlocked: true,
        statusMessage: 'Hidden destination accepted: Mars mission unlocked.',
      }

    case 'RETURN_TO_COMPLETE':
      if (!state.marsUnlocked) return state
      return {
        ...state,
        phase: 'complete',
        statusMessage: 'Returned from the Mars Easter egg to the hangar reward scene.',
      }

    case 'RESET':
      return createInitialState()

    default: {
      const exhaustive: never = action
      return exhaustive
    }
  }
}

export function gameProgress(state: GameState): number {
  const completed = new Set(state.completedPuzzles.filter((id): id is PuzzleId => PUZZLE_IDS.includes(id)))
  if (PUZZLE_IDS.length === 0) return 0
  const ratio = completed.size / PUZZLE_IDS.length
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
}
