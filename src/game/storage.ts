import {
  createInitialAirbusSimulatorProgress,
  createInitialState,
  DC9_SECURE_ORDER,
  GAME_SCHEMA_VERSION,
  type Dc9ChapterProgress,
  type Dc9SecureControlId,
  type AirbusSimulatorProgress,
  type GamePhase,
  type GameState,
  type PuzzleId,
} from './state'
import {
  airbusCaptainFlow,
  dc9LegacyFlow,
  lockerFlow,
  type AirbusControl,
  type AirbusDecoy,
  type LockerMemoryId,
  type LockerQuestionId,
} from './config'

export const STORAGE_KEY = 'cockpit-escape-room:game-state:v1'

type LegacyPhase = 'briefing' | 'airbus' | 'locker' | 'captain' | 'reward' | 'mars'
type LegacyPuzzleId = 'firstOfficer' | 'locker' | 'captain'

interface LegacyCommonState {
  phase: LegacyPhase
  airbusAssignments: Record<AirbusControl, string | null>
  airbusDecoyAssignments: Record<AirbusDecoy, string | null>
  airbusClockAnswer: string
  lockerCompleted: LockerMemoryId[]
  lockerAttempts: Record<LockerQuestionId, number>
  lockerIntroCompleted: boolean
  lockerHatRevealed: boolean
  captainModeUnlocked: boolean
  captainRouteVerified: boolean
  dc9SecureSequence: Dc9SecureControlId[]
  captainAttempts: { route: number; secure: number }
  routeSelections: string[]
  completedPuzzles: LegacyPuzzleId[]
  hintsUsed: number
  captainRewardUnlocked: boolean
  marsUnlocked: boolean
  statusMessage: string
}

type LegacyV6State = LegacyCommonState & { schemaVersion: 6 }
type LegacyV7State = LegacyCommonState & { schemaVersion: 7; dc9: unknown }
type CanonicalV8State = Omit<GameState, 'schemaVersion' | 'airbusSimulator'> & { schemaVersion: 8 }

const APPROVED_ROUTE_CODES = [...dc9LegacyFlow.routePuzzleAnswers] as string[]
const ALL_ROUTE_CODES = dc9LegacyFlow.routePuzzleOptions.map((route) => route.code) as string[]

function hasNoDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isLegacyPhase(value: unknown): value is LegacyPhase {
  return value === 'briefing' || value === 'airbus' || value === 'locker' || value === 'captain' || value === 'reward' || value === 'mars'
}

function isCanonicalPhase(value: unknown): value is GamePhase {
  return value === 'briefing' || value === 'dc9' || value === 'locker' || value === 'airbus' || value === 'reward' || value === 'mars'
}

function isSafeAssignments(value: unknown): value is Record<AirbusControl, string | null> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return airbusCaptainFlow.controlIds.every((control) => {
    const raw = candidate[control]
    return Object.prototype.hasOwnProperty.call(candidate, control) && (raw === null || typeof raw === 'string')
  })
}

function isSafeDecoyAssignments(value: unknown): value is Record<AirbusDecoy, string | null> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return airbusCaptainFlow.decoyIds.every((decoy) => {
    const raw = candidate[decoy]
    return Object.prototype.hasOwnProperty.call(candidate, decoy) && (raw === null || typeof raw === 'string')
  })
}

function isSafeSecureSequence(value: unknown): value is Dc9SecureControlId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is Dc9SecureControlId => (DC9_SECURE_ORDER as readonly string[]).includes(entry)) &&
    value.every((entry, index) => entry === DC9_SECURE_ORDER[index])
  )
}

function isSafeLegacyAttempts(value: unknown): value is LegacyCommonState['captainAttempts'] {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return isSafeNonNegativeInteger(candidate.route) && isSafeNonNegativeInteger(candidate.secure)
}

function isSafeLegacyPuzzleIds(value: unknown): value is LegacyPuzzleId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is LegacyPuzzleId => entry === 'firstOfficer' || entry === 'locker' || entry === 'captain') &&
    hasNoDuplicates(value)
  )
}

