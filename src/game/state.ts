import {
  dc9LegacyFlow,
  firstOfficerFlow,
  lockerFlow,
  type FirstOfficerControl,
  type FirstOfficerDecoy,
  type LockerMemoryId,
  type LockerQuestionId,
} from './config'

export const GAME_SCHEMA_VERSION = 7 as const
export const DC9_SECURE_ORDER = dc9LegacyFlow.secureSequence
export const PUZZLE_IDS = ['firstOfficer', 'locker', 'captain'] as const
export type GamePhase = 'briefing' | 'airbus' | 'locker' | 'captain' | 'reward' | 'mars'
export type Dc9ChapterStage =
  | 'intro'
  | 'routeRecord'
  | 'homeOperations'
  | 'shutdown'
  | 'keyReveal'
  | 'complete'
export interface Dc9ChapterProgress {
  stage: Dc9ChapterStage
  routeSelections: string[]
  routeCompleted: string[]
  routeAttempts: number
  homePage: number
  homeOperationsCompleted: boolean
  secureSequence: Dc9SecureControlId[]
  keyRevealed: boolean
  keyClaimed: boolean
}
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
  | { type: 'OPEN_DC9_ROUTE_RECORD' }
  | { type: 'TOGGLE_DC9_ROUTE'; code: string }
  | { type: 'SUBMIT_DC9_ROUTES' }
  | { type: 'SET_HOME_OPERATIONS_PAGE'; page: number }
  | { type: 'COMPLETE_HOME_OPERATIONS' }
  | { type: 'ACTIVATE_DC9_CONTROL'; controlId: Dc9SecureControlId }
  | { type: 'OPEN_CAPTAINS_KEY' }
  | { type: 'CLAIM_CAPTAINS_KEY' }
  | { type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' }
  | { type: 'TOGGLE_ROUTE'; code: string }
  | { type: 'SUBMIT_ROUTE' }
  | { type: 'USE_HINT' }
  | { type: 'UNLOCK_MARS' }
  | { type: 'RETURN_TO_REWARD' }
  | { type: 'RESET' }
export type Dc9SecureControlId = (typeof DC9_SECURE_ORDER)[number]
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
  dc9: Dc9ChapterProgress
  // Schema-v6 compatibility fields remain until migration and old call sites are removed.
  captainModeUnlocked: boolean
  captainRouteVerified: boolean
  dc9SecureSequence: Dc9SecureControlId[]
  captainAttempts: { route: number; secure: number }
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
    if (!state.captainRouteVerified) {
      return state.captainAttempts.route > 0
        ? dc9LegacyFlow.routeMileageHint
        : 'Use the code, city, and period-mileage columns to identify the three short MEM DC-9 routes.'
    }
    if (state.captainAttempts.secure > 0) {
      const next = DC9_SECURE_ORDER[state.dc9SecureSequence.length]
      return next
        ? `Next: ${dc9LegacyFlow.secureControls[next].label}. ${dc9LegacyFlow.secureHint}`
        : dc9LegacyFlow.secureHint
    }
    return dc9LegacyFlow.secureHint
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
    dc9: {
      stage: 'intro',
      routeSelections: [],
      routeCompleted: [],
      routeAttempts: 0,
      homePage: 0,
      homeOperationsCompleted: false,
      secureSequence: [],
      keyRevealed: false,
      keyClaimed: false,
    },
    captainModeUnlocked: false,
    captainRouteVerified: false,
    dc9SecureSequence: [],
    captainAttempts: { route: 0, secure: 0 },
    routeSelections: [],
    completedPuzzles: [],
    hintsUsed: 0,
    captainRewardUnlocked: false,
    marsUnlocked: false,
    statusMessage: 'Begin the DC-9 Final Flight Log when you are ready.',
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'START':
      if (state.phase !== 'briefing') return state
      return {
        ...state,
        phase: 'captain',
        statusMessage: 'The parked DC-9 is ready. Find the route strip on the captain yoke.',
      }

    case 'OPEN_DC9_ROUTE_RECORD':
      if (state.phase !== 'captain' || (state.dc9.stage !== 'intro' && state.dc9.stage !== 'routeRecord')) return state
      return {
        ...state,
        dc9: { ...state.dc9, stage: 'routeRecord' },
        statusMessage: 'Legacy Route Record opened. Select three familiar stops.',
      }

    case 'TOGGLE_DC9_ROUTE': {
      if (state.phase !== 'captain' || state.dc9.stage !== 'routeRecord') return state
      if (!(dc9LegacyFlow.routePuzzleOptions as readonly { code: string }[]).some((route) => route.code === action.code)) return state
      if (state.dc9.routeCompleted.includes(action.code)) {
        return { ...state, statusMessage: `${action.code} is permanently stamped in the legacy record.` }
      }
      const selected = state.dc9.routeSelections.includes(action.code)
      if (selected) {
        return {
          ...state,
          dc9: {
            ...state.dc9,
            routeSelections: state.dc9.routeSelections.filter((code) => code !== action.code),
          },
          statusMessage: `${action.code} lifted from the current selection.`,
        }
      }
      if (state.dc9.routeSelections.length >= dc9LegacyFlow.routePuzzleAnswers.length) {
        return { ...state, statusMessage: 'The route record holds three selections. Lift one before adding another.' }
      }
      return {
        ...state,
        dc9: {
          ...state.dc9,
          routeSelections: [...state.dc9.routeSelections, action.code],
        },
        statusMessage: `${action.code} selected for the legacy route record.`,
      }
    }

    case 'SUBMIT_DC9_ROUTES': {
      if (state.phase !== 'captain' || state.dc9.stage !== 'routeRecord') return state
      const approved = dc9LegacyFlow.routePuzzleAnswers as readonly string[]
      const stampedSet = new Set([
        ...state.dc9.routeCompleted,
        ...state.dc9.routeSelections.filter((code) => approved.includes(code)),
      ])
      const stamped = approved.filter((code) => stampedSet.has(code))
      const complete = stamped.length === approved.length
      if (complete) {
        return {
          ...state,
          dc9: {
            ...state.dc9,
            stage: 'homeOperations',
            routeSelections: [...approved],
            routeCompleted: [...approved],
          },
          captainRouteVerified: true,
          routeSelections: [...approved],
          statusMessage: dc9LegacyFlow.routeCompletionText,
        }
      }
      const routeAttempts = state.dc9.routeAttempts + 1
      const hint = routeAttempts === 1
        ? dc9LegacyFlow.routeHints[0]
        : routeAttempts === 2
          ? dc9LegacyFlow.routeHints[1]
          : `${dc9LegacyFlow.routeHints[1]} DTW, MSP, and STL are outlined for final support.`
      return {
        ...state,
        dc9: {
          ...state.dc9,
          routeSelections: stamped,
          routeCompleted: stamped,
          routeAttempts,
        },
        captainAttempts: { ...state.captainAttempts, route: routeAttempts },
        statusMessage: hint,
      }
    }

    case 'SET_HOME_OPERATIONS_PAGE': {
      if (state.phase !== 'captain' || state.dc9.stage !== 'homeOperations') return state
      const finalPage = dc9LegacyFlow.homeOperationsPages.length - 1
      const page = Number.isSafeInteger(action.page)
        ? Math.max(0, Math.min(action.page, finalPage))
        : state.dc9.homePage
      return {
        ...state,
        dc9: { ...state.dc9, homePage: page },
        statusMessage: `Home Operations Log page ${page + 1} of ${finalPage + 1}.`,
      }
    }

    case 'COMPLETE_HOME_OPERATIONS': {
      if (state.phase !== 'captain' || state.dc9.stage !== 'homeOperations') return state
      if (state.dc9.homePage < dc9LegacyFlow.homeOperationsPages.length - 1) {
        return { ...state, statusMessage: 'Continue through the Home Operations Log before applying its legacy seal.' }
      }
      return {
        ...state,
        dc9: {
          ...state.dc9,
          stage: 'shutdown',
          homeOperationsCompleted: true,
        },
        statusMessage: dc9LegacyFlow.secureInstruction,
      }
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
        phase: 'reward',
        completedPuzzles: unique([...state.completedPuzzles, 'firstOfficer']),
        captainRewardUnlocked: true,
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
        captainRouteVerified: false,
        dc9SecureSequence: [],
        routeSelections: [],
        statusMessage: `${lockerFlow.hatText.captainModeText}. Verify the MEM route strip first.`,
      }

    case 'ACTIVATE_DC9_CONTROL': {
      if (state.phase !== 'captain') return state
      if (state.dc9.stage !== 'shutdown') {
        return { ...state, statusMessage: 'Complete both legacy records before beginning the ceremonial shutdown.' }
      }
      const expected = DC9_SECURE_ORDER[state.dc9.secureSequence.length]

      if (action.controlId === expected) {
        const nextSequence = [...state.dc9.secureSequence, action.controlId]
        const complete = nextSequence.length === DC9_SECURE_ORDER.length
        return {
          ...state,
          dc9: {
            ...state.dc9,
            stage: complete ? 'keyReveal' : 'shutdown',
            secureSequence: nextSequence,
          },
          dc9SecureSequence: nextSequence,
          statusMessage: complete
            ? dc9LegacyFlow.completionText
            : `${dc9LegacyFlow.secureControls[action.controlId].label} off. ${DC9_SECURE_ORDER.length - nextSequence.length} control${DC9_SECURE_ORDER.length - nextSequence.length === 1 ? '' : 's'} remaining.`,
        }
      }

      return {
        ...state,
        captainAttempts: { ...state.captainAttempts, secure: state.captainAttempts.secure + 1 },
        statusMessage: dc9LegacyFlow.secureRetry,
      }
    }

    case 'OPEN_CAPTAINS_KEY':
      if (state.phase !== 'captain' || state.dc9.stage !== 'keyReveal') return state
      return {
        ...state,
        dc9: { ...state.dc9, keyRevealed: true },
        statusMessage: "The Captain's Key is ready. Its engravings honor Pop T and Momma Cheryl.",
      }

    case 'CLAIM_CAPTAINS_KEY':
      if (state.phase !== 'captain' || state.dc9.stage !== 'keyReveal' || !state.dc9.keyRevealed) return state
      return {
        ...state,
        phase: 'locker',
        dc9: {
          ...state.dc9,
          stage: 'complete',
          keyClaimed: true,
        },
        completedPuzzles: unique([...state.completedPuzzles, 'captain']),
        lockerIntroCompleted: false,
        statusMessage: "The Captain's Key is claimed. The Captain's Locker is opening.",
      }

    case 'CONTINUE_FROM_LOCKER_TO_AIRBUS':
      if (state.phase !== 'locker' || !state.completedPuzzles.includes('locker')) return state
      return {
        ...state,
        phase: 'airbus',
        airbusClockAnswer: '',
        statusMessage: 'The family legacy continues in the Airbus A320 First-Officer experience.',
      }

    case 'TOGGLE_ROUTE': {
      if (state.phase !== 'captain') return state
      if (state.captainRouteVerified) return state
      if (!(dc9LegacyFlow.routePuzzleOptions as readonly { code: string }[]).some((route) => route.code === action.code)) return state
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
      if (state.captainRouteVerified) return state
      const correct = sameCodeSet(state.routeSelections, dc9LegacyFlow.routePuzzleAnswers)
      if (!correct) {
        return {
          ...state,
          routeSelections: [],
          captainAttempts: { ...state.captainAttempts, route: state.captainAttempts.route + 1 },
          statusMessage: dc9LegacyFlow.routeRetry,
        }
      }
      return {
        ...state,
        captainRouteVerified: true,
        statusMessage: dc9LegacyFlow.secureInstruction,
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
