import { useState } from 'react'
import { dc9LegacyFlow, firstOfficerFlow, gameCopy, lockerFlow, type FirstOfficerControl, type LockerInteraction } from '../game/config'
import { SWITCH_ORDER, gameProgress, type GameAction, type GameState, type SwitchId } from '../game/state'

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

const lockerItems: ReadonlyArray<LockerInteraction> = [...lockerFlow.requiredInteractionIds]

export function Hud({ state, dispatch, onRestart }: HudProps) {
  const [airbusClockInput, setAirbusClockInput] = useState(state.airbusClockAnswer)
  const [watchInput, setWatchInput] = useState('')
  const [baseballInput, setBaseballInput] = useState('')
  const [checklistInput, setChecklistInput] = useState('')
  const selectedRoutes = new Set(state.routeSelections)

  const isComplete = (id: FirstOfficerControl) => state.airbusAssignments[id] === firstOfficerFlow.controlMatch[id]

  return (
    <aside className="hud" aria-label="Game controls">
      <div className="hud__topline">
        <span className="eyebrow">
          {state.phase === 'airbus'
            ? 'Airbus A320 First-Officer Mode'
            : state.phase === 'locker'
              ? 'Locker reveal'
              : state.phase === 'captain'
                ? 'DC-9-50 Pop T Captain Mode'
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

      {state.phase === 'airbus' && (
        <section aria-labelledby="airbus-heading">
          <h2 id="airbus-heading">Airbus A320 First-Officer onboarding</h2>
          <p>Match each label card to the correct control in a drag-and-drop style interaction.</p>
          {firstOfficerFlow.controlIds.map((control) => (
            <div key={control} style={{ marginBottom: '0.75rem' }}>
              <label>
                <span>
                  {firstOfficerFlow.controlLabels[control]} ({firstOfficerFlow.controlMatch[control]})
                </span>
                <select
                  aria-label={`Select card for ${firstOfficerFlow.controlLabels[control]}`}
                  value={state.airbusAssignments[control] ?? ''}
                  onChange={(event) =>
                    dispatch({ type: 'ASSIGN_AIRBUS_CARD', control, card: event.target.value === '' ? '' : event.target.value })
                  }
                >
                  <option value="">Pick card…</option>
                  {firstOfficerFlow.controlCards.map((card) => (
                    <option key={card} value={card}>
                      {card}
                    </option>
                  ))}
                </select>
              </label>
              <span style={{ fontSize: '0.9rem' }}>
                {state.airbusAssignments[control]
                  ? isComplete(control)
                    ? 'Correct.'
                    : 'Checking…'
                  : 'Unmatched'}
              </span>
              <p>{state.airbusAssignments[control] ? firstOfficerFlow.controlHints[control] : ''}</p>
            </div>
          ))}

          <p className="primary-note">{firstOfficerFlow.clockQuestion}</p>
          <label>
            <span>Milestone answer</span>
            <input
              type="text"
              value={airbusClockInput}
              onChange={(event) => {
                setAirbusClockInput(event.target.value)
                dispatch({ type: 'SET_AIRBUS_CLOCK_ANSWER', value: event.target.value })
              }}
              inputMode="numeric"
              aria-label="Milestone answer"
            />
          </label>
          <button
            type="button"
            className="primary-button"
            onClick={() => dispatch({ type: 'SUBMIT_AIRBUS_CLOCK' })}
          >
            Verify First-Officer challenge
          </button>
          <p>Correctly complete all matches and submit to unlock the locker.</p>
        </section>
      )}

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

      {(state.phase === 'airbus' || state.phase === 'locker') && (
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
          <p>{gameCopy.rewardUpgradeTitle}</p>
          <p>{gameCopy.rewardFlightModeLine}</p>
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
