/** Player-facing name of the guide after the Airbus chapter. */
export const ROBOPTIMUS_NAME = 'Roboptimus'
/** Current-model still shared by loading, accessible and unavailable-WebGL views. */
export const ROBOPTIMUS_FALLBACK_FILE = 'images/roboptimus-guide-fallback.png'
export const ROBOPTIMUS_WAITING_FILE = 'images/roboptimus-personal-waiting.png'

export const ROBOPTIMUS_WALK_MS = 8_500
export const ROBOPTIMUS_DOOR_DANCE_MS = 5_000
export const ROBOPTIMUS_FADE_MS = 1_200
export const ROBOPTIMUS_CAPTION_MS = 8_000
export type RoboptimusMotion = 'greeting' | 'walk' | 'dance'
export type RoboptimusStage = 'greeting' | 'walking' | 'dancing' | 'fading'

/** Spoken after the Airbus chapter, before the protected reward is revealed. */
export const OPTIMUS_GREETING_TEXT = "Congratulations! You did it! Your pilot skills have earned you something special. Let's go check it out!"

/** Relative to Vite's base URL; mounted only on the completed Airbus card. */
export const OPTIMUS_GREETING_AUDIO_FILE = 'audio/roboptimus-greeting-heart.mp3'