function isSafePuzzleIds(value: unknown): value is PuzzleId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is PuzzleId => entry === 'dc9' || entry === 'locker' || entry === 'airbus') &&
    hasNoDuplicates(value)
  )
}

function isSafeLockerCompleted(value: unknown): value is LockerMemoryId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is LockerMemoryId => (lockerFlow.memoryIds as readonly string[]).includes(entry)) &&
    hasNoDuplicates(value)
  )
}

function isSafeLockerAttempts(value: unknown): value is Record<LockerQuestionId, number> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return (
    isSafeNonNegativeInteger(candidate.watch) &&
    isSafeNonNegativeInteger(candidate.baseball) &&
    isSafeNonNegativeInteger(candidate.chargingBull) &&
    isSafeNonNegativeInteger(candidate.wings)
  )
}

function normalizeLockerAttempts(value: unknown): Record<LockerQuestionId, number> | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  const watch = isSafeNonNegativeInteger(candidate.watch) ? candidate.watch : null
  const baseball = isSafeNonNegativeInteger(candidate.baseball) ? candidate.baseball : null
  if (watch === null || baseball === null) return null
  return {
    watch,
    baseball,
    chargingBull: isSafeNonNegativeInteger(candidate.chargingBull) ? candidate.chargingBull : 0,
    wings: isSafeNonNegativeInteger(candidate.wings) ? candidate.wings : 0,
  }
}

function hasSafeLegacyCommonState(candidate: Record<string, unknown>): boolean {
  return (
    isLegacyPhase(candidate.phase) &&
    isSafeAssignments(candidate.airbusAssignments) &&
    isSafeDecoyAssignments(candidate.airbusDecoyAssignments) &&
    typeof candidate.airbusClockAnswer === 'string' &&
    isSafeLockerCompleted(candidate.lockerCompleted) &&
    isSafeLockerAttempts(candidate.lockerAttempts) &&
    typeof candidate.lockerIntroCompleted === 'boolean' &&
    typeof candidate.lockerHatRevealed === 'boolean' &&
    typeof candidate.captainModeUnlocked === 'boolean' &&
    typeof candidate.captainRouteVerified === 'boolean' &&
    isSafeSecureSequence(candidate.dc9SecureSequence) &&
    isSafeLegacyAttempts(candidate.captainAttempts) &&
    Array.isArray(candidate.routeSelections) &&
    candidate.routeSelections.every(isString) &&
    hasNoDuplicates(candidate.routeSelections) &&
    isSafeLegacyPuzzleIds(candidate.completedPuzzles) &&
    isSafeNonNegativeInteger(candidate.hintsUsed) &&
    typeof candidate.captainRewardUnlocked === 'boolean' &&
    typeof candidate.marsUnlocked === 'boolean' &&
    isString(candidate.statusMessage)
  )
}

function isLegacyV6State(value: unknown): value is LegacyV6State {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return candidate.schemaVersion === 6 && hasSafeLegacyCommonState(candidate)
}

function isLegacyV7State(value: unknown): value is LegacyV7State {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return candidate.schemaVersion === 7 && hasSafeLegacyCommonState(candidate)
}

function fullDc9Progress(routeAttempts = 0, secureAttempts = 0): Dc9ChapterProgress {
  return {
    stage: 'complete',
    routeSelections: [...APPROVED_ROUTE_CODES],
    routeCompleted: [...APPROVED_ROUTE_CODES],
    routeAttempts,
    homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
    homeOperationsCompleted: true,
    secureSequence: [...DC9_SECURE_ORDER],
    secureAttempts,
    keyRevealed: true,
    keyClaimed: true,
  }
}

function normalizeRouteCodes(value: unknown, allowed: readonly string[]): string[] {
  if (!Array.isArray(value)) return []
  const found = new Set(value.filter((entry): entry is string => typeof entry === 'string' && allowed.includes(entry)))
  return allowed.filter((code) => found.has(code))
}

function normalizeSecureSequence(value: unknown): Dc9SecureControlId[] {
  if (!Array.isArray(value)) return []
  const result: Dc9SecureControlId[] = []
  for (const controlId of DC9_SECURE_ORDER) {
    if (value[result.length] !== controlId) break
    result.push(controlId)
  }
  return result
}

