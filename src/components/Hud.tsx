import { useMemo, useState, type DragEvent } from 'react'
import { dc9LegacyFlow, firstOfficerFlow, gameCopy, lockerFlow, type FirstOfficerControl, type LockerInteraction } from '../game/config'
import { SWITCH_ORDER, gameProgress, type GameAction, type GameState, type SwitchId } from '../game/state'
import type { AirbusHotspotScreenPositions } from '../scenes/PrototypeScene'

interface HudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  onRestart: () => void
  airbusSceneReady: boolean
  airbusHotspots: AirbusHotspotScreenPositions
}

const switchLabels: Record<SwitchId, string> = {
  battery: 'Stored power',
  navigation: 'Navigation',
  cabin: 'Cabin circuit',
}

const lockerItems: ReadonlyArray<LockerInteraction> = [...lockerFlow.requiredInteractionIds]

const airbusTargetMeta: Record<FirstOfficerControl, { x: number; y: number; label: string }> = {
  sidestick: { x: 72, y: 79, label: 'Sidestick' },
  thrust: { x: 25.5, y: 86, label: 'Thrust levers' },
  gear: { x: 39.5, y: 57, label: 'Landing gear lever' },
  radio: { x: 40, y: 83, label: 'Radio panel' },
  altitude: { x: 38, y: 25, label: 'Altitude area' },
}

