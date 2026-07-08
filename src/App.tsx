import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Hud } from './components/Hud'
import { gameCopy } from './game/config'
import { clearGameState } from './game/storage'
import { useGame } from './game/useGame'

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

export default function App() {
  const { state, dispatch } = useGame()
  const reducedMotion = useReducedMotion()
  const skipPrototypeScene = shouldSkipPrototypeScene()
  const [airbusSceneReady, setAirbusSceneReady] = useState(false)
  const markAirbusSceneReady = useCallback(() => {
    setAirbusSceneReady(true)
  }, [])

  const restart = () => {
    const confirmed = window.confirm(`Restart ${gameCopy.title} and clear saved progress?`)
    if (!confirmed) return
    clearGameState()
    setAirbusSceneReady(false)
    dispatch({ type: 'RESET' })
  }

  if (state.phase === 'briefing') {
    return (
      <main className="briefing-shell">
        <section className="briefing-hero" aria-labelledby="game-title">
          <div className="briefing-visual" aria-hidden="true">
            <img src={`${import.meta.env.BASE_URL}images/a320-fo-view.png`} alt="" />
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
                Enter the ATP hour check.
              </li>
              <li>
                <span>3</span>
                Unlock the next sealed instruction.
              </li>
            </ol>

            <button type="button" className="primary-button primary-button--large" onClick={() => dispatch({ type: 'START' })}>
              Begin First-Officer onboarding
            </button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`game-shell${state.phase === 'airbus' ? ' airbus-shell' : ''}`}>
      {skipPrototypeScene ? (
        <div className="scene scene--loading">3D scene skipped. Use the mirrored controls below.</div>
      ) : (
        <Suspense fallback={<div className="scene scene--loading">Loading the cockpit sequence…</div>}>
          <PrototypeScene
            phase={state.phase}
            activeSwitches={state.switchSequence}
            lockerHatRevealed={state.lockerHatRevealed}
            captainRewardUnlocked={state.captainRewardUnlocked}
            reducedMotion={reducedMotion}
            onAirbusReady={markAirbusSceneReady}
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
      />
    </main>
  )
}
