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
        <div className="game-entry__copy">
          <h1 aria-label="The Captain’s Key"><span>The</span><span>Captain’s</span><span>Key</span></h1>
          <p className="game-entry__dedication">For Pop T, from your crew.</p>
          <button
            ref={beginRef}
            type="button"
            className="game-entry__begin"
            disabled={!ready}
            onClick={onBegin}
            aria-describedby="game-entry-sound"
          >
            <span aria-hidden="true">▶</span>
            Click to begin
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
              <button type="button" className="game-entry__retry" onClick={onRetry}>Retry cinematic assets</button>
            </div>
          )}
        </div>
        <div className="game-entry__art">
          <img
            src={`${import.meta.env.BASE_URL}images/captains-key-arcade.webp`}
            alt="A DC-9 in a hangar through a glowing keyhole"
            width={1024}
            height={1024}
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  )
}
