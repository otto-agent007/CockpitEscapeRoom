import { dc9LegacyFlow } from '../../game/config'
import type { Dc9ChapterProgress, GameAction } from '../../game/state'

interface LegacyRouteRecordProps {
  progress: Dc9ChapterProgress
  dispatch: React.Dispatch<GameAction>
  onClose: () => void
}

export function LegacyRouteRecord({ progress, dispatch, onClose }: LegacyRouteRecordProps) {
  const selected = new Set(progress.routeSelections)
  const stamped = new Set(progress.routeCompleted)
  const finalSupport = progress.routeAttempts >= 3
  const hint = progress.routeAttempts === 1
    ? dc9LegacyFlow.routeHints[0]
    : progress.routeAttempts >= 2
      ? dc9LegacyFlow.routeHints[1]
      : null

  return (
    <section
      className="dc9-document dc9-route-record"
      role="dialog"
      aria-modal="false"
      aria-labelledby="legacy-route-record-title"
    >
      <header className="dc9-document__header">
        <div>
          <p className="eyebrow">Representative career routes</p>
          <h2 id="legacy-route-record-title">Legacy Route Record</h2>
        </div>
        <button type="button" className="dc9-document__close" onClick={onClose} aria-label="Close Legacy Route Record">×</button>
      </header>

      <p className="dc9-document__question">{dc9LegacyFlow.routeQuestion}</p>
      <p className="dc9-document__note">Choose familiar stops from Pop T’s DC-9 years.</p>

      <div className="dc9-route-grid" aria-label="Legacy route choices">
        {dc9LegacyFlow.routePuzzleOptions.map((route) => {
          const isStamped = stamped.has(route.code)
          const isSelected = selected.has(route.code)
          const highlighted = finalSupport && dc9LegacyFlow.routeFinalHintCodes.includes(route.code as 'DTW' | 'MSP' | 'STL')
          return (
            <button
              key={route.code}
              type="button"
              className={`dc9-route-choice${isSelected ? ' is-selected' : ''}${isStamped ? ' is-stamped' : ''}${highlighted ? ' is-final-hint' : ''}`}
              aria-pressed={isSelected}
              aria-label={`${route.code}, ${route.city}${isStamped ? ', permanently stamped' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_DC9_ROUTE', code: route.code })}
            >
              <strong>{route.code}</strong>
              <span>{route.city}</span>
              {isStamped ? <small>Ink stamp permanent</small> : <small>{isSelected ? 'Selected' : 'Open entry'}</small>}
            </button>
          )
        })}
      </div>

      <div className="dc9-document__feedback" aria-live="polite" aria-atomic="true">
        {hint ? <p>{hint}</p> : <p>Three selections complete one route-record entry.</p>}
        {finalSupport ? <span className="sr-only">Final support highlights DTW, MSP, and STL.</span> : null}
      </div>

      <button
        type="button"
        className="primary-button dc9-document__primary"
        disabled={progress.routeSelections.length !== dc9LegacyFlow.routePuzzleAnswers.length}
        onClick={() => dispatch({ type: 'SUBMIT_DC9_ROUTES' })}
      >
        Record selected routes
      </button>
    </section>
  )
}
