import { useCallback, useEffect, useRef, useState } from 'react'
import { writeCelebrationMuted } from '../game/celebrationSound'
import { OPTIMUS_GREETING_AUDIO_FILE, ROBOPTIMUS_NAME } from '../game/optimusGreeting'

type PlaybackState = 'idle' | 'playing' | 'ended' | 'unavailable'

/** Local, captioned reward introduction. A blocked or failed voice never blocks the reward. */
export function OptimusNarrationAside({ onReplay, onFinished, onPlaybackChange, autoPlay = true }: {
  onReplay?: () => void
  onFinished?: () => void
  onPlaybackChange?: (playing: boolean) => void
  autoPlay?: boolean
}) {
  const audioRef = useRef<HTMLAudioElement>(null)
  // The owner wants this greeting to start aloud even after a muted celebration.
  const [muted, setMuted] = useState(false)
  const [playback, setPlayback] = useState<PlaybackState>('idle')

  useEffect(() => {
    onPlaybackChange?.(!muted && playback === 'playing')
  }, [muted, playback, onPlaybackChange])

  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [muted])

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
    if (muted || !autoPlay) return
    const audio = audioRef.current
    if (!audio || !audio.paused) return
    audio.volume = 0.85
    audio.currentTime = 0
    void audio.play().then(() => setPlayback('playing')).catch(() => {
      setPlayback((previous) => audio.error || previous === 'unavailable' ? 'unavailable' : 'idle')
    })
  }, [muted, autoPlay])

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
          aria-label={`${ROBOPTIMUS_NAME} greeting`}
          src={`${import.meta.env.BASE_URL}${OPTIMUS_GREETING_AUDIO_FILE}`}
          preload="auto"
          onEnded={() => { setPlayback('ended'); onFinished?.() }}
          onError={() => setPlayback('unavailable')}
        />
      )}
      {!muted && (
        <button type="button" className="celebration-sound-toggle" disabled={!autoPlay} onClick={() => void playGreeting()}>
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
