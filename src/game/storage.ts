import { createInitialState, GAME_SCHEMA_VERSION, type GameState } from './state'

export const STORAGE_KEY = 'cockpit-escape-room:game-state:v1'

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GameState>
  return (
    candidate.schemaVersion === GAME_SCHEMA_VERSION &&
    (candidate.mode === 'crew' || candidate.mode === 'captain') &&
    ['briefing', 'power', 'route', 'complete', 'mars'].includes(candidate.phase ?? '') &&
    Array.isArray(candidate.switchSequence) &&
    Array.isArray(candidate.routeSelections) &&
    Array.isArray(candidate.completedPuzzles) &&
    typeof candidate.hintsUsed === 'number' &&
    typeof candidate.captainRewardUnlocked === 'boolean' &&
    typeof candidate.marsUnlocked === 'boolean' &&
    typeof candidate.statusMessage === 'string'
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
