import { lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import type { EngineOutTrait } from '../game/airbusEngineOut'
import { OPTIMUS_GREETING_TEXT } from '../game/optimusGreeting'
import { CelebrationSoundAside } from './CelebrationSound'
import { OptimusNarrationAside } from './OptimusNarration'

const CAPTAIN_CELEBRATION_REVEAL_DELAY_MS = 850
const OptimusGuideScene = lazy(() => import('../scenes/OptimusGuideScene'))
const optimusFallbackUrl = `${import.meta.env.BASE_URL}images/optimus-guide-fallback.png`

interface MilestoneCelebrationProps {
  eyebrow: string
  title: string
  body: ReactNode
  actionLabel: string
  reducedMotion: boolean
  onContinue: () => void
  onDismiss?: () => void
  visual: ReactNode
  fadeToBlack?: boolean
  variant?: 'qualification' | 'captain' | 'key' | 'optimus'
  /** Optional secondary control shown under the primary action, e.g. a sound toggle. */
  aside?: ReactNode
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
  aside,
}: MilestoneCelebrationProps) {
  const continueRef = useRef<HTMLButtonElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
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
      : variant === 'optimus'
        ? ' qualification-celebration--optimus'
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
        // Focus stays inside the card, but it has to be able to reach every control in it:
        // pinning Tab to the primary action leaves any secondary control unreachable by
        // keyboard.
        event.preventDefault()
        const stops = [...(cardRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])]
        if (stops.length === 0) return
        const current = stops.indexOf(document.activeElement as HTMLButtonElement)
        const step = event.shiftKey ? -1 : 1
        const next = stops[(current + step + stops.length) % stops.length]
        ;(next ?? continueRef.current)?.focus()
      }}
    >
      {!reducedMotion && revealed && (
        <div className="qualification-confetti" aria-hidden="true">
          {Array.from({ length: 24 }, (_, index) => <i key={index} />)}
        </div>
      )}
      <div className="qualification-card" ref={cardRef}>
        {visual}
        <p className="eyebrow">{eyebrow}</p>
        <h2 id="qualification-title">{title}</h2>
        <p>{body}</p>
        <button ref={continueRef} type="button" className="primary-button primary-button--large" disabled={!revealed} onClick={onContinue}>
          {actionLabel}
        </button>
        {aside}
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
  forceAccessible,
  traits,
  onContinue,
}: {
  reducedMotion: boolean
  forceAccessible: boolean
  traits: EngineOutTrait[]
  onContinue: () => void
}) {
  const [replayRevision, setReplayRevision] = useState(0)
  const replayMotion = useCallback(() => setReplayRevision((revision) => revision + 1), [])
  const debrief = traits.length > 0
    ? `Captain traits: ${traits.map((trait) => captainTraitLabels[trait]).join(' · ')}`
    : 'Both captain challenges are complete. Captain knowledge logged.'
  return (
    <MilestoneCelebration
      eyebrow="Airbus A320"
      title="POP T CAPTAIN MODE COMPLETE"
      body={<><span className="optimus-greeting-copy">{OPTIMUS_GREETING_TEXT}</span><span className="optimus-debrief">{debrief}</span></>}
      actionLabel="Reveal reward"
      reducedMotion={reducedMotion}
      onContinue={onContinue}
      visual={
        <div className="optimus-figure" aria-hidden="true">
          {forceAccessible ? (
            <img className="optimus-guide-fallback" src={optimusFallbackUrl} alt="" />
          ) : (
            <Suspense fallback={<img className="optimus-guide-fallback" src={optimusFallbackUrl} alt="" />}>
              <OptimusGuideScene replayRevision={replayRevision} reducedMotion={reducedMotion} />
            </Suspense>
          )}
        </div>
      }
      variant="optimus"
      aside={<OptimusNarrationAside onReplay={replayMotion} />}
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
      aside={<CelebrationSoundAside />}
    />
  )
}
