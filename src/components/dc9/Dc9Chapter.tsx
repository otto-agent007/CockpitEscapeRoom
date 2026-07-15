import { useState } from 'react'
import { dc9LegacyFlow } from '../../game/config'
import { DC9_SECURE_ORDER, type GameAction, type GameState } from '../../game/state'
import { HomeOperationsLog } from './HomeOperationsLog'
import { LegacyRouteRecord } from './LegacyRouteRecord'
import { CaptainsKeyReveal } from './CaptainsKeyReveal'
import type { Dc9HotspotScreenPositions, Dc9LoadState } from '../../scenes/PrototypeScene'
import './dc9Chapter.css'

interface Dc9ChapterProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
  loadState: Dc9LoadState
  hotspots: Dc9HotspotScreenPositions
  onUseFallback: () => void
  reducedMotion: boolean
  onClaimKey: () => void
}

export function Dc9Chapter({ state, dispatch, onRestart, loadState, hotspots, onUseFallback, reducedMotion, onClaimKey }: Dc9ChapterProps) {
  const [routeRecordDismissed, setRouteRecordDismissed] = useState(false)
  const [keyRevealDismissed, setKeyRevealDismissed] = useState(false)
  const routeRecordVisible = state.dc9.stage === 'routeRecord' && !routeRecordDismissed
  const keyRevealVisible = state.dc9.stage === 'keyReveal' && state.dc9.keyRevealed && !keyRevealDismissed
  const routeProjection = hotspots['dc9.route.card']

  const openRouteRecord = () => {
    setRouteRecordDismissed(false)
    dispatch({ type: 'OPEN_DC9_ROUTE_RECORD' })
  }

  const openCaptainsKey = () => {
    setKeyRevealDismissed(false)
    dispatch({ type: 'OPEN_CAPTAINS_KEY' })
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
        <button
          type="button"
          className={`dc9-route-record-trigger${routeProjection?.visible ? ' is-projected' : ' is-fallback'}`}
          aria-label="Open Legacy Route Record"
          data-projection={routeProjection?.visible ? 'mesh' : 'fallback'}
          data-projection-point={routeProjection?.visible ? `${routeProjection.x},${routeProjection.y}` : undefined}
          style={routeProjection?.visible ? { left: routeProjection.x, top: routeProjection.y } : undefined}
          onClick={openRouteRecord}
        >
          <span className="dc9-route-record-trigger__fallback" aria-hidden="true">Open Legacy Route Record</span>
        </button>
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
              const projection = hotspots[`dc9.secure.${controlId}`]
              return (
                <button
                  key={controlId}
                  type="button"
                  className={`dc9-shutdown__control${complete ? ' is-complete' : ''}${next ? ' is-next' : ''}`}
                  aria-pressed={complete}
                  disabled={complete}
                  data-projection={projection?.visible ? 'mesh' : 'fallback'}
                  data-projection-point={projection ? `${projection.x},${projection.y},${projection.visible}` : undefined}
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

      {state.dc9.stage === 'qualification' ? (
        <section className="dc9-atp-gate" aria-labelledby="dc9-atp-title">
          <p className="eyebrow">Final Flight Log · closing milestone</p>
          <h2 id="dc9-atp-title">Airline Transport Pilot</h2>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              dispatch({ type: 'SUBMIT_DC9_ATP_QUALIFICATION' })
            }}
          >
            <label>
              <span>{dc9LegacyFlow.atpQuestion}</span>
              <input
                type="text"
                value={state.airbusQualificationAnswer}
                onChange={(event) => dispatch({ type: 'SET_ATP_QUALIFICATION_ANSWER', value: event.target.value })}
                inputMode="text"
                aria-label="Airline Transport Pilot answer"
                autoFocus
              />
            </label>
            <button type="submit" className="primary-button">Verify</button>
          </form>
        </section>
      ) : null}

      {state.dc9.stage === 'keyReveal' && (!state.dc9.keyRevealed || keyRevealDismissed) ? (
        <button type="button" className="dc9-key-glint" onClick={openCaptainsKey}>
          Open The Captain&apos;s Key
        </button>
      ) : null}

      {keyRevealVisible ? (
        <CaptainsKeyReveal
          reducedMotion={reducedMotion}
          onClaim={onClaimKey}
          onDismiss={() => setKeyRevealDismissed(true)}
        />
      ) : null}

      {loadState.status === 'error' ? (
        <div className="dc9-chapter__load-error" role="alert">
          <strong>3D cockpit unavailable.</strong>
          <span>{loadState.message ?? 'The DC-9 model could not be loaded.'} Your progress is safe; the complete chapter remains available here.</span>
          <button type="button" className="secondary-button" onClick={onUseFallback}>Use static cockpit view</button>
        </div>
      ) : null}

      <footer className="dc9-chapter__status">
        <p aria-live="polite" aria-atomic="true">{state.statusMessage}</p>
        <small>{dc9LegacyFlow.disclaimer}</small>
        <button type="button" className="text-button" onClick={onRestart}>Restart</button>
      </footer>
    </section>
  )
}
