import { useCallback, useEffect, useRef, useState } from 'react'
import { readCelebrationMuted, writeCelebrationMuted } from '../game/celebrationSound'
import { OPTIMUS_GREETING_AUDIO_FILE } from '../game/optimusGreeting'

type PlaybackState = 'idle' | 'playing' | 'ended' | 'unavailable'

/** Local, captioned reward introduction. A blocked or failed voice never blocks the reward. */
export function OptimusNarrationAside({ onReplay }: { onReplay?: () => void }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [muted, setMuted] = useState(() => (
    typeof window === 'undefined' ? false : readCelebrationMuted(window.localStorage)
  ))
  const [playback, setPlayback] = useState<PlaybackState>('idle')

  const playGreeting = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    onReplay?.()
    audio.volume = 0.85
    audio.currentTime = 0
    try {
      await audio.play()
      setPlayback('playing')
    } catch {
      // Autoplay can be refused even when the local file is healthy.
      setPlayback((previous) => audio.error || previous === 'unavailable' ? 'unavailable' : 'idle')
    }
  }, [onReplay])

  useEffect(() => {
    if (muted) return
    const audio = audioRef.current
    if (!audio) return
    audio.volume = 0.85
    audio.currentTime = 0
    void audio.play().then(() => setPlayback('playing')).catch(() => {
      setPlayback((previous) => audio.error || previous === 'unavailable' ? 'unavailable' : 'idle')
    })
    return () => audio.pause()
  }, [muted])

  const toggleMuted = useCallback(() => {
    const next = !muted
    writeCelebrationMuted(window.localStorage, next)
    if (next) setPlayback('idle')
    setMuted(next)
  }, [muted])

  return (
    <div className="optimus-narration-controls">
      {!muted && (
        <audio
          ref={audioRef}
          className="sr-only"
          aria-label="Optimus greeting"
          src={`${import.meta.env.BASE_URL}${OPTIMUS_GREETING_AUDIO_FILE}`}
          preload="auto"
          onEnded={() => setPlayback('ended')}
          onError={() => setPlayback('unavailable')}
        />
      )}
      {!muted && (
        <button type="button" className="celebration-sound-toggle" onClick={() => void playGreeting()}>
          {playback === 'playing' || playback === 'ended' ? 'Replay greeting' : 'Play greeting'}
        </button>
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
      {playback === 'unavailable' && !muted && (
        <p className="optimus-audio-fallback" role="status">The greeting is shown above. You can still reveal your reward.</p>
      )}
    </div>
  )
}
