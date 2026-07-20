import { useCallback, useEffect, useRef, useState } from 'react'
import { gameCopy, PROJECT_NAME } from '../game/config'
import {
  beginIntroAssetLoad,
  completeIntroAssetLoad,
  createIntroAssetLoadState,
  failIntroAssetLoad,
  getIntroPlaybackMode,
  preloadIntroAssets,
  type IntroAssetLoadState,
} from '../game/introAssets'
import { getIntroScene } from '../game/introConfig'
import type { IntroRenderAssets } from '../game/introRenderer'
import {
  activateIntroRuntime,
  createIntroRuntimeState,
  disposeIntroRuntime,
  enterIntroFallback,
  isIntroRuntimeActive,
  requestIntroCompletion,
  resetIntroRuntimeLoop,
  runIntroAudioRetry,
  sampleIntroClock,
  sampleIntroRuntime,
  type IntroRuntimeState,
} from '../game/introRuntime'
import { IntroCanvas } from './intro/IntroCanvas'

interface GameIntroProps {
  reducedMotion: boolean
  onComplete: () => void
}

type LegacyIntroCue = {
  id: 'boot' | 'dc9' | 'key' | 'hat' | 'airbus' | 'title'
  startSeconds: number
  image: string | null
  caption: string
  treatment: 'boot' | 'push' | 'wipe' | 'poster' | 'panel' | 'title'
  objectPosition: string
}

const DEFAULT_VOLUME = 0.72
const EMPTY_INTRO_ASSETS: IntroRenderAssets = new Map()

const legacyIntroCues = [
  { id: 'boot', startSeconds: 0, image: null, caption: 'A FAMILY CREW PRODUCTION', treatment: 'boot', objectPosition: 'center' },
  { id: 'dc9', startSeconds: 4, image: 'images/dc9-game-ready-first-officer.png', caption: 'THE FINAL FLIGHT LOG', treatment: 'push', objectPosition: '74% center' },
  { id: 'key', startSeconds: 16, image: 'images/captains-key-celebration.png', caption: 'LEGACY UNLOCKED', treatment: 'wipe', objectPosition: 'center' },
  { id: 'hat', startSeconds: 27, image: 'images/captains-hat-celebration.png', caption: 'THE JOURNEY CONTINUES', treatment: 'poster', objectPosition: 'center' },
  { id: 'airbus', startSeconds: 38, image: 'images/a320-game-ready-captain.png', caption: 'FROM FIRST OFFICER TO CAPTAIN', treatment: 'panel', objectPosition: 'center' },
  { id: 'title', startSeconds: 49, image: null, caption: 'MISSION READY', treatment: 'title', objectPosition: 'center' },
] as const satisfies readonly LegacyIntroCue[]

function getLegacyIntroCue(timeSeconds: number): LegacyIntroCue {
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0
  let activeCue: LegacyIntroCue = legacyIntroCues[0]
  for (const cue of legacyIntroCues) {
    if (safeTime < cue.startSeconds) break
    activeCue = cue
  }
  return activeCue
}

function LegacyGameIntro({ cue }: { cue: LegacyIntroCue }) {
  return (
    <div key={cue.id} className={`game-intro__beat game-intro__beat--${cue.treatment}`}>
      {cue.image ? (
        <img
          className="game-intro__image"
          src={`${import.meta.env.BASE_URL}${cue.image}`}
          style={{ objectPosition: cue.objectPosition }}
          alt=""
          aria-hidden="true"
        />
      ) : null}
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
  )
}

