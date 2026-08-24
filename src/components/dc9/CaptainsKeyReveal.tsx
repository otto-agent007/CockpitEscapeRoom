import { useCallback, useEffect, useRef, useState } from 'react'
import { MilestoneCelebration } from '../QualificationCelebration'
import {
  CELEBRATION_SOUND_FILE,
  CELEBRATION_SOUND_VOLUME,
  readCelebrationMuted,
  writeCelebrationMuted,
} from '../../game/celebrationSound'

interface CaptainsKeyRevealProps {
  reducedMotion: boolean
  onClaim: () => void
  onDismiss: () => void
}

export function CaptainsKeyReveal({ reducedMotion, onClaim, onDismiss }: CaptainsKeyRevealProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(() => (
    typeof window === 'undefined' ? false : readCelebrationMuted(window.localStorage)
  ))

  // The cheer plays once as the card opens. The player clicked their way here, so the gesture
  // requirement is met; if the browser refuses playback anyway the rejection is swallowed and
  // the reveal is unchanged. Turning the sound back on while the card is open plays it too,
  // which is the feedback that says the toggle worked.
  useEffect(() => {
    const audio = audioRef.current
    if (muted || !audio) return
    audio.volume = CELEBRATION_SOUND_VOLUME
    audio.currentTime = 0
    void audio.play().catch(() => undefined)
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
    <MilestoneCelebration
      eyebrow="Final Flight Log complete"
      title="THE CAPTAIN'S KEY"
      body="Legacy flight secured. The Captain’s Locker is ready."
      actionLabel="Take the Captain's Key"
      reducedMotion={reducedMotion}
      onContinue={onClaim}
      onDismiss={onDismiss}
      visual={<img className="qualification-key" src={`${import.meta.env.BASE_URL}images/captains-key-celebration.png`} alt="Golden Captain's Key" />}
      variant="key"
      aside={(
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
      )}
    />
  )
}
