import {
  dc9LegacyFlow,
  airbusCaptainFlow,
  lockerFlow,
  type AirbusControl,
  type AirbusDecoy,
  type LockerMemoryId,
  type LockerQuestionId,
} from './config'
import type { StormLineCheckpoint, StormLineTrait } from './airbusSimulator'
import {
  getAirbusScenarioAvailability,
  type AirbusScenarioId,
  type AirbusScenarioLocation,
  type EngineOutCheckpoint,
  type EngineOutTrait,
} from './airbusScenario'
import {
  DC9_CONTROL_CHECK_ITEM_IDS,
  dc9ControlCheckComplete,
  dc9ControlCheckNextItem,
  dc9ControlCheckReached,
  type Dc9ControlCheckItemId,
} from './dc9ControlCheck'
import type { Dc9ControlState } from './dc9Input'
import { DC9_INSTRUMENTS, type Dc9InstrumentId } from './dc9FlightDeck'
import {
  applyDc9InstrumentAnswer,
  createInitialDc9InstrumentScanProgress,
  dc9InstrumentScanComplete,
  dc9InstrumentScanPrompt,
  dc9InstrumentScanShowsFinalSupport,
  type Dc9InstrumentScanProgress,
} from './dc9InstrumentScan'
import {
  advanceDc9DepartureProgress,
  createInitialDc9DepartureProgress,
  DC9_DEPARTURE_CHECKPOINTS,
  recordDc9DepartureMistake,
  type Dc9DepartureBeat,
  type Dc9DepartureCheckpoint,
  type Dc9DepartureProgress,
} from './dc9MemphisDeparture'
import {
  airbusWorkloadHint,
  applyAirbusWorkloadAction,
  createInitialAirbusWorkloadProgress,
  deriveAirbusWorkloadTask,
  resetAirbusScenarioWorkload,
  type AirbusWorkloadAction,
  type AirbusWorkloadProgress,
  type AirbusWorkloadTaskId,
} from './airbusWorkload'

export const GAME_SCHEMA_VERSION = 14 as const
export const DC9_SECURE_ORDER = dc9LegacyFlow.secureSequence
export const PUZZLE_IDS = ['dc9', 'locker', 'airbus'] as const
export type GamePhase = 'briefing' | 'dc9' | 'locker' | 'airbus' | 'reward' | 'mars'
export type Dc9ChapterStage =
  | 'controlCheck'
  | 'intro'
  | 'routeRecord'
  | 'memphisDeparture'
  | 'homeOperations'
  | 'instrumentScan'
  | 'shutdown'
  | 'qualification'
  | 'keyReveal'
  | 'complete'
