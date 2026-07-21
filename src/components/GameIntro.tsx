import { useCallback, useEffect, useRef, useState } from 'react'
import { gameCopy, PROJECT_NAME } from '../game/config'
import { getIntroCue, INTRO_DURATION_SECONDS, type IntroCue } from '../game/introConfig'

interface GameIntroProps {
  reducedMotion: boolean
  onComplete: () => void
}

const DEFAULT_VOLUME = 0.72

export function GameIntro({ reducedMotion, onComplete }: GameIntroProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef(0)
  const completedRef = useRef(false)
  const fallbackStartedAtRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [cue, setCue] = useState<IntroCue>(() => getIntroCue(0))
  const [audioFailed, setAudioFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)

  const completeIntro = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    audioRef.current?.pause()
    onComplete()
  }, [onComplete])

  const updateCue = useCallback((timeSeconds: number) => {
    const nextCue = getIntroCue(timeSeconds)
    setCue((currentCue) => currentCue.id === nextCue.id ? currentCue : nextCue)
    if (timeSeconds >= INTRO_DURATION_SECONDS) completeIntro()
  }, [completeIntro])

  const markAudioFailed = useCallback(() => {
    const currentTime = audioRef.current?.currentTime ?? 0
    fallbackStartedAtRef.current = performance.now() - currentTime * 1_000
    setAudioFailed(true)
  }, [])

  const startIntro = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    completedRef.current = false
    fallbackStartedAtRef.current = performance.now()
    audio.currentTime = 0
    audio.volume = volume
    audio.muted = muted

    const playback = audio.play()
    setStarted(true)
    setAudioFailed(false)
    setCue(getIntroCue(0))
    void playback.catch(markAudioFailed)
  }, [markAudioFailed, muted, volume])

  const retrySound = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    const fallbackSeconds = Math.min(
      INTRO_DURATION_SECONDS,
      Math.max(0, (performance.now() - fallbackStartedAtRef.current) / 1_000),
    )
    audio.currentTime = fallbackSeconds
    audio.volume = volume
    audio.muted = muted
    void audio.play().then(() => setAudioFailed(false)).catch(markAudioFailed)
  }, [markAudioFailed, muted, volume])

  const toggleMute = useCallback(() => {
    const nextMuted = !muted
    setMuted(nextMuted)
    if (audioRef.current) audioRef.current.muted = nextMuted
  }, [muted])

  const changeVolume = useCallback((nextVolume: number) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume))
    setVolume(clampedVolume)
    if (audioRef.current) audioRef.current.volume = clampedVolume
  }, [])

  useEffect(() => {
    if (!started) return

    const tick = () => {
      const audio = audioRef.current
      const timeSeconds = audioFailed
        ? (performance.now() - fallbackStartedAtRef.current) / 1_000
        : audio?.currentTime ?? 0
      updateCue(timeSeconds)
      if (!completedRef.current) animationFrameRef.current = requestAnimationFrame(tick)
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [audioFailed, started, updateCue])

  useEffect(() => {
    if (!started) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      completeIntro()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [completeIntro, started])

  useEffect(() => {
    const audio = audioRef.current
    return () => audio?.pause()
  }, [])

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        src={`${import.meta.env.BASE_URL}audio/intro-audio-53s.mp3`}
        onEnded={completeIntro}
        onError={markAudioFailed}
        onTimeUpdate={(event) => updateCue(event.currentTarget.currentTime)}
      />

      {!started ? (
        <section className="briefing-hero" aria-labelledby="game-title">
          <div className="briefing-visual" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}images/dc9-game-ready-first-officer.png`} alt="" />
            <div className="briefing-visual__label">DC-9-32 first-officer station</div>
          </div>

          <div className="briefing-panel">
            <p className="briefing-route">DC-9-32 · First-Officer onboarding</p>
            <h1 id="game-title">{gameCopy.title}</h1>
            <p className="lede">Take the right seat and complete the Final Flight Log.</p>

            <button type="button" className="primary-button primary-button--large" onClick={startIntro}>
              Start Game
            </button>
          </div>
        </section>
      ) : (
        <section
          className="game-intro"
          aria-label="Game intro"
          data-intro-cue={cue.id}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
        >
          <div key={cue.id} className={`game-intro__beat game-intro__beat--${cue.treatment}`}>
            {cue.background && (
              <img
                className="game-intro__image"
                src={`${import.meta.env.BASE_URL}${cue.background}`}
                style={{ objectPosition: cue.objectPosition }}
                alt=""
                aria-hidden="true"
              />
            )}
            <div className="game-intro__color" aria-hidden="true" />
            <div className="game-intro__frame" aria-hidden="true" />
            <div className="game-intro__copy">
              {cue.id === 'title' ? (
                <>
                  <h1>{PROJECT_NAME}</h1>
                  <p>{cue.caption}</p>
                </>
              ) : (
                <h1>{cue.caption}</h1>
              )}
            </div>
          </div>

          <div className="game-intro__controls">
            <p className="game-intro__sound-status" role="status" aria-live="polite">
              {audioFailed ? 'The intro is continuing without sound.' : muted ? 'Intro muted.' : 'Intro audio playing.'}
            </p>
            <div className="game-intro__audio-controls">
              {audioFailed && (
                <button type="button" className="game-intro__control" onClick={retrySound}>Retry sound</button>
              )}
              <button type="button" className="game-intro__control" onClick={toggleMute}>
                {muted ? 'Unmute intro' : 'Mute intro'}
              </button>
              <label className="game-intro__volume">
                <span>Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  aria-label="Intro volume"
                  onChange={(event) => changeVolume(Number(event.currentTarget.value))}
                />
              </label>
            </div>
            <button type="button" className="game-intro__skip" onClick={completeIntro}>Skip Intro</button>
          </div>
        </section>
      )}
    </>
  )
}
