import { useCallback, useEffect, useRef, useState } from 'react'
import { gameCopy } from '../game/config'
import {
  beginIntroAssetLoad,
  completeIntroAssetLoad,
  createIntroAssetLoadState,
  failIntroAssetLoad,
  mergeIntroAssets,
  preloadIntroAssets,
  type IntroAssetLoadState,
  type IntroRenderAssets,
} from '../game/introAssets'
import { getIntroScene, INTRO_DURATION_SECONDS } from '../game/introConfig'
import {
  createIntroRuntimeState,
  disposeIntroRuntime,
  enterIntroFallback,
  isIntroRuntimeActive,
  requestIntroHandoff,
  resetIntroRuntimeLoop,
  runIntroAudioRetry,
  sampleIntroClock,
  sampleIntroHandoff,
  sampleIntroRuntime,
  type IntroRuntimeState,
} from '../game/introRuntime'
import { deriveDueIntroSfx } from '../game/introSfx'
import { IntroSfxPlayer } from '../game/introSfxPlayer'
import { IntroCanvas } from './intro/IntroCanvas'

interface GameIntroProps {
  reducedMotion: boolean
  onComplete: () => void
}

const DEFAULT_VOLUME = 0.72
const EMPTY_INTRO_ASSETS: IntroRenderAssets = new Map()