export function GameIntro({ reducedMotion, onComplete }: GameIntroProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const animationFrameRef = useRef(0)
  const gamepadAnimationFrameRef = useRef(0)
  const runtimeRef = useRef<IntroRuntimeState>(createIntroRuntimeState())
  const assetLoadStateRef = useRef<IntroAssetLoadState>(createIntroAssetLoadState())
  const assetLoadGenerationRef = useRef(0)
  const [started, setStarted] = useState(false)
  const [timeSeconds, setTimeSeconds] = useState(0)
  const [startAvailable, setStartAvailable] = useState(false)
  const [assetLoadState, setAssetLoadState] = useState<IntroAssetLoadState>(createIntroAssetLoadState)
  const [assets, setAssets] = useState<IntroRenderAssets>(EMPTY_INTRO_ASSETS)
  const [audioFailed, setAudioFailed] = useState(false)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(DEFAULT_VOLUME)
  const legacyRequested = import.meta.env.DEV
    && new URLSearchParams(window.location.search).get('legacyIntro') === '1'
  const playbackMode = getIntroPlaybackMode(assetLoadState, {
    development: import.meta.env.DEV,
    legacyRequested,
  })
  const legacyIntro = playbackMode === 'legacy'
  const cue = getIntroScene(timeSeconds)

  const syncRuntimeForRender = useCallback((runtime: IntroRuntimeState) => {
    setTimeSeconds(runtime.timeSeconds)
    setStartAvailable(runtime.startAvailable)
  }, [])

  const finishIntro = useCallback((source: 'start' | 'skip') => {
    const request = requestIntroCompletion(runtimeRef.current, source)
    runtimeRef.current = request.state
    if (!request.accepted) return false
    audioRef.current?.pause()
    onComplete()
    return true
  }, [onComplete])

  const completeIntro = useCallback(() => {
    finishIntro('skip')
  }, [finishIntro])

  const requestStart = useCallback(() => finishIntro('start'), [finishIntro])

  const updatePlaybackTime = useCallback((sampledTimeSeconds: number) => {
    const sample = sampleIntroRuntime(runtimeRef.current, sampledTimeSeconds)
    runtimeRef.current = sample.state
    syncRuntimeForRender(sample.state)
    return sample.didLoop
  }, [syncRuntimeForRender])

  const markAudioFailed = useCallback(() => {
    if (!isIntroRuntimeActive(runtimeRef.current)) return
    const currentTime = audioRef.current?.currentTime ?? 0
    runtimeRef.current = enterIntroFallback(runtimeRef.current, performance.now(), currentTime)
    syncRuntimeForRender(runtimeRef.current)
    setAudioFailed(true)
  }, [syncRuntimeForRender])

  const resetLoop = useCallback(() => {
    const audio = audioRef.current
    runtimeRef.current = resetIntroRuntimeLoop(runtimeRef.current, performance.now())
    syncRuntimeForRender(runtimeRef.current)
    if (!isIntroRuntimeActive(runtimeRef.current)) return
    if (!audio || runtimeRef.current.audioMode === 'fallback') return
    audio.currentTime = 0
    void audio.play().catch(markAudioFailed)
  }, [markAudioFailed, syncRuntimeForRender])

  const startIntro = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    const currentPlaybackMode = getIntroPlaybackMode(assetLoadStateRef.current, {
      development: import.meta.env.DEV,
      legacyRequested,
    })
    if (currentPlaybackMode === 'blocked') return

    runtimeRef.current = createIntroRuntimeState()
    audio.currentTime = 0
    audio.volume = volume
    audio.muted = muted

    const playback = audio.play()
    setStarted(true)
    setAudioFailed(false)
    syncRuntimeForRender(runtimeRef.current)
    void playback.catch(markAudioFailed)
  }, [legacyRequested, markAudioFailed, muted, syncRuntimeForRender, volume])

  const retrySound = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !isIntroRuntimeActive(runtimeRef.current)) return

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
      seek: (timeSeconds) => {
        audio.currentTime = timeSeconds
      },
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
    if (audioRef.current) audioRef.current.volume = clampedVolume
  }, [])

  const loadIntroAssets = useCallback(() => {
    const generation = ++assetLoadGenerationRef.current
    const loadingState = beginIntroAssetLoad(assetLoadStateRef.current)
    assetLoadStateRef.current = loadingState
    setAssetLoadState(loadingState)
    setAssets(EMPTY_INTRO_ASSETS)

    void preloadIntroAssets(import.meta.env.BASE_URL)
      .then((loadedAssets) => {
        if (generation !== assetLoadGenerationRef.current) return
        const readyState = completeIntroAssetLoad(loadingState)
        assetLoadStateRef.current = readyState
        setAssets(loadedAssets)
        setAssetLoadState(readyState)
      })
      .catch((error: unknown) => {
        if (generation !== assetLoadGenerationRef.current) return
        const failedState = failIntroAssetLoad(loadingState, error)
        assetLoadStateRef.current = failedState
        setAssets(EMPTY_INTRO_ASSETS)
        setAssetLoadState(failedState)
        if (failedState.status === 'error') {
          console.error(`[TMB2 intro assets] ${failedState.failure.message}`)
        }
      })
  }, [])

  useEffect(() => {
    loadIntroAssets()
    return () => {
      assetLoadGenerationRef.current += 1
    }
  }, [loadIntroAssets])

  useEffect(() => {
    if (!started) return

    const tick = () => {
      const audio = audioRef.current
      const sample = sampleIntroClock(runtimeRef.current, {
        nowMs: performance.now(),
        mediaTimeSeconds: audio?.currentTime ?? 0,
      })
      runtimeRef.current = sample.state
      syncRuntimeForRender(sample.state)
      if (sample.didLoop) {
        if (legacyIntro) completeIntro()
        else resetLoop()
      }
      if (isIntroRuntimeActive(runtimeRef.current)) {
        animationFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrameRef.current)
  }, [completeIntro, legacyIntro, resetLoop, started, syncRuntimeForRender])

  useEffect(() => {
    if (!started || legacyIntro) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      const isSpace = event.key === ' ' || event.code === 'Space'
      if (event.key !== 'Enter' && event.key !== 'Escape' && !isSpace) return
      const target = event.target instanceof Element ? event.target : null
      const interactiveTarget = target?.closest(
        'button, input, select, textarea, a, [contenteditable]:not([contenteditable="false"])',
      )
      const startButtonTarget = target?.closest('.game-intro__press-start[aria-label="Start game"]')
      if ((event.key === 'Enter' || isSpace) && interactiveTarget && !startButtonTarget) return
      const accepted = requestStart()
      if (isSpace && accepted) event.preventDefault()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [legacyIntro, requestStart, started])

  useEffect(() => {
    if (!started || legacyIntro) return

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
  }, [legacyIntro, requestStart, started])

  useEffect(() => {
    runtimeRef.current = activateIntroRuntime(runtimeRef.current)
    const audio = audioRef.current
    return () => {
      runtimeRef.current = disposeIntroRuntime(runtimeRef.current)
      audio?.pause()
    }
  }, [])

  const legacyCue = getLegacyIntroCue(timeSeconds)

  return (
    <>
      <audio
        ref={audioRef}
        preload="auto"
        src={`${import.meta.env.BASE_URL}audio/intro-audio-53s.mp3`}
        onEnded={legacyIntro ? completeIntro : resetLoop}
        onError={markAudioFailed}
        onTimeUpdate={(event) => {
          const didLoop = updatePlaybackTime(event.currentTarget.currentTime)
          if (didLoop) {
            if (legacyIntro) completeIntro()
            else resetLoop()
          }
        }}
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
              disabled={playbackMode === 'blocked'}
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
                  {playbackMode === 'legacy' ? ' Development fallback ready.' : ''}
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
          className={`game-intro${legacyIntro ? ' game-intro--legacy' : ''}`}
          aria-label="Game intro"
          data-intro-cue={legacyIntro ? legacyCue.id : cue.id}
          data-reduced-motion={reducedMotion ? 'true' : 'false'}
        >
          {legacyIntro ? (
            <LegacyGameIntro cue={legacyCue} />
          ) : (
            <div className="game-intro__stage-shell">
              <IntroCanvas timeSeconds={timeSeconds} assets={assets} reducedMotion={reducedMotion} />
            </div>
          )}

          {!legacyIntro && startAvailable ? (
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
            <button type="button" className="game-intro__skip" onClick={completeIntro}>Skip Intro</button>
          </div>
        </section>
      )}
    </>
  )
}
