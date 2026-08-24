/**
 * The cheer that plays when the Captain's Key reveal opens.
 *
 * An owner-supplied crowd recording, first ten seconds. Provenance and licence status are in
 * `public/audio/README.md` and `LICENSES/ASSET_MANIFEST.md`.
 *
 * This module is pure apart from the preference read/write, so the policy is testable
 * without an audio element.
 */

/** Path under `BASE_URL`. Kept here so the asset check and the component agree. */
export const CELEBRATION_SOUND_FILE = 'audio/key-celebration.mp3'

/**
 * Playback level. The asset peaks at -3.7 dBFS, which is right for a file but loud for a
 * surprise, so the reveal plays it back well under unity. The clip runs ten seconds; the
 * reveal stops it when the card closes, so taking the key early cuts it short rather than
 * leaving a crowd cheering over the next scene.
 */
export const CELEBRATION_SOUND_VOLUME = 0.55

/**
 * Separate from the game-state key on purpose: restarting the game clears progress, and a
 * player who turned the sound off does not want it back on because they replayed.
 */
export const CELEBRATION_SOUND_STORAGE_KEY = 'cockpit-escape-room:sound:v1'

type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>

/**
 * Muted only when the stored preference says so. Anything unreadable, corrupt or from a
 * future shape means "not muted", because sound on is the default and a broken preference
 * should never be able to silence the game permanently.
 */
export function readCelebrationMuted(storage: PreferenceStorage): boolean {
  try {
    const raw = storage.getItem(CELEBRATION_SOUND_STORAGE_KEY)
    if (!raw) return false
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return false
    return (parsed as { muted?: unknown }).muted === true
  } catch {
    return false
  }
}

/** Never throws: a full or blocked storage must not take the celebration down with it. */
export function writeCelebrationMuted(storage: PreferenceStorage, muted: boolean): void {
  try {
    storage.setItem(CELEBRATION_SOUND_STORAGE_KEY, JSON.stringify({ muted }))
  } catch {
    // Private mode, quota, or a browser with storage disabled. The toggle still works for
    // this visit; it just will not be remembered.
  }
}
