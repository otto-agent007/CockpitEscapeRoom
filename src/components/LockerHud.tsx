import { useEffect, useRef, useState } from 'react'
import { lockerFlow, type LockerMemoryId, type LockerQuestionId } from '../game/config'
import { isLockerMemoryAvailable, type GameAction, type GameState } from '../game/state'

interface LockerHudProps {
  state: GameState
  dispatch: React.Dispatch<GameAction>
  selectedMemory: LockerMemoryId | null
  onSelectedMemoryChange: (memory: LockerMemoryId | null) => void
  onRestart: () => void
}

function isQuestion(memoryId: LockerMemoryId): memoryId is LockerQuestionId {
  return (lockerFlow.questionIds as readonly string[]).includes(memoryId)
}

export function LockerHud({ state, dispatch, selectedMemory, onSelectedMemoryChange, onRestart }: LockerHudProps) {
  const [answers, setAnswers] = useState<Record<LockerQuestionId, string>>({ watch: '', baseball: '' })
  const closeRef = useRef<HTMLButtonElement>(null)
  const watchLinkRef = useRef<HTMLButtonElement>(null)
  const completed = new Set(state.lockerCompleted)
  const visibleMemories = lockerFlow.memoryIds.filter((memoryId) => isLockerMemoryAvailable(state, memoryId))
  const trayMemories = visibleMemories.filter((memoryId) => memoryId !== 'watch')
  const watchAvailable = visibleMemories.includes('watch')
  const selectedMemoryComplete = selectedMemory ? completed.has(selectedMemory) : false
  const authoredSequenceComplete = lockerFlow.authoredSequence.every((memoryId) => completed.has(memoryId))

  useEffect(() => {
    if (selectedMemory) closeRef.current?.focus()
  }, [selectedMemory, selectedMemoryComplete])

  useEffect(() => {
    if (!selectedMemory) watchLinkRef.current?.focus()
  }, [selectedMemory])

  const inspect = (memoryId: LockerMemoryId) => {
    if (!isLockerMemoryAvailable(state, memoryId)) return
    onSelectedMemoryChange(memoryId)
    if (!isQuestion(memoryId)) dispatch({ type: 'INSPECT_LOCKER_MEMORY', memoryId })
  }

  return (
    <aside className="locker-hud" aria-label="Captain's locker memories">
      <header className="locker-header">
        <div>
          <p className="eyebrow">Captain's locker</p>
          <h1>Before the captain's seat</h1>
        </div>
        <div className="locker-count" aria-label={`${state.lockerCompleted.length} of ${lockerFlow.memoryIds.length} memories found`}>
          <span>Memories found</span>
          <strong>{state.lockerCompleted.length}/{lockerFlow.memoryIds.length}</strong>
        </div>
      </header>

      <div id="locker-watch-instruction" className="status locker-status" aria-live="polite" aria-atomic="true">{state.statusMessage}</div>

      {watchAvailable && (
        <button
          ref={watchLinkRef}
          type="button"
          className="locker-watch-link"
          aria-describedby="locker-watch-instruction"
          onClick={() => inspect('watch')}
        >
          {completed.has('watch') ? 'Review watch' : 'Inspect watch'}
        </button>
      )}

      {trayMemories.length > 0 && (
        <nav className={`locker-memory-tray${trayMemories.length === 1 ? ' locker-memory-tray--single' : ''}`} aria-label="Locker memories">
          {trayMemories.map((memoryId) => (
            <button
              key={memoryId}
              type="button"
              className={`locker-memory-button${completed.has(memoryId) ? ' is-complete' : ''}${selectedMemory === memoryId ? ' is-selected' : ''}`}
              aria-pressed={selectedMemory === memoryId}
              onClick={() => inspect(memoryId)}
            >
              <span>{lockerFlow.memories[memoryId].label}</span>
              <strong>{completed.has(memoryId) ? 'Remembered' : isQuestion(memoryId) ? 'Answer' : 'Inspect'}</strong>
            </button>
          ))}
        </nav>
      )}

      {authoredSequenceComplete && !state.lockerHatRevealed && (
        <p className="locker-next-memory" role="status" aria-live="polite">{lockerFlow.firstMemoryCompleteText}</p>
      )}

      <div className="locker-actions">
        <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'USE_LOCKER_HINT', memoryId: selectedMemory && isQuestion(selectedMemory) ? selectedMemory : undefined })}>
          Request a hint
        </button>
        <button type="button" className="text-button" onClick={onRestart}>Restart</button>
      </div>

      {selectedMemory && isLockerMemoryAvailable(state, selectedMemory) && (
        <section className="locker-story-card" role="dialog" aria-modal="false" aria-labelledby="locker-story-title">
          <button ref={closeRef} type="button" className="locker-story-close" aria-label="Close memory" onClick={() => onSelectedMemoryChange(null)}>×</button>
          <p className="eyebrow">{lockerFlow.memories[selectedMemory].eyebrow}</p>
          <h2 id="locker-story-title">{lockerFlow.memories[selectedMemory].label}</h2>
          <p>{lockerFlow.memories[selectedMemory].story}</p>
          {isQuestion(selectedMemory) && !completed.has(selectedMemory) ? (
            selectedMemory === 'watch' ? (
              <fieldset className="locker-choice-fieldset">
                <legend>{lockerFlow.memories.watch.question}</legend>
                <div className="locker-choice-grid">
                  {lockerFlow.memories.watch.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="locker-choice-button"
                      onClick={() => dispatch({ type: 'SUBMIT_LOCKER_ANSWER', memoryId: 'watch', response: choice })}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <form onSubmit={(event) => {
                event.preventDefault()
                dispatch({ type: 'SUBMIT_LOCKER_ANSWER', memoryId: selectedMemory, response: answers[selectedMemory] })
              }}>
                <label>
                  <span>{lockerFlow.memories[selectedMemory].question}</span>
                  <input
                    value={answers[selectedMemory]}
                    onChange={(event) => setAnswers((current) => ({ ...current, [selectedMemory]: event.target.value }))}
                    aria-label={`${lockerFlow.memories[selectedMemory].label} answer`}
                    autoComplete="off"
                  />
                </label>
                <button type="submit" className="primary-button">Confirm memory</button>
              </form>
            )
          ) : (
            <p className="locker-story-complete">{completed.has(selectedMemory) ? lockerFlow.memories[selectedMemory].feedback : 'Inspect this memory to continue.'}</p>
          )}
        </section>
      )}

      <div className={`locker-hat-callout${state.lockerHatRevealed ? ' is-revealed' : ''}`}>
        <span>{state.lockerHatRevealed ? lockerFlow.hatText.revealText : lockerFlow.hatText.hiddenText}</span>
        <button
          type="button"
          className="primary-button"
          disabled={!state.lockerHatRevealed || state.captainModeUnlocked}
          onClick={() => dispatch({ type: 'CLAIM_CAPTAIN_HAT' })}
        >
          {state.captainModeUnlocked ? 'Captain’s hat claimed' : 'Claim the captain’s hat'}
        </button>
      </div>

      {state.captainModeUnlocked && (
        <section className="locker-promotion" role="dialog" aria-modal="true" aria-labelledby="locker-promotion-title">
          <p className="eyebrow">{lockerFlow.hatText.promotionText}</p>
          <h2 id="locker-promotion-title">{lockerFlow.hatText.captainModeText}</h2>
          <p>The memories are logged. The captain's seat is ready.</p>
          <button type="button" className="primary-button" autoFocus onClick={() => dispatch({ type: 'CONTINUE_TO_CAPTAIN' })}>
            Enter Pop T Captain Mode
          </button>
        </section>
      )}
    </aside>
  )
}