function normalizeDc9Progress(
  value: unknown,
  completed: boolean,
  fallbackRouteAttempts = 0,
  fallbackSecureAttempts = 0,
): Dc9ChapterProgress {
  const candidate = value && typeof value === 'object' ? value as Record<string, unknown> : null
  const routeAttempts = candidate && isSafeNonNegativeInteger(candidate.routeAttempts) ? candidate.routeAttempts : fallbackRouteAttempts
  const secureAttempts = candidate && isSafeNonNegativeInteger(candidate.secureAttempts) ? candidate.secureAttempts : fallbackSecureAttempts
  if (completed) return fullDc9Progress(routeAttempts, secureAttempts)
  if (!candidate) return { ...createInitialState().dc9, routeAttempts, secureAttempts }

  const routeCompleted = normalizeRouteCodes(candidate.routeCompleted, APPROVED_ROUTE_CODES)
  const routeSelections = normalizeRouteCodes(candidate.routeSelections, ALL_ROUTE_CODES)
  const routesComplete = routeCompleted.length === APPROVED_ROUTE_CODES.length
  const homeOperationsCompleted = routesComplete && candidate.homeOperationsCompleted === true
  const secureSequence = homeOperationsCompleted ? normalizeSecureSequence(candidate.secureSequence) : []
  const shutdownComplete = secureSequence.length === DC9_SECURE_ORDER.length
  const keyClaimed = shutdownComplete && candidate.keyClaimed === true
  const keyRevealed = shutdownComplete && (candidate.keyRevealed === true || keyClaimed)
  const hasRouteEvidence = routeSelections.length > 0 || routeCompleted.length > 0 || routeAttempts > 0
  const savedStage = candidate.stage
  const stage: Dc9ChapterProgress['stage'] = keyClaimed
    ? 'complete'
    : shutdownComplete
      ? savedStage === 'qualification' ? 'qualification' : 'keyReveal'
      : homeOperationsCompleted
        ? 'shutdown'
        : routesComplete
          ? 'homeOperations'
          : hasRouteEvidence
            ? 'routeRecord'
            : 'intro'
  const finalPage = dc9LegacyFlow.homeOperationsPages.length - 1
  const homePage = routesComplete && isSafeNonNegativeInteger(candidate.homePage) ? Math.min(candidate.homePage, finalPage) : 0

  return {
    stage,
    routeSelections: stage === 'intro' ? [] : routeSelections,
    routeCompleted: stage === 'intro' ? [] : routeCompleted,
    routeAttempts: stage === 'intro' ? 0 : routeAttempts,
    homePage,
    homeOperationsCompleted,
    secureSequence,
    secureAttempts,
    keyRevealed,
    keyClaimed,
  }
}

function mapLegacyPuzzles(value: readonly LegacyPuzzleId[]): PuzzleId[] {
  const mapped = value.map((id): PuzzleId => id === 'captain' ? 'dc9' : id === 'firstOfficer' ? 'airbus' : 'locker')
  return [...new Set(mapped)]
}

function mapLegacyPhase(value: LegacyPhase): GamePhase {
  return value === 'captain' ? 'dc9' : value
}

export function migrateV7ToV8(value: unknown): CanonicalV8State | null {
  if (!isLegacyV7State(value)) return null
  const phase = mapLegacyPhase(value.phase)
  const completedPuzzles = mapLegacyPuzzles(value.completedPuzzles)
  const rewardUnlocked = value.captainRewardUnlocked || phase === 'reward' || phase === 'mars'
  const completedDc9 = completedPuzzles.includes('dc9') || rewardUnlocked
  const dc9 = normalizeDc9Progress(
    value.dc9,
    completedDc9,
    value.captainAttempts.route,
    value.captainAttempts.secure,
  )

  return {
    schemaVersion: 8,
    phase,
    airbusAssignments: value.airbusAssignments,
    airbusDecoyAssignments: value.airbusDecoyAssignments,
    airbusQualificationAnswer: value.airbusClockAnswer,
    lockerCompleted: value.lockerCompleted,
    lockerAttempts: value.lockerAttempts,
    lockerIntroCompleted: value.lockerIntroCompleted,
    lockerHatRevealed: value.lockerHatRevealed,
    dc9,
    airbusCaptainModeUnlocked: value.captainModeUnlocked || completedPuzzles.includes('locker'),
    completedPuzzles,
    hintsUsed: value.hintsUsed,
    rewardUnlocked,
    marsUnlocked: value.marsUnlocked,
    statusMessage: phase === 'dc9' && dc9.stage === 'intro'
      ? 'The parked DC-9 is ready. Find the route strip on the first-officer yoke.'
      : value.statusMessage,
  }
}

