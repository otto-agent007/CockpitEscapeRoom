import { useMemo, useState, type DragEvent } from 'react'
import { dc9LegacyFlow, firstOfficerFlow, gameCopy, type FirstOfficerControl, type LockerMemoryId } from '../game/config'
import { DC9_SECURE_ORDER, gameProgress, type GameAction, type GameState } from '../game/state'
import type { AirbusHotspotScreenPositions, Dc9HotspotScreenPositions, Dc9LoadState } from '../scenes/PrototypeScene'
import { LockerHud } from './LockerHud'

interface HudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
  airbusSceneReady: boolean
  airbusHotspots: AirbusHotspotScreenPositions
  airbusMeshPickingEnabled: boolean
  selectedAirbusCard: string | null
  onSelectedAirbusCardChange: (card: string | null) => void
  selectedLockerMemory: LockerMemoryId | null
  onSelectedLockerMemoryChange: (memory: LockerMemoryId | null) => void
  dc9LoadState: Dc9LoadState
  dc9Hotspots: Dc9HotspotScreenPositions
  onDc9Fallback?: () => void
}

const airbusTargetMeta: Record<FirstOfficerControl, { x: number; y: number }> = {
  sidestick: { x: 72, y: 79 },
  thrust: { x: 25.5, y: 86 },
  gear: { x: 39.5, y: 57 },
  radio: { x: 40, y: 83 },
  altitude: { x: 38, y: 25 },
}

