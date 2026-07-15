import { useEffect, useRef } from 'react'
import { dc9LegacyFlow } from '../../game/config'

interface CaptainsKeyRevealProps {
  reducedMotion: boolean
  onClaim: () => void
  onDismiss: () => void
}

export function CaptainsKeyReveal({ reducedMotion, onClaim, onDismiss }: CaptainsKeyRevealProps) {
  const claimRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    claimRef.current?.focus()
  }, [])

  return (
    <section
      className={`captains-key-reveal${reducedMotion ? ' captains-key-reveal--reduced-motion' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="captains-key-title"
      aria-describedby="captains-key-description captains-key-live-text"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          onDismiss()
          return
        }
        if (event.key === 'Tab') {
          event.preventDefault()
          claimRef.current?.focus()
        }
      }}
    >
      <div className="captains-key-reveal__light" aria-hidden="true" />
      <div className="captains-key-reveal__card">
        <p className="eyebrow">Final Flight Log complete</p>
        <h2 id="captains-key-title">The Captain&apos;s Key</h2>
        <p id="captains-key-description">
          The final record belongs to the full home crew. Turn the key to read both engravings.
        </p>
        <div className="captains-key" aria-hidden="true">
          <div className="captains-key__ring" />
          <div className="captains-key__medallion">
            <span>{dc9LegacyFlow.keyEngravings.front}</span>
            <span>{dc9LegacyFlow.keyEngravings.reverse}</span>
          </div>
          <div className="captains-key__shaft"><i /><i /><i /></div>
        </div>
        <div className="captains-key-reveal__engravings">
          <p><span>Front</span><strong>{dc9LegacyFlow.keyEngravings.front}</strong></p>
          <p><span>Reverse</span><strong>{dc9LegacyFlow.keyEngravings.reverse}</strong></p>
        </div>
        <p id="captains-key-live-text" className="sr-only" aria-live="polite">
          The Captain&apos;s Key reads {dc9LegacyFlow.keyEngravings.front} on the front and {dc9LegacyFlow.keyEngravings.reverse} on the reverse.
        </p>
        <button ref={claimRef} type="button" className="primary-button primary-button--large" onClick={onClaim}>
          Take the Captain&apos;s Key
        </button>
      </div>
    </section>
  )
}
