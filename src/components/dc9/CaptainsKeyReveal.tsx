import { useEffect } from 'react'
import { MilestoneCelebration } from '../QualificationCelebration'
import { DC9_KEY_FANFARE, dc9KeyFanfareDurationSeconds } from '../../game/dc9KeySfx'
import { IntroSfxPlayer } from '../../game/introSfxPlayer'

interface CaptainsKeyRevealProps {
  reducedMotion: boolean
  onClaim: () => void
  onDismiss: () => void
}

/** A little tail after the last voice before the AudioContext is released. */
const FANFARE_RELEASE_PADDING_SECONDS = 0.4

export function CaptainsKeyReveal({ reducedMotion, onClaim, onDismiss }: CaptainsKeyRevealProps) {
  // One fanfare when the card opens. The player has clicked their way here, so the
  // AudioContext has the gesture it needs; if the browser refuses one anyway the player
  // fails silently and the reveal is unchanged.
  useEffect(() => {
    const player = new IntroSfxPlayer()
    player.play(DC9_KEY_FANFARE, 1, false)
    // Released on a timer rather than on unmount, so taking the key straight away lets the
    // chord ring out instead of cutting it off mid-note.
    const releaseMs = (dc9KeyFanfareDurationSeconds() + FANFARE_RELEASE_PADDING_SECONDS) * 1_000
    window.setTimeout(() => player.dispose(), releaseMs)
  }, [])

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
