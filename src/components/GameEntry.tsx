import { useEffect, useRef } from 'react'
import type { IntroAssetLoadState } from '../game/introAssets'

interface GameEntryProps {
  loadState: IntroAssetLoadState
  onBegin: () => void
  onRetry: () => void
}

export function GameEntry({ loadState, onBegin, onRetry }: GameEntryProps) {
  const beginRef = useRef<HTMLButtonElement>(null)
  const ready = loadState.status === 'ready'

  useEffect(() => {
    if (ready && document.activeElement === document.body) beginRef.current?.focus()
  }, [ready])

  return (
    <section className="game-entry" aria-label="Game entry" aria-busy={loadState.status === 'loading'}>
      <div className="game-entry__content">
        <p className="game-entry__eyebrow">Welcome aboard</p>
        <img
          className="game-entry__emblem"
          src={`${import.meta.env.BASE_URL}images/captains-key-emblem.webp`}
          alt="Golden key with pilot wings"
          width={640}
          height={640}
          fetchPriority="high"
        />
        <h1>The Captain’s Key</h1>
        <p className="game-entry__dedication">For Pop T, from your crew.</p>
        <button
          ref={beginRef}
          type="button"
          className="game-entry__begin"
          disabled={!ready}
          onClick={onBegin}
          aria-describedby="game-entry-sound"
        >
          Click to begin
          <span aria-hidden="true">▶</span>
        </button>
        <p id="game-entry-sound" className="game-entry__sound">Your flight begins with sound.</p>
        {loadState.status === 'loading' && (
          <p className="game-entry__status" role="status">Preparing your flight…</p>
        )}
        {loadState.status === 'error' && (
          <div className="game-entry__error">
            <p role="alert">
              Cinematic art failed: {loadState.failure.assetId} ({loadState.failure.assetPath}).
            </p>
            <button type="button" className="secondary-button" onClick={onRetry}>Retry cinematic assets</button>
          </div>
        )}
      </div>
    </section>
  )
}
