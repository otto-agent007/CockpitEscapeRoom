import { useEffect, useRef, useState } from 'react'
import { dc9LegacyFlow } from '../../game/config'
import { DC9_SECURE_ORDER, type GameAction, type GameState } from '../../game/state'
import { HomeOperationsLog } from './HomeOperationsLog'
import { LegacyRouteRecord } from './LegacyRouteRecord'
import { CaptainsKeyReveal } from './CaptainsKeyReveal'
import { ControlCheckPanel } from './ControlCheckPanel'
import { InstrumentScanPanel } from './InstrumentScanPanel'
import type { Dc9InstrumentId } from '../../game/dc9FlightDeck'
import type { Dc9ControlState, Dc9HoldControl, Dc9InputMethod } from '../../game/dc9Input'
import type { Dc9HotspotScreenPositions, Dc9LoadState } from '../../scenes/PrototypeScene'
import './dc9Chapter.css'

/**
 * Smallest on-screen edge for a switch marker, so a 42 mm collider stays pointable. The
 * colliders are deliberately separated in 3D, so the marker grows as little as it can get
 * away with or the three boxes start overlapping again on screen.
 */
const DC9_SECURE_MARKER_MIN_PX = 44

/**
 * How far across the viewport the look-down cue may track the key. The right-hand stop keeps
 * it clear of the fullscreen and help buttons pinned to the bottom-right corner, which it
 * otherwise sits on top of at 375 and 768.
 */
const DC9_KEY_CUE_TRACK_RANGE = ['15%', '80%'] as const

interface Dc9ChapterProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
  loadState: Dc9LoadState
  hotspots: Dc9HotspotScreenPositions
  onUseFallback: () => void
  reducedMotion: boolean
  onClaimKey: () => void
  controls: Dc9ControlState
  inputMethod: Dc9InputMethod
  onHoldControl: (control: Dc9HoldControl, pressed: boolean) => void
}