function hasSafeCanonicalCommonState(candidate: Record<string, unknown>): boolean {
  return (
    isCanonicalPhase(candidate.phase) &&
    isSafeAssignments(candidate.airbusAssignments) &&
    isSafeDecoyAssignments(candidate.airbusDecoyAssignments) &&
    typeof candidate.airbusQualificationAnswer === 'string' &&
    isSafeLockerCompleted(candidate.lockerCompleted) &&
    isSafeLockerAttempts(candidate.lockerAttempts) &&
    typeof candidate.lockerIntroCompleted === 'boolean' &&
    typeof candidate.lockerHatRevealed === 'boolean' &&
    typeof candidate.airbusCaptainModeUnlocked === 'boolean' &&
    isSafePuzzleIds(candidate.completedPuzzles) &&
    isSafeNonNegativeInteger(candidate.hintsUsed) &&
    typeof candidate.rewardUnlocked === 'boolean' &&
    typeof candidate.marsUnlocked === 'boolean' &&
    isString(candidate.statusMessage)
  )
}

function allAirbusAssignmentsCorrect(value: unknown): boolean {
  if (!isSafeAssignments(value)) return false
  return airbusCaptainFlow.controlIds.every((control) => value[control] === airbusCaptainFlow.controlMatch[control])
}

function simulatorProgressForV8(candidate: Record<string, unknown>, completedPuzzles: PuzzleId[]): AirbusSimulatorProgress {
  const completed = completedPuzzles.includes('airbus')
  const familiarizationComplete = completed || allAirbusAssignmentsCorrect(candidate.airbusAssignments)
  const progress = createInitialAirbusSimulatorProgress()
  if (!familiarizationComplete) return progress
  return {
    ...progress,
    familiarization: 'completed',
    cameraPhase: 'qualified',
    location: 'hub',
    stormLine: {
      ...progress.stormLine,
      status: completed ? 'completed' : 'not_started',
    },
    engineOut: {
      ...progress.engineOut,
      status: completed ? 'completed' : 'locked',
    },
  }
}

function normalizeV8(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 8 || !hasSafeCanonicalCommonState(candidate)) return null
  const phase = candidate.phase as GamePhase
  const completedPuzzles = candidate.completedPuzzles as PuzzleId[]
  const rewardUnlocked = candidate.rewardUnlocked === true || phase === 'reward' || phase === 'mars'
  const dc9 = normalizeDc9Progress(candidate.dc9, completedPuzzles.includes('dc9') || rewardUnlocked)

  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase,
    airbusAssignments: candidate.airbusAssignments as GameState['airbusAssignments'],
    airbusDecoyAssignments: candidate.airbusDecoyAssignments as GameState['airbusDecoyAssignments'],
    airbusQualificationAnswer: candidate.airbusQualificationAnswer as string,
    airbusSimulator: simulatorProgressForV8(candidate, completedPuzzles),
    lockerCompleted: candidate.lockerCompleted as LockerMemoryId[],
    lockerAttempts: candidate.lockerAttempts as GameState['lockerAttempts'],
    lockerIntroCompleted: candidate.lockerIntroCompleted as boolean,
    lockerHatRevealed: candidate.lockerHatRevealed as boolean,
    dc9,
    airbusCaptainModeUnlocked: candidate.airbusCaptainModeUnlocked as boolean,
    completedPuzzles,
    hintsUsed: candidate.hintsUsed as number,
    rewardUnlocked,
    marsUnlocked: candidate.marsUnlocked as boolean,
    statusMessage: candidate.statusMessage as string,
  }
}

