import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { gameCopy } from '../game/config'
import { primedMediaElement } from '../game/mediaUnlock'
import { rewardCopy } from '../game/rewardCopy'
import { createFilmLandscapeController, type FilmOrientation, type NativeFullscreenVideo } from './filmLandscape'
import { SecretArcadeEntry } from './SecretArcadeEntry'

import './RewardFilm.css'

interface RewardExperienceProps {
  initialComplete?: boolean
  onReplay?: () => void
  onRestart: () => void
  onComplete?: () => void
  onOpenArcade?: () => void
}

const filmUrl = `${import.meta.env.BASE_URL}media/tesla-flight-mode-final.mp4`

export function RewardExperience({
  initialComplete = false,
  onReplay,
  onRestart,
  onComplete,
  onOpenArcade,
}: RewardExperienceProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoSlotRef = useRef<HTMLDivElement>(null)
  const cinemaRef = useRef<HTMLDivElement>(null)
  const landscapeRef = useRef<ReturnType<typeof createFilmLandscapeController> | null>(null)
  const playbackGeneration = useRef(0)
  const [stage, setStage] = useState<'film' | 'complete'>(initialComplete ? 'complete' : 'film')
  const [loadFailed, setLoadFailed] = useState(false)
  const [manualPlayNeeded, setManualPlayNeeded] = useState(false)
  const [filmMuted, setFilmMuted] = useState(false)
  const [landscapePending, setLandscapePending] = useState(false)
  const [rotateGuidance, setRotateGuidance] = useState(false)

  const releaseLandscape = useCallback(() => {
    landscapeRef.current?.dispose()
    landscapeRef.current = null
  }, [])

  useEffect(() => releaseLandscape, [releaseLandscape])

  const watchLandscape = useCallback(async () => {
    const target = cinemaRef.current
    const video = videoRef.current
    if (!target || !video) return
    const controller = landscapeRef.current ?? createFilmLandscapeController({
      target,
      video: video as HTMLVideoElement & NativeFullscreenVideo,
      document,
      orientation: screen.orientation as ScreenOrientation & FilmOrientation,
    })
    landscapeRef.current = controller
    setLandscapePending(true)
    const result = await controller.request()
    if (landscapeRef.current !== controller) return
    setLandscapePending(false)
    setRotateGuidance(result === 'rotate' || result === 'native')
  }, [])

  // Adopt the film element the player's earlier taps blessed for sound, so an iPhone
  // plays the music when the film starts on its own (see mediaUnlock).
  useLayoutEffect(() => {
    const slot = videoSlotRef.current
    if (!slot) return
    const video = primedMediaElement<HTMLVideoElement>('rewardFilm')
    video.className = 'reward-film-video'
    video.controls = true
    video.preload = 'auto'
    video.setAttribute('aria-label', 'Model FLY film')
    slot.appendChild(video)
    videoRef.current = video
    return () => {
      video.pause()
      video.remove()
      videoRef.current = null
    }
  }, [])

  useLayoutEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.autoplay = stage === 'film'
    video.hidden = stage === 'complete'
  }, [stage])

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
    releaseLandscape()
    setStage('complete')
  }, [releaseLandscape])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setManualPlayNeeded(false)
    const onVolumeChange = () => setFilmMuted(video.muted)
    const onError = () => setLoadFailed(true)
    const onLoadedMetadata = () => setLoadFailed(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('ended', finishFilm)
    video.addEventListener('error', onError)
    video.addEventListener('loadedmetadata', onLoadedMetadata)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener('ended', finishFilm)
      video.removeEventListener('error', onError)
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
    }
  }, [finishFilm])

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
    setLandscapePending(false)
    setRotateGuidance(false)
    setStage('film')
    void startFilm(true)
  }, [onReplay, startFilm])

  return (
    <section className={`reward-experience reward-experience--${stage}`} data-reward-stage={stage} aria-labelledby="reward-title">
      <div ref={cinemaRef} className={stage === 'film' ? 'reward-cinema' : 'reward-film-layout'}>
        <header className="reward-film-intro">
          <p className="eyebrow">Upgraded Transport</p>
          <h1 id="reward-title">{stage === 'film' ? 'Model FLY' : onOpenArcade
            ? <SecretArcadeEntry onOpen={onOpenArcade}>{gameCopy.rewardTitle}</SecretArcadeEntry>
            : 'Ground Transport Upgrade Authorized'}</h1>
          {stage === 'film' && <p>Model FLY is here. Watch the full journey.</p>}
        </header>

        {/* The film element itself is adopted into this slot (see the layout effect above). */}
        <div ref={videoSlotRef} className="reward-film-video-slot" />

        {stage === 'film' ? (
          <>
            <p className="reward-film-description">
              Model FLY transforms in the hangar, flies over the landscape,
              passes through clouds into sunrise, then cuts to black. The original music plays throughout.
            </p>
            <div className="reward-film-toolbar">
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
                <button type="button" className="secondary-button" disabled={landscapePending} aria-describedby="film-landscape-guidance" onClick={() => void watchLandscape()}>
                  {landscapePending ? 'Opening landscape…' : 'Watch landscape'}
                </button>
                <button type="button" className="secondary-button" aria-label="Skip film and read tribute" onClick={finishFilm}>Skip to tribute</button>
                <button type="button" className="text-button" onClick={onRestart}>Restart game</button>
              </div>
              <p id="film-landscape-guidance" className="reward-film-guidance" role="status">
                <span className="reward-film-guidance__portrait">{rotateGuidance ? 'Rotate your phone; turn off rotation lock if needed.' : 'Rotate your phone for a wider view.'}</span>
                <span className="reward-film-guidance__landscape">Landscape view.</span>
              </p>
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