export function Hud({
  state,
  dispatch,
  onRestart,
  airbusSceneReady,
  airbusHotspots,
  airbusMeshPickingEnabled,
  selectedAirbusCard,
  onSelectedAirbusCardChange,
  selectedLockerMemory,
  onSelectedLockerMemoryChange,
  dc9LoadState,
  dc9Hotspots,
  onDc9Fallback,
}: HudProps) {
  const [draggingAirbusCard, setDraggingAirbusCard] = useState<string | null>(null)
  const [activeAirbusTarget, setActiveAirbusTarget] = useState<FirstOfficerControl | null>(null)
  const selectedRoutes = new Set(state.routeSelections)
  const assignedCards = useMemo(() => new Set(Object.values(state.airbusAssignments).filter(Boolean)), [state.airbusAssignments])

  const isComplete = (id: FirstOfficerControl) => state.airbusAssignments[id] === firstOfficerFlow.controlMatch[id]
  const placedAirbusCards = Object.values(state.airbusAssignments).filter(Boolean).length
  const airbusLabelsComplete = firstOfficerFlow.controlIds.every((control) => state.airbusAssignments[control] === firstOfficerFlow.controlMatch[control])

  const placeAirbusCard = (control: FirstOfficerControl, card: string) => {
    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card })
    onSelectedAirbusCardChange(null)
    setDraggingAirbusCard(null)
    setActiveAirbusTarget(null)
  }

  if (state.phase === 'airbus') {
    if (!airbusSceneReady) {
      return (
        <section className="airbus-training airbus-training--loading" aria-labelledby="airbus-heading">
          <h2 id="airbus-heading" className="sr-only">Airbus cockpit loading</h2>
          <p className="sr-only" aria-live="polite">Loading the Airbus cockpit.</p>
        </section>
      )
    }

    return (
      <section className="airbus-training" aria-labelledby="airbus-heading">
        <div className="airbus-topbar">
          <div>
            <p className="eyebrow">Airbus First-Officer Mode</p>
            <h2 id="airbus-heading" className="sr-only">Airbus cockpit label placement</h2>
          </div>
          <div className="airbus-progress" aria-label={`${placedAirbusCards} of ${firstOfficerFlow.controlCards.length} cards placed`}>
            <span>{gameProgress(state)}% complete</span>
            <strong>{placedAirbusCards}/{firstOfficerFlow.controlCards.length}</strong>
          </div>
        </div>

        <div className="airbus-card-tray" aria-label="Draggable label cards">
          {firstOfficerFlow.controlCards.map((card) => {
            const control = firstOfficerFlow.controlIds.find((controlId) => firstOfficerFlow.controlMatch[controlId] === card)
            const assigned = assignedCards.has(card)
            const selected = selectedAirbusCard === card

            return (
              <button
                key={card}
                type="button"
                className={`airbus-card${selected ? ' is-selected' : ''}${assigned ? ' is-placed' : ''}`}
                draggable
                aria-pressed={selected}
                onClick={() => onSelectedAirbusCardChange(selected ? null : card)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', card)
                  onSelectedAirbusCardChange(card)
                  setDraggingAirbusCard(card)
                }}
                onDragEnd={() => {
                  setDraggingAirbusCard(null)
                  setActiveAirbusTarget(null)
                }}
              >
                <strong>{card}</strong>
                <span className="airbus-card-description">{control ? firstOfficerFlow.controlDescriptions[control] : ''}</span>
                {assigned && <span className="airbus-card-placement">Placed</span>}
              </button>
            )
          })}
        </div>

        <div
          className={`airbus-target-layer${Object.keys(airbusHotspots).length > 0 ? ' airbus-target-layer--projected' : ''}${airbusMeshPickingEnabled ? ' airbus-target-layer--mesh-picking' : ' airbus-target-layer--fallback'}${selectedAirbusCard || draggingAirbusCard ? ' is-placing-card' : ''}`}
          aria-label="Cockpit placement targets"
        >
          {firstOfficerFlow.controlIds.map((control, index) => {
            const assignedCard = state.airbusAssignments[control]
            const complete = isComplete(control)
            const wrong = Boolean(assignedCard) && !complete
            const dragging = Boolean(draggingAirbusCard)
            const active = activeAirbusTarget === control
            const projectedTarget = airbusHotspots[control]
            const hasProjectedTarget = Boolean(projectedTarget?.visible)
            const dropZoneLabel = `Cockpit drop zone ${index + 1}`
            const targetStyle = projectedTarget
              ? {
                  left: `${projectedTarget.x}px`,
                  top: `${projectedTarget.y}px`,
                }
              : { left: `${airbusTargetMeta[control].x}%`, top: `${airbusTargetMeta[control].y}%` }

            return (
              <button
                key={control}
                type="button"
                className={`airbus-target-control airbus-target-control--${control}${hasProjectedTarget ? ' is-projected' : ''}${assignedCard ? ' has-card' : ''}${complete ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}${dragging ? ' is-dragging-card' : ''}${active ? ' is-drag-over' : ''}`}
                style={targetStyle}
                data-airbus-target={control}
                data-anchor-x={projectedTarget?.x}
                data-anchor-y={projectedTarget?.y}
                aria-label={dropZoneLabel}
                onClick={() => {
                  if (selectedAirbusCard) {
                    placeAirbusCard(control, selectedAirbusCard)
                    return
                  }
                  if (assignedCard) onSelectedAirbusCardChange(assignedCard)
                }}
                onDragEnter={(event) => {
                  event.preventDefault()
                  setActiveAirbusTarget(control)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  event.dataTransfer.dropEffect = 'move'
                  setActiveAirbusTarget(control)
                }}
                onDragLeave={(event) => {
                  const nextTarget = event.relatedTarget
                  if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return
                  setActiveAirbusTarget((current) => (current === control ? null : current))
                }}
                onDrop={(event: DragEvent<HTMLButtonElement>) => {
                  event.preventDefault()
                  const card = event.dataTransfer.getData('text/plain')
                  if (card) placeAirbusCard(control, card)
                  else setActiveAirbusTarget(null)
                }}
              >
                <span className="sr-only">
                  {`${dropZoneLabel}. ${
                    assignedCard ? `Current card: ${assignedCard}.` : 'No card placed.'
                  }`}
                </span>
                <span className="airbus-target-silhouette" aria-hidden="true" />
                {assignedCard && <span className="airbus-target-card" aria-hidden="true">{assignedCard}</span>}
              </button>
            )
          })}
        </div>

        <div
          className={`airbus-dock${airbusLabelsComplete ? ' airbus-dock--atp' : ''}`}
          aria-label="First-Officer status and controls"
        >
          <div className="status airbus-status" aria-live="polite" aria-atomic="true">
            {state.statusMessage}
          </div>

          {airbusLabelsComplete && !state.completedPuzzles.includes('firstOfficer') && (
            <form
              className="airbus-qualification-form"
              onSubmit={(event) => {
                event.preventDefault()
                dispatch({ type: 'SUBMIT_AIRBUS_CLOCK' })
              }}
            >
              <label className="airbus-atp">
                <span>{firstOfficerFlow.clockQuestion}</span>
                <input
                  type="text"
                  value={state.airbusClockAnswer}
                  onChange={(event) => {
                    dispatch({ type: 'SET_AIRBUS_CLOCK_ANSWER', value: event.target.value })
                  }}
                  inputMode="text"
                  aria-label="Airline Transport Pilot answer"
                />
              </label>
              <button
                type="submit"
                className="primary-button airbus-dock-button"
              >
                Verify
              </button>
            </form>
          )}

          <button type="button" className="text-button airbus-restart" onClick={onRestart}>
            Restart
          </button>
        </div>
      </section>
    )
  }

  if (state.phase === 'locker') {
    return (
      <LockerHud
        state={state}
        dispatch={dispatch}
        selectedMemory={selectedLockerMemory}
        onSelectedMemoryChange={onSelectedLockerMemoryChange}
        onRestart={onRestart}
      />
    )
  }

  if (state.phase === 'captain') {
    const projectedStyle = (gameId: string, fallback: { x: string; y: string }) => {
      const hotspot = dc9Hotspots[gameId]
      return hotspot?.visible
        ? { left: `clamp(62px, ${hotspot.x}px, calc(100vw - 62px))`, top: `${hotspot.y}px` }
        : { left: fallback.x, top: fallback.y }
    }
    const routeFallback = [
      { x: '18%', y: '35%' }, { x: '18%', y: '42%' }, { x: '18%', y: '49%' },
      { x: '18%', y: '56%' }, { x: '18%', y: '63%' }, { x: '18%', y: '70%' },
    ]
    const secureFallback = [{ x: '44%', y: '18%' }, { x: '53%', y: '18%' }, { x: '62%', y: '18%' }]
    const fallback = dc9LoadState.status === 'error' || dc9LoadState.status === 'accessible-fallback'
    return (
      <section className={`captain-interface${fallback ? ' captain-interface--fallback' : ''}`} aria-labelledby="captain-heading">
        <header className="captain-topbar">
          <div>
            <p className="eyebrow">DC-9-32 · Pop T Captain Mode</p>
            <h2 id="captain-heading" className="sr-only">DC-9-32 Pop T Captain Mode</h2>
          </div>
          <div className="captain-progress" aria-label="Captain Mode progress">
            <span>{state.captainRouteVerified ? 'Route verified' : 'Route verification'}</span>
            <strong>{state.captainRouteVerified ? `${state.dc9SecureSequence.length}/3 secure` : `${state.routeSelections.length}/3 selected`}</strong>
          </div>
        </header>

        <div className="captain-projected-controls" data-testid="captain-projected-controls">
          {!state.captainRouteVerified && dc9LegacyFlow.routePuzzleOptions.map((route, index) => {
            const selected = selectedRoutes.has(route.code)
            const highlighted = state.captainAttempts.route >= 2 && route.verifiedDc9
            const routeHotspot = dc9Hotspots[`dc9.route.${route.code}`]
            return (
              <button
                key={route.code}
                type="button"
                className={`captain-route-hotspot${selected ? ' is-selected' : ''}${highlighted ? ' is-hinted' : ''}`}
                style={projectedStyle(`dc9.route.${route.code}`, routeFallback[index] ?? { x: '18%', y: '50%' })}
                aria-pressed={selected}
                aria-label={`${route.code}, ${route.city}, ${route.mileage} miles from Memphis`}
                data-projection={routeHotspot?.visible ? 'mesh' : 'fallback'}
                data-projection-point={routeHotspot ? `${routeHotspot.x},${routeHotspot.y}` : undefined}
                onClick={() => dispatch({ type: 'TOGGLE_ROUTE', code: route.code })}
              >
                <strong>{route.code}</strong>
                <span>{route.city} · {route.mileage} mi</span>
              </button>
            )
          })}
          {!state.captainRouteVerified && (
            <button
              type="button"
              className="captain-route-submit"
              style={projectedStyle('dc9.route.submit', { x: '18%', y: '78%' })}
              disabled={state.routeSelections.length !== dc9LegacyFlow.routePuzzleAnswers.length}
              onClick={() => dispatch({ type: 'SUBMIT_ROUTE' })}
            >
              Verify MEM strip
            </button>
          )}
          {state.captainRouteVerified && DC9_SECURE_ORDER.map((controlId, index) => {
            const complete = state.dc9SecureSequence.includes(controlId)
            const next = DC9_SECURE_ORDER[state.dc9SecureSequence.length] === controlId
            const secureHotspot = dc9Hotspots[`dc9.secure.${controlId}`]
            return (
              <button
                key={controlId}
                type="button"
                className={`captain-secure-hotspot${complete ? ' is-complete' : ''}${state.captainAttempts.secure >= 2 && next ? ' is-hinted' : ''}`}
                style={projectedStyle(`dc9.secure.${controlId}`, secureFallback[index] ?? { x: '52%', y: '18%' })}
                aria-pressed={complete}
                disabled={complete}
                data-projection={secureHotspot?.visible ? 'mesh' : 'fallback'}
                data-projection-point={secureHotspot ? `${secureHotspot.x},${secureHotspot.y},${secureHotspot.visible}` : undefined}
                onClick={() => dispatch({ type: 'ACTIVATE_DC9_CONTROL', controlId })}
              >
                <span>{dc9LegacyFlow.secureControls[controlId].label}</span>
                <strong>{complete ? 'Off' : next ? 'Next' : 'Stand by'}</strong>
              </button>
            )
          })}
        </div>

        {dc9LoadState.status === 'error' && (
          <div className="captain-load-notice" role="alert">
            <strong>3D cockpit unavailable.</strong>
            <span>Your progress is safe; the same controls remain available.</span>
            {onDc9Fallback && <button type="button" onClick={onDc9Fallback}>Use static cockpit view</button>}
          </div>
        )}

        <footer className="captain-status-dock">
          <div>
            <p className="captain-stage-label">{state.captainRouteVerified ? 'Parked-cockpit secure' : 'MEM route strip'}</p>
            <p className="captain-status" aria-live="polite" aria-atomic="true">{state.statusMessage}</p>
            <small>{dc9LegacyFlow.disclaimer}</small>
          </div>
          <div className="captain-dock-actions">
            <button type="button" onClick={() => dispatch({ type: 'USE_HINT' })}>Hint</button>
            <button type="button" onClick={onRestart}>Restart</button>
          </div>
        </footer>
      </section>
    )
  }

  return (
    <aside className="hud" aria-label="Game controls">
      <div className="hud__topline">
        <span className="eyebrow">
          {state.phase === 'reward'
                  ? 'Hangar access'
                  : 'Completion beat'}
        </span>
        <span>{gameProgress(state)}% complete</span>
      </div>

      <progress max={100} value={gameProgress(state)} aria-label="Puzzle progress" />

      <div className="status" aria-live="polite" aria-atomic="true">
        {state.statusMessage}
      </div>

      {state.phase === 'reward' && (
        <section aria-labelledby="reward-heading">
          <h2 id="reward-heading">Ground transport release</h2>
          <p>{gameCopy.rewardTitle}</p>
          <p>{gameCopy.rewardVehicleLine}</p>
          <p>{gameCopy.finalMessage}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => dispatch({ type: 'UNLOCK_MARS' })}
          >
            Request Mars option
          </button>
        </section>
      )}

      {state.phase === 'mars' && (
        <section aria-labelledby="mars-heading">
          <h2 id="mars-heading">{gameCopy.marsRank}</h2>
          <p>{gameCopy.hiddenEasterEgg.message}</p>
          <button type="button" className="primary-button" onClick={() => dispatch({ type: 'RETURN_TO_REWARD' })}>
            Return to hangar
          </button>
        </section>
      )}

      <button type="button" className="text-button" onClick={onRestart}>
        Restart game
      </button>
    </aside>
  )
}
