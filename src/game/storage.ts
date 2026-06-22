import {
  createInitialState,
  GAME_SCHEMA_VERSION,
  type GameState,
  type GameMode,
  type GamePhase,
  type PuzzleId,
  type SwitchId,
} from './state'

export const STORAGE_KEY = 'cockpit-escape-room:game-state:v1'

function hasNoDuplicates<T>(values: readonly T[]): boolean {
  return new Set(values).size === values.length
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isSafeMode(value: unknown): value is GameMode {
  return value === 'crew' || value === 'captain'
}

function isSafePhase(value: unknown): value is GamePhase {
  return value === 'briefing' || value === 'power' || value === 'route' || value === 'complete' || value === 'mars'
}

function isSafeSwitchSequence(value: unknown): value is SwitchId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is SwitchId => entry === 'battery' || entry === 'navigation' || entry === 'cabin') &&
    hasNoDuplicates(value)
  )
}

function isSafePuzzleIds(value: unknown): value is PuzzleId[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is PuzzleId => entry === 'power' || entry === 'route') &&
    hasNoDuplicates(value)
  )
}

function isSafeRouteSelections(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString) && hasNoDuplicates(value)
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GameState>
  return (
    candidate.schemaVersion === GAME_SCHEMA_VERSION &&
    isSafeMode(candidate.mode) &&
    isSafePhase(candidate.phase) &&
    isSafeSwitchSequence(candidate.switchSequence) &&
    isSafeRouteSelections(candidate.routeSelections) &&
    isSafePuzzleIds(candidate.completedPuzzles) &&
    isSafeNonNegativeInteger(candidate.hintsUsed) &&
    typeof candidate.captainRewardUnlocked === 'boolean' &&
    typeof candidate.marsUnlocked === 'boolean' &&
    isString(candidate.statusMessage)
  )
}

export function loadGameState(storage: Pick<Storage, 'getItem' | 'removeItem'> = window.localStorage): GameState {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const parsed: unknown = JSON.parse(raw)
    if (isGameState(parsed)) return parsed
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