export function GameIntro({ reducedMotion, onComplete }: GameIntroProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef(0)
  const gamepadAnimationFrameRef = useRef(0)
  const runtimeRef = useRef<IntroRuntimeState>(createIntroRuntimeState())
  const sfxPlayerRef = useRef<IntroSfxPlayer | null>(null)
  const sfxTimeRef = useRef(0)
  const assetLoadStateRef = useRef<IntroAssetLoadState>(createIntroAssetLoadState())
  const assetLoadGenerationRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [startAvailable, setStartAvailable] = useState(false)
  const [phase, setPhase] = useState<IntroRuntimeState['phase']>('playing')
  const [handoffProgress, setHandoffProgress] = useState<number | null>(null)
  const [assetLoadState, setAssetLoadState] = useState<IntroAssetLoadState>(createIntroAssetLoadState)
  const [assets, setAssets] = useState<IntroRenderAssets>(EMPTY_INTRO_ASSETS)
  const [visualFailure, setVisualFailure] = useState<string | null>(null)
  const [audioFailed, setAudioFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const scene = getIntroScene(timeSeconds)

  const syncRuntimeForRender = useCallback((runtime: IntroRuntimeState) => {
    setTimeSeconds(runtime.timeSeconds)
    setStartAvailable(runtime.startAvailable)
    setPhase(runtime.phase)
  }, [])

  const loadIntroAssets = useCallback(() => {
    const generation = ++assetLoadGenerationRef.current
    const loadingState = beginIntroAssetLoad(assetLoadStateRef.current)
    assetLoadStateRef.current = loadingState
    setAssetLoadState(loadingState)
    setAssets(EMPTY_INTRO_ASSETS)
    setVisualFailure(null)

    void preloadIntroAssets(import.meta.env.BASE_URL, 'initial')
      .then((initialAssets) => {
        if (generation !== assetLoadGenerationRef.current) return
        const readyState = completeIntroAssetLoad(loadingState)
        assetLoadStateRef.current = readyState
        setAssets(initialAssets)
        setAssetLoadState(readyState)

        void preloadIntroAssets(import.meta.env.BASE_URL, 'full')
          .then((fullAssets) => {
            if (generation !== assetLoadGenerationRef.current) return
            setAssets((current) => mergeIntroAssets(current, fullAssets))
            setVisualFailure(null)
          })
          .catch((error: unknown) => {
            if (generation !== assetLoadGenerationRef.current) return
            setVisualFailure(error instanceof Error ? error.message : String(error))
          })
      })
      .catch((error: unknown) => {
        if (generation !== assetLoadGenerationRef.current) return
        const failedState = failIntroAssetLoad(loadingState, error)
        assetLoadStateRef.current = failedState
        setAssetLoadState(failedState)
        setAssets(EMPTY_INTRO_ASSETS)
      })
  }, [])

  const markAudioFailed = useCallback(() => {
    const audio = audioRef.current
    if (!audio || runtimeRef.current.phase !== 'playing') return
    runtimeRef.current = enterIntroFallback(
      runtimeRef.current,
      performance.now(),
      audio.currentTime,
    )
    syncRuntimeForRender(runtimeRef.current)
    setAudioFailed(true)
  }, [syncRuntimeForRender])

  /**
   * The track finishing no longer restarts the intro: it plays once and holds
   * the title over the empty seat until the player starts. `resetLoop` stays
   * for the audio-failure retry path, which does still rewind to zero.
   */
  const holdOnFinalFrame = useCallback(() => {
    const runtime = runtimeRef.current
    if (runtime.phase !== 'playing') return
    runtimeRef.current = { ...runtime, timeSeconds: INTRO_DURATION_SECONDS, reachedEnd: true }
    syncRuntimeForRender(runtimeRef.current)
  }, [syncRuntimeForRender])

  const resetLoop = useCallback(() => {
    const audio = audioRef.current
    // The gag scores from zero again on every loop.
    sfxTimeRef.current = 0
    runtimeRef.current = resetIntroRuntimeLoop(runtimeRef.current, performance.now())
    syncRuntimeForRender(runtimeRef.current)
    if (!audio || runtimeRef.current.phase !== 'playing') return
    audio.currentTime = 0
    if (runtimeRef.current.audioMode === 'media') void audio.play().catch(markAudioFailed)
  }, [markAudioFailed, syncRuntimeForRender])

  const updatePlaybackTime = useCallback((sampledTimeSeconds: number) => {
    const sample = sampleIntroRuntime(runtimeRef.current, sampledTimeSeconds)
    runtimeRef.current = sample.state
    syncRuntimeForRender(sample.state)
    if (sample.didLoop) resetLoop()
  }, [resetLoop, syncRuntimeForRender])

  const startIntro = useCallback(() => {
    const audio = audioRef.current
    if (!audio || assetLoadStateRef.current.status !== 'ready') return
    runtimeRef.current = createIntroRuntimeState()
    audio.currentTime = 0
    audio.volume = volume
    audio.muted = muted
    setStarted(true)
    setAudioFailed(false)
    setHandoffProgress(null)
    syncRuntimeForRender(runtimeRef.current)
    void audio.play().catch(markAudioFailed)
  }, [markAudioFailed, muted, syncRuntimeForRender, volume])

  const requestStart = useCallback(() => {
    const request = requestIntroHandoff(runtimeRef.current, performance.now())
    runtimeRef.current = request.state
    if (!request.accepted) return false
    syncRuntimeForRender(request.state)
    setHandoffProgress(0)
    return true
  }, [syncRuntimeForRender])

  const retrySound = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    runIntroAudioRetry({
      getState: () => runtimeRef.current,
      setState: (nextState) => {
        runtimeRef.current = nextState
        syncRuntimeForRender(nextState)
      },
      play: () => {
        audio.volume = volume
        audio.muted = muted
        return audio.play()
      },
      seek: (nextTimeSeconds) => { audio.currentTime = nextTimeSeconds },
      nowMs: () => performance.now(),
      onSuccess: () => setAudioFailed(false),
      onRejected: () => setAudioFailed(true),
    })
  }, [muted, syncRuntimeForRender, volume])

  const toggleMute = useCallback(() => {
    const nextMuted = !muted
    setMuted(nextMuted)
    if (audioRef.current) audioRef.current.muted = nextMuted
  }, [muted])

  const changeVolume = useCallback((nextVolume: number) => {
    const clampedVolume = Math.min(1, Math.max(0, nextVolume))
    setVolume(clampedVolume)
    if (audioRef.current && runtimeRef.current.phase === 'playing') {
      audioRef.current.volume = clampedVolume
    }
  }, [])

  useEffect(() => {
    loadIntroAssets()
    return () => { assetLoadGenerationRef.current += 1 }
  }, [loadIntroAssets])

  useEffect(() => {
    if (!started || reducedMotion) return
    const player = new IntroSfxPlayer()
    sfxPlayerRef.current = player
    return () => {
      sfxPlayerRef.current = null
      player.dispose()
    }
  }, [reducedMotion, started])

  useEffect(() => {
    sfxPlayerRef.current?.setVolume(volume, muted)
  }, [muted, volume])

  useEffect(() => {
    if (!started) return
    const tick = () => {
      const audio = audioRef.current
      if (runtimeRef.current.phase === 'playing') {
        const sample = sampleIntroClock(runtimeRef.current, {
          nowMs: performance.now(),
          mediaTimeSeconds: audio?.currentTime ?? 0,
        })
        runtimeRef.current = sample.state
        syncRuntimeForRender(sample.state)
        // Gag sound effects ride the same clock the animation does, so they stay
        // aligned with the picture even when frames drop.
        const previousSfxTime = sfxTimeRef.current
        sfxTimeRef.current = sample.state.timeSeconds
        if (!sample.didLoop) {
          for (const cue of deriveDueIntroSfx(previousSfxTime, sample.state.timeSeconds, reducedMotion)) {
            sfxPlayerRef.current?.play(cue, volume, muted)
          }
        }
        if (sample.didLoop) resetLoop()
      } else if (runtimeRef.current.phase === 'handoff') {
        const sample = sampleIntroHandoff(runtimeRef.current, performance.now())
        runtimeRef.current = sample.state
        syncRuntimeForRender(sample.state)
        setHandoffProgress(sample.progress)
        if (audio) audio.volume = volume * sample.audioGain
        if (sample.shouldComplete) {
          audio?.pause()
          onComplete()
        }
      }
      if (isIntroRuntimeActive(runtimeRef.current)) {
        animationFrameRef.current = requestAnimationFrame(tick)
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [muted, onComplete, reducedMotion, resetLoop, started, syncRuntimeForRender, volume])

  useEffect(() => {
    if (!started) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      const isSpace = event.key === ' ' || event.code === 'Space'
      if (event.key !== 'Enter' && !isSpace) return
      const target = event.target instanceof Element ? event.target : null
      const interactiveTarget = target?.closest(
        'button, input, select, textarea, a, [contenteditable]:not([contenteditable="false"])',
      )
      const startButtonTarget = target?.closest('.game-intro__press-start[aria-label="Start game"]')
      if (interactiveTarget && !startButtonTarget) return
      const accepted = requestStart()
      if (isSpace && accepted) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [requestStart, started])

  useEffect(() => {
    if (!started) return
    const hasPressedStart = () => Array.from(navigator.getGamepads?.() ?? [])
      .some((gamepad) => gamepad?.mapping === 'standard' && gamepad.buttons[9]?.pressed)
    let startWasPressed = hasPressedStart()
    const pollGamepad = () => {
      const startPressed = hasPressedStart()
      if (startPressed && !startWasPressed) requestStart()
      startWasPressed = startPressed
      if (isIntroRuntimeActive(runtimeRef.current)) {
        gamepadAnimationFrameRef.current = requestAnimationFrame(pollGamepad)
      }
    }
    gamepadAnimationFrameRef.current = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(gamepadAnimationFrameRef.current)
  }, [requestStart, started])

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      runtimeRef.current = disposeIntroRuntime(runtimeRef.current)
      audio?.pause()
    }
  }, [])

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        src={`${import.meta.env.BASE_URL}audio/intro-audio-53s.mp3`}
        onEnded={holdOnFinalFrame}
        onError={markAudioFailed}
        onTimeUpdate={(event) => updatePlaybackTime(event.currentTarget.currentTime)}
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

            <button
              type="button"
              className="primary-button primary-button--large"
              aria-describedby={assetLoadState.status === 'ready' ? undefined : 'intro-asset-status'}
              disabled={assetLoadState.status !== 'ready'}
              onClick={startIntro}
            >
              Start Game
            </button>
            {assetLoadState.status === 'loading' ? (
              <p id="intro-asset-status" className="briefing-asset-status" role="status" aria-live="polite">
                Preparing the TMB2 cinematic…
              </p>
            ) : null}
            {assetLoadState.status === 'error' ? (
              <div className="briefing-asset-error">
                <p id="intro-asset-status" className="briefing-asset-status" role="status" aria-live="polite">
                  Cinematic art failed: {assetLoadState.failure.assetId} ({assetLoadState.failure.assetPath}).
                </p>
                <button type="button" className="text-button" onClick={loadIntroAssets}>
                  Retry cinematic assets
                </button>
              </div>
            ) : null}
          </div>
        </section>
      ) : (
        <section
          className={`game-intro${phase === 'handoff' ? ' game-intro--handoff' : ''}`}
          aria-label="Game intro"
          data-intro-cue={scene.id}
          data-audio-failed={audioFailed ? 'true' : 'false'}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
          data-start-available={startAvailable ? 'true' : 'false'}
          data-transition-state={phase}
        >
          <div className="game-intro__stage-shell">
            <IntroCanvas
              timeSeconds={timeSeconds}
              assets={assets}
              reducedMotion={reducedMotion}
              handoffProgress={handoffProgress}
            />
          </div>
          <p className="game-intro__summary sr-only">{scene.summary}</p>

          {startAvailable && phase === 'playing' ? (
            <button
              type="button"
              className="game-intro__press-start"
              aria-label="Start game"
              onClick={requestStart}
            >
              PRESS START
            </button>
          ) : null}

          <div className="game-intro__controls">
            <p className="game-intro__sound-status" role="status" aria-live="polite">
              {audioFailed ? 'The intro is continuing without sound.' : muted ? 'Intro muted.' : 'Intro audio playing.'}
            </p>
            {visualFailure ? <p className="game-intro__visual-status">{visualFailure}</p> : null}
            <div className="game-intro__audio-controls">
              {audioFailed ? (
                <button type="button" className="game-intro__control" onClick={retrySound}>Retry sound</button>
              ) : null}
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
          </div>
        </section>
      )}
    </>
  )
}
