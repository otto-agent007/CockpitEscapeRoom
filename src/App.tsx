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

export default function App() {
  const { state, dispatch } = useGame()
  const reducedMotion = useReducedMotion()

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
          <span className="eyebrow">{PROJECT_NAME} starter vertical slice</span>
          <h1 id="game-title">{gameCopy.title}</h1>
          <p className="lede">{gameCopy.subtitle}</p>
          <p>{gameCopy.premise}</p>

          <div className="mode-grid" role="group" aria-label="Select game mode">
            <button
              type="button"
              className="mode-card"
              aria-pressed={state.mode === 'crew'}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'crew' })}
            >
              <strong>Crew Mode</strong>
              <span>Clearer labels, city names, and family-friendly hints.</span>
            </button>
            <button
              type="button"
              className="mode-card"
              aria-pressed={state.mode === 'captain'}
              onClick={() => dispatch({ type: 'SET_MODE', mode: 'captain' })}
            >
              <strong>Captain Mode</strong>
              <span>Compact clues, aviation flavor, and the red Model Y reward.</span>
            </button>
          </div>

          <button type="button" className="primary-button primary-button--large" onClick={() => dispatch({ type: 'START' })}>
            Begin legacy flight
          </button>

          <dl className="briefing-facts">
            <div>
              <dt>Main aircraft</dt>
              <dd>{personalization.startingAircraft}</dd>
            </div>
            <div>
              <dt>Bonus level</dt>
              <dd>{personalization.laterAircraft} cockpit — exact model still to confirm</dd>
            </div>
            <div>
              <dt>Home atmosphere</dt>
              <dd>{personalization.airlineContext}</dd>
            </div>
          </dl>

          <p className="prototype-note">
            This working starter demonstrates the gameplay, persistence, accessibility, and repair loop. Blender-built aircraft art comes next through approval gates.
          </p>
        </section>
      </main>
    )
  }

  return (
    <main className="game-shell">
      <Suspense fallback={<div className="scene scene--loading">Loading the cockpit greybox…</div>}>
        <PrototypeScene
          activeSwitches={state.switchSequence}
          phase={state.phase}
          captainRewardUnlocked={state.captainRewardUnlocked}
          reducedMotion={reducedMotion}
          onSwitch={(switchId) => dispatch({ type: 'ACTIVATE_SWITCH', switchId })}
          onMars={() => dispatch({ type: 'UNLOCK_MARS' })}
        />
      </Suspense>
      <Hud state={state} dispatch={dispatch} onRestart={restart} />
    </main>
  )
}
