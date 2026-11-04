import { useCallback, useEffect, useRef, useState } from 'react'

import { gameCopy } from '../game/config'
import { rewardCopy } from '../game/rewardCopy'

interface RewardExperienceProps {
  initialComplete?: boolean
  onReplay?: () => void
  onRestart: () => void
  onComplete?: () => void
}

const filmUrl = `${import.meta.env.BASE_URL}media/tesla-flight-mode-final.mp4`

export function RewardExperience({
  initialComplete = false,
  onReplay,
  onRestart,
  onComplete,
}: RewardExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playbackGeneration = useRef(0)
  const [stage, setStage] = useState<'film' | 'complete'>(initialComplete ? 'complete' : 'film')
  const [loadFailed, setLoadFailed] = useState(false)
  const [manualPlayNeeded, setManualPlayNeeded] = useState(false)
  const [filmMuted, setFilmMuted] = useState(false)

  useEffect(() => {
    if (videoRef.current) videoRef.current.src = filmUrl
  }, [])

  useEffect(() => {
    if (stage === 'complete') onComplete?.()
  }, [stage, onComplete])

  const startFilm = useCallback(async (allowMutedAutoplay: boolean) => {
    const video = videoRef.current
    if (!video) return
    const generation = ++playbackGeneration.current
    const current = () => generation === playbackGeneration.current && videoRef.current === video
    try {
      await video.play()
    } catch (error) {
      if (!current()) return
      if (allowMutedAutoplay && !video.error && !video.muted && error instanceof DOMException && error.name === 'NotAllowedError') {
        video.muted = true
        try {
          await video.play()
        } catch {
          if (current()) {
            setLoadFailed(Boolean(video.error))
            setManualPlayNeeded(!video.error)
          }
          return
        }
      } else {
        setLoadFailed(Boolean(video.error))
        setManualPlayNeeded(!video.error)
        return
      }
    }
    if (current()) {
      setManualPlayNeeded(false)
      setFilmMuted(video.muted)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (stage !== 'film' || !video) return
    if (video.paused) void startFilm(true)
    return () => {
      playbackGeneration.current += 1
      video.pause()
    }
  }, [stage, startFilm])

  const finishFilm = useCallback(() => {
    playbackGeneration.current += 1
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
    video.muted = false
    void startFilm(false)
  }, [startFilm])

  const replayFilm = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    onReplay?.()
    video.currentTime = 0
    setStage('film')
    void startFilm(true)
  }, [onReplay, startFilm])

  return (
    <section className={`reward-experience reward-experience--${stage}`} data-reward-stage={stage} aria-labelledby="reward-title">
      <div className={stage === 'film' ? 'reward-cinema' : 'reward-film-layout'}>
        <header className="reward-film-intro">
          <p className="eyebrow">Upgraded Transport</p>
          <h1 id="reward-title">{stage === 'film' ? 'Model FLY' : 'Ground Transport Upgrade Authorized'}</h1>
          {stage === 'film' && <p>Model FLY is here. Watch the full journey.</p>}
        </header>

        <video
          ref={videoRef}
          className="reward-film-video"
          controls
          autoPlay={stage === 'film'}
          playsInline
          preload="auto"
          hidden={stage === 'complete'}
          aria-label="Model FLY film"
          onPlay={() => setManualPlayNeeded(false)}
          onVolumeChange={(event) => setFilmMuted(event.currentTarget.muted)}
          onEnded={finishFilm}
          onError={() => setLoadFailed(true)}
          onLoadedMetadata={() => setLoadFailed(false)}
        />

        {stage === 'film' ? (
          <>
            <p className="reward-film-description">
              Model FLY transforms in the hangar, flies over the landscape,
              passes through clouds into sunrise, then cuts to black. The original music plays throughout.
            </p>
            {loadFailed && (
              <div className="reward-film-error" role="alert">
                <span>The film could not load. Your completed journey is safe.</span>
                <button type="button" className="secondary-button" onClick={() => {
                  setLoadFailed(false)
                  videoRef.current?.load()
                  void startFilm(true)
                }}>Retry film</button>
              </div>
            )}
            <div className="reward-actions">
              {manualPlayNeeded && !loadFailed && <button type="button" className="primary-button" onClick={playFilm}>Play film</button>}
              {filmMuted && !manualPlayNeeded && !loadFailed && <button type="button" className="primary-button" onClick={playFilm}>Turn film sound on</button>}
              <button type="button" className="secondary-button" onClick={() => finishFilm()}>Skip film and read tribute</button>
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
