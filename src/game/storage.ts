import {
  createInitialState,
  DC9_SECURE_ORDER,
  GAME_SCHEMA_VERSION,
  type Dc9ChapterProgress,
  type Dc9SecureControlId,
  type GamePhase,
  type GameState,
  type PuzzleId,
} from './state'
import { type FirstOfficerControl, type FirstOfficerDecoy, type LockerMemoryId, type LockerQuestionId } from './config'
import { dc9LegacyFlow, firstOfficerFlow, lockerFlow } from './config'

export const STORAGE_KEY = 'cockpit-escape-room:game-state:v1'

type LegacyV6State = Omit<GameState, 'schemaVersion' | 'dc9'> & {
  schemaVersion: 6
}

const APPROVED_ROUTE_CODES = [...dc9LegacyFlow.routePuzzleAnswers] as string[]
const ALL_ROUTE_CODES = dc9LegacyFlow.routePuzzleOptions.map((route) => route.code) as string[]

function hasNoDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isSafePhase(value: unknown): value is GamePhase {
  return (
    value === 'briefing' ||
    value === 'airbus' ||
    value === 'locker' ||
    value === 'captain' ||
    value === 'reward' ||
    value === 'mars'
  )
}

function isSafeAssignments(value: unknown): value is Record<FirstOfficerControl, string | null> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const controls = [...firstOfficerFlow.controlIds]
  return (
    controls.every((control) => {
      const raw = candidate[control]
      return raw === null || typeof raw === 'string'
    }) && controls.every((control) => Object.prototype.hasOwnProperty.call(candidate, control))
  )
}

function isSafeDecoyAssignments(value: unknown): value is Record<FirstOfficerDecoy, string | null> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  const decoys = [...firstOfficerFlow.decoyIds]
  return (
    decoys.every((decoy) => {
      const raw = candidate[decoy]
      return raw === null || typeof raw === 'string'
    }) && decoys.every((decoy) => Object.prototype.hasOwnProperty.call(candidate, decoy))
  )
}

function isSafeSecureSequence(value: unknown): value is Dc9SecureControlId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is Dc9SecureControlId =>
      (DC9_SECURE_ORDER as readonly string[]).includes(entry),
    ) &&
    value.every((entry, index) => entry === DC9_SECURE_ORDER[index])
  )
}

function isSafeCaptainAttempts(value: unknown): value is GameState['captainAttempts'] {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return isSafeNonNegativeInteger(candidate.route) && isSafeNonNegativeInteger(candidate.secure)
}

function isSafePuzzleIds(value: unknown): value is PuzzleId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is PuzzleId => entry === 'firstOfficer' || entry === 'locker' || entry === 'captain') &&
    hasNoDuplicates(value)
  )
}

function isSafeLockerCompleted(value: unknown): value is LockerMemoryId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is LockerMemoryId =>
      (lockerFlow.memoryIds as readonly string[]).includes(entry),
    ) &&
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
  const chargingBull = isSafeNonNegativeInteger(candidate.chargingBull) ? candidate.chargingBull : 0
  const wings = isSafeNonNegativeInteger(candidate.wings) ? candidate.wings : 0
  return { watch, baseball, chargingBull, wings }
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function hasSafeCommonState(candidate: Record<string, unknown>): boolean {
  return (
    isSafePhase(candidate.phase) &&
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
    isSafeCaptainAttempts(candidate.captainAttempts) &&
    Array.isArray(candidate.routeSelections) &&
    candidate.routeSelections.every((value): value is string => typeof value === 'string') &&
    candidate.routeSelections.length === new Set(candidate.routeSelections).size &&
    isSafePuzzleIds(candidate.completedPuzzles) &&
    isSafeNonNegativeInteger(candidate.hintsUsed) &&
    typeof candidate.captainRewardUnlocked === 'boolean' &&
    typeof candidate.marsUnlocked === 'boolean' &&
    isString(candidate.statusMessage)
  )
}

function isLegacyV6State(value: unknown): value is LegacyV6State {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return candidate.schemaVersion === 6 && hasSafeCommonState(candidate)
}

