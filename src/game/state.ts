import {
  dc9LegacyFlow,
  firstOfficerFlow,
  lockerFlow,
  type FirstOfficerControl,
  type LockerInteraction,
} from './config'

export const GAME_SCHEMA_VERSION = 2 as const
export const SWITCH_ORDER = dc9LegacyFlow.checklistOrder as const
export const PUZZLE_IDS = ['firstOfficer', 'locker', 'captain'] as const
export type GamePhase = 'briefing' | 'airbus' | 'locker' | 'captain' | 'reward' | 'mars'
export type GameAction =
  | { type: 'START' }
  | { type: 'ASSIGN_AIRBUS_CARD'; control: FirstOfficerControl; card: string }
  | { type: 'SET_AIRBUS_CLOCK_ANSWER'; value: string }
  | { type: 'SUBMIT_AIRBUS_CLOCK' }
  | { type: 'COMPLETE_LOCKER_OBJECT'; objectId: LockerInteraction; response?: string }
  | { type: 'REVEAL_CAPTAIN_HAT' }
  | { type: 'ACTIVATE_SWITCH'; switchId: SwitchId }
  | { type: 'TOGGLE_ROUTE'; code: string }
  | { type: 'SUBMIT_ROUTE' }
  | { type: 'USE_HINT' }
  | { type: 'UNLOCK_MARS' }
  | { type: 'RETURN_TO_REWARD' }
  | { type: 'RESET' }
export type SwitchId = (typeof SWITCH_ORDER)[number]
export type PuzzleId = (typeof PUZZLE_IDS)[number]

interface AirbusAssignments {
  [K in FirstOfficerControl]: string | null
}

interface LockerPayload {
  completed: LockerInteraction[]
  hatRevealed: boolean
}

export interface GameState {
  schemaVersion: typeof GAME_SCHEMA_VERSION
  phase: GamePhase
  airbusAssignments: AirbusAssignments
  airbusClockAnswer: string
  lockerCompleted: LockerInteraction[]
  lockerHatRevealed: boolean
  captainModeUnlocked: boolean
  switchSequence: SwitchId[]
  routeSelections: string[]
  completedPuzzles: PuzzleId[]
  hintsUsed: number
  captainRewardUnlocked: boolean
  marsUnlocked: boolean
  statusMessage: string
}

