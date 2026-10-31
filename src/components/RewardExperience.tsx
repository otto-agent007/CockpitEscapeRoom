import { useCallback, useEffect, useRef, useState } from 'react'

import { gameCopy } from '../game/config'
import { rewardCopy } from '../game/rewardCopy'

interface RewardExperienceProps {
  reducedMotion: boolean
  forceAccessible: boolean
  initialComplete?: boolean
  onReplay?: () => void
  onRestart: () => void
  onComplete?: () => void
}

const filmUrl = `${import.meta.env.BASE_URL}media/tesla-flight-mode-final.mp4`

export function RewardExperience({
  reducedMotion,
  forceAccessible,
  initialComplete = false,
  onReplay,
  onRestart,
  onComplete,
}: RewardExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stage, setStage] = useState<'film' | 'complete'>(initialComplete ? 'complete' : 'film')
  const [loadFailed, setLoadFailed] = useState(false)
  const [manualPlayNeeded, setManualPlayNeeded] = useState(reducedMotion || forceAccessible)

  useEffect(() => {
    if (videoRef.current) videoRef.current.src = filmUrl
  }, [])

  useEffect(() => {
    if (stage === 'complete') onComplete?.()
  }, [stage, onComplete])

  useEffect(() => {
    if (stage !== 'film' || reducedMotion || forceAccessible) return
    const video = videoRef.current
    if (!video) return
    let mounted = true
    void video.play().catch(() => {
      if (!mounted) return
      if (video.error) setLoadFailed(true)
      else setManualPlayNeeded(true)
    })
    return () => { mounted = false }
  }, [forceAccessible, reducedMotion, stage])

  const finishFilm = useCallback(() => {
    videoRef.current?.pause()
    setStage('complete')
  }, [])

  const playFilm = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.error) {
      setLoadFailed(true)
      return
    }
    void video.play().then(() => setManualPlayNeeded(false)).catch(() => {
      if (video.error) setLoadFailed(true)
      else setManualPlayNeeded(true)
    })
  }, [])

  const replayFilm = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    onReplay?.()
    video.currentTime = 0
    setStage('film')
    playFilm()
  }, [onReplay, playFilm])

  return (
    <section className={`reward-experience reward-experience--${stage}`} data-reward-stage={stage} aria-labelledby="reward-title">
      <div className={stage === 'film' ? 'reward-cinema' : 'reward-film-layout'}>
        <header className="reward-film-intro">
          <p className="eyebrow">CockpitEscapeRoom · Final film</p>
          <h1 id="reward-title">{stage === 'film' ? 'Flight Mode' : 'Ground Transport Upgrade Authorized'}</h1>
          {stage === 'film' && <p>The Future Tesla is here. Watch the full journey.</p>}
        </header>

        <video
          ref={videoRef}
          className="reward-film-video"
          controls
          autoPlay={stage === 'film' && !reducedMotion && !forceAccessible}
          playsInline
          preload="auto"
          hidden={stage === 'complete'}
          aria-label="Tesla Flight Mode film"
          onPlay={() => setManualPlayNeeded(false)}
          onEnded={finishFilm}
          onError={() => setLoadFailed(true)}
          onLoadedMetadata={() => setLoadFailed(false)}
        />

        {stage === 'film' ? (
          <>
            <p className="reward-film-description">
              The Future Tesla transforms in the hangar, flies over the landscape,
              passes through clouds into sunrise, then cuts to black. The original music plays throughout.
            </p>
            {loadFailed && (
              <div className="reward-film-error" role="alert">
                <span>The film could not load. Your completed journey is safe.</span>
                <button type="button" className="secondary-button" onClick={() => {
                  setLoadFailed(false)
                  videoRef.current?.load()
                  setManualPlayNeeded(true)
                }}>Retry film</button>
              </div>
            )}
            {reducedMotion && <p className="reward-film-motion-note">Reduced motion is on. The film will play only when you choose Play.</p>}
            <div className="reward-actions">
              {manualPlayNeeded && !loadFailed && <button type="button" className="primary-button" onClick={playFilm}>Play film</button>}
              <button type="button" className="secondary-button" onClick={finishFilm}>Skip film and read tribute</button>
              <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
            </div>
          </>
        ) : (
          <div className="reward-finale">
            <div className="reward-release-summary">
              <strong>{gameCopy.rewardTitle}</strong>
              <span>{rewardCopy.vehicleLine}</span>
            </div>
            <blockquote className="reward-tribute">{gameCopy.finalMessage}</blockquote>
            <div className="reward-actions">
              <button type="button" className="primary-button" onClick={replayFilm}>Replay film</button>
              <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