export function Hud({ state, dispatch, onRestart, airbusSceneReady, airbusHotspots }: HudProps) {
  const [selectedAirbusCard, setSelectedAirbusCard] = useState<string | null>(null)
  const [draggingAirbusCard, setDraggingAirbusCard] = useState<string | null>(null)
  const [activeAirbusTarget, setActiveAirbusTarget] = useState<FirstOfficerControl | null>(null)
  const [watchInput, setWatchInput] = useState('')
  const [baseballInput, setBaseballInput] = useState('')
  const [checklistInput, setChecklistInput] = useState('')
  const selectedRoutes = new Set(state.routeSelections)
  const assignedTargetByCard = useMemo(() => {
    const assignments = new Map<string, string>()
    for (const control of firstOfficerFlow.controlIds) {
      const card = state.airbusAssignments[control]
      if (card) assignments.set(card, firstOfficerFlow.controlLabels[control])
    }
    return assignments
  }, [state.airbusAssignments])

  const isComplete = (id: FirstOfficerControl) => state.airbusAssignments[id] === firstOfficerFlow.controlMatch[id]
  const placedAirbusCards = Object.values(state.airbusAssignments).filter(Boolean).length
  const airbusLabelsComplete = firstOfficerFlow.controlIds.every((control) => state.airbusAssignments[control] === firstOfficerFlow.controlMatch[control])

  const placeAirbusCard = (control: FirstOfficerControl, card: string) => {
    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card })
    setSelectedAirbusCard(null)
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
            const assignedTarget = assignedTargetByCard.get(card)
            const selected = selectedAirbusCard === card

            return (
              <button
                key={card}
                type="button"
                className={`airbus-card${selected ? ' is-selected' : ''}${assignedTarget ? ' is-placed' : ''}`}
                draggable
                aria-pressed={selected}
                onClick={() => setSelectedAirbusCard(selected ? null : card)}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = 'move'
                  event.dataTransfer.setData('text/plain', card)
                  setSelectedAirbusCard(card)
                  setDraggingAirbusCard(card)
                }}
                onDragEnd={() => {
                  setDraggingAirbusCard(null)
                  setActiveAirbusTarget(null)
                }}
              >
                <strong>{card}</strong>
                {assignedTarget && <span>{assignedTarget}</span>}
              </button>
            )
          })}
        </div>

        <div
          className={`airbus-target-layer${Object.keys(airbusHotspots).length > 0 ? ' airbus-target-layer--projected' : ''}`}
          aria-label="Cockpit placement targets"
        >
          {firstOfficerFlow.controlIds.map((control) => {
            const assignedCard = state.airbusAssignments[control]
            const complete = isComplete(control)
            const wrong = Boolean(assignedCard) && !complete
            const dragging = Boolean(draggingAirbusCard)
            const active = activeAirbusTarget === control
            const projectedTarget = airbusHotspots[control]
            const hasProjectedTarget = Boolean(projectedTarget)
            const targetStyle = projectedTarget
              ? { left: `${projectedTarget.x}px`, top: `${projectedTarget.y}px` }
              : { left: `${airbusTargetMeta[control].x}%`, top: `${airbusTargetMeta[control].y}%` }

            return (
              <button
                key={control}
                type="button"
                className={`airbus-target airbus-target--${control}${hasProjectedTarget ? ' is-projected' : ''}${assignedCard ? ' has-card' : ''}${complete ? ' is-correct' : ''}${wrong ? ' is-wrong' : ''}${dragging ? ' is-dragging-card' : ''}${active ? ' is-drag-over' : ''}`}
                style={targetStyle}
                aria-label={`${firstOfficerFlow.controlLabels[control]} target`}
                onClick={() => {
                  if (selectedAirbusCard) {
                    placeAirbusCard(control, selectedAirbusCard)
                    return
                  }
                  if (assignedCard) setSelectedAirbusCard(assignedCard)
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
                  {`${airbusTargetMeta[control].label} drop area. ${
                    assignedCard ? `Current card: ${assignedCard}.` : 'No card placed.'
                  }`}
                </span>
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

          {airbusLabelsComplete && (
            <>
              <label className="airbus-atp">
                <span>{firstOfficerFlow.clockQuestion}</span>
                <input
                  type="text"
                  value={state.airbusClockAnswer}
                  onChange={(event) => {
                    dispatch({ type: 'SET_AIRBUS_CLOCK_ANSWER', value: event.target.value })
                  }}
                  inputMode="numeric"
                  aria-label="ATP answer"
                />
              </label>
              <button
                type="button"
                className="primary-button airbus-dock-button"
                onClick={() => dispatch({ type: 'SUBMIT_AIRBUS_CLOCK' })}
              >
                Verify
              </button>
            </>
          )}

          <button type="button" className="secondary-button airbus-dock-button" onClick={() => dispatch({ type: 'USE_HINT' })}>
            Hint
          </button>
          <button type="button" className="text-button airbus-restart" onClick={onRestart}>
            Restart
          </button>
        </div>
      </section>
    )
  }

  return (
    <aside className="hud" aria-label="Game controls">
      <div className="hud__topline">
        <span className="eyebrow">
          {state.phase === 'locker'
              ? 'Locker reveal'
              : state.phase === 'captain'
                ? 'Pop T Captain Mode'
                : state.phase === 'reward'
                  ? 'Hangar access'
                  : 'Completion beat'}
        </span>
        <span>{gameProgress(state)}% complete</span>
      </div>

      <progress max={100} value={gameProgress(state)} aria-label="Puzzle progress" />

      <div className="status" aria-live="polite" aria-atomic="true">
        {state.statusMessage}
      </div>

      {state.phase === 'locker' && (
        <section aria-labelledby="locker-heading">
          <h2 id="locker-heading">Locker reveal sequence</h2>
          <p>Inspect each object. A hidden reward reveal waits for all locker moments to complete.</p>

          <div>
            <label>
              <span>{lockerFlow.interactions.watch.label}</span>
              <input
                type="text"
                value={watchInput}
                onChange={(event) => setWatchInput(event.target.value)}
                placeholder="Right-seat hours"
                aria-label="Right-seat hours"
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              aria-label="Confirm watch answer"
              aria-disabled={state.lockerCompleted.includes('watch')}
              onClick={() => {
                if (state.lockerCompleted.includes('watch')) return
                dispatch({ type: 'COMPLETE_LOCKER_OBJECT', objectId: 'watch', response: watchInput })
              }}
            >
              Confirm
            </button>
          </div>

          <div>
            <label>
              <span>{lockerFlow.interactions.baseball.label}</span>
              <input
                type="text"
                value={baseballInput}
                onChange={(event) => setBaseballInput(event.target.value)}
                placeholder="Name"
                aria-label="Name"
              />
            </label>
            <button
              type="button"
              className="secondary-button"
              aria-label="Confirm baseball answer"
              aria-disabled={state.lockerCompleted.includes('baseball')}
              onClick={() => {
                if (state.lockerCompleted.includes('baseball')) return
                dispatch({ type: 'COMPLETE_LOCKER_OBJECT', objectId: 'baseball', response: baseballInput })
              }}
            >
              Confirm
            </button>
          </div>

          {lockerItems
            .filter((item) => item !== 'watch' && item !== 'baseball')
            .map((item) => (
              <button
                key={item}
                type="button"
                className="secondary-button"
                aria-label={`Inspect ${lockerFlow.interactions[item].label}`}
                aria-disabled={state.lockerCompleted.includes(item)}
                onClick={() => {
                  if (state.lockerCompleted.includes(item)) return
                  const payload: { type: 'COMPLETE_LOCKER_OBJECT'; objectId: LockerInteraction; response?: string } = {
                    type: 'COMPLETE_LOCKER_OBJECT',
                    objectId: item,
                  }
                  if (item === 'checklist') {
                    payload.response = checklistInput
                  }
                  dispatch(payload)
                }}
              >
                {state.lockerCompleted.includes(item)
                  ? `${lockerFlow.interactions[item].label} complete`
                  : `Inspect ${lockerFlow.interactions[item].label}`}
              </button>
            ))}

          <label>
            <span>{lockerFlow.interactions.checklist.label}</span>
            <input
              type="text"
              value={checklistInput}
              onChange={(event) => setChecklistInput(event.target.value)}
              placeholder="Power,Lights,Route,Crew,Release"
              aria-label="Power,Lights,Route,Crew,Release"
            />
          </label>

          <p>{lockerFlow.hatText.hiddenText}</p>

          <button
            type="button"
            className="primary-button"
            disabled={!state.lockerHatRevealed}
            aria-label="Complete captain hat reveal"
            onClick={() => dispatch({ type: 'REVEAL_CAPTAIN_HAT' })}
          >
            {state.lockerHatRevealed ? 'Touch the captain’s hat' : 'Complete locker inspection first'}
          </button>
        </section>
      )}

      {state.phase === 'locker' && (
        <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'USE_HINT' })}>
          Request progressive hint
        </button>
      )}

      {state.phase === 'captain' && (
        <section aria-labelledby="captain-heading">
          <h2 id="captain-heading">{dc9LegacyFlow.title}</h2>
          <p>{dc9LegacyFlow.subtitle}</p>
          <div className="control-grid">
            {SWITCH_ORDER.map((switchId) => (
              <button
                key={switchId}
                type="button"
                className="control-button"
                aria-pressed={state.switchSequence.includes(switchId)}
                onClick={() => dispatch({ type: 'ACTIVATE_SWITCH', switchId })}
              >
                <span>{switchLabels[switchId]}</span>
                <strong>{state.switchSequence.includes(switchId) ? 'Latched' : 'Ready'}</strong>
              </button>
            ))}
          </div>

          <div className="route-grid">
            {dc9LegacyFlow.routePuzzleOptions.map((route) => (
              <button
                key={route.code}
                type="button"
                className="route-button"
                aria-pressed={selectedRoutes.has(route.code)}
                onClick={() => dispatch({ type: 'TOGGLE_ROUTE', code: route.code })}
              >
                <strong>{route.code}</strong>
                <span>{route.city}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            className="primary-button"
            disabled={state.routeSelections.length !== dc9LegacyFlow.routePuzzleAnswers.length}
            onClick={() => dispatch({ type: 'SUBMIT_ROUTE' })}
          >
            Submit captain legacy strip
          </button>
          <p>{dc9LegacyFlow.routeQuestion}</p>
        </section>
      )}

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
