import {
  dc9LegacyFlow,
  firstOfficerFlow,
  lockerFlow,
  type FirstOfficerControl,
  type FirstOfficerDecoy,
  type LockerMemoryId,
  type LockerQuestionId,
} from './config'

export const GAME_SCHEMA_VERSION = 5 as const
export const SWITCH_ORDER = dc9LegacyFlow.checklistOrder
export const PUZZLE_IDS = ['firstOfficer', 'locker', 'captain'] as const
export type GamePhase = 'briefing' | 'airbus' | 'locker' | 'captain' | 'reward' | 'mars'
export type GameAction =
  | { type: 'START' }
  | { type: 'ASSIGN_AIRBUS_CARD'; control: FirstOfficerControl; card: string }
  | { type: 'ASSIGN_AIRBUS_DECOY_CARD'; decoy: FirstOfficerDecoy; card: string }
  | { type: 'SET_AIRBUS_CLOCK_ANSWER'; value: string }
  | { type: 'SUBMIT_AIRBUS_CLOCK' }
  | { type: 'CONTINUE_TO_LOCKER' }
  | { type: 'COMPLETE_LOCKER_INTRO' }
  | { type: 'SUBMIT_LOCKER_ANSWER'; memoryId: LockerQuestionId; response: string }
  | { type: 'USE_LOCKER_HINT'; memoryId?: LockerQuestionId }
  | { type: 'CLAIM_CAPTAIN_HAT' }
  | { type: 'CONTINUE_TO_CAPTAIN' }
  | { type: 'ACTIVATE_SWITCH'; switchId: SwitchId }
  | { type: 'TOGGLE_ROUTE'; code: string }
  | { type: 'SUBMIT_ROUTE' }
  | { type: 'USE_HINT' }
  | { type: 'UNLOCK_MARS' }
  | { type: 'RETURN_TO_REWARD' }
  | { type: 'RESET' }
export type SwitchId = (typeof SWITCH_ORDER)[number]
export type PuzzleId = (typeof PUZZLE_IDS)[number]

export type AirbusAssignments = {
  [K in FirstOfficerControl]: string | null
}

export type AirbusDecoyAssignments = {
  [K in FirstOfficerDecoy]: string | null
}

interface LockerPayload {
  completed: LockerMemoryId[]
  hatRevealed: boolean
}

export type LockerAttempts = Record<LockerQuestionId, number>

export interface GameState {
  schemaVersion: typeof GAME_SCHEMA_VERSION
  phase: GamePhase
  airbusAssignments: AirbusAssignments
  airbusDecoyAssignments: AirbusDecoyAssignments
  airbusClockAnswer: string
  lockerCompleted: LockerMemoryId[]
  lockerAttempts: LockerAttempts
  lockerIntroCompleted: boolean
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
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
    : ''
}

