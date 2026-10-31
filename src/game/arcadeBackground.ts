export const ARCADE_BACKGROUND_KEY = 'cockpit-escape-room-arcade-background'
export type ArcadeBackgroundId = 'mars' | 'moonbase'
export const ARCADE_BACKGROUND_LABELS = { mars: 'Mars', moonbase: 'Moonbase' } as const
export function isArcadeBackground(value: unknown): value is ArcadeBackgroundId {
  return value === 'mars' || value === 'moonbase'
}
export function loadArcadeBackground(storage?: Pick<Storage, 'getItem'>): ArcadeBackgroundId {
  try {
    const raw = (storage ?? window.localStorage).getItem(ARCADE_BACKGROUND_KEY)
    if (!raw) return 'mars'
    const setting: unknown = JSON.parse(raw)
    if (typeof setting === 'object' && setting !== null && 'version' in setting && setting.version === 1
      && 'background' in setting && isArcadeBackground(setting.background)) return setting.background
  } catch { /* Denied/corrupt settings must not prevent playing. */ }
  return 'mars'
}
export function saveArcadeBackground(background: ArcadeBackgroundId, storage?: Pick<Storage, 'setItem'>): boolean {
  try {
    (storage ?? window.localStorage).setItem(ARCADE_BACKGROUND_KEY, JSON.stringify({ version: 1, background }))
    return true
  } catch { return false }
}

/** Bound scenery panning independently of the camera's extra corner margin. */
export function moonbasePanoramaLeft(camera: number): number {
  const pan = Number.isFinite(camera) ? Math.round(Math.max(-80, Math.min(80, camera))) : 0
  return -80 - pan
}

/** Graceful scenery fallback; fighter/rule coordinates never depend on it. */
export const MOONBASE_BACKGROUND_BANDS = [
  { y: 0, height: 84, colour: '#060b14' },
  { y: 84, height: 24, colour: '#222d3c' },
  { y: 108, height: 48, colour: '#707a86' },
  { y: 156, height: 32, colour: '#56616e' },
  { y: 188, height: 4, colour: '#a6afb8' },
  { y: 192, height: 32, colour: '#777f89' },
] as const