function normalize(value: unknown): string {
  return typeof value === 'string'
    ? value
        .normalize('NFD')
        .replace(/[^a-z0-9]+/g, '')
        .toLowerCase()
    : ''
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

function createEmptyAssignments(): AirbusAssignments {
  return {
    sidestick: null,
    thrust: null,
    gear: null,
    radio: null,
    altitude: null,
  }
}

function controlsComplete(assignments: AirbusAssignments): boolean {
  return firstOfficerFlow.controlIds.every((id) => assignments[id] !== null)
}

function allControlsCorrect(assignments: AirbusAssignments): boolean {
  return firstOfficerFlow.controlIds.every((id) => assignments[id] === firstOfficerFlow.controlMatch[id])
}

function controlAnswerFeedback(placements: AirbusAssignments): string {
  const assigned = Object.entries(placements).filter(([, value]) => Boolean(value))
  if (assigned.length === 0) return 'Match each label card to its cockpit object.'
  if (!controlsComplete(placements)) return `Good start. ${firstOfficerFlow.controlIds.length - assigned.length} cards left.`
  if (allControlsCorrect(placements)) return `${firstOfficerFlow.firstCompleteBanner}.`
  return 'One or more labels are incorrect. Retry those cards without losing locker progress.'
}

function isLockerAnswerCorrect(objectId: LockerInteraction, response: string): boolean {
  const answer = lockerFlow.interactions[objectId]?.answer
  if (!answer) return true
  return normalize(response) === normalize(answer)
}

function lockerInteractionComplete(current: LockerInteraction[], objectId: LockerInteraction): LockerPayload {
  const completed = unique([...current, objectId]).sort()
  const requirementMet = lockerFlow.requiredInteractionIds.every((id) => completed.includes(id))
  return {
    completed,
    hatRevealed: requirementMet ? true : false,
  }
}

function hintFor(state: GameState): string {
  if (state.phase === 'airbus') {
    if (!controlsComplete(state.airbusAssignments)) {
      return 'Match the label cards to each control first, then use the ATP clock challenge.'
    }
    if (!allControlsCorrect(state.airbusAssignments)) {
      return 'Some control labels are off. Correct order and names are all that matters.'
    }
    return `Great fit. Try ${firstOfficerFlow.clockQuestion}`
  }

  if (state.phase === 'locker') {
    return 'Locker tasks are memory clues. Complete each item to unlock the hat reveal.'
  }

  if (state.phase === 'captain') {
    if (state.routeSelections.length > 0) return 'Check the active route strip sequence and adjust the order.'
    return `Try the checklist in legacy order, then pick the Southern funnel route set.`
  }

  return 'No hint is needed now.'
}

function isSafeLockerState(items: readonly LockerInteraction[]): boolean {
  const known = new Set(lockerFlow.requiredInteractionIds)
  return unique(items).length === items.length && items.every((id) => known.has(id))
}

export function createInitialState(): GameState {
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase: 'briefing',
    airbusAssignments: createEmptyAssignments(),
    airbusClockAnswer: '',
    lockerCompleted: [],
    lockerHatRevealed: false,
    captainModeUnlocked: false,
    switchSequence: [],
    routeSelections: [],
    completedPuzzles: [],
    hintsUsed: 0,
    captainRewardUnlocked: false,
    marsUnlocked: false,
    statusMessage:
      'Start in Airbus First-Officer Mode. Complete labels, then clock, then move to the locker.',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'briefing') return state
      return {
        ...state,
        phase: 'airbus',
        statusMessage: 'Match the Airbus labels to the right controls.',
      }

    case 'ASSIGN_AIRBUS_CARD': {
      if (state.phase !== 'airbus') return state
      if (action.card === '') {
        return {
          ...state,
          airbusAssignments: {
            ...state.airbusAssignments,
            [action.control]: null,
          },
          statusMessage: 'Card removed from control. Reassign a matching card.',
        }
      }

      const usedBy = Object.entries(state.airbusAssignments).find(
        ([control, assignedCard]) => control !== action.control && assignedCard === action.card,
      )
      if (usedBy) {
        return {
          ...state,
          statusMessage: `${action.card} is already used on another control. Use one label per control.`,
        }
      }

      const nextAssignments = {
        ...state.airbusAssignments,
        [action.control]: action.card,
      }
      return {
        ...state,
        airbusAssignments: nextAssignments,
        statusMessage: allControlsCorrect(nextAssignments)
          ? `${firstOfficerFlow.firstCompleteBanner}. Now enter the ATP time on the clock.`
          : controlAnswerFeedback(nextAssignments),
      }
    }

    case 'SET_AIRBUS_CLOCK_ANSWER':
      if (state.phase !== 'airbus') return state
      return {
        ...state,
        airbusClockAnswer: action.value,
      }

    case 'SUBMIT_AIRBUS_CLOCK': {
      if (state.phase !== 'airbus') return state
      if (!controlsComplete(state.airbusAssignments)) {
        return {
          ...state,
          statusMessage: `Finish matching the control labels before the clock challenge.`,
        }
      }
      if (!allControlsCorrect(state.airbusAssignments)) {
        return {
          ...state,
          statusMessage: `Keep retrying the labels until they are all correct, then submit 1500.`,
        }
      }
      if (normalize(state.airbusClockAnswer) !== normalize(firstOfficerFlow.clockAnswer)) {
        return {
          ...state,
          statusMessage: 'Clock answer is not yet recognized. Keep the family clue in mind.',
        }
      }
      return {
        ...state,
        phase: 'locker',
        completedPuzzles: unique([...state.completedPuzzles, 'firstOfficer']),
        statusMessage: `${firstOfficerFlow.firstCompleteBanner}. ${firstOfficerFlow.lockerAccessText}`,
      }
    }

    case 'COMPLETE_LOCKER_OBJECT': {
      if (state.phase !== 'locker') return state
      if (state.lockerCompleted.includes(action.objectId)) {
        return {
          ...state,
          statusMessage: 'That locker item is already complete.',
        }
      }

      const isCorrect = isLockerAnswerCorrect(action.objectId, action.response ?? '')
      if (!isCorrect) {
        return {
          ...state,
          statusMessage: lockerFlow.interactions[action.objectId]?.feedback ?? 'Try this memory clue again.',
        }
      }

      const payload = lockerInteractionComplete(state.lockerCompleted, action.objectId)
      const feedback =
        lockerFlow.interactions[action.objectId]?.feedback ?? 'Locker detail logged. Continue the inspection.'
      if (!payload.hatRevealed) {
        return {
          ...state,
          lockerCompleted: payload.completed,
          statusMessage: feedback,
        }
        }
      return {
        ...state,
        lockerCompleted: payload.completed,
        lockerHatRevealed: true,
        statusMessage: `${feedback} ${lockerFlow.interactions[action.objectId]?.trigger} ${lockerFlow.hatText.revealText}`,
      }
    }

    case 'REVEAL_CAPTAIN_HAT':
      if (state.phase !== 'locker' || !state.lockerHatRevealed) return state
      return {
        ...state,
        phase: 'captain',
        captainModeUnlocked: true,
        completedPuzzles: unique([...state.completedPuzzles, 'locker']),
        statusMessage: `${lockerFlow.hatText.foundText} ${lockerFlow.hatText.promotionText} ${lockerFlow.hatText.captainModeText}`,
      }

    case 'ACTIVATE_SWITCH': {
      if (state.phase !== 'captain') return state
      const expected = SWITCH_ORDER[state.switchSequence.length]

      if (action.switchId === expected) {
        const nextSequence = [...state.switchSequence, action.switchId]
        const complete = nextSequence.length === SWITCH_ORDER.length
        return {
          ...state,
          switchSequence: nextSequence,
          routeSelections: state.routeSelections,
          statusMessage: complete
            ? 'Checklist sequence complete. The legacy route strip is now available.'
            : `Good. ${SWITCH_ORDER.length - nextSequence.length} switch${SWITCH_ORDER.length - nextSequence.length === 1 ? '' : 's'} remaining.`,
        }
      }

      return {
        ...state,
        switchSequence: [],
        statusMessage: 'That checklist step did not latch. Retry this captain sequence.',
      }
    }

    case 'TOGGLE_ROUTE': {
      if (state.phase !== 'captain') return state
      const selected = state.routeSelections.includes(action.code)
      if (selected) {
        return {
          ...state,
          routeSelections: state.routeSelections.filter((code) => code !== action.code),
          statusMessage: `${action.code} removed from the strip.`,
        }
      }
      if (state.routeSelections.length >= dc9LegacyFlow.routePuzzleAnswers.length) {
        return {
          ...state,
          statusMessage: 'The legacy strip holds three entries. Remove one before adding another.',
        }
      }
      return {
        ...state,
        routeSelections: [...state.routeSelections, action.code],
        statusMessage: `${action.code} added to legacy route choices.`,
      }
    }

    case 'SUBMIT_ROUTE': {
      if (state.phase !== 'captain') return state
      const correct = sameCodeSet(state.routeSelections, dc9LegacyFlow.routePuzzleAnswers)
      if (!correct) {
        return {
          ...state,
          routeSelections: [],
          statusMessage: 'Those routes do not match the legacy pattern. Retry any three Southern choices.',
        }
      }
      return {
        ...state,
        phase: 'reward',
        completedPuzzles: unique([...state.completedPuzzles, 'captain']),
        captainRewardUnlocked: true,
        statusMessage: dc9LegacyFlow.completionText,
      }
    }

    case 'USE_HINT':
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        statusMessage: hintFor(state),
      }

    case 'UNLOCK_MARS':
      if (state.phase !== 'reward' && state.phase !== 'mars') return state
      return {
        ...state,
        phase: 'mars',
        marsUnlocked: true,
        statusMessage: 'Mars mission accepted. Optional ending unlocked.',
      }

    case 'RETURN_TO_REWARD':
      if (!state.marsUnlocked) return state
      return {
        ...state,
        phase: 'reward',
        statusMessage: 'Returned from the easter egg to the hangar completion scene.',
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
  const totalPuzzles = PUZZLE_IDS.length
  if (totalPuzzles === 0) return 0
  const ratio = completed.size / totalPuzzles
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
}

export function isLockerActionValid(items: LockerInteraction[]): boolean {
  return isSafeLockerState(items)
}
