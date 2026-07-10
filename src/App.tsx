import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Hud } from './components/Hud'
import { QualificationCelebration } from './components/QualificationCelebration'
import { SceneHelp } from './components/SceneHelp'
import { gameCopy, type FirstOfficerControl } from './game/config'
import { clearGameState } from './game/storage'
import { useGame } from './game/useGame'
import type { AirbusHotspotScreenPositions, AirbusLoadState } from './scenes/PrototypeScene'

const PrototypeScene = lazy(async () => {
  const module = await import('./scenes/PrototypeScene')
  return { default: module.PrototypeScene }
})

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

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
      <img src={`${import.meta.env.BASE_URL}images/a320-game-ready-fo.png`} alt="Game-ready Airbus A320 cockpit viewed from the first-officer seat" />
      <div className="airbus-loader-shade" />
      <div className="airbus-loader-content">
        <p className="eyebrow">CockpitEscapeRoom</p>
        <h1 id="airbus-loader-title">Airbus A320 First-Officer Mode</h1>
        <p className="airbus-loader-quote">One of the most beautiful offices on earth.</p>
        <p>Modern technology, human wisdom, and the view from the right seat.</p>
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
  const [cameraResetRevision, setCameraResetRevision] = useState(0)
  const [helpOpen, setHelpOpen] = useState(false)
  const [showAirbusLoader, setShowAirbusLoader] = useState(true)
  const [airbusLoaderFading, setAirbusLoaderFading] = useState(false)
  const [airbusHotspots, setAirbusHotspots] = useState<AirbusHotspotScreenPositions>({})
  const [selectedAirbusCard, setSelectedAirbusCard] = useState<string | null>(null)
  const airbusSceneReady = airbusLoadState.status === 'ready' || airbusLoadState.status === 'accessible-fallback'
  const viewerResetReady = state.phase !== 'airbus' || airbusSceneReady

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
  const placeSelectedAirbusCard = useCallback((control: FirstOfficerControl) => {
    if (!activeSelectedAirbusCard) return
    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card: activeSelectedAirbusCard })
    setSelectedAirbusCard(null)
  }, [activeSelectedAirbusCard, dispatch])

  const restart = () => {
    const confirmed = window.confirm(`Restart ${gameCopy.title} and clear saved progress?`)
    if (!confirmed) return
    clearGameState()
    beginAirbusLoading()
    setAirbusHotspots({})
    setSelectedAirbusCard(null)
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
      if (event.key === 'Escape' && helpOpen) {
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
  }, [closeHelp, helpOpen, toggleFullscreen, viewerResetReady])

  if (state.phase === 'briefing') {
    return (
      <main className="briefing-shell">
        <section className="briefing-hero" aria-labelledby="game-title">
          <div className="briefing-visual" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}images/a320-game-ready-fo.png`} alt="" />
            <div className="briefing-visual__label">A320 first-officer station</div>
          </div>

          <div className="briefing-panel">
            <p className="briefing-route">Airbus A320 · First-Officer onboarding</p>
            <h1 id="game-title">{gameCopy.title}</h1>
            <p className="lede">
              Take the right seat, scan the panel, and match each cockpit label to the control it belongs to.
            </p>

            <ol className="briefing-checklist" aria-label="Opening tasks">
              <li>
                <span>1</span>
                Identify five A320 control areas.
              </li>
              <li>
                <span>2</span>
                Answer the Airline Transport Pilot question.
              </li>
              <li>
                <span>3</span>
                Unlock the next sealed instruction.
              </li>
            </ol>

            <button
              type="button"
              className="primary-button primary-button--large"
              onClick={() => {
                beginAirbusLoading()
                dispatch({ type: 'START' })
              }}
            >
              Begin First-Officer onboarding
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main ref={shellRef} className={`game-shell${state.phase === 'airbus' ? ' airbus-shell' : ''}`}>
      {skipPrototypeScene || airbusLoadState.status === 'accessible-fallback' ? (
        <div className="scene scene--accessible" aria-label="Static accessible cockpit view"><img src={`${import.meta.env.BASE_URL}images/a320-game-ready-fo.png`} alt="Game-ready Airbus A320 cockpit from the first-officer seat" /></div>
      ) : (
        <Suspense fallback={null}>
          <PrototypeScene
            phase={state.phase}
            activeSwitches={state.switchSequence}
            lockerHatRevealed={state.lockerHatRevealed}
            captainRewardUnlocked={state.captainRewardUnlocked}
            selectedAirbusCard={activeSelectedAirbusCard}
            airbusRetryToken={airbusRetryToken}
            cameraResetRevision={cameraResetRevision}
            onAirbusLoadState={setAirbusLoadState}
            onAirbusHotspotsChange={updateAirbusHotspots}
            onAirbusTarget={placeSelectedAirbusCard}
            onSwitch={(switchId) => dispatch({ type: 'ACTIVATE_SWITCH', switchId })}
            onMars={() => dispatch({ type: 'UNLOCK_MARS' })}
            onLockerHat={() => dispatch({ type: 'REVEAL_CAPTAIN_HAT' })}
          />
        </Suspense>
      )}
      <Hud
        state={state}
        dispatch={dispatch}
        onRestart={restart}
        airbusSceneReady={skipPrototypeScene || airbusSceneReady}
        airbusHotspots={skipPrototypeScene || airbusLoadState.status === 'accessible-fallback' ? {} : airbusHotspots}
        airbusMeshPickingEnabled={!skipPrototypeScene && airbusLoadState.status !== 'accessible-fallback'}
        selectedAirbusCard={activeSelectedAirbusCard}
        onSelectedAirbusCardChange={setSelectedAirbusCard}
      />
      {state.phase === 'airbus' && !skipPrototypeScene && showAirbusLoader && airbusLoadState.status !== 'accessible-fallback' && (
        <AirbusLoader
          state={airbusLoadState}
          fading={airbusLoaderFading}
          onRetry={() => { beginAirbusLoading(); setAirbusRetryToken((token) => token + 1) }}
          onFallback={() => setAirbusLoadState({ status: 'accessible-fallback', loadedBytes: airbusLoadState.loadedBytes, totalBytes: airbusLoadState.totalBytes })}
        />
      )}
      <div className="scene-tools">
        <button ref={helpTriggerRef} type="button" className="scene-tool-button" aria-label="Open viewer help" aria-expanded={helpOpen} onClick={() => setHelpOpen((open) => !open)}>?</button>
        <button type="button" className="scene-tool-button" aria-label="Toggle fullscreen" onClick={() => void toggleFullscreen()}>⛶</button>
      </div>
      {helpOpen && <button type="button" className="scene-help-dismiss" onClick={closeHelp} aria-label="Dismiss viewer help" tabIndex={-1} />}
      <SceneHelp phase={state.phase} open={helpOpen} onClose={closeHelp} />
      {state.phase === 'airbus' && state.completedPuzzles.includes('firstOfficer') && (
        <QualificationCelebration
          reducedMotion={reducedMotion}
          onContinue={() => dispatch({ type: 'CONTINUE_TO_LOCKER' })}
        />
      )}
    </main>
  )
}
