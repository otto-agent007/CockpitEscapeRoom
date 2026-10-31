/** Earned access survives clearing or restarting the current chapter save. */
export const MARS_ARCADE_UNLOCK_KEY = 'cockpit-escape-room-mars-arcade-unlock'

export function loadMarsArcadeUnlock(storage?: Pick<Storage, 'getItem'>): boolean {
  try {
    const raw = (storage ?? window.localStorage).getItem(MARS_ARCADE_UNLOCK_KEY)
    if (!raw) return false
    const record: unknown = JSON.parse(raw)
    return typeof record === 'object' && record !== null
      && 'version' in record && record.version === 1
      && 'completedOnce' in record && record.completedOnce === true
  } catch {
    return false
  }
}

export function saveMarsArcadeUnlock(storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? window.localStorage).setItem(MARS_ARCADE_UNLOCK_KEY, JSON.stringify({ version: 1, completedOnce: true }))
    return true
  } catch {
    // The App retains earned access in memory if storage is unavailable.
    return false
  }
}
