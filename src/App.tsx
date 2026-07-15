import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Hud } from './components/Hud'
import { Dc9Chapter } from './components/dc9/Dc9Chapter'
import { LockerTransition, type LockerIntroStage } from './components/LockerTransition'
import { CaptainHatCelebration, QualificationCelebration } from './components/QualificationCelebration'
import { SceneHelp } from './components/SceneHelp'
import { dc9LegacyFlow, gameCopy, lockerFlow, type AirbusControl, type LockerMemoryId } from './game/config'
import { isLockerMemoryAvailable } from './game/state'
import { clearGameState } from './game/storage'
import { useGame } from './game/useGame'
import type { AirbusHotspotScreenPositions, AirbusLoadState, Dc9HotspotScreenPositions, Dc9LoadState, LockerCameraCue, LockerLoadState } from './scenes/PrototypeScene'

const PrototypeScene = lazy(async () => {
  const module = await import('./scenes/PrototypeScene')
  return { default: module.PrototypeScene }
})

const LOCKER_INTRO_TIMINGS = {
  fadeToBlack: 900,
  blackPause: 600,
  titleIn: 1_400,
  titleHold: 2_800,
  titleOut: 700,
  revealLocker: 1_100,
  wideHold: 800,
} as const

const REDUCED_LOCKER_INTRO_TIMINGS = {
  fadeToBlack: 250,
  blackPause: 200,
  titleIn: 20,
  titleHold: 1_500,
  titleOut: 20,
  revealLocker: 250,
  wideHold: 0,
} as const

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReduced(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  return reduced
}

function shouldSkipPrototypeScene(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('skip3d') === '1'
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
}

function AirbusLoader({ state, fading, onRetry, onFallback }: { state: AirbusLoadState; fading: boolean; onRetry: () => void; onFallback: () => void }) {
  const loadedMb = (state.loadedBytes / 1_000_000).toFixed(1)
  const totalMb = state.totalBytes ? (state.totalBytes / 1_000_000).toFixed(1) : null
  const percentage = 'percentage' in state ? state.percentage : undefined
  return (
    <section className={`airbus-loader${fading ? ' airbus-loader--fading' : ''}`} aria-labelledby="airbus-loader-title">
      <img src={`${import.meta.env.BASE_URL}images/a320-game-ready-captain.png`} alt="Game-ready Airbus A320 cockpit viewed from the captain seat" />
      <div className="airbus-loader-shade" />
      <div className="airbus-loader-content">
        <p className="eyebrow">CockpitEscapeRoom</p>
        <h1 id="airbus-loader-title">Airbus A320 Pop T Captain Mode</h1>
        <p className="airbus-loader-quote">One of the most beautiful offices on earth.</p>
        <p>Modern technology, earned command, and the view from the left seat.</p>
        {state.status === 'error' ? (
          <div className="airbus-loader-error" role="alert">
            <strong>{state.message}</strong>
            <div><button type="button" className="primary-button" onClick={onRetry}>Retry 3D</button><button type="button" className="secondary-button" onClick={onFallback}>Continue with accessible controls</button></div>
          </div>
        ) : (
          <div className="airbus-loader-progress" role="status" aria-live="polite">
            <div><span>Preparing the A320 cockpit</span><strong>{percentage !== undefined ? `${percentage}%` : `${loadedMb} MB`}</strong></div>
            <progress max={100} value={percentage ?? 0} />
            <small>{totalMb ? `${loadedMb} of ${totalMb} MB downloaded` : `${loadedMb} MB downloaded`}</small>
          </div>
        )}
      </div>
    </section>
  )
}

