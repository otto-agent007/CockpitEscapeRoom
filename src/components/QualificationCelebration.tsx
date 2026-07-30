import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { EngineOutTrait } from '../game/airbusEngineOut'

const CAPTAIN_CELEBRATION_REVEAL_DELAY_MS = 850

interface MilestoneCelebrationProps {
  eyebrow: string
  title: string
  body: string
  actionLabel: string
  reducedMotion: boolean
  onContinue: () => void
  onDismiss?: () => void
  visual: ReactNode
  fadeToBlack?: boolean
  variant?: 'qualification' | 'captain' | 'key'
}

export function MilestoneCelebration({
  eyebrow,
  title,
  body,
  actionLabel,
  reducedMotion,
  onContinue,
  onDismiss,
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

  const variantClass = variant === 'captain'
    ? ' qualification-celebration--captain'
    : variant === 'key'
      ? ' qualification-celebration--key'
      : ''
  const fadeClass = fadeToBlack ? ' qualification-celebration--fade-to-black' : ''

  return (
    <div
      className={`qualification-celebration${variantClass}${fadeClass}${revealed ? ' is-revealed' : ''}`}
      data-celebration-ready={revealed}
      role="dialog"
      aria-modal="true"
      aria-labelledby="qualification-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && onDismiss) {
          event.preventDefault()
          onDismiss()
          return
        }
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

const captainTraitLabels: Record<EngineOutTrait, string> = {
  directionalControl: 'Directional Control',
  energyDiscipline: 'Energy Discipline',
  calmDiversion: 'Calm Diversion',
}

export function AirbusCompletionCelebration({
  reducedMotion,
  traits,
  onContinue,
}: {
  reducedMotion: boolean
  traits: EngineOutTrait[]
  onContinue: () => void
}) {
  const debrief = traits.length > 0
    ? `Captain traits: ${traits.map((trait) => captainTraitLabels[trait]).join(' · ')}`
    : 'Both simulator exercises are complete. Captain knowledge logged.'
  return (
    <MilestoneCelebration
      eyebrow="Airbus A320"
      title="POP T CAPTAIN MODE COMPLETE"
      body={debrief}
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
      title="POP T CAPTAIN MODE UNLOCKED"
      body="The memories are logged. The captain’s seat is ready."
      actionLabel="Enter Pop T Captain Mode"
      reducedMotion={reducedMotion}
      onContinue={onContinue}
      visual={<img className="qualification-hat" src={`${import.meta.env.BASE_URL}images/captains-hat-celebration.png`} alt="Captain’s hat" />}
      fadeToBlack
      variant="captain"
    />
  )
}