const STORM_CHECKPOINTS = ['stormEntry', 'stormCore', 'clearAir'] as const
const STORM_TRAITS = ['calmControl', 'weatherJudgment', 'energyManagement'] as const
const ENGINE_OUT_CHECKPOINTS = ['recognition', 'stabilization', 'diversion'] as const
const ENGINE_OUT_TRAITS = ['directionalControl', 'energyDiscipline', 'calmDiversion'] as const

function normalizeAirbusSimulatorProgress(
  value: unknown,
  completed: boolean,
  assignmentsCorrect: boolean,
): AirbusSimulatorProgress {
  const fallback = createInitialAirbusSimulatorProgress()
  const qualificationProven = completed || assignmentsCorrect
  if (!qualificationProven) return fallback
  if (!value || typeof value !== 'object') {
    return {
      ...fallback,
      familiarization: 'completed',
      cameraPhase: 'qualified',
      location: 'hub',
      stormLine: { ...fallback.stormLine, status: completed ? 'completed' : 'not_started' },
      engineOut: { ...fallback.engineOut, status: completed ? 'completed' : 'locked' },
    }
  }
  const candidate = value as Record<string, unknown>
  const stormLine = candidate.stormLine && typeof candidate.stormLine === 'object'
    ? candidate.stormLine as Record<string, unknown>
    : null
  const attemptsCandidate = stormLine?.attempts && typeof stormLine.attempts === 'object'
    ? stormLine.attempts as Record<string, unknown>
    : null
  const attempts = {
    stormEntry: attemptsCandidate && isSafeNonNegativeInteger(attemptsCandidate.stormEntry)
      ? attemptsCandidate.stormEntry
      : 0,
    stormCore: attemptsCandidate && isSafeNonNegativeInteger(attemptsCandidate.stormCore)
      ? attemptsCandidate.stormCore
      : 0,
    clearAir: attemptsCandidate && isSafeNonNegativeInteger(attemptsCandidate.clearAir)
      ? attemptsCandidate.clearAir
      : 0,
  }
  const checkpoint = STORM_CHECKPOINTS.includes(stormLine?.checkpoint as typeof STORM_CHECKPOINTS[number])
    ? stormLine?.checkpoint as typeof STORM_CHECKPOINTS[number]
    : 'stormEntry'
  const status = stormLine?.status === 'in_progress' || stormLine?.status === 'completed'
    ? stormLine.status
    : 'not_started'
  const savedTraits = Array.isArray(stormLine?.bestTraits)
    ? stormLine.bestTraits.filter(isString)
    : []
  const bestTraits = STORM_TRAITS.filter((trait) => savedTraits.includes(trait))
  const normalizedStatus = completed ? 'completed' : status
  const engineOut = candidate.engineOut && typeof candidate.engineOut === 'object'
    ? candidate.engineOut as Record<string, unknown>
    : null
  const engineAttemptsCandidate = engineOut?.attempts && typeof engineOut.attempts === 'object'
    ? engineOut.attempts as Record<string, unknown>
    : null
  const hasSafeEngineCheckpoint = ENGINE_OUT_CHECKPOINTS.includes(
    engineOut?.checkpoint as typeof ENGINE_OUT_CHECKPOINTS[number],
  )
  const hasSafeEngineAttempts = engineAttemptsCandidate !== null &&
    ENGINE_OUT_CHECKPOINTS.every((entry) => isSafeNonNegativeInteger(engineAttemptsCandidate[entry]))
  const hasSafeEngineStatus = engineOut?.status === 'not_started' ||
    engineOut?.status === 'in_progress' ||
    engineOut?.status === 'completed' ||
    engineOut?.status === 'locked'
  const hasConsistentEngineCompletion = engineOut?.status !== 'completed' || completed
  const engineProgressValid = engineOut !== null &&
    hasSafeEngineStatus &&
    hasConsistentEngineCompletion &&
    hasSafeEngineCheckpoint &&
    hasSafeEngineAttempts
  const engineAttempts = engineProgressValid
    ? {
        recognition: engineAttemptsCandidate.recognition as number,
        stabilization: engineAttemptsCandidate.stabilization as number,
        diversion: engineAttemptsCandidate.diversion as number,
      }
    : { recognition: 0, stabilization: 0, diversion: 0 }
  const engineCheckpoint = engineProgressValid
    ? engineOut.checkpoint as typeof ENGINE_OUT_CHECKPOINTS[number]
    : 'recognition'
  const savedEngineTraits = Array.isArray(engineOut?.bestTraits)
    ? engineOut.bestTraits.filter(isString)
    : []
  const engineTraits = engineProgressValid
    ? ENGINE_OUT_TRAITS.filter((trait) => savedEngineTraits.includes(trait))
    : []
  const engineStatus = completed
    ? 'completed'
    : normalizedStatus !== 'completed'
      ? 'locked'
      : engineProgressValid && (engineOut.status === 'completed' || engineOut.status === 'in_progress')
        ? engineOut.status
        : 'not_started'
  const cameraPhase = normalizedStatus === 'in_progress' || engineStatus === 'in_progress'
    ? 'storm'
    : candidate.cameraPhase === 'transitioning'
      ? 'transitioning'
      : 'qualified'
  const location = completed
    ? 'hub'
    : engineStatus === 'in_progress'
      ? 'engineOut'
      : normalizedStatus === 'in_progress'
        ? 'stormLine'
        : candidate.location === 'stormLine'
          ? 'stormLine'
          : candidate.location === 'engineOut' && engineProgressValid && engineStatus !== 'locked'
            ? 'engineOut'
            : 'hub'

  return {
    familiarization: 'completed',
    cameraPhase,
    location,
    stormLine: {
      status: normalizedStatus,
      checkpoint,
      attempts,
      bestTraits,
    },
    engineOut: {
      status: engineStatus,
      checkpoint: engineCheckpoint,
      attempts: engineAttempts,
      bestTraits: engineTraits,
    },
  }
}