function fullDc9Progress(): Dc9ChapterProgress {
  return {
    stage: 'complete',
    routeSelections: [...APPROVED_ROUTE_CODES],
    routeCompleted: [...APPROVED_ROUTE_CODES],
    routeAttempts: 0,
    homePage: dc9LegacyFlow.homeOperationsPages.length - 1,
    homeOperationsCompleted: true,
    secureSequence: [...DC9_SECURE_ORDER],
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
  phase: GamePhase,
  completedPuzzles: readonly PuzzleId[],
  captainRewardUnlocked: boolean,
): Dc9ChapterProgress {
  const completedChapter = completedPuzzles.includes('captain') || captainRewardUnlocked || phase === 'reward' || phase === 'mars'
  if (completedChapter) return fullDc9Progress()
  if (!value || typeof value !== 'object') return createInitialState().dc9

  const candidate = value as Record<string, unknown>
  const routeCompleted = normalizeRouteCodes(candidate.routeCompleted, APPROVED_ROUTE_CODES)
  const routeSelections = normalizeRouteCodes(candidate.routeSelections, ALL_ROUTE_CODES)
  const routeAttempts = isSafeNonNegativeInteger(candidate.routeAttempts) ? candidate.routeAttempts : 0
  const routesComplete = routeCompleted.length === APPROVED_ROUTE_CODES.length
  const homeOperationsCompleted = routesComplete && candidate.homeOperationsCompleted === true
  const secureSequence = homeOperationsCompleted ? normalizeSecureSequence(candidate.secureSequence) : []
  const shutdownComplete = secureSequence.length === DC9_SECURE_ORDER.length
  const keyClaimed = shutdownComplete && candidate.keyClaimed === true
  const keyRevealed = shutdownComplete && (candidate.keyRevealed === true || keyClaimed)
  const hasRouteEvidence = routeSelections.length > 0 || routeCompleted.length > 0 || routeAttempts > 0

  const stage: Dc9ChapterProgress['stage'] = keyClaimed
    ? 'complete'
    : shutdownComplete
      ? 'keyReveal'
      : homeOperationsCompleted
        ? 'shutdown'
        : routesComplete
          ? 'homeOperations'
          : hasRouteEvidence
            ? 'routeRecord'
            : 'intro'
  const finalPage = dc9LegacyFlow.homeOperationsPages.length - 1
  const homePage = routesComplete && isSafeNonNegativeInteger(candidate.homePage)
    ? Math.min(candidate.homePage, finalPage)
    : 0

  return {
    stage,
    routeSelections: stage === 'intro' ? [] : routeSelections,
    routeCompleted: stage === 'intro' ? [] : routeCompleted,
    routeAttempts: stage === 'intro' ? 0 : routeAttempts,
    homePage,
    homeOperationsCompleted,
    secureSequence,
    keyRevealed,
    keyClaimed,
  }
}

function normalizeV7(value: unknown): GameState | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== GAME_SCHEMA_VERSION || !hasSafeCommonState(candidate)) return null

  let phase = candidate.phase as GamePhase
  const completedPuzzles = candidate.completedPuzzles as PuzzleId[]
  let captainRewardUnlocked = candidate.captainRewardUnlocked as boolean
  let dc9 = normalizeDc9Progress(candidate.dc9, phase, completedPuzzles, captainRewardUnlocked)

  if ((phase === 'locker' || phase === 'airbus') && !completedPuzzles.includes('captain')) {
    phase = 'captain'
    dc9 = createInitialState().dc9
  }
  if (phase === 'airbus' && completedPuzzles.includes('firstOfficer')) {
    phase = 'reward'
    captainRewardUnlocked = true
  }
  if (phase === 'reward' || phase === 'mars') captainRewardUnlocked = true

  return {
    ...(candidate as unknown as GameState),
    schemaVersion: GAME_SCHEMA_VERSION,
    phase,
    dc9,
    captainRewardUnlocked,
    airbusClockAnswer: phase === 'airbus' ? '' : candidate.airbusClockAnswer as string,
  }
}

