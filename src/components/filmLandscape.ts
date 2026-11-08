interface FullscreenTarget {
  requestFullscreen?: () => Promise<void>
}

export interface NativeFullscreenVideo {
  webkitDisplayingFullscreen?: boolean
  webkitEnterFullscreen?: () => void
  webkitExitFullscreen?: () => void
}

interface FullscreenDocument {
  readonly fullscreenEnabled?: boolean
  readonly fullscreenElement: object | null
  exitFullscreen?: () => Promise<void>
  addEventListener: (event: string, listener: () => void) => void
  removeEventListener: (event: string, listener: () => void) => void
}

export interface FilmOrientation {
  lock?: (orientation: 'landscape') => Promise<void>
  unlock?: () => void
}

interface FilmLandscapeEnvironment {
  target: FullscreenTarget
  video: NativeFullscreenVideo
  document: FullscreenDocument
  orientation?: FilmOrientation
}

export type FilmLandscapeResult = 'landscape' | 'native' | 'rotate' | 'cancelled'

/** Owns only presentation requested by the film's native landscape button. */
export function createFilmLandscapeController({ target, video, document, orientation }: FilmLandscapeEnvironment) {
  let active = true
  let ownsFullscreen = false
  let ownsNativeFullscreen = false
  let ownsOrientation = false
  let orientationFullscreen: object | null = null
  let pending: Promise<FilmLandscapeResult> | undefined

  const unlock = () => {
    if (!ownsOrientation) return
    ownsOrientation = false
    try { orientation?.unlock?.() } catch { /* Playback remains available. */ }
  }
  const exitOwnedFullscreen = () => {
    if (!ownsFullscreen) return
    ownsFullscreen = false
    if (document.fullscreenElement !== target) return
    try { void document.exitFullscreen?.().catch(() => {}) } catch { /* Browser may have already exited. */ }
  }
  const fullscreenChanged = () => {
    if (document.fullscreenElement !== target) ownsFullscreen = false
    if (document.fullscreenElement !== orientationFullscreen) unlock()
  }
  document.addEventListener('fullscreenchange', fullscreenChanged)

  const enter = async (): Promise<FilmLandscapeResult> => {
    if (!active) return 'cancelled'
    if (!document.fullscreenElement) {
      if (target.requestFullscreen && document.fullscreenEnabled !== false) {
        try {
          // This starts synchronously in the button gesture, before any await.
          await target.requestFullscreen()
          ownsFullscreen = document.fullscreenElement === target
        } catch { return active ? 'rotate' : 'cancelled' }
      } else if (video.webkitEnterFullscreen) {
        try {
          video.webkitEnterFullscreen()
          ownsNativeFullscreen = true
          return 'native'
        } catch { return 'rotate' }
      } else return 'rotate'
    }
    if (!active) {
      exitOwnedFullscreen()
      return 'cancelled'
    }
    if (!document.fullscreenElement || !orientation?.lock) return 'rotate'
    orientationFullscreen = document.fullscreenElement
    try {
      await orientation.lock('landscape')
      ownsOrientation = true
      // Orientation promises cannot be cancelled. Release a late acquisition.
      if (!active || document.fullscreenElement !== orientationFullscreen) {
        unlock()
        return 'cancelled'
      }
      return 'landscape'
    } catch { return active ? 'rotate' : 'cancelled' }
  }

  return {
    request: () => {
      pending ??= enter().finally(() => { pending = undefined })
      return pending
    },
    dispose: () => {
      active = false
      document.removeEventListener('fullscreenchange', fullscreenChanged)
      unlock()
      exitOwnedFullscreen()
      if (ownsNativeFullscreen) {
        ownsNativeFullscreen = false
        try {
          if (video.webkitDisplayingFullscreen !== false) video.webkitExitFullscreen?.()
        } catch { /* Native Done may have already closed the player. */ }
      }
    },
  }
}
