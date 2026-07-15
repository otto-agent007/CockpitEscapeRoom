import { useState } from 'react'
import { dc9LegacyFlow } from '../../game/config'
import { DC9_SECURE_ORDER, type GameAction, type GameState } from '../../game/state'
import { HomeOperationsLog } from './HomeOperationsLog'
import { LegacyRouteRecord } from './LegacyRouteRecord'
import './dc9Chapter.css'

interface Dc9ChapterProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
}

export function Dc9Chapter({ state, dispatch, onRestart }: Dc9ChapterProps) {
  const [routeRecordDismissed, setRouteRecordDismissed] = useState(false)
  const routeRecordVisible = state.dc9.stage === 'routeRecord' && !routeRecordDismissed

  const openRouteRecord = () => {
    setRouteRecordDismissed(false)
    dispatch({ type: 'OPEN_DC9_ROUTE_RECORD' })
  }

  return (
    <section className={`dc9-chapter dc9-chapter--${state.dc9.stage}`} aria-labelledby="dc9-chapter-title">
      <header className="dc9-chapter__topbar">
        <div>
          <p className="eyebrow">DC-9-32 · safely parked</p>
          <h1 id="dc9-chapter-title">DC-9 Final Flight Log</h1>
        </div>
        <span className="dc9-chapter__greybox">GREYBOX</span>
      </header>

      {(state.dc9.stage === 'intro' || (state.dc9.stage === 'routeRecord' && routeRecordDismissed)) ? (
        <div className="dc9-chapter__prompt">
          <p>Find the narrow route strip attached to the captain-yoke center pad.</p>
          <button type="button" className="primary-button" onClick={openRouteRecord}>Open Legacy Route Record</button>
        </div>
      ) : null}

      {routeRecordVisible ? (
        <LegacyRouteRecord
          progress={state.dc9}
          dispatch={dispatch}
          onClose={() => setRouteRecordDismissed(true)}
        />
      ) : null}

      {state.dc9.stage === 'homeOperations' ? <HomeOperationsLog progress={state.dc9} dispatch={dispatch} /> : null}

      {state.dc9.stage === 'shutdown' ? (
        <section className="dc9-shutdown" aria-labelledby="dc9-shutdown-title">
          <p className="eyebrow">Ceremonial shutdown</p>
          <h2 id="dc9-shutdown-title">Secure the parked aircraft</h2>
          <p>Complete the three supported controls in order. An early selection receives calm guidance and never resets a finished step.</p>
          <div className="dc9-shutdown__controls">
            {DC9_SECURE_ORDER.map((controlId) => {
              const complete = state.dc9.secureSequence.includes(controlId)
              const next = DC9_SECURE_ORDER[state.dc9.secureSequence.length] === controlId
              return (
                <button
                  key={controlId}
                  type="button"
                  className={`dc9-shutdown__control${complete ? ' is-complete' : ''}${next ? ' is-next' : ''}`}
                  aria-pressed={complete}
                  disabled={complete}
                  onClick={() => dispatch({ type: 'ACTIVATE_DC9_CONTROL', controlId })}
                >
                  <span>{dc9LegacyFlow.secureControls[controlId].label}</span>
                  <strong>{complete ? 'Off' : next ? 'Next' : 'Stand by'}</strong>
                </button>
              )
            })}
          </div>
        </section>
      ) : null}

      {state.dc9.stage === 'keyReveal' && !state.dc9.keyRevealed ? (
        <button type="button" className="dc9-key-glint" onClick={() => dispatch({ type: 'OPEN_CAPTAINS_KEY' })}>
          Open The Captain&apos;s Key
        </button>
      ) : null}

      <footer className="dc9-chapter__status">
        <p aria-live="polite" aria-atomic="true">{state.statusMessage}</p>
        <small>{dc9LegacyFlow.disclaimer}</small>
        <button type="button" className="text-button" onClick={onRestart}>Restart</button>
      </footer>
    </section>
  )
}
