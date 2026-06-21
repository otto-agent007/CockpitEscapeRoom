import { dc9Atmosphere, gameCopy, personalization } from '../game/config'
import { gameProgress, SWITCH_ORDER, type GameAction, type GameState, type SwitchId } from '../game/state'

interface HudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
}

const switchLabels: Record<SwitchId, string> = {
  battery: 'Stored power',
  navigation: 'Navigation',
  cabin: 'Cabin circuit',
}

export function Hud({ state, dispatch, onRestart }: HudProps) {
  const selectedRoutes = new Set(state.routeSelections)

  return (
    <aside className="hud" aria-label="Game controls">
      <div className="hud__topline">
        <span className="eyebrow">{state.mode === 'captain' ? 'Captain Mode' : 'Crew Mode'}</span>
        <span>{gameProgress(state)}% restored</span>
      </div>

      <progress max={100} value={gameProgress(state)} aria-label="Puzzle progress" />

      <div className="status" aria-live="polite" aria-atomic="true">
        {state.statusMessage}
      </div>

      {state.phase === 'power' && (
        <section aria-labelledby="power-heading">
          <h2 id="power-heading">1. Fictional power sequence</h2>
          <p>
            {state.mode === 'captain'
              ? 'Use the compact panel clues. A wrong attempt resets only this sequence.'
              : 'Restore the three circuits in a logical order. The 3D switches and these buttons control the same state.'}
          </p>
          <div className="control-grid">
            {SWITCH_ORDER.map((switchId) => {
              const active = state.switchSequence.includes(switchId)
              return (
                <button
                  key={switchId}
                  type="button"
                  className="control-button"
                  aria-pressed={active}
                  onClick={() => dispatch({ type: 'ACTIVATE_SWITCH', switchId })}
                >
                  <span>{state.mode === 'captain' ? switchId.slice(0, 3).toUpperCase() : switchLabels[switchId]}</span>
                  <strong>{active ? 'Latched' : 'Ready'}</strong>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {state.phase === 'route' && (
        <section aria-labelledby="route-heading">
          <h2 id="route-heading">2. Memphis feeder route</h2>
          <p>
            Select three short-haul routes that fit the Southern funnel into {personalization.homeBaseAirport}. The details add atmosphere; this is not a history exam.
          </p>
          <div className="route-grid">
            {dc9Atmosphere.routePuzzleOptions.map((route) => (
              <button
                key={route.code}
                type="button"
                className="route-button"
                aria-pressed={selectedRoutes.has(route.code)}
                onClick={() => dispatch({ type: 'TOGGLE_ROUTE', code: route.code })}
              >
                <strong>{route.code}</strong>
                {state.mode === 'crew' && <span>{route.city}</span>}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="primary-button"
            disabled={state.routeSelections.length !== dc9Atmosphere.routePuzzleAnswers.length}
            onClick={() => dispatch({ type: 'SUBMIT_ROUTE' })}
          >
            Submit route strip
          </button>
        </section>
      )}

      {state.phase === 'complete' && (
        <section aria-labelledby="complete-heading">
          <h2 id="complete-heading">Legacy flight complete</h2>
          <p>{gameCopy.finalMessage}</p>
          {state.captainRewardUnlocked ? (
            <div className="reward-card">
              <span className="eyebrow">Captain Mode reward</span>
              <strong>{gameCopy.captainReward}</strong>
              <span>The 3D car is an intentionally simple proxy until an original or licensed production asset is approved.</span>
            </div>
          ) : (
            <p>Restart and select Captain Mode to unlock the red Model Y hangar reward.</p>
          )}
          <button type="button" className="mars-button" onClick={() => dispatch({ type: 'UNLOCK_MARS' })}>
            Inspect the tiny red destination light
          </button>
        </section>
      )}

      {state.phase === 'mars' && (
        <section aria-labelledby="mars-heading">
          <span className="eyebrow">Hidden mission</span>
          <h2 id="mars-heading">Mars diversion accepted</h2>
          <p>{gameCopy.marsRank}</p>
          <p>The final game will hide this trigger inside the realistic Airbus bonus cockpit.</p>
          <button type="button" className="primary-button" onClick={() => dispatch({ type: 'RETURN_TO_COMPLETE' })}>
            Return to the hangar
          </button>
        </section>
      )}

      {(state.phase === 'power' || state.phase === 'route') && (
        <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'USE_HINT' })}>
          Request progressive hint
        </button>
      )}

      <button type="button" className="text-button" onClick={onRestart}>
        Restart game
      </button>
    </aside>
  )
}