function unique<T>(items: readonly T[]): T[] {
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

function createEmptyDecoyAssignments(): AirbusDecoyAssignments {
  return {
    leftPanelKnobs: null,
    rightDisplay: null,
    sideConsole: null,
    windshieldLights: null,
  }
}

function allControlsCorrect(assignments: AirbusAssignments): boolean {
  return firstOfficerFlow.controlIds.every((id) => assignments[id] === firstOfficerFlow.controlMatch[id])
}

function countPlacedAirbusCards(assignments: AirbusAssignments): number {
  return Object.values(assignments).filter(Boolean).length
}

function allControlsAssigned(assignments: AirbusAssignments): boolean {
  return countPlacedAirbusCards(assignments) === firstOfficerFlow.controlCards.length
}

function removeCardFromAirbusTargets(
  assignments: AirbusAssignments,
  decoyAssignments: AirbusDecoyAssignments,
  card: string,
): { assignments: AirbusAssignments; decoyAssignments: AirbusDecoyAssignments } {
  const nextAssignments = { ...assignments }
  const nextDecoyAssignments = { ...decoyAssignments }
  for (const control of firstOfficerFlow.controlIds) {
    if (nextAssignments[control] === card) nextAssignments[control] = null
  }
  for (const decoy of firstOfficerFlow.decoyIds) {
    if (nextDecoyAssignments[decoy] === card) nextDecoyAssignments[decoy] = null
  }
  return { assignments: nextAssignments, decoyAssignments: nextDecoyAssignments }
}

function controlAnswerFeedback(assignments: AirbusAssignments): string {
  const placed = countPlacedAirbusCards(assignments)
  if (placed === 0) return 'Match each label card to a cockpit object.'

  const wrongControl = firstOfficerFlow.controlIds.find((control) => {
    const card = assignments[control]
    return card !== null && card !== firstOfficerFlow.controlMatch[control]
  })
  if (wrongControl) {
    return 'That card does not match this cockpit control. Try it somewhere else.'
  }

  const remaining = firstOfficerFlow.controlCards.length - placed
  if (remaining > 0) {
    return `Green means correct. ${remaining} label${remaining === 1 ? '' : 's'} left.`
  }

  return 'All five labels are correct. Answer the Airline Transport Pilot question to qualify.'
}

function isAirlineTransportPilotAnswerCorrect(value: string): boolean {
  const normalized = normalize(value)
  return firstOfficerFlow.clockAnswers.some((answer) => normalize(answer) === normalized)
}

function isLockerAnswerCorrect(memoryId: LockerQuestionId, response: string): boolean {
  const normalized = normalize(response)
  return lockerFlow.memories[memoryId].acceptedAnswers.some((answer) => normalize(answer) === normalized)
}

function lockerInteractionComplete(current: LockerMemoryId[], memoryId: LockerMemoryId): LockerPayload {
  const completed = lockerFlow.authoredSequence.filter((id) => current.includes(id) || id === memoryId)
  const requirementMet = lockerFlow.memoryIds.every((id) => completed.includes(id))
  return {
    completed,
    hatRevealed: requirementMet ? true : false,
  }
}

export function isLockerMemoryAvailable(
  state: Pick<GameState, 'lockerCompleted' | 'lockerIntroCompleted'>,
  memoryId: LockerMemoryId,
): boolean {
  if (!state.lockerIntroCompleted) return false
  if (state.lockerCompleted.includes(memoryId)) return true
  if (memoryId === 'watch') return true
  if (memoryId === 'baseball') return state.lockerCompleted.includes('watch')
  if (memoryId === 'chargingBull') return state.lockerCompleted.includes('baseball')
  if (memoryId === 'wings') return state.lockerCompleted.includes('chargingBull')
  return false
}

function hintFor(state: GameState): string {
  if (state.phase === 'airbus') {
    if (!allControlsAssigned(state.airbusAssignments)) {
      return 'Green boxes are correct. Red boxes need a different label. Place the remaining cards on the visible boxes.'
    }
    if (!allControlsCorrect(state.airbusAssignments)) {
      return 'Fix the red box by selecting that card again and placing a better match.'
    }
    return `All five labels are correct. Try ${firstOfficerFlow.clockQuestion}`
  }

  if (state.phase === 'locker') {
    if (!state.lockerIntroCompleted) return 'Let the locker room come into view.'
    if (state.lockerHatRevealed) return 'The upper cubby is open. Captain promotion is ready.'
    const available = lockerFlow.memoryIds.filter((id) => isLockerMemoryAvailable(state, id) && !state.lockerCompleted.includes(id))
    if (state.lockerCompleted.includes('wings')) return 'The airline wings are logged. One locker memory remains.'
    if (state.lockerCompleted.includes('chargingBull')) return 'The Charging Bull is logged. Continue to the airline wings.'
    if (state.lockerCompleted.includes('baseball')) return 'The baseball memory is logged. Look for the Charging Bull.'
    if (available.length === 0) return lockerFlow.openingInstruction
    return `Look for ${available.map((id) => lockerFlow.memories[id].label).join(', ')}.`
  }

  if (state.phase === 'captain') {
    if (state.routeSelections.length > 0) return 'Check the active route strip sequence and adjust the order.'
    return `Try the checklist in legacy order, then pick the Southern funnel route set.`
  }

  return 'No hint is needed now.'
}

function isSafeLockerState(items: readonly LockerMemoryId[]): boolean {
  const known = new Set(lockerFlow.memoryIds)
  return unique(items).length === items.length && items.every((id) => known.has(id))
}

export function createInitialState(): GameState {
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase: 'briefing',
    airbusAssignments: createEmptyAssignments(),
    airbusDecoyAssignments: createEmptyDecoyAssignments(),
    airbusClockAnswer: '',
    lockerCompleted: [],
    lockerAttempts: { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: false,
    lockerHatRevealed: false,
    captainModeUnlocked: false,
    switchSequence: [],
    routeSelections: [],
    completedPuzzles: [],
    hintsUsed: 0,
    captainRewardUnlocked: false,
    marsUnlocked: false,
    statusMessage:
      'Start in Airbus First-Officer Mode. Complete the labels, then move to the locker.',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'briefing') return state
      return {
        ...state,
        phase: 'airbus',
        statusMessage: 'Match the Airbus labels to the right cockpit boxes.',
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
          airbusClockAnswer: '',
          statusMessage: 'Card removed from control. Reassign a matching card.',
        }
      }

      const cleared = removeCardFromAirbusTargets(state.airbusAssignments, state.airbusDecoyAssignments, action.card)
      const nextAssignments = {
        ...cleared.assignments,
        [action.control]: action.card,
      }
      const feedback = controlAnswerFeedback(nextAssignments)
      const correctPlacement = action.card === firstOfficerFlow.controlMatch[action.control]
      const hasWrongPlacement = firstOfficerFlow.controlIds.some((control) => {
        const card = nextAssignments[control]
        return card !== null && card !== firstOfficerFlow.controlMatch[control]
      })
      return {
        ...state,
        airbusAssignments: nextAssignments,
        airbusDecoyAssignments: cleared.decoyAssignments,
        airbusClockAnswer: '',
        statusMessage: correctPlacement && !hasWrongPlacement && !allControlsCorrect(nextAssignments)
          ? firstOfficerFlow.controlHints[action.control]
          : feedback,
      }
    }

    case 'ASSIGN_AIRBUS_DECOY_CARD': {
      if (state.phase !== 'airbus') return state
      const cleared = removeCardFromAirbusTargets(state.airbusAssignments, state.airbusDecoyAssignments, action.card)
      const nextDecoyAssignments = {
        ...cleared.decoyAssignments,
        [action.decoy]: action.card,
      }
      return {
        ...state,
        airbusAssignments: cleared.assignments,
        airbusDecoyAssignments: nextDecoyAssignments,
        airbusClockAnswer: '',
        statusMessage: 'That area is not part of this five-label check. Use one of the visible cockpit boxes.',
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
      if (!allControlsAssigned(state.airbusAssignments)) {
        return {
          ...state,
          statusMessage: 'Place each label on the visible cockpit boxes.',
        }
      }
      if (!allControlsCorrect(state.airbusAssignments)) {
        return {
          ...state,
          statusMessage: 'Fix the red label boxes before moving on.',
        }
      }
      if (!isAirlineTransportPilotAnswerCorrect(state.airbusClockAnswer)) {
        return {
          ...state,
          statusMessage: 'That Airline Transport Pilot answer is not yet recognized. Try the standard hour milestone.',
        }
      }
      return {
        ...state,
        completedPuzzles: unique([...state.completedPuzzles, 'firstOfficer']),
        statusMessage: `${firstOfficerFlow.clockFeedback} ${firstOfficerFlow.knowledgeLoggedText}`,
      }
    }

    case 'CONTINUE_TO_LOCKER':
      if (state.phase !== 'airbus' || !state.completedPuzzles.includes('firstOfficer')) return state
      return {
        ...state,
        phase: 'locker',
        lockerIntroCompleted: false,
        statusMessage: `${firstOfficerFlow.firstCompleteBanner}. ${firstOfficerFlow.lockerAccessText}`,
      }

    case 'COMPLETE_LOCKER_INTRO':
      if (state.phase !== 'locker' || state.lockerIntroCompleted) return state
      return {
        ...state,
        lockerIntroCompleted: true,
        statusMessage: lockerFlow.openingInstruction,
      }

    case 'SUBMIT_LOCKER_ANSWER': {
      if (state.phase !== 'locker') return state
      if (!isLockerMemoryAvailable(state, action.memoryId)) return state
      if (state.lockerCompleted.includes(action.memoryId)) {
        return {
          ...state,
          statusMessage: `${lockerFlow.memories[action.memoryId].label} is already part of the memory sequence.`,
        }
      }

      const isCorrect = isLockerAnswerCorrect(action.memoryId, action.response)
      if (!isCorrect) {
        const attempts = state.lockerAttempts[action.memoryId] + 1
        return {
          ...state,
          lockerAttempts: { ...state.lockerAttempts, [action.memoryId]: attempts },
          statusMessage: attempts >= 2
            ? lockerFlow.memories[action.memoryId].strongerHint
            : lockerFlow.memories[action.memoryId].retry,
        }
      }

      const payload = lockerInteractionComplete(state.lockerCompleted, action.memoryId)
      const feedback = lockerFlow.memories[action.memoryId].feedback
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
        statusMessage: `${feedback} ${lockerFlow.hatText.revealText}`,
      }
    }

    case 'USE_LOCKER_HINT': {
      if (state.phase !== 'locker') return state
      if (!state.lockerIntroCompleted) return state
      if (action.memoryId && !state.lockerCompleted.includes(action.memoryId)) {
        return {
          ...state,
          hintsUsed: state.hintsUsed + 1,
          statusMessage: lockerFlow.memories[action.memoryId].strongerHint,
        }
      }
      return {
        ...state,
        hintsUsed: state.hintsUsed + 1,
        statusMessage: hintFor(state),
      }
    }

    case 'CLAIM_CAPTAIN_HAT':
      if (state.phase !== 'locker' || !state.lockerHatRevealed) return state
      return {
        ...state,
        captainModeUnlocked: true,
        completedPuzzles: unique([...state.completedPuzzles, 'locker']),
        statusMessage: `${lockerFlow.hatText.foundText} ${lockerFlow.hatText.promotionText} ${lockerFlow.hatText.captainModeText}`,
      }

    case 'CONTINUE_TO_CAPTAIN':
      if (state.phase !== 'locker' || !state.captainModeUnlocked) return state
      return {
        ...state,
        phase: 'captain',
        statusMessage: `${lockerFlow.hatText.captainModeText}. Legacy checklist ready.`,
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
  const totalPuzzles = PUZZLE_IDS.length as number
  if (totalPuzzles === 0) return 0
  const ratio = completed.size / totalPuzzles
  return Math.round(Math.max(0, Math.min(1, ratio)) * 100)
}

export function isLockerActionValid(items: LockerMemoryId[]): boolean {
  return isSafeLockerState(items)
}