export function migrateV6ToV7(value: unknown): GameState | null {
  if (!isLegacyV6State(value)) return null

  const completedCaptain = value.completedPuzzles.includes('captain') || value.captainRewardUnlocked || value.phase === 'reward' || value.phase === 'mars'
  const legacySelections = normalizeRouteCodes(value.routeSelections, ALL_ROUTE_CODES)
  const routeVerified = value.captainRouteVerified && !completedCaptain
  const dc9 = completedCaptain
    ? fullDc9Progress()
    : routeVerified
      ? {
          ...createInitialState().dc9,
          stage: 'homeOperations' as const,
          routeSelections: [...APPROVED_ROUTE_CODES],
          routeCompleted: [...APPROVED_ROUTE_CODES],
          routeAttempts: value.captainAttempts.route,
        }
      : value.phase === 'captain' && legacySelections.length > 0
        ? {
            ...createInitialState().dc9,
            stage: 'routeRecord' as const,
            routeSelections: legacySelections,
            routeAttempts: value.captainAttempts.route,
          }
        : createInitialState().dc9

  const phase: GamePhase = completedCaptain
    ? value.phase === 'mars' ? 'mars' : 'reward'
    : value.phase === 'briefing' ? 'briefing' : 'captain'

  return {
    ...value,
    schemaVersion: GAME_SCHEMA_VERSION,
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
            : 'The parked DC-9 is ready. Find the route strip on the captain yoke.',
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
    ? candidate.completedPuzzles.filter((entry): entry is PuzzleId =>
        entry === 'firstOfficer' || entry === 'locker' || entry === 'captain',
      )
    : []
  const completedCaptain = completedPuzzles.includes('captain') || candidate.phase === 'reward' || candidate.phase === 'mars'
  const validRoutes = Array.isArray(candidate.routeSelections)
    ? candidate.routeSelections.filter((entry): entry is string =>
        typeof entry === 'string' && dc9LegacyFlow.routePuzzleOptions.some((route) => route.code === entry),
      )
    : []
  const migrated = {
    ...candidate,
    schemaVersion: 6,
    captainRouteVerified: completedCaptain,
    dc9SecureSequence: completedCaptain ? [...DC9_SECURE_ORDER] : [],
    captainAttempts: { route: 0, secure: 0 },
    routeSelections: candidate.phase === 'captain' ? validRoutes : validRoutes,
  }
  return isLegacyV6State(migrated) ? migrated : null
}

function migrateV4(value: unknown): LegacyV6State | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 4) return null

  const migratedV5 = {
    ...candidate,
    schemaVersion: 5,
    lockerAttempts: normalizeLockerAttempts(candidate.lockerAttempts) ?? { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: hasReachedLocker(candidate.phase),
  }
  return migrateV5(migratedV5)
}

function migrateV3(value: unknown): LegacyV6State | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  if (candidate.schemaVersion !== 3 || !Array.isArray(candidate.lockerCompleted)) return null

  const legacyCompleted = candidate.lockerCompleted.filter((entry): entry is string => typeof entry === 'string')
  const completedPuzzles = Array.isArray(candidate.completedPuzzles)
    ? candidate.completedPuzzles.filter((entry): entry is string => typeof entry === 'string')
    : []
  const laterPhase = candidate.phase === 'captain' || candidate.phase === 'reward' || candidate.phase === 'mars'
  const preserveFullLocker = candidate.lockerHatRevealed === true || completedPuzzles.includes('locker') || laterPhase
  const lockerCompleted: LockerMemoryId[] = preserveFullLocker
    ? [...lockerFlow.memoryIds]
    : lockerFlow.memoryIds.filter((id) => id === 'watch' || id === 'baseball').filter((id) => legacyCompleted.includes(id))

  const migratedV5 = {
    ...candidate,
    schemaVersion: 5,
    lockerCompleted,
    lockerAttempts: { watch: 0, baseball: 0, chargingBull: 0, wings: 0 },
    lockerIntroCompleted: hasReachedLocker(candidate.phase),
    lockerHatRevealed: preserveFullLocker,
  }
  return migrateV5(migratedV5)
}

export function loadGameState(storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage): GameState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    const normalized = parsed && typeof parsed === 'object' && [3, 4, 5, 6, 7].includes(Number((parsed as Record<string, unknown>).schemaVersion))
      ? normalizeLockerAttempts((parsed as Record<string, unknown>).lockerAttempts)
      : null
    const normalizedParsed = normalized
      ? { ...(parsed as Record<string, unknown>), lockerAttempts: normalized }
      : parsed
    const legacy = isLegacyV6State(normalizedParsed)
      ? normalizedParsed
      : migrateV5(normalizedParsed) ?? migrateV4(normalizedParsed) ?? migrateV3(normalizedParsed)
    const state = normalizeV7(normalizedParsed) ?? (legacy ? migrateV6ToV7(legacy) : null)
    if (state) {
      return state
    }
    storage.removeItem(STORAGE_KEY)
  } catch {
    storage.removeItem(STORAGE_KEY)
  }
  return createInitialState()
}

export function saveGameState(
  state: GameState,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
): void {
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
