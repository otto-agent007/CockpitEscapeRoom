/**
 * Fullscreen for the game page, across the browsers the owner actually uses.
 *
 * Desktop and Android browsers support the standard Fullscreen API. iPad Safari has long
 * supported it with a webkit prefix. iPhone browsers (Safari, Brave and every other iOS
 * browser, which are all WebKit) do not let a web page go fullscreen at all; only a video
 * can. There the closest thing is opening the game from a Home Screen icon, which runs it
 * with no browser bars (owner, 2026-11-10: "can we get the full screen to work on the
 * mobile browser?", then chose Home Screen mode).
 */

export interface FullscreenTarget {
  requestFullscreen?: () => Promise<void>
  webkitRequestFullscreen?: () => void
}

export interface FullscreenDocument {
  fullscreenEnabled?: boolean
  webkitFullscreenEnabled?: boolean
  fullscreenElement?: Element | null
  webkitFullscreenElement?: Element | null
  exitFullscreen?: () => Promise<void>
  webkitExitFullscreen?: () => void
}

export type FullscreenResult = 'entered' | 'exited' | 'unavailable'

function standardAvailable(target: FullscreenTarget, doc: FullscreenDocument): boolean {
  return typeof target.requestFullscreen === 'function' && doc.fullscreenEnabled !== false
}

function prefixedAvailable(target: FullscreenTarget, doc: FullscreenDocument): boolean {
  return typeof target.webkitRequestFullscreen === 'function' && doc.webkitFullscreenEnabled !== false
}

/** False on iPhone browsers, where only video can go fullscreen. */
export function pageFullscreenAvailable(target: FullscreenTarget | null | undefined, doc: FullscreenDocument): boolean {
  return Boolean(target) && (standardAvailable(target!, doc) || prefixedAvailable(target!, doc))
}

export function inPageFullscreen(doc: FullscreenDocument): boolean {
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement)
}

/**
 * Enters or leaves fullscreen. Call it from a tap or key handler, because browsers only
 * grant fullscreen to a user gesture. Never throws.
 */
export async function togglePageFullscreen(
  target: FullscreenTarget | null | undefined,
  doc: FullscreenDocument,
): Promise<FullscreenResult> {
  try {
    if (doc.fullscreenElement && doc.exitFullscreen) {
      await doc.exitFullscreen()
      return 'exited'
    }
    if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) {
      doc.webkitExitFullscreen()
      return 'exited'
    }
    return requestPageFullscreen(target, doc)
  } catch {
    return 'unavailable'
  }
}

/** Enters fullscreen if the browser allows it. Never throws or rejects. */
export async function requestPageFullscreen(
  target: FullscreenTarget | null | undefined,
  doc: FullscreenDocument,
): Promise<FullscreenResult> {
  if (!target) return 'unavailable'
  try {
    if (standardAvailable(target, doc)) {
      await target.requestFullscreen!()
      return 'entered'
    }
    if (prefixedAvailable(target, doc)) {
      target.webkitRequestFullscreen!()
      return 'entered'
    }
  } catch {
    return 'unavailable'
  }
  return 'unavailable'
}

interface DisplayModeWindow {
  matchMedia?: (query: string) => { matches: boolean }
  /** iOS Safari's non-standard `navigator.standalone` is read when present. */
  navigator?: object
}

/** True when the game was opened from a Home Screen icon (no browser bars to hide). */
export function runningFromHomeScreen(win: DisplayModeWindow): boolean {
  const matches = (query: string) => Boolean(win.matchMedia?.(query).matches)
  return matches('(display-mode: standalone)')
    || matches('(display-mode: fullscreen)')
    || (win.navigator as { standalone?: boolean } | undefined)?.standalone === true
}