export default function App() {
  const { state, dispatch } = useGame()
  const reducedMotion = useReducedMotion()
  const skipPrototypeScene = shouldSkipPrototypeScene()
  const shellRef = useRef<HTMLElement>(null)
  const helpTriggerRef = useRef<HTMLButtonElement>(null)
  const loaderStartedAtRef = useRef(0)
  const [airbusLoadState, setAirbusLoadState] = useState<AirbusLoadState>({ status: 'loading', loadedBytes: 0 })
  const [airbusRetryToken, setAirbusRetryToken] = useState(0)
  const [lockerRetryToken, setLockerRetryToken] = useState(0)
  const [lockerLoadState, setLockerLoadState] = useState<LockerLoadState>({ status: 'idle' })
  const [dc9LoadState, setDc9LoadState] = useState<Dc9LoadState>({ status: 'idle' })
  const [dc9Hotspots, setDc9Hotspots] = useState<Dc9HotspotScreenPositions>({})
  const [cameraResetRevision, setCameraResetRevision] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [showAirbusLoader, setShowAirbusLoader] = useState(true)
  const [airbusLoaderFading, setAirbusLoaderFading] = useState(false)
  const [airbusHotspots, setAirbusHotspots] = useState<AirbusHotspotScreenPositions>({})
  const [selectedAirbusCard, setSelectedAirbusCard] = useState<string | null>(null)
  const [selectedLockerMemory, setSelectedLockerMemory] = useState<LockerMemoryId | null>(null)
  const [pendingLockerMemoryFocus, setPendingLockerMemoryFocus] = useState<LockerMemoryId | null>(null)
  const [lastAutoFocusedLockerMemory, setLastAutoFocusedLockerMemory] = useState<LockerMemoryId | null>(null)
  const pendingLockerIntroOnLoad = state.phase === 'locker' && !state.lockerIntroCompleted
  const [lockerIntroStage, setLockerIntroStage] = useState<LockerIntroStage>(pendingLockerIntroOnLoad ? 'black-pause' : 'idle')
  const [lockerCameraCue, setLockerCameraCue] = useState<LockerCameraCue>(
    pendingLockerIntroOnLoad
      ? 'entry-wide'
      : state.lockerCompleted.includes('wings')
        ? 'wings-focus'
        : state.lockerCompleted.includes('chargingBull')
          ? 'bull-focus'
          : state.lockerCompleted.includes('baseball')
            ? 'baseball-focus'
            : 'watch-focus',
  )
  const [lockerCameraImmediate, setLockerCameraImmediate] = useState(state.phase === 'locker' && reducedMotion)
  const [lockerIntroSkipRequested, setLockerIntroSkipRequested] = useState(false)
  const airbusSceneReady = airbusLoadState.status === 'ready' || airbusLoadState.status === 'accessible-fallback'
  const lockerIntroActive = lockerIntroStage !== 'idle'
  const captainHatCelebrationActive = state.phase === 'locker' && state.lockerHatRevealed && !lockerIntroActive
  const lockerIntroErrorVisible = lockerIntroStage === 'waiting-for-locker' && lockerLoadState.status === 'error'
  const lockerSceneReady = skipPrototypeScene || lockerLoadState.status === 'ready' || lockerLoadState.status === 'accessible-fallback'
  const lockerInteractionEnabled = state.phase === 'locker' && state.lockerIntroCompleted && !lockerIntroActive && !captainHatCelebrationActive
  const availableLockerMemories = lockerFlow.memoryIds.filter((memoryId) => isLockerMemoryAvailable(state, memoryId))
  const viewerResetReady = !lockerIntroActive && (state.phase !== 'airbus' || airbusSceneReady)

  useEffect(() => {
    if (state.phase !== 'locker' || lockerIntroActive || state.lockerHatRevealed) return
    const nextMemory: LockerMemoryId | null = state.lockerCompleted.includes('chargingBull')
      ? 'wings'
      : state.lockerCompleted.includes('baseball')
        ? 'chargingBull'
        : state.lockerCompleted.includes('watch')
          ? 'baseball'
          : null
    if (!nextMemory || nextMemory === lastAutoFocusedLockerMemory) return
    const focusTimeout = window.setTimeout(() => {
      setLastAutoFocusedLockerMemory(nextMemory)
      setSelectedLockerMemory(null)
      setLockerCameraImmediate(reducedMotion)
      setLockerCameraCue(nextMemory === 'wings' ? 'wings-focus' : nextMemory === 'baseball' ? 'baseball-focus' : 'bull-focus')
      if (skipPrototypeScene || lockerLoadState.status === 'accessible-fallback') {
        setSelectedLockerMemory(nextMemory)
        setPendingLockerMemoryFocus(null)
      } else {
        setPendingLockerMemoryFocus(nextMemory)
      }
    }, 0)
    return () => window.clearTimeout(focusTimeout)
  }, [lastAutoFocusedLockerMemory, lockerIntroActive, lockerLoadState.status, reducedMotion, skipPrototypeScene, state.lockerCompleted, state.lockerHatRevealed, state.phase])

  useEffect(() => {
    if (!pendingLockerMemoryFocus || (!skipPrototypeScene && lockerLoadState.status !== 'accessible-fallback')) return
    const fallbackTimeout = window.setTimeout(() => {
      setSelectedLockerMemory(pendingLockerMemoryFocus)
      setPendingLockerMemoryFocus(null)
    }, 0)
    return () => window.clearTimeout(fallbackTimeout)
  }, [lockerLoadState.status, pendingLockerMemoryFocus, skipPrototypeScene])

  useEffect(() => {
    loaderStartedAtRef.current = performance.now()
  }, [])

  useEffect(() => {
    if (airbusLoadState.status !== 'ready') return
    const minimumRemaining = Math.max(0, 600 - (performance.now() - loaderStartedAtRef.current))
    const fadeTimeout = window.setTimeout(() => setAirbusLoaderFading(true), minimumRemaining)
    const hideTimeout = window.setTimeout(() => setShowAirbusLoader(false), minimumRemaining + (reducedMotion ? 0 : 250))
    return () => {
      window.clearTimeout(fadeTimeout)
      window.clearTimeout(hideTimeout)
    }
  }, [airbusLoadState.status, reducedMotion])

  useEffect(() => {
    if (lockerIntroStage === 'idle' || lockerIntroStage === 'waiting-for-locker' || lockerIntroStage === 'focus-watch') return
    const timings = reducedMotion ? REDUCED_LOCKER_INTRO_TIMINGS : LOCKER_INTRO_TIMINGS
    let firstFrame = 0
    let secondFrame = 0
    let timeout = 0

    if (lockerIntroStage === 'arming') {
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => setLockerIntroStage('fade-to-black'))
      })
    } else {
      const advance = () => {
        switch (lockerIntroStage) {
          case 'fade-to-black':
            setLockerIntroStage('black-pause')
            break
          case 'black-pause':
            setLockerIntroStage('title-in')
            break
          case 'title-in':
            setLockerIntroStage('title-hold')
            break
          case 'title-hold':
            setLockerIntroStage('title-out')
            break
          case 'title-out':
            setLockerIntroStage('waiting-for-locker')
            break
          case 'reveal-locker':
            setLockerIntroStage('wide-hold')
            break
          case 'wide-hold':
            setLockerCameraCue('watch-focus')
            setLockerIntroStage('focus-watch')
            break
          default:
            break
        }
      }
      const duration = {
        'fade-to-black': timings.fadeToBlack,
        'black-pause': timings.blackPause,
        'title-in': timings.titleIn,
        'title-hold': timings.titleHold,
        'title-out': timings.titleOut,
        'reveal-locker': timings.revealLocker,
        'wide-hold': timings.wideHold,
      }[lockerIntroStage]
      timeout = window.setTimeout(advance, duration)
    }

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      window.clearTimeout(timeout)
    }
  }, [lockerIntroStage, reducedMotion])

  useEffect(() => {
    if (lockerIntroStage !== 'waiting-for-locker' || !lockerSceneReady) return
    const timeout = window.setTimeout(() => {
      if (lockerIntroSkipRequested) {
        setLockerCameraCue('watch-focus')
        setLockerIntroStage('focus-watch')
        return
      }
      setLockerIntroStage('reveal-locker')
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [lockerIntroSkipRequested, lockerIntroStage, lockerSceneReady])

  useEffect(() => {
    const accessibleLockerScene = skipPrototypeScene || lockerLoadState.status === 'accessible-fallback'
    if (lockerIntroStage !== 'focus-watch' || !accessibleLockerScene) return
    const timeout = window.setTimeout(() => {
      if (!state.lockerIntroCompleted) dispatch({ type: 'COMPLETE_LOCKER_INTRO' })
      setLockerIntroStage('idle')
      setLockerIntroSkipRequested(false)
    }, 0)
    return () => window.clearTimeout(timeout)
  }, [dispatch, lockerIntroStage, lockerLoadState.status, skipPrototypeScene, state.lockerIntroCompleted])

  const beginAirbusLoading = useCallback(() => {
    loaderStartedAtRef.current = performance.now()
    setAirbusLoaderFading(false)
    setShowAirbusLoader(true)
    setAirbusLoadState({ status: 'loading', loadedBytes: 0 })
  }, [])
  const updateAirbusHotspots = useCallback((positions: AirbusHotspotScreenPositions) => {
    setAirbusHotspots((current) => {
      if (Object.keys(positions).length === 0 && Object.keys(current).length > 0) return current
      return positions
    })
  }, [])
  const activeSelectedAirbusCard = state.phase === 'airbus' ? selectedAirbusCard : null
  const placeSelectedAirbusCard = useCallback((control: AirbusControl) => {
    if (!activeSelectedAirbusCard) return
    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card: activeSelectedAirbusCard })
    setSelectedAirbusCard(null)
  }, [activeSelectedAirbusCard, dispatch])

  const beginLockerIntro = useCallback(() => {
    setHelpOpen(false)
    setSelectedLockerMemory(null)
    setPendingLockerMemoryFocus(null)
    setLastAutoFocusedLockerMemory(null)
    setLockerIntroSkipRequested(false)
    setLockerCameraCue('entry-wide')
    setLockerCameraImmediate(reducedMotion)
    setLockerIntroStage('arming')
  }, [reducedMotion])

  const skipLockerIntro = useCallback(() => {
    setSelectedLockerMemory(null)
    setLockerIntroSkipRequested(true)
    setLockerCameraImmediate(true)
    setLockerCameraCue('watch-focus')
    setLockerIntroStage(state.phase === 'locker' && lockerSceneReady ? 'focus-watch' : 'waiting-for-locker')
  }, [lockerSceneReady, state.phase])

  const continueToAirbus = useCallback(() => {
    dispatch({ type: 'CLAIM_CAPTAIN_HAT' })
    dispatch({ type: 'CONTINUE_FROM_LOCKER_TO_AIRBUS' })
    beginAirbusLoading()
  }, [beginAirbusLoading, dispatch])

  const continueToReward = useCallback(() => {
    dispatch({ type: 'CONTINUE_FROM_AIRBUS_TO_REWARD' })
  }, [dispatch])

  const claimCaptainsKey = useCallback(() => {
    dispatch({ type: 'CLAIM_CAPTAINS_KEY' })
    beginLockerIntro()
  }, [beginLockerIntro, dispatch])

  const handleDc9Interaction = useCallback((gameId: string) => {
    if (gameId === 'dc9.key.open') {
      dispatch({ type: 'OPEN_CAPTAINS_KEY' })
      return
    }
    if (gameId.startsWith('dc9.route.')) {
      dispatch({ type: 'OPEN_DC9_ROUTE_RECORD' })
      return
    }
    const controlId = dc9LegacyFlow.secureControlIds.find((id) => `dc9.secure.${id}` === gameId)
    if (controlId) dispatch({ type: 'ACTIVATE_DC9_CONTROL', controlId })
  }, [dispatch])

  const handleLockerCameraSettled = useCallback((cue: LockerCameraCue) => {
    if (cue === 'watch-focus' && lockerIntroStage === 'focus-watch') {
      if (!state.lockerIntroCompleted) dispatch({ type: 'COMPLETE_LOCKER_INTRO' })
      setLockerIntroStage('idle')
      setLockerIntroSkipRequested(false)
      return
    }
    const settledMemory = cue === 'baseball-focus' ? 'baseball' : cue === 'bull-focus' ? 'chargingBull' : cue === 'wings-focus' ? 'wings' : null
    if (!settledMemory || pendingLockerMemoryFocus !== settledMemory) return
    setSelectedLockerMemory(settledMemory)
    setPendingLockerMemoryFocus(null)
  }, [dispatch, lockerIntroStage, pendingLockerMemoryFocus, state.lockerIntroCompleted])

  const restart = () => {
    const confirmed = window.confirm(`Restart ${gameCopy.title} and clear saved progress?`)
    if (!confirmed) return
    clearGameState()
    beginAirbusLoading()
    setAirbusHotspots({})
    setSelectedAirbusCard(null)
    setSelectedLockerMemory(null)
    setPendingLockerMemoryFocus(null)
    setLastAutoFocusedLockerMemory(null)
    setLockerLoadState({ status: 'idle' })
    setLockerIntroStage('idle')
    setLockerCameraCue('watch-focus')
    setLockerCameraImmediate(false)
    setLockerIntroSkipRequested(false)
    dispatch({ type: 'RESET' })
  }

  const closeHelp = useCallback(() => {
    setHelpOpen(false)
    requestAnimationFrame(() => helpTriggerRef.current?.focus())
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await shellRef.current?.requestFullscreen()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return
      if (event.key === 'Escape' && lockerIntroActive) {
        event.preventDefault()
        skipLockerIntro()
      } else if (event.key === 'Escape' && helpOpen) {
        event.preventDefault()
        closeHelp()
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void toggleFullscreen()
      } else if (event.key.toLowerCase() === 'r' && viewerResetReady) {
        event.preventDefault()
        setCameraResetRevision((revision) => revision + 1)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeHelp, helpOpen, lockerIntroActive, skipLockerIntro, toggleFullscreen, viewerResetReady])

  if (state.phase === 'briefing') {
    return (
      <main className="briefing-shell">
        <section className="briefing-hero" aria-labelledby="game-title">
          <div className="briefing-visual" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}images/dc9-game-ready-first-officer.png`} alt="" />
            <div className="briefing-visual__label">DC-9-32 first-officer station</div>
          </div>

          <div className="briefing-panel">
            <p className="briefing-route">DC-9-32 · First-Officer onboarding</p>
            <h1 id="game-title">{gameCopy.title}</h1>
            <p className="lede">
              Take the right seat and complete the commemorative Final Flight Log before the locker reveal.
            </p>

            <ol className="briefing-checklist" aria-label="Opening tasks">
              <li>
                <span>1</span>
                Verify the DC-9 route card.
              </li>
              <li>
                <span>2</span>
                Review the Home Operations Log.
              </li>
              <li>
                <span>3</span>
                Secure the parked aircraft and unlock the Captain’s Key.
              </li>
            </ol>

            <button
              type="button"
              className="primary-button primary-button--large"
              onClick={() => {
                dispatch({ type: 'START' })
              }}
            >
              Start Game
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main ref={shellRef} className={`game-shell${state.phase === 'airbus' ? ' airbus-shell' : ''}${state.phase === 'locker' ? ' locker-shell' : ''}${state.phase === 'dc9' ? ' captain-shell' : ''}`}>
      {skipPrototypeScene || (state.phase === 'airbus' && airbusLoadState.status === 'accessible-fallback') || (state.phase === 'locker' && lockerLoadState.status === 'accessible-fallback') || (state.phase === 'dc9' && dc9LoadState.status === 'accessible-fallback') ? (
        state.phase === 'locker'
          ? <div className="scene scene--accessible scene--locker-accessible" aria-label="Static accessible captain's locker view"><div className="locker-accessible-mark">Captain's locker</div></div>
          : state.phase === 'dc9'
            ? <div className="scene scene--accessible scene--dc9-accessible" aria-label="Static accessible DC-9-32 cockpit view"><img src={`${import.meta.env.BASE_URL}images/dc9-game-ready-first-officer.png`} alt="Game-ready DC-9-32 cockpit from the first-officer seat" /></div>
            : <div className="scene scene--accessible" aria-label="Static accessible cockpit view"><img src={`${import.meta.env.BASE_URL}images/a320-game-ready-captain.png`} alt="Game-ready Airbus A320 cockpit from the captain seat" /></div>
      ) : (
        <Suspense fallback={null}>
          <PrototypeScene
            phase={state.phase}
            activeDc9Controls={state.dc9.secureSequence}
            dc9ChapterStage={state.dc9.stage}
            reducedMotion={reducedMotion}
            lockerHatRevealed={state.lockerHatRevealed}
            rewardUnlocked={state.rewardUnlocked}
            selectedAirbusCard={activeSelectedAirbusCard}
            airbusRetryToken={airbusRetryToken}
            lockerRetryToken={lockerRetryToken}
            lockerCameraCue={lockerCameraCue}
            lockerCameraImmediate={lockerCameraImmediate}
            lockerControlsEnabled={lockerInteractionEnabled}
            availableLockerMemories={availableLockerMemories}
            cameraResetRevision={cameraResetRevision}
            onAirbusLoadState={setAirbusLoadState}
            onLockerLoadState={setLockerLoadState}
            onDc9LoadState={setDc9LoadState}
            onAirbusHotspotsChange={updateAirbusHotspots}
            onDc9HotspotsChange={setDc9Hotspots}
            onAirbusTarget={placeSelectedAirbusCard}
            onLockerCameraSettled={handleLockerCameraSettled}
            onDc9Interaction={handleDc9Interaction}
            onMars={() => dispatch({ type: 'UNLOCK_MARS' })}
            onLockerMemory={(memoryId) => {
              if (!lockerInteractionEnabled || !availableLockerMemories.includes(memoryId)) return
              setSelectedLockerMemory(memoryId)
            }}
            onLockerHat={() => dispatch({ type: 'CLAIM_CAPTAIN_HAT' })}
          />
        </Suspense>
      )}
      {!lockerIntroActive && !captainHatCelebrationActive && state.phase !== 'dc9' && (
        <Hud
          state={state}
          dispatch={dispatch}
          onRestart={restart}
          airbusSceneReady={skipPrototypeScene || airbusSceneReady}
          airbusHotspots={skipPrototypeScene || airbusLoadState.status === 'accessible-fallback' ? {} : airbusHotspots}
          airbusMeshPickingEnabled={!skipPrototypeScene && airbusLoadState.status !== 'accessible-fallback'}
          selectedAirbusCard={activeSelectedAirbusCard}
          onSelectedAirbusCardChange={setSelectedAirbusCard}
          selectedLockerMemory={selectedLockerMemory}
          onSelectedLockerMemoryChange={setSelectedLockerMemory}
        />
      )}
      {state.phase === 'dc9' && (
        <Dc9Chapter
          state={state}
          dispatch={dispatch}
          onRestart={restart}
          loadState={skipPrototypeScene ? { status: 'accessible-fallback' } : dc9LoadState}
          hotspots={dc9Hotspots}
          onUseFallback={() => setDc9LoadState({ status: 'accessible-fallback' })}
          reducedMotion={reducedMotion}
          onClaimKey={claimCaptainsKey}
        />
      )}
      {state.phase === 'airbus' && !skipPrototypeScene && showAirbusLoader && airbusLoadState.status !== 'accessible-fallback' && (
        <AirbusLoader
          state={airbusLoadState}
          fading={airbusLoaderFading}
          onRetry={() => { beginAirbusLoading(); setAirbusRetryToken((token) => token + 1) }}
          onFallback={() => setAirbusLoadState({ status: 'accessible-fallback', loadedBytes: airbusLoadState.loadedBytes, totalBytes: airbusLoadState.totalBytes })}
        />
      )}
      {state.phase === 'locker' && lockerLoadState.status === 'error' && (!lockerIntroActive || lockerIntroStage === 'waiting-for-locker') && (
        <section className="locker-load-error" role="alert" aria-labelledby="locker-load-error-title">
          <h2 id="locker-load-error-title">The 3D locker could not be opened.</h2>
          <p>Your memory progress is safe.</p>
          <button type="button" className="primary-button" onClick={() => setLockerRetryToken((token) => token + 1)}>Retry 3D</button>
          <button type="button" className="secondary-button" onClick={() => setLockerLoadState({ status: 'accessible-fallback' })}>Continue with accessible controls</button>
        </section>
      )}
      {!lockerIntroActive && !captainHatCelebrationActive && (
        <div className="scene-tools">
          {state.phase === 'locker' && state.lockerIntroCompleted && (
            <button type="button" className="scene-tool-button" aria-label="Replay locker intro" onClick={beginLockerIntro}>↻</button>
          )}
          <button ref={helpTriggerRef} type="button" className="scene-tool-button" aria-label="Open viewer help" aria-expanded={helpOpen} onClick={() => setHelpOpen((open) => !open)}>?</button>
          <button type="button" className="scene-tool-button" aria-label="Toggle fullscreen" onClick={() => void toggleFullscreen()}>⛶</button>
        </div>
      )}
      {!lockerIntroActive && !captainHatCelebrationActive && helpOpen && <button type="button" className="scene-help-dismiss" onClick={closeHelp} aria-label="Dismiss viewer help" tabIndex={-1} />}
      {!lockerIntroActive && !captainHatCelebrationActive && <SceneHelp phase={state.phase} open={helpOpen} onClose={closeHelp} />}
      {state.phase === 'airbus' && state.completedPuzzles.includes('airbus') && !lockerIntroActive && (
        <QualificationCelebration reducedMotion={reducedMotion} onContinue={continueToReward} />
      )}
      {captainHatCelebrationActive && (
        <CaptainHatCelebration reducedMotion={reducedMotion} onContinue={continueToAirbus} />
      )}
      {lockerIntroActive && !lockerIntroErrorVisible && (
        <LockerTransition
          stage={lockerIntroStage}
          text={lockerFlow.introText}
          reducedMotion={reducedMotion}
          onSkip={skipLockerIntro}
        />
      )}
    </main>
  )
}
