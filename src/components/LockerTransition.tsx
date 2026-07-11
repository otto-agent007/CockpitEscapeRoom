import { useEffect, useRef } from 'react'

export type LockerIntroStage =
  | 'idle'
  | 'arming'
  | 'fade-to-black'
  | 'black-pause'
  | 'title-in'
  | 'title-hold'
  | 'title-out'
  | 'waiting-for-locker'
  | 'reveal-locker'
  | 'wide-hold'
  | 'focus-watch'

export function LockerTransition({
  stage,
  text,
  reducedMotion,
  onSkip,
}: {
  stage: Exclude<LockerIntroStage, 'idle'>
  text: string
  reducedMotion: boolean
  onSkip: () => void
}) {
  const skipRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    skipRef.current?.focus()
  }, [])

  return (
    <section
      className={`locker-transition locker-transition--${stage}${reducedMotion ? ' locker-transition--reduced-motion' : ''}`}
      data-locker-intro-stage={stage}
      role="dialog"
      aria-modal="true"
      aria-labelledby="locker-transition-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        event.preventDefault()
        skipRef.current?.focus()
      }}
    >
      <div className="locker-transition__vignette" aria-hidden="true" />
      <p id="locker-transition-title" className="locker-transition__title">
        {text}
      </p>
      {stage === 'waiting-for-locker' && (
        <p className="locker-transition__loading" role="status">Preparing the captain’s locker…</p>
      )}
      <button ref={skipRef} type="button" className="locker-transition__skip" onClick={onSkip}>
        Skip cinematic
      </button>
    </section>
  )
}
