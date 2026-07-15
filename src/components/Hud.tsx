import { useMemo, useState, type DragEvent } from 'react'
import { firstOfficerFlow, gameCopy, type FirstOfficerControl, type LockerMemoryId } from '../game/config'
import { gameProgress, type GameAction, type GameState } from '../game/state'
import type { AirbusHotspotScreenPositions } from '../scenes/PrototypeScene'
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
}: HudProps) {
  const [draggingAirbusCard, setDraggingAirbusCard] = useState<string | null>(null)
  const [activeAirbusTarget, setActiveAirbusTarget] = useState<FirstOfficerControl | null>(null)
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
            <p className="eyebrow">Crew experience</p>
            <h2 id="airbus-heading">Airbus A320 First-Officer Mode</h2>
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
