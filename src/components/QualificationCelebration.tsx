import { useEffect, useRef, useState, type ReactNode } from 'react'

const CAPTAIN_CELEBRATION_REVEAL_DELAY_MS = 850

interface MilestoneCelebrationProps {
  eyebrow: string
  title: string
  body: string
  actionLabel: string
  reducedMotion: boolean
  onContinue: () => void
  visual: ReactNode
  fadeToBlack?: boolean
  variant?: 'qualification' | 'captain'
}

function MilestoneCelebration({
  eyebrow,
  title,
  body,
  actionLabel,
  reducedMotion,
  onContinue,
  visual,
  fadeToBlack = false,
  variant = 'qualification',
}: MilestoneCelebrationProps) {
  const continueRef = useRef<HTMLButtonElement>(null)
  const [revealed, setRevealed] = useState(!fadeToBlack || reducedMotion)

  useEffect(() => {
    if (revealed) {
      continueRef.current?.focus()
      return
    }
    const timeout = window.setTimeout(() => setRevealed(true), CAPTAIN_CELEBRATION_REVEAL_DELAY_MS)
    return () => window.clearTimeout(timeout)
  }, [revealed])

  const variantClass = variant === 'captain' ? ' qualification-celebration--captain' : ''
  const fadeClass = fadeToBlack ? ' qualification-celebration--fade-to-black' : ''

  return (
    <div
      className={`qualification-celebration${variantClass}${fadeClass}${revealed ? ' is-revealed' : ''}`}
      data-celebration-ready={revealed}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qualification-title"
      onKeyDown={(event) => {
        if (event.key !== 'Tab' || !revealed) return
        event.preventDefault()
        continueRef.current?.focus()
      }}
    >
      {!reducedMotion && revealed && (
        <div className="qualification-confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
        </div>
      )}
      <div className="qualification-card">
        {visual}
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="qualification-title">{title}</h2>
        <p>{body}</p>
        <button ref={continueRef} type="button" className="primary-button primary-button--large" disabled={!revealed} onClick={onContinue}>
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export function QualificationCelebration({ reducedMotion, onContinue }: { reducedMotion: boolean; onContinue: () => void }) {
  return (
    <MilestoneCelebration
      eyebrow="Crew qualification complete"
      title="Airline Transport Pilot milestone recognized"
      body="First-Officer knowledge logged."
      actionLabel="Continue"
      reducedMotion={reducedMotion}
      onContinue={onContinue}
      visual={<div className="qualification-emblem" aria-hidden="true">✓</div>}
    />
  )
}

export function CaptainHatCelebration({ reducedMotion, onContinue }: { reducedMotion: boolean; onContinue: () => void }) {
  return (
    <MilestoneCelebration
      eyebrow="Captain’s locker complete"
      title="Captain’s locker complete"
      body="The memories are logged and the captain’s hat is recognized. The existing Airbus crew experience is ready."
      actionLabel="Continue to Airbus First-Officer Mode"
      reducedMotion={reducedMotion}
      onContinue={onContinue}
      visual={<img className="qualification-hat" src={`${import.meta.env.BASE_URL}images/captains-hat-celebration.png`} alt="Captain’s hat" />}
      fadeToBlack
      variant="captain"
    />
  )
}