function normalizeV9(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 9 || !hasSafeCanonicalCommonState(candidate)) return null
  const phase = candidate.phase as GamePhase
  const completedPuzzles = candidate.completedPuzzles as PuzzleId[]
  const rewardUnlocked = candidate.rewardUnlocked === true || phase === 'reward' || phase === 'mars'
  const completed = completedPuzzles.includes('airbus')
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase,
    airbusAssignments: candidate.airbusAssignments as GameState['airbusAssignments'],
    airbusDecoyAssignments: candidate.airbusDecoyAssignments as GameState['airbusDecoyAssignments'],
    airbusQualificationAnswer: candidate.airbusQualificationAnswer as string,
    airbusSimulator: normalizeAirbusSimulatorProgress(
      candidate.airbusSimulator,
      completed,
      allAirbusAssignmentsCorrect(candidate.airbusAssignments),
    ),
    lockerCompleted: candidate.lockerCompleted as LockerMemoryId[],
    lockerAttempts: candidate.lockerAttempts as GameState['lockerAttempts'],
    lockerIntroCompleted: candidate.lockerIntroCompleted as boolean,
    lockerHatRevealed: candidate.lockerHatRevealed as boolean,
    dc9: normalizeDc9Progress(candidate.dc9, completedPuzzles.includes('dc9') || rewardUnlocked),
    airbusCaptainModeUnlocked: candidate.airbusCaptainModeUnlocked as boolean,
    completedPuzzles,
    hintsUsed: candidate.hintsUsed as number,
    rewardUnlocked,
    marsUnlocked: candidate.marsUnlocked as boolean,
    statusMessage: candidate.statusMessage as string,
  }
}

