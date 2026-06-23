import { createInitialState, type GamePhase, type GameState, type PuzzleId, type SwitchId } from './state'
import { type FirstOfficerControl, type LockerInteraction } from './config'
import { firstOfficerFlow, lockerFlow } from './config'

export const STORAGE_KEY = 'cockpit-escape-room:game-state:v1'

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
    value.every((entry): entry is PuzzleId => entry === 'firstOfficer' || entry === 'locker' || entry === 'captain') &&
    hasNoDuplicates(value)
  )
}

function isSafeLockerCompleted(value: unknown): value is LockerInteraction[] {
  return (
    Array.isArray(value) &&
    value.every((entry): entry is LockerInteraction =>
      (lockerFlow.requiredInteractionIds as readonly string[]).includes(entry),
    ) &&
    hasNoDuplicates(value)
  )
}

function isSafeNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<GameState>
  return (
    candidate.schemaVersion === 2 &&
    isSafePhase(candidate.phase) &&
    isSafeAssignments(candidate.airbusAssignments) &&
    typeof candidate.airbusClockAnswer === 'string' &&
    isSafeLockerCompleted(candidate.lockerCompleted) &&
    typeof candidate.lockerHatRevealed === 'boolean' &&
    typeof candidate.captainModeUnlocked === 'boolean' &&
    isSafeSwitchSequence(candidate.switchSequence) &&
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
