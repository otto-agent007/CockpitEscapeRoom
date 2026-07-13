import { useEffect, useRef, useState, type FormEvent } from 'react'
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
  const closeRef = useRef<HTMLButtonElement>(null)
  const watchLinkRef = useRef<HTMLButtonElement>(null)
  const [textResponse, setTextResponse] = useState('')
  const completed = new Set(state.lockerCompleted)
  const visibleMemories = lockerFlow.memoryIds.filter((memoryId) => isLockerMemoryAvailable(state, memoryId))
  const trayMemories = visibleMemories.filter((memoryId) => memoryId !== 'watch')
  const watchAvailable = visibleMemories.includes('watch')
  const selectedMemoryComplete = selectedMemory ? completed.has(selectedMemory) : false
  const selectedMemoryConfig = selectedMemory ? lockerFlow.memories[selectedMemory] : null

  useEffect(() => {
    if (selectedMemory) closeRef.current?.focus()
  }, [selectedMemory, selectedMemoryComplete])

  useEffect(() => {
    if (!selectedMemory) watchLinkRef.current?.focus()
  }, [selectedMemory])

  const inspect = (memoryId: LockerMemoryId) => {
    if (!isLockerMemoryAvailable(state, memoryId)) return
    setTextResponse('')
    onSelectedMemoryChange(memoryId)
  }

  const closeMemory = () => {
    setTextResponse('')
    onSelectedMemoryChange(null)
  }

  const submitTextAnswer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMemory || !isQuestion(selectedMemory) || !textResponse.trim()) return
    dispatch({ type: 'SUBMIT_LOCKER_ANSWER', memoryId: selectedMemory, response: textResponse })
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

      <div className="locker-actions">
        <button type="button" className="secondary-button" onClick={() => dispatch({ type: 'USE_LOCKER_HINT', memoryId: selectedMemory && isQuestion(selectedMemory) ? selectedMemory : undefined })}>
          Request a hint
        </button>
        <button type="button" className="text-button" onClick={onRestart}>Restart</button>
      </div>

      {selectedMemory && selectedMemoryConfig && isLockerMemoryAvailable(state, selectedMemory) && (
        <section className={`locker-story-card${selectedMemory === 'wings' ? ' locker-story-card--wings' : ''}`} role="dialog" aria-modal="false" aria-labelledby="locker-story-title">
          <button ref={closeRef} type="button" className="locker-story-close" aria-label="Close memory" onClick={closeMemory}>×</button>
          <p className="eyebrow">{selectedMemoryConfig.eyebrow}</p>
          <h2 id="locker-story-title">{selectedMemoryConfig.storyTitle}</h2>
          <p>{selectedMemoryConfig.story}</p>
          {isQuestion(selectedMemory) && !completed.has(selectedMemory) ? (
            selectedMemoryConfig.answerMode === 'choice' ? (
              <fieldset className="locker-choice-fieldset">
                <legend className="locker-question-block">
                  <strong>{selectedMemoryConfig.question}</strong>
                </legend>
                <div className="locker-choice-grid">
                  {selectedMemoryConfig.choices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      className="locker-choice-button"
                      onClick={() => dispatch({ type: 'SUBMIT_LOCKER_ANSWER', memoryId: selectedMemory, response: choice })}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </fieldset>
            ) : (
              <form className="locker-answer-form" onSubmit={submitTextAnswer}>
                <fieldset className="locker-choice-fieldset">
                  <legend className="locker-question-block"><strong>{selectedMemoryConfig.question}</strong></legend>
                  <label htmlFor="locker-text-answer">{selectedMemoryConfig.inputLabel}</label>
                  <input
                    id="locker-text-answer"
                    name="locker-text-answer"
                    type="text"
                    autoComplete="off"
                    value={textResponse}
                    onChange={(event) => setTextResponse(event.target.value)}
                  />
                  <button type="submit" className="primary-button" disabled={!textResponse.trim()}>Submit answer</button>
                </fieldset>
              </form>
            )
          ) : isQuestion(selectedMemory) ? (
            <p className="locker-story-complete">{selectedMemoryConfig.feedback}</p>
          ) : null}
        </section>
      )}

    </aside>
  )
}