function normalizeCanonicalScenarioState(value: unknown, schemaVersion: 10 | 11): GameState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== schemaVersion || !hasSafeCanonicalCommonState(candidate)) return null
  const phase = candidate.phase as GamePhase
  const completedPuzzles = candidate.completedPuzzles as PuzzleId[]
  const rewardUnlocked = candidate.rewardUnlocked === true || phase === 'reward' || phase === 'mars'
  const completed = completedPuzzles.includes('airbus')
  return {
    schemaVersion: GAME_SCHEMA_VERSION,
    phase,
    airbusAssignments: candidate.airbusAssignments as GameState['airbusAssignments'],
    airbusDecoyAssignments: candidate.airbusDecoyAssignments as GameState['airbusDecoyAssignments'],
    airbusQualificationAnswer: candidate.airbusQualificationAnswer as string,
    airbusSimulator: normalizeAirbusSimulatorProgress(
      candidate.airbusSimulator,
      completed,
      allAirbusAssignmentsCorrect(candidate.airbusAssignments),
    ),
    lockerCompleted: candidate.lockerCompleted as LockerMemoryId[],
    lockerAttempts: candidate.lockerAttempts as GameState['lockerAttempts'],
    lockerIntroCompleted: candidate.lockerIntroCompleted as boolean,
    lockerHatRevealed: candidate.lockerHatRevealed as boolean,
    dc9: normalizeDc9Progress(candidate.dc9, completedPuzzles.includes('dc9') || rewardUnlocked),
    airbusCaptainModeUnlocked: candidate.airbusCaptainModeUnlocked as boolean,
    completedPuzzles,
    hintsUsed: candidate.hintsUsed as number,
    rewardUnlocked,
    marsUnlocked: candidate.marsUnlocked as boolean,
    statusMessage: candidate.statusMessage as string,
  }
}

function migrateV10(value: unknown): GameState | null {
  return normalizeCanonicalScenarioState(value, 10)
}

function normalizeV11(value: unknown): GameState | null {
  return normalizeCanonicalScenarioState(value, GAME_SCHEMA_VERSION)
}

function migrateV6ToV7(value: unknown): LegacyV7State | null {
  if (!isLegacyV6State(value)) return null
  const completedCaptain = value.completedPuzzles.includes('captain') || value.captainRewardUnlocked || value.phase === 'reward' || value.phase === 'mars'
  const legacySelections = normalizeRouteCodes(value.routeSelections, ALL_ROUTE_CODES)
  const routeVerified = value.captainRouteVerified && !completedCaptain
  const dc9 = completedCaptain
    ? fullDc9Progress(value.captainAttempts.secure)
    : routeVerified
      ? {
          ...createInitialState().dc9,
          stage: 'homeOperations' as const,
          routeSelections: [...APPROVED_ROUTE_CODES],
          routeCompleted: [...APPROVED_ROUTE_CODES],
          routeAttempts: value.captainAttempts.route,
          secureAttempts: value.captainAttempts.secure,
        }
      : value.phase === 'captain' && legacySelections.length > 0
        ? {
            ...createInitialState().dc9,
            stage: 'routeRecord' as const,
            routeSelections: legacySelections,
            routeAttempts: value.captainAttempts.route,
            secureAttempts: value.captainAttempts.secure,
          }
        : createInitialState().dc9
  const phase: LegacyPhase = completedCaptain
    ? value.phase === 'mars' ? 'mars' : 'reward'
    : value.phase === 'briefing' ? 'briefing' : 'captain'

  return {
    ...value,
    schemaVersion: 7,
    phase,
    dc9,
    captainRouteVerified: dc9.routeCompleted.length === APPROVED_ROUTE_CODES.length,
    dc9SecureSequence: [...dc9.secureSequence],
    routeSelections: [...dc9.routeSelections],
    statusMessage: completedCaptain
      ? value.statusMessage
      : phase === 'briefing'
        ? 'Begin the DC-9 Final Flight Log when you are ready.'
        : dc9.stage === 'homeOperations'
          ? dc9LegacyFlow.routeCompletionText
          : dc9.stage === 'routeRecord'
            ? dc9LegacyFlow.routeQuestion
            : 'The parked DC-9 is ready. Find the route strip on the first-officer yoke.',
  }
}

function hasReachedLocker(phase: unknown): boolean {
  return phase === 'locker' || phase === 'captain' || phase === 'reward' || phase === 'mars'
}

