import { lazy, Suspense, useEffect, useState } from 'react'
import { Hud } from './components/Hud'
import { gameCopy, personalization, PROJECT_NAME } from './game/config'
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

  const restart = () => {
    const confirmed = window.confirm('Restart CockpitEscapeRoom and clear saved progress?')
    if (!confirmed) return
    clearGameState()
    dispatch({ type: 'RESET' })
  }

  if (state.phase === 'briefing') {
    return (
      <main className="briefing-shell">
        <section className="briefing-card" aria-labelledby="game-title">
          <span className="eyebrow">{PROJECT_NAME} flow update</span>
          <h1 id="game-title">{gameCopy.title}</h1>
          <p className="lede">{gameCopy.subtitle}</p>
          <p>{gameCopy.premise}</p>

          <button type="button" className="primary-button primary-button--large" onClick={() => dispatch({ type: 'START' })}>
            Begin First-Officer onboarding
          </button>

          <dl className="briefing-facts">
            <div>
              <dt>Intro cockpit</dt>
              <dd>Airbus A320 First-Officer</dd>
            </div>
            <div>
              <dt>Reward vehicle</dt>
              <dd>{personalization.rewardVehicle}</dd>
            </div>
            <div>
              <dt>Legacy cockpit</dt>
              <dd>{personalization.exactDc9Variant}</dd>
            </div>
          </dl>
        </section>
      </main>
    )
  }

  return (
    <main className="game-shell">
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
            onSwitch={(switchId) => dispatch({ type: 'ACTIVATE_SWITCH', switchId })}
            onMars={() => dispatch({ type: 'UNLOCK_MARS' })}
            onLockerHat={() => dispatch({ type: 'REVEAL_CAPTAIN_HAT' })}
          />
        </Suspense>
      )}
      <Hud state={state} dispatch={dispatch} onRestart={restart} />
    </main>
  )
}
