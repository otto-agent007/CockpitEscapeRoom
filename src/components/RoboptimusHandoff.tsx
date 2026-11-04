import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { OPTIMUS_GREETING_TEXT, ROBOPTIMUS_CAPTION_MS, ROBOPTIMUS_DOOR_DANCE_MS, ROBOPTIMUS_FADE_MS, ROBOPTIMUS_WAITING_FILE, ROBOPTIMUS_WALK_MS, type RoboptimusStage } from '../game/optimusGreeting'
import { OptimusNarrationAside } from './OptimusNarration'

const OptimusGuideScene = lazy(() => import('../scenes/OptimusGuideScene'))

class GuideSceneBoundary extends Component<{ children: ReactNode; onUnavailable: (available: boolean) => void }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch() { this.props.onUnavailable(false) }

  render() {
    return this.state.failed
      ? <img className="optimus-guide-fallback" src={`${import.meta.env.BASE_URL}${ROBOPTIMUS_WAITING_FILE}`} alt="" />
      : this.props.children
  }
}

export function RoboptimusHandoff({ reducedMotion, forceAccessible, debrief, onContinue, onPrepareReward }: {
  reducedMotion: boolean
  forceAccessible: boolean
  debrief: string
  onContinue: () => void
  onPrepareReward?: () => void
}) {
  const [beat, setBeat] = useState<{ stage: RoboptimusStage; startedAt: number }>({ stage: 'greeting', startedAt: 0 })
  const stage = beat.stage
  const [ready, setReady] = useState(forceAccessible)
  const [playing, setPlaying] = useState(false)
  const [replayRevision, setReplayRevision] = useState(0)
  const continueRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const walkedRef = useRef(false)
  const sceneAvailable = useRef(false)
  const sceneReady = useCallback((available: boolean) => {
    sceneAvailable.current = available
    setReady(true)
  }, [])
  const beginWalk = useCallback(() => {
    if (walkedRef.current) return
    walkedRef.current = true
    if (reducedMotion || forceAccessible || !sceneAvailable.current) onContinue()
    else {
      onPrepareReward?.()
      setBeat({ stage: 'walking', startedAt: performance.now() })
    }
  }, [forceAccessible, onContinue, onPrepareReward, reducedMotion])

  useEffect(() => { continueRef.current?.focus() }, [])
  useEffect(() => {
    if (stage !== 'greeting' || !ready || playing) return
    const timeout = window.setTimeout(beginWalk, ROBOPTIMUS_CAPTION_MS)
    return () => window.clearTimeout(timeout)
  }, [stage, ready, playing, replayRevision, beginWalk])
  useEffect(() => {
    if (stage === 'greeting') return
    const duration = stage === 'walking' ? ROBOPTIMUS_WALK_MS : stage === 'dancing' ? ROBOPTIMUS_DOOR_DANCE_MS : ROBOPTIMUS_FADE_MS
    const timeout = window.setTimeout(() => {
      if (stage === 'fading') onContinue()
      else setBeat({ stage: stage === 'walking' ? 'dancing' : 'fading', startedAt: performance.now() })
    }, duration)
    return () => window.clearTimeout(timeout)
  }, [stage, onContinue])

  return (
    <div
      ref={dialogRef}
      className={`roboptimus-handoff roboptimus-handoff--${stage}`}
      data-handoff-stage={stage}
      style={{ '--roboptimus-fade-duration': `${ROBOPTIMUS_FADE_MS}ms` } as CSSProperties}
      role="dialog" aria-modal="true" aria-labelledby="qualification-title"
      onKeyDown={event => {
        if (event.key !== 'Tab') return
        const stops = [...(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])]
        if (!stops.length) return
        event.preventDefault()
        const index = stops.indexOf(document.activeElement as HTMLButtonElement)
        stops[(index + (event.shiftKey ? -1 : 1) + stops.length) % stops.length]?.focus()
      }}
    >
      <div className="roboptimus-hangar-view" aria-hidden="true" data-guide-motion={stage === 'greeting' ? 'greeting' : stage === 'walking' ? 'walk' : 'dance'}>
        {forceAccessible ? (
          <img className="optimus-guide-fallback" src={`${import.meta.env.BASE_URL}${ROBOPTIMUS_WAITING_FILE}`} alt="" />
        ) : (
          <GuideSceneBoundary onUnavailable={sceneReady}>
            <Suspense fallback={<div className="roboptimus-scene-loading" />}>
              <OptimusGuideScene motion={stage === 'greeting' ? 'greeting' : stage === 'walking' ? 'walk' : 'dance'} beat={stage} beatStartedAt={beat.startedAt} hangar replayRevision={replayRevision} reducedMotion={reducedMotion} onReady={sceneReady} />
            </Suspense>
          </GuideSceneBoundary>
        )}
      </div>
      <header className="roboptimus-handoff-heading">
        <p className="eyebrow">Airbus A320 · Roboptimus</p>
        <h2 id="qualification-title">POP T CAPTAIN MODE COMPLETE</h2>
        <p>{debrief}</p>
      </header>
      <p className="sr-only">{stage === 'greeting' ? 'Roboptimus greets you outside the hangar.' : stage === 'walking' ? 'She walks to the closed hangar door.' : 'She dances as the hangar doors open onto darkness, then the film begins.'}</p>
      <div className="roboptimus-caption-panel">
        <div className="roboptimus-caption" aria-live="polite">
          <p className="eyebrow">Roboptimus</p>
          <p>{stage === 'greeting' ? OPTIMUS_GREETING_TEXT : 'Right this way, Captain.'}</p>
        </div>
        <div className="roboptimus-handoff-actions">
          <button ref={continueRef} type="button" className="primary-button" onClick={stage === 'greeting' ? beginWalk : onContinue}>
            {stage === 'greeting' ? 'Reveal reward' : 'Skip to film'}
          </button>
          {stage === 'greeting' && <OptimusNarrationAside autoPlay={ready} onPlaybackChange={setPlaying} onFinished={beginWalk} onReplay={() => setReplayRevision(revision => revision + 1)} />}
        </div>
      </div>
    </div>
  )
}