export interface Dc9ChapterProgress {
  stage: Dc9ChapterStage
  controlCheck: Dc9ControlCheckItemId[]
  instrumentScan: Dc9InstrumentScanProgress
  departure: Dc9DepartureProgress
  routeSelections: string[]
  routeCompleted: string[]
  routeAttempts: number
  homePage: number
  homeOperationsCompleted: boolean
  secureSequence: Dc9SecureControlId[]
  secureAttempts: number
  keyRevealed: boolean
  keyClaimed: boolean
}
export type GameAction =
  | { type: 'START' }
  | { type: 'ASSIGN_AIRBUS_CARD'; control: AirbusControl; card: string }
  | { type: 'ASSIGN_AIRBUS_DECOY_CARD'; decoy: AirbusDecoy; card: string }
  | { type: 'SELECT_AIRBUS_SCENARIO'; scenario: AirbusScenarioId }
  | { type: 'BEGIN_AIRBUS_STORM_TRANSITION' }
  | { type: 'START_AIRBUS_STORM_LINE' }
  | {
      type: 'SAVE_AIRBUS_STORM_CHECKPOINT'
      checkpoint: StormLineCheckpoint
      attempts: Record<StormLineCheckpoint, number>
    }
  | { type: 'COMPLETE_AIRBUS_STORM_LINE'; traits: StormLineTrait[] }
  | { type: 'BEGIN_AIRBUS_ENGINE_OUT' }
  | {
      type: 'SAVE_AIRBUS_ENGINE_OUT_CHECKPOINT'
      checkpoint: EngineOutCheckpoint
      attempts: Record<EngineOutCheckpoint, number>
    }
  | { type: 'COMPLETE_AIRBUS_ENGINE_OUT'; traits: EngineOutTrait[] }
  | { type: 'APPLY_AIRBUS_WORKLOAD_ACTION'; action: AirbusWorkloadAction }
  | { type: 'RETURN_TO_AIRBUS_SCENARIO_HUB' }
  | { type: 'SET_ATP_QUALIFICATION_ANSWER'; value: string }
  | { type: 'SUBMIT_DC9_ATP_QUALIFICATION' }
  | { type: 'CONTINUE_FROM_AIRBUS_TO_REWARD' }
  | { type: 'COMPLETE_LOCKER_INTRO' }
  | { type: 'SUBMIT_LOCKER_ANSWER'; memoryId: LockerQuestionId; response: string }
  | { type: 'USE_LOCKER_HINT'; memoryId?: LockerQuestionId }
  | { type: 'CLAIM_CAPTAIN_HAT' }
  | { type: 'APPLY_DC9_CONTROL_CHECK'; controls: Dc9ControlState }
  | { type: 'IDENTIFY_DC9_INSTRUMENT'; instrument: Dc9InstrumentId }
  | { type: 'OPEN_DC9_ROUTE_RECORD' }
  | { type: 'TOGGLE_DC9_ROUTE'; code: string }
  | { type: 'SUBMIT_DC9_ROUTES' }
  | { type: 'SAVE_DC9_DEPARTURE_CHECKPOINT'; checkpoint: Dc9DepartureCheckpoint }
  | { type: 'RECORD_DC9_DEPARTURE_MISTAKE'; beat: Dc9DepartureBeat }
  | { type: 'RESTORE_DC9_DEPARTURE_CHECKPOINT' }
  | { type: 'COMPLETE_DC9_MEMPHIS_DEPARTURE' }
  | { type: 'SET_HOME_OPERATIONS_PAGE'; page: number }
  | { type: 'COMPLETE_HOME_OPERATIONS' }
  | { type: 'ACTIVATE_DC9_CONTROL'; controlId: Dc9SecureControlId }
  | { type: 'OPEN_CAPTAINS_KEY' }
  | { type: 'CLAIM_CAPTAINS_KEY' }
  | { type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' }
  | { type: 'USE_HINT' }
  | { type: 'UNLOCK_MARS' }
  | { type: 'RETURN_TO_REWARD' }
  | { type: 'RESET' }
export type Dc9SecureControlId = (typeof DC9_SECURE_ORDER)[number]
export type PuzzleId = (typeof PUZZLE_IDS)[number]

export type AirbusAssignments = {
  [K in AirbusControl]: string | null
}

export type AirbusDecoyAssignments = {
  [K in AirbusDecoy]: string | null
}

export type AirbusFamiliarizationStatus = 'unseen' | 'completed'
export type AirbusCameraPhase = 'familiarization' | 'qualified' | 'transitioning' | 'storm'

export interface AirbusSimulatorProgress {
  familiarization: AirbusFamiliarizationStatus
  cameraPhase: AirbusCameraPhase
  location: AirbusScenarioLocation
  stormLine: {
    status: 'not_started' | 'in_progress' | 'completed'
    checkpoint: StormLineCheckpoint
    attempts: Record<StormLineCheckpoint, number>
    bestTraits: StormLineTrait[]
  }
  engineOut: {
    status: 'locked' | 'not_started' | 'in_progress' | 'completed'
    checkpoint: EngineOutCheckpoint
    attempts: Record<EngineOutCheckpoint, number>
    bestTraits: EngineOutTrait[]
  }
  workload: AirbusWorkloadProgress
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
  airbusQualificationAnswer: string
  airbusSimulator: AirbusSimulatorProgress
  lockerCompleted: LockerMemoryId[]
  lockerAttempts: LockerAttempts
  lockerIntroCompleted: boolean
  lockerHatRevealed: boolean
  dc9: Dc9ChapterProgress
  airbusCaptainModeUnlocked: boolean
  completedPuzzles: PuzzleId[]
  hintsUsed: number
  rewardUnlocked: boolean
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

export function createInitialAirbusSimulatorProgress(): AirbusSimulatorProgress {
  return {
    familiarization: 'unseen',
    cameraPhase: 'familiarization',
    location: 'qualification',
    stormLine: {
      status: 'not_started',
      checkpoint: 'stormEntry',
      attempts: {
        stormEntry: 0,
        stormCore: 0,
        clearAir: 0,
      },
      bestTraits: [],
    },
    engineOut: {
      status: 'locked',
      checkpoint: 'recognition',
      attempts: {
        recognition: 0,
        stabilization: 0,
        diversion: 0,
      },
      bestTraits: [],
    },
    workload: createInitialAirbusWorkloadProgress(),
  }
}

function hasAirbusWorkloadTasks(
  progress: AirbusWorkloadProgress,
  tasks: readonly AirbusWorkloadTaskId[],
): boolean {
  return tasks.every((task) => progress.completedTasks.includes(task))
}

function activeAirbusWorkloadTask(state: GameState): AirbusWorkloadTaskId | null {
  if (state.phase !== 'airbus') return null
  if (
    state.airbusSimulator.location === 'stormLine' &&
    state.airbusSimulator.stormLine.status === 'in_progress'
  ) {
    return deriveAirbusWorkloadTask('stormLine', state.airbusSimulator.stormLine.checkpoint)
  }
  if (
    state.airbusSimulator.location === 'engineOut' &&
    state.airbusSimulator.engineOut.status === 'in_progress'
  ) {
    return deriveAirbusWorkloadTask('engineOut', state.airbusSimulator.engineOut.checkpoint)
  }
  return null
}

function completedAirbusWorkloadMessage(task: AirbusWorkloadTaskId): string {
  if (task === 'stormScanRange') return 'Captain ND training range set to MID.'
  if (task === 'stormGapSelection') return 'Stable western weather gap confirmed.'
  if (task === 'engineEventAcknowledgement') return 'Deliberate simulator event acknowledged.'
  return 'Right-side SAFE RETURN corridor selected.'
}

function allControlsCorrect(assignments: AirbusAssignments): boolean {
  return airbusCaptainFlow.controlIds.every((id) => assignments[id] === airbusCaptainFlow.controlMatch[id])
}

function countPlacedAirbusCards(assignments: AirbusAssignments): number {
  return Object.values(assignments).filter(Boolean).length
}

function removeCardFromAirbusTargets(
  assignments: AirbusAssignments,
  decoyAssignments: AirbusDecoyAssignments,
  card: string,
): { assignments: AirbusAssignments; decoyAssignments: AirbusDecoyAssignments } {
  const nextAssignments = { ...assignments }
  const nextDecoyAssignments = { ...decoyAssignments }
  for (const control of airbusCaptainFlow.controlIds) {
    if (nextAssignments[control] === card) nextAssignments[control] = null
  }
  for (const decoy of airbusCaptainFlow.decoyIds) {
    if (nextDecoyAssignments[decoy] === card) nextDecoyAssignments[decoy] = null
  }
  return { assignments: nextAssignments, decoyAssignments: nextDecoyAssignments }
}

function controlAnswerFeedback(assignments: AirbusAssignments): string {
  const placed = countPlacedAirbusCards(assignments)
  if (placed === 0) return 'Match each label card to a cockpit object.'

  const wrongControl = airbusCaptainFlow.controlIds.find((control) => {
    const card = assignments[control]
    return card !== null && card !== airbusCaptainFlow.controlMatch[control]
  })
  if (wrongControl) {
    return 'That card does not match this cockpit control. Try it somewhere else.'
  }

  const remaining = airbusCaptainFlow.controlCards.length - placed
  if (remaining > 0) {
    return `Green means correct. ${remaining} label${remaining === 1 ? '' : 's'} left.`
  }

  return `${airbusCaptainFlow.firstCompleteBanner}. ${airbusCaptainFlow.knowledgeLoggedText}`
}

function isAirlineTransportPilotAnswerCorrect(value: string): boolean {
  const normalized = normalize(value)
  return dc9LegacyFlow.atpAnswers.some((answer) => normalize(answer) === normalized)
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

function isDc9DepartureBeatActive(
  checkpoint: Dc9DepartureCheckpoint,
  beat: Dc9DepartureBeat,
): boolean {
  if (checkpoint === 'rampStart') return beat === 'rampRelease'
  if (checkpoint === 'taxiTurn') return beat === 'taxi'
  if (checkpoint === 'holdShort') return beat === 'holdShort'
  if (checkpoint === 'runwayLineup') {
    return beat === 'lineup' || beat === 'takeoffRoll' || beat === 'rotation'
  }
  return checkpoint === 'initialClimb' && beat === 'initialClimb'
}

function isNextDc9DepartureCheckpoint(
  current: Dc9DepartureCheckpoint,
  next: Dc9DepartureCheckpoint,
): boolean {
  return DC9_DEPARTURE_CHECKPOINTS.indexOf(next) === DC9_DEPARTURE_CHECKPOINTS.indexOf(current) + 1
}

function hintFor(state: GameState): string {
  if (state.phase === 'airbus') {
    if (countPlacedAirbusCards(state.airbusAssignments) !== airbusCaptainFlow.controlCards.length) {
      return 'Green boxes are correct. Red boxes need a different label. Place the remaining cards on the visible boxes.'
    }
    if (!allControlsCorrect(state.airbusAssignments)) {
      return 'Fix the red box by selecting that card again and placing a better match.'
    }
    return `${airbusCaptainFlow.firstCompleteBanner}. ${airbusCaptainFlow.knowledgeLoggedText}`
  }

  if (state.phase === 'dc9' && state.dc9.stage === 'qualification') {
    return 'Use the standard total-time milestone for an Airline Transport Pilot certificate.'
  }

  if (state.phase === 'locker') {
    if (!state.lockerIntroCompleted) return 'Let the locker room come into view.'
    if (state.lockerHatRevealed) return 'The upper cubby is open. The captain’s hat is ready to be recognized.'
    const available = lockerFlow.memoryIds.filter((id) => isLockerMemoryAvailable(state, id) && !state.lockerCompleted.includes(id))
    if (state.lockerCompleted.includes('wings')) return 'The airline wings are logged. One locker memory remains.'
    if (state.lockerCompleted.includes('chargingBull')) return 'The Charging Bull is logged. Continue to the airline wings.'
    if (state.lockerCompleted.includes('baseball')) return 'The baseball memory is logged. Look for the Charging Bull.'
    if (available.length === 0) return lockerFlow.openingInstruction
    return `Look for ${available.map((id) => lockerFlow.memories[id].label).join(', ')}.`
  }

  if (state.phase === 'dc9' && state.dc9.stage === 'controlCheck') {
    const next = dc9ControlCheckNextItem(state.dc9.controlCheck)
    return next
      ? `${dc9LegacyFlow.controlCheck.items[next].detail} ${dc9LegacyFlow.controlCheck.instructions}`
      : dc9LegacyFlow.controlCheck.completionText
  }

  if (state.phase === 'dc9' && state.dc9.stage === 'instrumentScan') {
    const prompt = dc9InstrumentScanPrompt(state.dc9.instrumentScan)
    return prompt
      ? `${dc9LegacyFlow.instrumentScan.prompts[prompt].strongerHint} Looking for the ${DC9_INSTRUMENTS[prompt].label.toLowerCase()}.`
      : dc9LegacyFlow.instrumentScan.completionText
  }

  if (state.phase === 'dc9') {
    if (state.dc9.routeCompleted.length !== dc9LegacyFlow.routePuzzleAnswers.length) {
      return state.dc9.routeAttempts > 0
        ? dc9LegacyFlow.routeMileageHint
        : 'Use the code, city, and period-mileage columns to identify the three short MEM DC-9 routes.'
    }
    if (state.dc9.secureAttempts > 0) {
      const next = DC9_SECURE_ORDER[state.dc9.secureSequence.length]
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
    airbusQualificationAnswer: '',
    airbusSimulator: createInitialAirbusSimulatorProgress(),
    lockerCompleted: [],
    lockerAttempts: { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: false,
    lockerHatRevealed: false,
    dc9: {
      stage: 'controlCheck',
      controlCheck: [],
      instrumentScan: createInitialDc9InstrumentScanProgress(),
      departure: createInitialDc9DepartureProgress(),
      routeSelections: [],
      routeCompleted: [],
      routeAttempts: 0,
      homePage: 0,
      homeOperationsCompleted: false,
      secureSequence: [],
      secureAttempts: 0,
      keyRevealed: false,
      keyClaimed: false,
    },
    airbusCaptainModeUnlocked: false,
    completedPuzzles: [],
    hintsUsed: 0,
    rewardUnlocked: false,
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
        phase: 'dc9',
        statusMessage: 'The parked DC-9 is ready. Walk every right-seat control to its stops.',
      }

    case 'OPEN_DC9_ROUTE_RECORD':
      if (state.phase !== 'dc9' || (state.dc9.stage !== 'intro' && state.dc9.stage !== 'routeRecord')) return state
      return {
        ...state,
        dc9: { ...state.dc9, stage: 'routeRecord' },
        statusMessage: 'Legacy Route Record opened. Select three familiar stops.',
      }

    case 'TOGGLE_DC9_ROUTE': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'routeRecord') return state
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
      if (state.phase !== 'dc9' || state.dc9.stage !== 'routeRecord') return state
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
            stage: 'memphisDeparture',
            routeSelections: [...approved],
            routeCompleted: [...approved],
          },
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
        statusMessage: hint,
      }
    }

    case 'SAVE_DC9_DEPARTURE_CHECKPOINT': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'memphisDeparture') return state
      if (
        action.checkpoint === 'complete'
        || !isNextDc9DepartureCheckpoint(state.dc9.departure.checkpoint, action.checkpoint)
      ) return state
      const departure = advanceDc9DepartureProgress(state.dc9.departure, {
        type: 'checkpoint',
        checkpoint: action.checkpoint,
      })
      if (departure === state.dc9.departure) return state
      return { ...state, dc9: { ...state.dc9, departure } }
    }

    case 'RECORD_DC9_DEPARTURE_MISTAKE': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'memphisDeparture') return state
      if (!isDc9DepartureBeatActive(state.dc9.departure.checkpoint, action.beat)) return state
      return {
        ...state,
        dc9: {
          ...state.dc9,
          departure: recordDc9DepartureMistake(state.dc9.departure, action.beat),
        },
      }
    }

    case 'RESTORE_DC9_DEPARTURE_CHECKPOINT':
      return state

    case 'COMPLETE_DC9_MEMPHIS_DEPARTURE': {
      if (
        state.phase !== 'dc9'
        || state.dc9.stage !== 'memphisDeparture'
        || state.dc9.departure.checkpoint !== 'initialClimb'
      ) return state
      return {
        ...state,
        dc9: {
          ...state.dc9,
          stage: 'homeOperations',
          departure: advanceDc9DepartureProgress(state.dc9.departure, { type: 'complete' }),
        },
        statusMessage: 'Memphis legacy departure complete. The Home Operations Log is open.',
      }
    }

    case 'SET_HOME_OPERATIONS_PAGE': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'homeOperations') return state
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
      if (state.phase !== 'dc9' || state.dc9.stage !== 'homeOperations') return state
      if (state.dc9.homePage < dc9LegacyFlow.homeOperationsPages.length - 1) {
        return { ...state, statusMessage: 'Continue through the Home Operations Log before applying its legacy seal.' }
      }
      return {
        ...state,
        dc9: {
          ...state.dc9,
          stage: 'instrumentScan',
          homeOperationsCompleted: true,
        },
        statusMessage: dc9LegacyFlow.instrumentScan.intro,
      }
    }

    case 'APPLY_DC9_CONTROL_CHECK': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'controlCheck') return state
      const reached = dc9ControlCheckReached(action.controls, state.dc9.controlCheck)
      if (reached.length === 0) return state
      const controlCheck = DC9_CONTROL_CHECK_ITEM_IDS.filter(
        (id) => state.dc9.controlCheck.includes(id) || reached.includes(id),
      )
      if (dc9ControlCheckComplete(controlCheck)) {
        return {
          ...state,
          dc9: { ...state.dc9, stage: 'intro', controlCheck },
          statusMessage: dc9LegacyFlow.controlCheck.completionText,
        }
      }
      const remaining = DC9_CONTROL_CHECK_ITEM_IDS.length - controlCheck.length
      const justChecked = reached[reached.length - 1]
      const checkedLabel = justChecked ? dc9LegacyFlow.controlCheck.items[justChecked].label : 'Control'
      return {
        ...state,
        dc9: { ...state.dc9, controlCheck },
        statusMessage: `${checkedLabel} checked. `
          + `${remaining} control movement${remaining === 1 ? '' : 's'} remaining.`,
      }
    }

    case 'IDENTIFY_DC9_INSTRUMENT': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'instrumentScan') return state
      const prompt = dc9InstrumentScanPrompt(state.dc9.instrumentScan)
      if (prompt === null) return state
      const result = applyDc9InstrumentAnswer(state.dc9.instrumentScan, action.instrument)
      if (result.outcome === 'ignored') return state
      if (result.outcome === 'incorrect') {
        const copy = dc9LegacyFlow.instrumentScan.prompts[prompt]
        return {
          ...state,
          dc9: { ...state.dc9, instrumentScan: result.progress },
          statusMessage: dc9InstrumentScanShowsFinalSupport(result.progress)
            ? `${copy.strongerHint} It is outlined for you now.`
            : result.progress.attempts >= 2
              ? copy.strongerHint
              : copy.retry,
        }
      }
      const identifiedCopy = dc9LegacyFlow.instrumentScan.prompts[prompt]
      if (dc9InstrumentScanComplete(result.progress)) {
        return {
          ...state,
          dc9: { ...state.dc9, stage: 'shutdown', instrumentScan: result.progress },
          statusMessage: `${identifiedCopy.feedback} ${dc9LegacyFlow.instrumentScan.completionText} `
            + dc9LegacyFlow.secureInstruction,
        }
      }
      return {
        ...state,
        dc9: { ...state.dc9, instrumentScan: result.progress },
        statusMessage: `${identifiedCopy.feedback} ${identifiedCopy.reading}`,
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
          statusMessage: 'Card removed from control. Reassign a matching card.',
        }
      }

      const cleared = removeCardFromAirbusTargets(state.airbusAssignments, state.airbusDecoyAssignments, action.card)
      const nextAssignments = {
        ...cleared.assignments,
        [action.control]: action.card,
      }
      const feedback = controlAnswerFeedback(nextAssignments)
      const correctPlacement = action.card === airbusCaptainFlow.controlMatch[action.control]
      const hasWrongPlacement = airbusCaptainFlow.controlIds.some((control) => {
        const card = nextAssignments[control]
        return card !== null && card !== airbusCaptainFlow.controlMatch[control]
      })
      const familiarizationComplete = allControlsCorrect(nextAssignments)
      const qualificationProgress = familiarizationComplete
        ? {
            ...state.airbusSimulator,
            familiarization: 'completed' as const,
            location: state.airbusSimulator.location === 'qualification'
              ? 'hub' as const
              : state.airbusSimulator.location,
            cameraPhase: state.airbusSimulator.stormLine.status === 'not_started'
              ? 'qualified' as const
              : state.airbusSimulator.cameraPhase,
          }
        : state.airbusSimulator.stormLine.status === 'not_started'
          ? {
              ...state.airbusSimulator,
              familiarization: 'unseen' as const,
              location: 'qualification' as const,
              cameraPhase: 'familiarization' as const,
            }
          : state.airbusSimulator
      return {
        ...state,
        airbusAssignments: nextAssignments,
        airbusDecoyAssignments: cleared.decoyAssignments,
        airbusSimulator: qualificationProgress,
        statusMessage: familiarizationComplete
          ? 'Cockpit familiarization complete. Storm Line simulator ready.'
          : correctPlacement && !hasWrongPlacement
          ? airbusCaptainFlow.controlHints[action.control]
          : feedback,
      }
    }

    case 'SELECT_AIRBUS_SCENARIO': {
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.familiarization !== 'completed' ||
        state.airbusSimulator.location !== 'hub'
      ) return state
      const availability = getAirbusScenarioAvailability(action.scenario, {
        qualified: true,
        stormCompleted: state.airbusSimulator.stormLine.status === 'completed',
        engineOutCompleted: state.airbusSimulator.engineOut.status === 'completed',
      })
      if (availability === 'locked') return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: action.scenario,
        },
        statusMessage: action.scenario === 'stormLine'
          ? 'Storm Line selected. Begin when ready.'
          : 'Engine-Out Handling selected. Begin when ready.',
      }
    }

    case 'BEGIN_AIRBUS_STORM_TRANSITION':
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.familiarization !== 'completed' ||
        state.airbusSimulator.cameraPhase !== 'qualified' ||
        (state.airbusSimulator.stormLine.status !== 'not_started' &&
          state.airbusSimulator.stormLine.status !== 'completed') ||
        !allControlsCorrect(state.airbusAssignments)
      ) return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'stormLine',
          cameraPhase: 'transitioning',
          workload: state.airbusSimulator.stormLine.status === 'completed'
            ? resetAirbusScenarioWorkload(state.airbusSimulator.workload, 'stormLine')
            : state.airbusSimulator.workload,
          stormLine: state.airbusSimulator.stormLine.status === 'completed'
            ? {
                ...state.airbusSimulator.stormLine,
                checkpoint: 'stormEntry',
                attempts: { stormEntry: 0, stormCore: 0, clearAir: 0 },
              }
            : state.airbusSimulator.stormLine,
        },
        statusMessage: 'Captain view moving forward. Storm Flight instruments coming into focus.',
      }

    case 'START_AIRBUS_STORM_LINE':
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.familiarization !== 'completed' ||
        state.airbusSimulator.cameraPhase !== 'transitioning' ||
        !allControlsCorrect(state.airbusAssignments)
      ) return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'stormLine',
          cameraPhase: 'storm',
          stormLine: {
            ...state.airbusSimulator.stormLine,
            status: 'in_progress',
          },
        },
        statusMessage: 'Storm Line active. Fly the captain’s seat through the stable weather gap.',
      }

    case 'SAVE_AIRBUS_STORM_CHECKPOINT':
      if (state.phase !== 'airbus' || state.airbusSimulator.stormLine.status !== 'in_progress') return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          stormLine: {
            ...state.airbusSimulator.stormLine,
            checkpoint: action.checkpoint,
            attempts: { ...action.attempts },
          },
        },
        statusMessage: action.checkpoint === 'clearAir'
          ? 'Clear air ahead. Stabilize the aircraft to finish Storm Line.'
          : 'Storm checkpoint recorded.',
      }

    case 'COMPLETE_AIRBUS_STORM_LINE': {
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.stormLine.status !== 'in_progress' ||
        !hasAirbusWorkloadTasks(state.airbusSimulator.workload, [
          'stormScanRange',
          'stormGapSelection',
        ])
      ) return state
      const bestTraits = unique([...state.airbusSimulator.stormLine.bestTraits, ...action.traits])
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'hub',
          cameraPhase: 'qualified',
          stormLine: {
            ...state.airbusSimulator.stormLine,
            status: 'completed',
            bestTraits,
          },
          engineOut: {
            ...state.airbusSimulator.engineOut,
            status: state.airbusSimulator.engineOut.status === 'completed'
              ? 'completed'
              : 'not_started',
          },
        },
        statusMessage: 'Storm Line clear. Engine-Out Handling unlocked in the Simulator Hub.',
      }
    }

    case 'BEGIN_AIRBUS_ENGINE_OUT':
      if (
        state.phase !== 'airbus' ||
        (state.airbusSimulator.location !== 'hub' &&
          state.airbusSimulator.location !== 'engineOut') ||
        state.airbusSimulator.stormLine.status !== 'completed' ||
        (state.airbusSimulator.engineOut.status !== 'not_started' &&
          state.airbusSimulator.engineOut.status !== 'completed')
      ) return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'engineOut',
          cameraPhase: 'storm',
          workload: state.airbusSimulator.engineOut.status === 'completed'
            ? resetAirbusScenarioWorkload(state.airbusSimulator.workload, 'engineOut')
            : state.airbusSimulator.workload,
          engineOut: {
            ...state.airbusSimulator.engineOut,
            status: 'in_progress',
            checkpoint: state.airbusSimulator.engineOut.status === 'completed'
              ? 'recognition'
              : state.airbusSimulator.engineOut.checkpoint,
            attempts: state.airbusSimulator.engineOut.status === 'completed'
              ? { recognition: 0, stabilization: 0, diversion: 0 }
              : state.airbusSimulator.engineOut.attempts,
          },
        },
        statusMessage: 'Engine-Out Handling is a deliberate cruise training exercise. Maintain calm control.',
      }

    case 'SAVE_AIRBUS_ENGINE_OUT_CHECKPOINT':
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.location !== 'engineOut' ||
        state.airbusSimulator.engineOut.status !== 'in_progress'
      ) return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          engineOut: {
            ...state.airbusSimulator.engineOut,
            checkpoint: action.checkpoint,
            attempts: { ...action.attempts },
          },
        },
        statusMessage: action.checkpoint === 'stabilization'
          ? 'Stabilization checkpoint recorded.'
          : action.checkpoint === 'diversion'
            ? 'Diversion checkpoint recorded. SAFE RETURN is available.'
            : 'Recognition checkpoint recorded.',
      }

    case 'COMPLETE_AIRBUS_ENGINE_OUT': {
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.location !== 'engineOut' ||
        state.airbusSimulator.engineOut.status !== 'in_progress' ||
        !hasAirbusWorkloadTasks(state.airbusSimulator.workload, [
          'engineEventAcknowledgement',
          'engineSafeReturnSelection',
        ])
      ) return state
      const bestTraits = unique([...state.airbusSimulator.engineOut.bestTraits, ...action.traits])
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'hub',
          cameraPhase: 'qualified',
          engineOut: {
            ...state.airbusSimulator.engineOut,
            status: 'completed',
            bestTraits,
          },
        },
        completedPuzzles: unique([...state.completedPuzzles, 'airbus']),
        statusMessage: `${airbusCaptainFlow.firstCompleteBanner}. Engine-Out Handling complete.`,
      }
    }

    case 'APPLY_AIRBUS_WORKLOAD_ACTION': {
      const task = activeAirbusWorkloadTask(state)
      if (!task) return state
      const result = applyAirbusWorkloadAction(
        state.airbusSimulator.workload,
        task,
        action.action,
      )
      if (result.outcome === 'ignored') return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          workload: result.progress,
        },
        statusMessage: result.outcome === 'correct'
          ? completedAirbusWorkloadMessage(task)
          : airbusWorkloadHint(task, result.progress.attempts[task]),
      }
    }

    case 'RETURN_TO_AIRBUS_SCENARIO_HUB':
      if (
        state.phase !== 'airbus' ||
        state.airbusSimulator.familiarization !== 'completed' ||
        state.airbusSimulator.location === 'qualification'
      ) return state
      return {
        ...state,
        airbusSimulator: {
          ...state.airbusSimulator,
          location: 'hub',
          cameraPhase: 'qualified',
        },
        statusMessage: 'Simulator Hub ready.',
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
        statusMessage: 'That area is not part of this five-label check. Use one of the visible cockpit boxes.',
      }
    }

    case 'SET_ATP_QUALIFICATION_ANSWER':
      if (state.phase !== 'dc9' || state.dc9.stage !== 'qualification') return state
      return {
        ...state,
        airbusQualificationAnswer: action.value,
      }

    case 'SUBMIT_DC9_ATP_QUALIFICATION': {
      if (state.phase !== 'dc9' || state.dc9.stage !== 'qualification') return state
      if (!isAirlineTransportPilotAnswerCorrect(state.airbusQualificationAnswer)) {
        return {
          ...state,
          statusMessage: 'That Airline Transport Pilot answer is not yet recognized. Try the standard hour milestone.',
        }
      }
      return {
        ...state,
        dc9: { ...state.dc9, stage: 'keyReveal' },
        statusMessage: `${dc9LegacyFlow.atpFeedback} The Captain's Key is ready.`,
      }
    }

    case 'CONTINUE_FROM_AIRBUS_TO_REWARD':
      if (state.phase !== 'airbus' || !state.completedPuzzles.includes('airbus')) return state
      return {
        ...state,
        phase: 'reward',
        rewardUnlocked: true,
        statusMessage: 'Ground transport upgrade authorized.',
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
        airbusCaptainModeUnlocked: true,
        completedPuzzles: unique([...state.completedPuzzles, 'locker']),
        statusMessage: `${lockerFlow.hatText.foundText} ${lockerFlow.hatText.promotionText} ${lockerFlow.hatText.captainModeText}`,
      }

    case 'ACTIVATE_DC9_CONTROL': {
      if (state.phase !== 'dc9') return state
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
            stage: complete ? 'qualification' : 'shutdown',
            secureSequence: nextSequence,
          },
          statusMessage: complete
            ? `${dc9LegacyFlow.completionText} Complete the Airline Transport Pilot milestone to close the Final Flight Log.`
            : `${dc9LegacyFlow.secureControls[action.controlId].label} off. ${DC9_SECURE_ORDER.length - nextSequence.length} control${DC9_SECURE_ORDER.length - nextSequence.length === 1 ? '' : 's'} remaining.`,
        }
      }

      return {
        ...state,
        dc9: { ...state.dc9, secureAttempts: state.dc9.secureAttempts + 1 },
        statusMessage: dc9LegacyFlow.secureRetry,
      }
    }

    case 'OPEN_CAPTAINS_KEY':
      if (state.phase !== 'dc9' || state.dc9.stage !== 'keyReveal') return state
      return {
        ...state,
        dc9: { ...state.dc9, keyRevealed: true },
        statusMessage: "The Captain's Key is ready. Take it to open the Captain's Locker.",
      }

    case 'CLAIM_CAPTAINS_KEY':
      if (state.phase !== 'dc9' || state.dc9.stage !== 'keyReveal' || !state.dc9.keyRevealed) return state
      return {
        ...state,
        phase: 'locker',
        dc9: {
          ...state.dc9,
          stage: 'complete',
          keyClaimed: true,
        },
        completedPuzzles: unique([...state.completedPuzzles, 'dc9']),
        lockerIntroCompleted: false,
        statusMessage: "The Captain's Key is claimed. The Captain's Locker is opening.",
      }

    case 'CONTINUE_FROM_LOCKER_TO_AIRBUS':
      if (state.phase !== 'locker' || !state.completedPuzzles.includes('locker')) return state
      if (state.completedPuzzles.includes('airbus')) {
        return {
          ...state,
          phase: 'reward',
          rewardUnlocked: true,
          statusMessage: 'Airbus A320 Pop T Captain Mode is already complete. Ground transport upgrade authorized.',
        }
      }
      return {
        ...state,
        phase: 'airbus',
        airbusQualificationAnswer: '',
        statusMessage:
          'The family legacy continues in Airbus A320 Pop T Captain Mode. First up: a drag-and-drop cockpit check.',
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
