import { dc9LegacyFlow } from '../../game/config'
import type { Dc9ChapterProgress, GameAction } from '../../game/state'

interface HomeOperationsLogProps {
  progress: Dc9ChapterProgress
  dispatch: React.Dispatch<GameAction>
}

export function HomeOperationsLog({ progress, dispatch }: HomeOperationsLogProps) {
  const finalPage = dc9LegacyFlow.homeOperationsPages.length - 1
  const pageText = dc9LegacyFlow.homeOperationsPages[progress.homePage] ?? dc9LegacyFlow.homeOperationsPages[0]

  return (
    <section
      className="dc9-document dc9-home-log"
      role="dialog"
      aria-modal="false"
      aria-labelledby="home-operations-log-title"
    >
      <header className="dc9-document__header">
        <div>
          <p className="eyebrow">A completed companion record</p>
          <h2 id="home-operations-log-title">Home Operations Log — Momma Cheryl</h2>
        </div>
        <span className="dc9-home-log__folio" aria-label={`Page ${progress.homePage + 1} of ${finalPage + 1}`}>
          {progress.homePage + 1}/{finalPage + 1}
        </span>
      </header>

      <div className="dc9-home-log__page" aria-live="polite">
        <p>{pageText}</p>
      </div>

      <p className="dc9-document__note">This legacy record is already complete. Read it at your own pace; there are no questions or scored answers.</p>

      <div className="dc9-document__navigation">
        <button
          type="button"
          className="secondary-button"
          disabled={progress.homePage === 0}
          onClick={() => dispatch({ type: 'SET_HOME_OPERATIONS_PAGE', page: progress.homePage - 1 })}
        >
          Previous page
        </button>
        {progress.homePage < finalPage ? (
          <button
            type="button"
            className="primary-button"
            onClick={() => dispatch({ type: 'SET_HOME_OPERATIONS_PAGE', page: progress.homePage + 1 })}
          >
            Next page
          </button>
        ) : (
          <button type="button" className="primary-button" onClick={() => dispatch({ type: 'COMPLETE_HOME_OPERATIONS' })}>
            Record this legacy
          </button>
        )}
      </div>
    </section>
  )
}
