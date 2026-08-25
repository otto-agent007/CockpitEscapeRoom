import { useCallback, useEffect, useRef, useState } from 'react'
import {
  CELEBRATION_SOUND_FILE,
  CELEBRATION_SOUND_VOLUME,
  readCelebrationMuted,
  writeCelebrationMuted,
} from '../game/celebrationSound'

/**
 * The celebration cheer and its Sound on/off toggle, as the `aside` of a milestone card.
 *
 * Every milestone card mounts this, so the cheer that first shipped on the Captain's Key
 * now also marks the locker room and the Airbus. The mute preference is one shared key, so
 * a player who silences the cheer at one milestone stays silenced at the next.
 *
 * The cheer plays once as the card opens. The player clicked their way to the milestone, so
 * the gesture requirement is met; if the browser refuses playback anyway the rejection is
 * swallowed and the card is unchanged. Turning the sound back on while a card is open plays
 * it too, which is the feedback that says the toggle worked.
 */
export function CelebrationSoundAside() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(() => (
    typeof window === 'undefined' ? false : readCelebrationMuted(window.localStorage)
  ))

  useEffect(() => {
    const audio = audioRef.current
    if (muted || !audio) return
    audio.volume = CELEBRATION_SOUND_VOLUME
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
    // Stopped when the card closes, so continuing early cuts the crowd short rather than
    // leaving it cheering over the next scene.
    return () => audio.pause()
  }, [muted])

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current
      if (typeof window !== 'undefined') writeCelebrationMuted(window.localStorage, next)
      return next
    })
  }, [])

  return (
    <>
      {/* Not rendered at all while muted, so a silenced game never fetches the file. */}
      {!muted && (
        <audio
          ref={audioRef}
          className="sr-only"
          src={`${import.meta.env.BASE_URL}${CELEBRATION_SOUND_FILE}`}
          preload="auto"
          aria-hidden="true"
        />
      )}
      <button
        type="button"
        className="celebration-sound-toggle"
        data-muted={muted}
        aria-pressed={muted}
        onClick={toggleMuted}
      >
        {muted ? 'Sound off' : 'Sound on'}
      </button>
    </>
  )
}
