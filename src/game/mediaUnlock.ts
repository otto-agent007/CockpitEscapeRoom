/**
 * Sound for media that starts on its own, on iPhone.
 *
 * iOS WebKit (every iOS browser, Brave included) lets media start with sound only while a
 * recent tap still counts, or on an element a tap has play()ed once. The Roboptimus
 * greeting starts a few seconds after the player's last Engine-Out tap and is allowed.
 * The reward film starts about 20 s later, after the walk and door dance, so on the owner's
 * iPhone it was refused and fell back to muted (2026-11-10: "the model fly video should
 * start with music automatically"; the greeting already played aloud).
 *
 * An element that is play()ed once during any tap keeps that permission for its
 * lifetime, even with no source yet. So the game blesses one element per sound on the
 * player's taps, and the components adopt those same elements instead of rendering
 * fresh ones. No source is set here, so nothing downloads early and no reward asset
 * name reaches the initial bundle.
 */

export type PrimedMediaKey = 'rewardFilm'

const KINDS: Record<PrimedMediaKey, 'video' | 'audio'> = {
  rewardFilm: 'video',
}

export const PRIMED_MEDIA_KEYS = Object.keys(KINDS) as PrimedMediaKey[]

interface MediaFactory {
  createElement(tagName: 'video' | 'audio'): HTMLMediaElement
}

export function createMediaUnlock(factory: MediaFactory) {
  const elements = new Map<PrimedMediaKey, HTMLMediaElement>()
  const blessed = new Set<PrimedMediaKey>()

  const element = <T extends HTMLMediaElement>(key: PrimedMediaKey): T => {
    let media = elements.get(key)
    if (!media) {
      media = factory.createElement(KINDS[key])
      if (KINDS[key] === 'video') {
        // An iPhone plays a video inline only with playsinline; otherwise it opens fullscreen.
        ;(media as HTMLVideoElement).playsInline = true
        media.setAttribute('playsinline', '')
      }
      elements.set(key, media)
    }
    return media as T
  }

  /** Call from inside a user gesture (touchend, click or keydown). Each element is blessed once. */
  const bless = (keys: readonly PrimedMediaKey[] = PRIMED_MEDIA_KEYS): void => {
    for (const key of keys) {
      if (blessed.has(key)) continue
      const media = element(key)
      blessed.add(key)
      // Already playing (for example a muted film): leave it alone; its own sound button handles it.
      if (!media.paused) continue
      media.muted = false
      try {
        const attempt = media.play()
        // Paused in the same task, so no frame or sample is ever rendered.
        media.pause()
        void attempt?.catch(() => undefined)
      } catch {
        // A browser that refuses outright simply keeps its normal autoplay rules.
      }
    }
  }

  return { element, bless, isBlessed: (key: PrimedMediaKey) => blessed.has(key) }
}

let shared: ReturnType<typeof createMediaUnlock> | null = null

function sharedUnlock() {
  shared ??= createMediaUnlock({ createElement: (tagName) => document.createElement(tagName) })
  return shared
}

/** The element a component should adopt for this sound: the blessed one when a tap came first. */
export function primedMediaElement<T extends HTMLMediaElement>(key: PrimedMediaKey): T {
  return sharedUnlock().element<T>(key)
}

export function blessMediaForSound(keys?: readonly PrimedMediaKey[]): void {
  sharedUnlock().bless(keys)
}