export function Dc9Chapter({
  state,
  dispatch,
  onRestart,
  loadState,
  hotspots,
  onUseFallback,
  reducedMotion,
  onClaimKey,
  controls,
  inputMethod,
  onHoldControl,
}: Dc9ChapterProps) {
  const [routeRecordDismissed, setRouteRecordDismissed] = useState(false)
  const [keyRevealDismissed, setKeyRevealDismissed] = useState(false)
  const [restoreKeyFocus, setRestoreKeyFocus] = useState(false)
  const keyTriggerRef = useRef<HTMLButtonElement>(null)
  const routeRecordVisible = state.dc9.stage === 'routeRecord' && !routeRecordDismissed
  const keyRevealVisible = state.dc9.stage === 'keyReveal' && state.dc9.keyRevealed && !keyRevealDismissed
  const routeProjection = hotspots['dc9.route.card']
  const keyProjection = hotspots['dc9.key.open']
  const keyTriggerVisible = state.dc9.stage === 'keyReveal' && (!state.dc9.keyRevealed || keyRevealDismissed)
  const routeTriggerStageVisible = state.dc9.stage === 'intro' || (state.dc9.stage === 'routeRecord' && routeRecordDismissed)
  const routeProjected = loadState.status === 'ready' && routeProjection?.visible === true
  const routeFallback = loadState.status === 'accessible-fallback' || loadState.status === 'error'
  const routeKeyboardOnly = loadState.status === 'ready' && !routeProjected
  const routeTriggerVisible = routeTriggerStageVisible && (routeProjected || routeFallback || routeKeyboardOnly)
  const keyProjected = loadState.status === 'ready' && keyProjection?.visible === true
  const keyFallback = loadState.status === 'accessible-fallback' || loadState.status === 'error'
  // The key sits low on the ledge beside the seat, so it is off both the right edge and the
  // bottom edge to start with. The projector reports whichever way is further out of view,
  // which turns the cue from "scan right" into "look down" once the pan has come round.
  // Only the two directions the seat can actually produce get a cue. Anything else is the
  // projector saying it has no useful instruction, which is better than a wrong arrow.
  const keyScanCue = keyTriggerVisible
    && loadState.status === 'ready'
    && (keyProjection?.offscreen === 'down' || keyProjection?.offscreen === 'right')
    ? keyProjection.offscreen
    : null

  useEffect(() => {
    if (!restoreKeyFocus) return
    const timeout = window.setTimeout(() => keyTriggerRef.current?.focus(), 0)
    return () => window.clearTimeout(timeout)
  }, [restoreKeyFocus])

  const openRouteRecord = () => {
    setRouteRecordDismissed(false)
    dispatch({ type: 'OPEN_DC9_ROUTE_RECORD' })
  }

  const openCaptainsKey = () => {
    setRestoreKeyFocus(false)
    setKeyRevealDismissed(false)
    dispatch({ type: 'OPEN_CAPTAINS_KEY' })
  }

  const dismissCaptainsKey = () => {
    setRestoreKeyFocus(true)
    setKeyRevealDismissed(true)
  }

  const identifyInstrument = (instrument: Dc9InstrumentId) => {
    dispatch({ type: 'IDENTIFY_DC9_INSTRUMENT', instrument })
  }

  const claimCaptainsKey = () => {
    setRestoreKeyFocus(false)
    setKeyRevealDismissed(true)
    onClaimKey()
  }

  return (
    <section className={`dc9-chapter dc9-chapter--${state.dc9.stage}`} aria-labelledby="dc9-chapter-title">
      <header className="dc9-chapter__topbar">
        <h1 id="dc9-chapter-title">DC-9 Final Flight Log</h1>
      </header>

      {state.dc9.stage === 'controlCheck' ? (
        <ControlCheckPanel
          completed={state.dc9.controlCheck}
          controls={controls}
          inputMethod={inputMethod}
          onHold={onHoldControl}
        />
      ) : null}

      {state.dc9.stage === 'instrumentScan' ? (
        <InstrumentScanPanel
          progress={state.dc9.instrumentScan}
          hotspots={hotspots}
          projectionReady={loadState.status === 'ready'}
          onIdentify={identifyInstrument}
        />
      ) : null}

      {routeTriggerVisible ? (
        <button
          type="button"
          className={`dc9-route-record-trigger${routeProjected ? ' is-projected' : routeFallback ? ' is-fallback' : ' is-keyboard-only'}`}
          aria-label="Open Legacy Route Record"
          data-projection={routeProjected ? 'mesh' : routeFallback ? 'fallback' : 'offscreen'}
          data-projection-point={routeProjected ? `${routeProjection.x},${routeProjection.y}` : undefined}
          data-projection-size={routeProjected && routeProjection.width !== undefined && routeProjection.height !== undefined
            ? `${routeProjection.width},${routeProjection.height}`
            : undefined}
          style={routeProjected ? {
            left: routeProjection.x,
            top: routeProjection.y,
            width: routeProjection.width !== undefined ? routeProjection.width + 8 : undefined,
            height: routeProjection.height !== undefined ? routeProjection.height + 8 : undefined,
          } : undefined}
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

      {state.dc9.stage === 'shutdown' && loadState.status === 'ready' ? (
        <div className="dc9-secure-markers" aria-hidden="true">
          {DC9_SECURE_ORDER.map((controlId) => {
            const projection = hotspots[`dc9.secure.${controlId}`]
            if (!projection?.inView || projection.width === undefined || projection.height === undefined) return null
            const complete = state.dc9.secureSequence.includes(controlId)
            const next = DC9_SECURE_ORDER[state.dc9.secureSequence.length] === controlId
            // The colliders are 42 mm cubes, so on a wide view they project to a box too
            // small to read as a target. Grow the marker without moving its centre.
            const width = Math.max(projection.width + 6, DC9_SECURE_MARKER_MIN_PX)
            const height = Math.max(projection.height + 6, DC9_SECURE_MARKER_MIN_PX)
            return (
              <span
                key={controlId}
                className={`dc9-secure-marker${complete ? ' is-complete' : next ? ' is-next' : ''}`}
                data-control={controlId}
                style={{ left: projection.x, top: projection.y, width, height }}
              >
                <span className="dc9-secure-marker__label">
                  {dc9LegacyFlow.secureControls[controlId].shortLabel}
                </span>
              </span>
            )
          })}
        </div>
      ) : null}

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

      {keyScanCue ? (
        <div
          className={`dc9-key-scan-cue dc9-key-scan-cue--${keyScanCue}`}
          data-cue={keyScanCue}
          aria-hidden="true"
          // The key can project thousands of pixels off the edge, so CSS clamps the cue
          // back into the viewport rather than the component guessing at its width.
          style={keyScanCue === 'down' && Number.isFinite(keyProjection?.x)
            ? { left: `clamp(${DC9_KEY_CUE_TRACK_RANGE[0]}, ${Math.round(keyProjection?.x ?? 0)}px, ${DC9_KEY_CUE_TRACK_RANGE[1]})` }
            : undefined}
        >
          <span /><span /><span />
        </div>
      ) : null}

      {keyTriggerVisible ? (
        <button
          ref={keyTriggerRef}
          type="button"
          className={`dc9-key-trigger${keyProjected ? ' is-projected' : keyFallback ? ' is-fallback' : ' is-keyboard-only'}`}
          aria-label="Open The Captain's Key"
          data-projection={keyProjected ? 'mesh' : keyFallback ? 'fallback' : 'offscreen'}
          data-projection-point={keyProjection ? `${keyProjection.x},${keyProjection.y},${keyProjection.visible}` : undefined}
          style={keyProjected ? { left: keyProjection.x, top: keyProjection.y } : undefined}
          onClick={openCaptainsKey}
        >
          <img src={`${import.meta.env.BASE_URL}images/captains-key-celebration.png`} alt="Golden Captain's Key" />
        </button>
      ) : null}

      {keyRevealVisible ? (
        <CaptainsKeyReveal
          reducedMotion={reducedMotion}
          onClaim={claimCaptainsKey}
          onDismiss={dismissCaptainsKey}
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
        <button type="button" className="text-button" onClick={onRestart}>Restart</button>
      </footer>
    </section>
  )
}