function migrateV5(value: unknown): LegacyV6State | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 5) return null
  const completedPuzzles = Array.isArray(candidate.completedPuzzles)
    ? candidate.completedPuzzles.filter((entry): entry is LegacyPuzzleId => entry === 'firstOfficer' || entry === 'locker' || entry === 'captain')
    : []
  const completedCaptain = completedPuzzles.includes('captain') || candidate.phase === 'reward' || candidate.phase === 'mars'
  const validRoutes = Array.isArray(candidate.routeSelections)
    ? candidate.routeSelections.filter((entry): entry is string => typeof entry === 'string' && dc9LegacyFlow.routePuzzleOptions.some((route) => route.code === entry))
    : []
  const migrated = {
    ...candidate,
    schemaVersion: 6,
    captainRouteVerified: completedCaptain,
    dc9SecureSequence: completedCaptain ? [...DC9_SECURE_ORDER] : [],
    captainAttempts: { route: 0, secure: 0 },
    routeSelections: validRoutes,
  }
  return isLegacyV6State(migrated) ? migrated : null
}

function migrateV4(value: unknown): LegacyV6State | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 4) return null
  return migrateV5({
    ...candidate,
    schemaVersion: 5,
    lockerAttempts: normalizeLockerAttempts(candidate.lockerAttempts) ?? { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: hasReachedLocker(candidate.phase),
  })
}

function migrateV3(value: unknown): LegacyV6State | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 3 || !Array.isArray(candidate.lockerCompleted)) return null
  const legacyCompleted = candidate.lockerCompleted.filter(isString)
  const completedPuzzles = Array.isArray(candidate.completedPuzzles) ? candidate.completedPuzzles.filter(isString) : []
  const laterPhase = candidate.phase === 'captain' || candidate.phase === 'reward' || candidate.phase === 'mars'
  const preserveFullLocker = candidate.lockerHatRevealed === true || completedPuzzles.includes('locker') || laterPhase
  const lockerCompleted: LockerMemoryId[] = preserveFullLocker
    ? [...lockerFlow.memoryIds]
    : lockerFlow.memoryIds.filter((id) => (id === 'watch' || id === 'baseball') && legacyCompleted.includes(id))
  return migrateV5({
    ...candidate,
    schemaVersion: 5,
    lockerCompleted,
    lockerAttempts: { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: hasReachedLocker(candidate.phase),
    lockerHatRevealed: preserveFullLocker,
  })
}

export function loadGameState(storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage): GameState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    const parsedVersion = parsed && typeof parsed === 'object' ? Number((parsed as Record<string, unknown>).schemaVersion) : NaN
    const normalizedAttempts = [3, 4, 5, 6, 7].includes(parsedVersion)
      ? normalizeLockerAttempts((parsed as Record<string, unknown>).lockerAttempts)
      : null
    const normalizedParsed = normalizedAttempts
      ? { ...(parsed as Record<string, unknown>), lockerAttempts: normalizedAttempts }
      : parsed
    const legacyV6 = isLegacyV6State(normalizedParsed)
      ? normalizedParsed
      : migrateV5(normalizedParsed) ?? migrateV4(normalizedParsed) ?? migrateV3(normalizedParsed)
    const legacyV7 = isLegacyV7State(normalizedParsed) ? normalizedParsed : legacyV6 ? migrateV6ToV7(legacyV6) : null
    const migratedV8 = legacyV7 ? migrateV7ToV8(legacyV7) : null
    const state = normalizeV11(normalizedParsed)
      ?? migrateV10(normalizedParsed)
      ?? normalizeV9(normalizedParsed)
      ?? normalizeV8(normalizedParsed)
      ?? (migratedV8 ? normalizeV8(migratedV8) : null)
    if (state) return state
    storage.removeItem(STORAGE_KEY)
  } catch {
    storage.removeItem(STORAGE_KEY)
  }
  return createInitialState()
}

export function saveGameState(state: GameState, storage: Pick<Storage, 'setItem'> = window.localStorage): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Storage can be unavailable in private modes or restricted environments.
  }
}

export function clearGameState(storage: Pick<Storage, 'removeItem'> = window.localStorage): void {
  try {
    storage.removeItem(STORAGE_KEY)
  } catch {
    // Reset should still succeed in memory when storage is unavailable.
  }
}
