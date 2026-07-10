import { useEffect, useRef } from 'react'

export function QualificationCelebration({
  reducedMotion,
  onContinue,
}: {
  reducedMotion: boolean
  onContinue: () => void
}) {
  const continueRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    continueRef.current?.focus()
  }, [])

  return (
    <div
      className="qualification-celebration"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qualification-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return
        event.preventDefault()
        continueRef.current?.focus()
      }}
    >
      {!reducedMotion && (
        <div className="qualification-confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
        </div>
      )}
      <div className="qualification-card">
        <div className="qualification-emblem" aria-hidden="true">✓</div>
        <p className="eyebrow">Crew qualification complete</p>
        <h2 id="qualification-title">Airline Transport Pilot milestone recognized</h2>
        <p>First-Officer knowledge logged.</p>
        <button ref={continueRef} type="button" className="primary-button primary-button--large" onClick={onContinue}>
          Continue
        </button>
      </div>
    </div>
  )
}
