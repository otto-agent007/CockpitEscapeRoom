import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { gameCopy } from '../game/config'
import { REWARD_CLIP_DURATION_MS, rewardFrameAt } from '../game/rewardSequence'
import { RewardScene, type RewardLoadState } from '../scenes/RewardScene'

interface RewardExperienceProps {
  reducedMotion: boolean
  forceAccessible: boolean
  onRestart: () => void
}

const initialLoadState: RewardLoadState = { status: 'loading', loadedBytes: 0 }

export function RewardExperience({
  reducedMotion,
  forceAccessible,
  onRestart,
}: RewardExperienceProps) {
  const [loadState, setLoadState] = useState<RewardLoadState>(
    forceAccessible ? { status: 'accessible-fallback', loadedBytes: 0 } : initialLoadState,
  )
  const [elapsedMs, setElapsedMs] = useState(0)
  const [skipped, setSkipped] = useState(forceAccessible)
  const [retryToken, setRetryToken] = useState(0)
  const [replayRevision, setReplayRevision] = useState(0)
  const startAtRef = useRef<number | null>(null)
  const ready = loadState.status === 'ready'
  const accessiblePresentation = forceAccessible
    || loadState.status === 'accessible-fallback'
    || loadState.status === 'error'
  const showAccessibleScene = forceAccessible || loadState.status === 'accessible-fallback'

  useEffect(() => {
    if (!ready || reducedMotion || skipped) return
    startAtRef.current = performance.now()
    let animationFrame = 0
    const tick = (now: number) => {
      const nextElapsed = Math.min(now - (startAtRef.current ?? now), REWARD_CLIP_DURATION_MS)
      setElapsedMs(nextElapsed)
      if (nextElapsed < REWARD_CLIP_DURATION_MS) animationFrame = requestAnimationFrame(tick)
    }
    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [ready, reducedMotion, replayRevision, skipped])

  const frame = useMemo(() => rewardFrameAt({
    elapsedMs,
    ready: ready || accessiblePresentation,
    reducedMotion,
    skipped: skipped || accessiblePresentation,
  }), [accessiblePresentation, elapsedMs, ready, reducedMotion, skipped])

  const replay = useCallback(() => {
    setElapsedMs(0)
    setSkipped(false)
    setReplayRevision((revision) => revision + 1)
  }, [])

  const retry = useCallback(() => {
    setElapsedMs(0)
    setSkipped(false)
    setLoadState(initialLoadState)
    setRetryToken((token) => token + 1)
  }, [])

  const loadedMb = (loadState.loadedBytes / 1_000_000).toFixed(1)
  const totalMb = loadState.totalBytes ? (loadState.totalBytes / 1_000_000).toFixed(1) : null
  const progress = loadState.totalBytes
    ? Math.min(100, Math.round((loadState.loadedBytes / loadState.totalBytes) * 100))
    : 0

  return (
    <section
      className={`reward-experience reward-experience--${frame.stage}`}
      data-reward-stage={frame.stage}
      aria-labelledby="reward-title"
    >
      {!showAccessibleScene && (
        <RewardScene
          clipTimeSeconds={frame.clipTimeSeconds}
          retryToken={retryToken}
          onLoadState={setLoadState}
        />
      )}
      {showAccessibleScene && (
        <div className="reward-scene reward-scene--accessible" aria-label="Accessible Model Y reward">
          <div className="reward-accessible-silhouette" aria-hidden="true" />
        </div>
      )}

      <div className="reward-overlay">
        <p className="eyebrow">CockpitEscapeRoom · Legacy Hangar</p>
        <h1 id="reward-title">{frame.title}</h1>
        <p className="reward-caption" role="status" aria-live="polite" aria-atomic="true">
          {reducedMotion && frame.stage === 'complete'
            ? 'Reduced motion is on. Flight Mode is shown in its completed pose. '
            : ''}
          {frame.caption}
        </p>
        {frame.stage === 'complete' && (
          <div className="reward-release-summary">
            <strong>{gameCopy.rewardTitle}</strong>
            <span>{gameCopy.rewardVehicleLine}</span>
          </div>
        )}

        {loadState.status === 'loading' && !forceAccessible && (
          <div className="reward-loader" aria-label="Model Y reward loading progress">
            <div><span>Preparing the Model Y reward</span><strong>{progress ? `${progress}%` : `${loadedMb} MB`}</strong></div>
            <progress max={100} value={progress} />
            <small>{totalMb ? `${loadedMb} of ${totalMb} MB downloaded` : `${loadedMb} MB downloaded`}</small>
          </div>
        )}

        {loadState.status === 'error' && (
          <div className="reward-load-error" role="alert">
            <strong>The 3D hangar could not be opened.</strong>
            <span>{loadState.message} Your completed journey is safe.</span>
            <div>
              <button type="button" className="primary-button" onClick={retry}>Retry 3D</button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setLoadState({
                  status: 'accessible-fallback',
                  loadedBytes: loadState.loadedBytes,
                  totalBytes: loadState.totalBytes,
                })}
              >
                Continue with accessible reward
              </button>
            </div>
          </div>
        )}

        {frame.stage === 'complete' && (
          <blockquote className="reward-tribute">{gameCopy.finalMessage}</blockquote>
        )}

        <div className="reward-actions">
          {ready && frame.stage !== 'complete' && (
            <button type="button" className="secondary-button" onClick={() => setSkipped(true)}>
              Skip cinematic
            </button>
          )}
          {frame.stage === 'complete' && ready && (
            <button type="button" className="primary-button" onClick={replay}>
              Replay Flight Mode
            </button>
          )}
          <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
        </div>
      </div>
    </section>
  )
}
