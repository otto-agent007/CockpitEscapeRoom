import { MilestoneCelebration } from '../QualificationCelebration'

interface CaptainsKeyRevealProps {
  reducedMotion: boolean
  onClaim: () => void
  onDismiss: () => void
}

export function CaptainsKeyReveal({ reducedMotion, onClaim, onDismiss }: CaptainsKeyRevealProps) {
  return (
    <MilestoneCelebration
      eyebrow="Final Flight Log complete"
      title="THE CAPTAIN'S KEY"
      body="Legacy flight secured. The Captain’s Locker is ready."
      actionLabel="Take the Captain's Key"
      reducedMotion={reducedMotion}
      onContinue={onClaim}
      onDismiss={onDismiss}
      visual={<img className="qualification-key" src={`${import.meta.env.BASE_URL}images/captains-key-celebration.png`} alt="Golden Captain's Key" />}
      variant="key"
    />
  )
}
